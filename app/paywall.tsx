import { useRouter } from 'expo-router';
import { X, Check, Sparkles, ExternalLink, RefreshCw } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/subscription-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, isLoading, getPaymentLink, startPolling, stopPolling, refreshPremium, isPolling } = useSubscription();
  const hasOpenedPayment = useRef(false);

  useEffect(() => {
    if (isPremium && hasOpenedPayment.current) {
      Alert.alert('Success', 'Premium unlocked! Enjoy all features.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [isPremium, router]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handlePayment = useCallback(async () => {
    const paymentLink = getPaymentLink();
    if (!paymentLink) {
      Alert.alert('Setup Required', 'Payment is not configured yet. Please contact support.');
      return;
    }

    hasOpenedPayment.current = true;
    startPolling();

    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(paymentLink);
      } else {
        await WebBrowser.openBrowserAsync(paymentLink, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }

      console.log('Browser closed, checking premium status...');
      refreshPremium();
    } catch (error) {
      console.log('Error opening payment link:', error);
      try {
        await Linking.openURL(paymentLink);
      } catch (linkError) {
        Alert.alert('Error', 'Could not open payment page. Please try again.');
        stopPolling();
      }
    }
  }, [getPaymentLink, startPolling, stopPolling, refreshPremium]);

  const handleCheckStatus = useCallback(() => {
    console.log('Manually checking premium status...');
    refreshPremium();
    startPolling();
    Alert.alert('Checking...', 'Verifying your payment status. This may take a moment.');
  }, [refreshPremium, startPolling]);

  if (isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.premiumContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.premiumContent}>
            <Sparkles size={64} color="#ffffff" />
            <Text style={styles.premiumTitle}>You&apos;re Premium!</Text>
            <Text style={styles.premiumDescription}>
              Enjoy unlimited access to all advanced features
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#7e22ce', '#9333ea', '#a855f7']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Sparkles size={72} color="#fbbf24" />
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>Access advanced AI features</Text>
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>One-time Payment</Text>
            <Text style={styles.priceAmount}>Premium Access</Text>
            <Text style={styles.pricePeriod}>Lifetime access to all features</Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Premium Features</Text>
            
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>AI Exam Scanner with instant feedback</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Study OS: Focus timer, blocker & coach</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Advanced interview assessment</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Unlimited AI-generated content</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handlePayment}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.buttonGradient}>
              <ExternalLink size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.subscribeButtonText}>Pay with Stripe</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isPolling && (
            <View style={styles.pollingContainer}>
              <ActivityIndicator size="small" color="#fbbf24" />
              <Text style={styles.pollingText}>Verifying your payment...</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleCheckStatus}
          >
            <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.restoreButtonText}>Already paid? Check status</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            You will be redirected to Stripe's secure checkout. After payment, your premium features will be activated automatically.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#e9d5ff',
    fontWeight: '500' as const,
  },
  priceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#7e22ce',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500' as const,
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  pollingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  pollingText: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
  disclaimer: {
    fontSize: 12,
    color: '#e9d5ff',
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumContainer: {
    flex: 1,
  },
  premiumContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  premiumTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
  },
  premiumDescription: {
    fontSize: 18,
    color: '#d1fae5',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
