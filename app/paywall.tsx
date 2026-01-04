import { useRouter } from 'expo-router';
import { X, Check, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/subscription-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, purchase, isPurchasing, restore, isRestoring, isLoading } = useSubscription();

  const handlePurchase = async () => {
    const currentOffering = offerings?.current;
    if (!currentOffering?.availablePackages || currentOffering.availablePackages.length === 0) {
      Alert.alert('Error', 'No packages available');
      return;
    }

    const packageToPurchase = currentOffering.availablePackages[0];
    try {
      purchase(packageToPurchase, {
        onSuccess: () => {
          Alert.alert('Success', 'Premium unlocked!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        },
        onError: (error: any) => {
          if (error?.userCancelled) {
            return;
          }
          Alert.alert('Error', error?.message || 'Purchase failed');
        },
      });
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert('Error', 'Purchase failed');
      }
    }
  };

  const handleRestore = async () => {
    try {
      restore(undefined, {
        onSuccess: (customerInfo) => {
          if (customerInfo?.entitlements.active['premium']) {
            Alert.alert('Success', 'Purchases restored!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } else {
            Alert.alert('Info', 'No purchases to restore');
          }
        },
        onError: () => {
          Alert.alert('Error', 'Failed to restore purchases');
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

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

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages?.[0];
  const product = packageToPurchase?.product;

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
            <Text style={styles.priceAmount}>{product?.priceString || '$4.99'}</Text>
            <Text style={styles.pricePeriod}>per month</Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Premium Features</Text>
            
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
              <Text style={styles.featureText}>Advanced interview practice</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Voice assistant</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Unlimited quiz generation</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Check size={20} color="#10b981" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, (isPurchasing || isRestoring) && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.buttonGradient}>
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
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
  priceAmount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#7e22ce',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600' as const,
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
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
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
