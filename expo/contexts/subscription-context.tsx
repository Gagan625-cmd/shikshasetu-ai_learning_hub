import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

const apiKey = getRCToken();
let rcConfigured = false;
try {
  if (apiKey) {
    Purchases.configure({ apiKey });
    rcConfigured = true;
  } else {
    console.log('[RevenueCat] No API key found, purchases disabled');
  }
} catch (e) {
  console.log('[RevenueCat] Configuration error:', e);
}

const PREMIUM_EMAILS = ['gagandeepn49@gmail.com', 'ngagandeep2@gmail.com', 'gagandepn49@gmail.com', 'gagandeep123@gmail.com'];

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasXPRewardOverride, setHasXPRewardOverride] = useState(false);

  useEffect(() => {
    if (rcConfigured) {
      setIsInitialized(true);
    }
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo', isInitialized],
    queryFn: async () => {
      if (!isInitialized) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        return info;
      } catch (e) {
        console.log('[RevenueCat] Error fetching customer info:', e);
        return null;
      }
    },
    enabled: isInitialized,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings', isInitialized],
    queryFn: async () => {
      if (!isInitialized) return null;
      try {
        const offerings = await Purchases.getOfferings();
        return offerings;
      } catch (e) {
        console.log('[RevenueCat] Error fetching offerings:', e);
        return null;
      }
    },
    enabled: isInitialized,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['customerInfo'], customerInfo);
    },
  });

  const hasPremiumEmail = user?.email && PREMIUM_EMAILS.includes(user.email.toLowerCase());
  const isPremium = hasPremiumEmail || hasXPRewardOverride || customerInfoQuery.data?.entitlements.active['premium'] !== undefined;

  return useMemo(() => ({
    isInitialized,
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isPremium,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    purchase: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    restore: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
    restoreError: restoreMutation.error,
    setHasXPRewardOverride,
  }), [isInitialized, customerInfoQuery.data, offeringsQuery.data, isPremium, customerInfoQuery.isLoading, offeringsQuery.isLoading, purchaseMutation.mutate, purchaseMutation.isPending, restoreMutation.mutate, restoreMutation.isPending, purchaseMutation.error, restoreMutation.error, setHasXPRewardOverride]);
});
