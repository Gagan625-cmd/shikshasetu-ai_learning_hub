import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
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
if (apiKey) {
  Purchases.configure({ apiKey });
}

const PREMIUM_EMAILS = ['gagandeepn49@gmail.com', 'ak.atharva2011@gmail.com'];

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setIsInitialized(true);
    }
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo', isInitialized],
    queryFn: async () => {
      if (!isInitialized) return null;
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    enabled: isInitialized,
    staleTime: 1000 * 60 * 5,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings', isInitialized],
    queryFn: async () => {
      if (!isInitialized) return null;
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    enabled: isInitialized,
    staleTime: 1000 * 60 * 10,
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
  const isPremium = hasPremiumEmail || customerInfoQuery.data?.entitlements.active['premium'] !== undefined;

  return {
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
  };
});
