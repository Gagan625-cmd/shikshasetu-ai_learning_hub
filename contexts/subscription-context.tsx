import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-context';
import { trpc } from '@/lib/trpc';
import { AppState, AppStateStatus } from 'react-native';

const PREMIUM_CACHE_KEY = 'premium_status';
const PREMIUM_EMAILS = ['gagandeepn49@gmail.com', 'ak.atharva2011@gmail.com'];

const STRIPE_PAYMENT_LINK = process.env.EXPO_PUBLIC_STRIPE_PAYMENT_LINK || '';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [cachedPremium, setCachedPremium] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
        if (cached === 'true') {
          setCachedPremium(true);
          console.log('Loaded cached premium status: true');
        }
      } catch (error) {
        console.log('Error loading premium cache:', error);
      }
    };
    loadCache();
  }, []);

  const userEmail = user?.email || '';
  const hasPremiumEmail = userEmail ? PREMIUM_EMAILS.includes(userEmail.toLowerCase()) : false;

  const premiumQuery = trpc.subscription.check.useQuery(
    { email: userEmail },
    {
      enabled: !!userEmail && !hasPremiumEmail && userEmail !== 'guest@app.com',
      staleTime: 1000 * 30,
      refetchInterval: isPolling ? 3000 : false,
      retry: 2,
    }
  );

  const dbPremium = premiumQuery.data?.isPremium === true;
  const isPremium = hasPremiumEmail || dbPremium || cachedPremium;

  useEffect(() => {
    if (dbPremium) {
      setCachedPremium(true);
      AsyncStorage.setItem(PREMIUM_CACHE_KEY, 'true').catch(console.error);
      console.log('Premium status confirmed from server, cached locally');

      if (isPolling) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }
  }, [dbPremium, isPolling]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, refetching premium status');
        if (userEmail && userEmail !== 'guest@app.com') {
          queryClient.invalidateQueries({ queryKey: [['subscription', 'check']] });
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userEmail, queryClient]);

  const startPolling = useCallback(() => {
    console.log('Starting premium status polling');
    setIsPolling(true);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setTimeout(() => {
      console.log('Polling timeout reached, stopping');
      setIsPolling(false);
      pollingIntervalRef.current = null;
    }, 120000) as unknown as ReturnType<typeof setInterval>;
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const refreshPremium = useCallback(() => {
    if (userEmail && userEmail !== 'guest@app.com') {
      queryClient.invalidateQueries({ queryKey: [['subscription', 'check']] });
    }
  }, [userEmail, queryClient]);

  const manualSetPremium = useMutation({
    mutationFn: async () => {
      setCachedPremium(true);
      await AsyncStorage.setItem(PREMIUM_CACHE_KEY, 'true');
      return true;
    },
  });

  const getPaymentLink = useCallback(() => {
    if (!STRIPE_PAYMENT_LINK) {
      console.log('No Stripe payment link configured');
      return '';
    }
    if (userEmail && userEmail !== 'guest@app.com') {
      const separator = STRIPE_PAYMENT_LINK.includes('?') ? '&' : '?';
      return `${STRIPE_PAYMENT_LINK}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
    }
    return STRIPE_PAYMENT_LINK;
  }, [userEmail]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    isPremium,
    isLoading: premiumQuery.isLoading,
    isPolling,
    startPolling,
    stopPolling,
    refreshPremium,
    getPaymentLink,
    manualSetPremium: manualSetPremium.mutate,
    stripePaymentLink: STRIPE_PAYMENT_LINK,
  };
});
