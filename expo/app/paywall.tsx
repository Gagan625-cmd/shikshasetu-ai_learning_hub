import { useRouter } from 'expo-router';
import { X, Check, Crown, Zap, Shield, Star, Clock } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/subscription-context';
import { useTheme } from '@/contexts/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanType = 'monthly' | 'bimonthly';

interface PlanConfig {
  id: PlanType;
  label: string;
  price: string;
  priceNum: number;
  duration: string;
  perMonth: string;
  savings?: string;
  badge?: string;
}

const PLANS: PlanConfig[] = [
  {
    id: 'monthly',
    label: '1 Month',
    price: '₹199',
    priceNum: 199,
    duration: '1 month',
    perMonth: '₹199/mo',
  },
  {
    id: 'bimonthly',
    label: '2 Months',
    price: '₹349',
    priceNum: 349,
    duration: '2 months',
    perMonth: '₹174.50/mo',
    savings: 'Save ₹49',
    badge: 'BEST VALUE',
  },
];

const FEATURES = [
  { icon: Zap, text: 'AI Exam Scanner with instant feedback', color: '#f59e0b' },
  { icon: Clock, text: 'Study OS: Focus timer, blocker & coach', color: '#06b6d4' },
  { icon: Star, text: 'Unlimited AI-generated content & comics', color: '#8b5cf6' },
  { icon: Shield, text: 'Advanced performance analytics', color: '#10b981' },
  { icon: Crown, text: 'Priority support & early access', color: '#ec4899' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, isPremium, purchase, isPurchasing, restore, isRestoring, isLoading } = useSubscription();
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('bimonthly');

  const crownAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const planScaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(crownAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
        Animated.timing(crownAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [crownAnim, fadeAnim, glowAnim, slideAnim]);

  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    Animated.sequence([
      Animated.timing(planScaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(planScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handlePurchase = async () => {
    const currentOffering = offerings?.current;
    if (!currentOffering?.availablePackages || currentOffering.availablePackages.length === 0) {
      Alert.alert('Error', 'No packages available');
      return;
    }

    const packageIndex = selectedPlan === 'monthly' ? 0 : Math.min(1, currentOffering.availablePackages.length - 1);
    const packageToPurchase = currentOffering.availablePackages[packageIndex];
    try {
      purchase(packageToPurchase, {
        onSuccess: () => {
          Alert.alert('Success', 'Premium unlocked!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        },
        onError: (error: any) => {
          if (error?.userCancelled) return;
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

  const bgBase = isDark ? '#060d18' : '#f0f4ff';
  const gradientColors: [string, string, string] = isDark
    ? ['#060d18', '#0a1a30', '#0d2240']
    : ['#0a1628', '#0d2847', '#133a60'];

  if (isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: bgBase }]}>
        <LinearGradient colors={['#059669', '#10b981', '#34d399']} style={styles.premiumActiveContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} testID="paywall-close">
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.premiumActiveContent}>
            <Animated.View style={{ transform: [{ translateY: crownAnim }] }}>
              <Crown size={72} color="#fbbf24" strokeWidth={2} />
            </Animated.View>
            <Text style={styles.premiumActiveTitle}>You're Premium!</Text>
            <Text style={styles.premiumActiveDesc}>Enjoy unlimited access to all features</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: bgBase }]}>
        <ActivityIndicator size="large" color="#00b4d8" />
      </View>
    );
  }

  const activePlan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[1];

  return (
    <View style={[styles.container, { backgroundColor: bgBase }]}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} testID="paywall-close-btn">
              <X size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.crownContainer, { transform: [{ translateY: crownAnim }] }]}>
              <Animated.View style={[styles.crownGlow, { opacity: glowAnim }]} />
              <Crown size={56} color="#fbbf24" strokeWidth={2} />
            </Animated.View>
            <Text style={styles.heroTitle}>Unlock Premium</Text>
            <Text style={styles.heroSubtitle}>Supercharge your learning experience</Text>
          </Animated.View>

          <View style={styles.plansRow}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isDark
                        ? isSelected ? 'rgba(0, 180, 216, 0.12)' : 'rgba(255,255,255,0.04)'
                        : isSelected ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.6)',
                      borderColor: isSelected ? '#00b4d8' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
                      borderWidth: isSelected ? 2.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                  activeOpacity={0.7}
                  testID={`plan-${plan.id}`}
                >
                  {plan.badge && (
                    <View style={styles.badgeContainer}>
                      <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </LinearGradient>
                    </View>
                  )}
                  <Text style={[styles.planLabel, { color: isDark ? '#b8d0e8' : '#475569' }]}>{plan.label}</Text>
                  <Text style={[styles.planPrice, { color: isDark ? '#f1f5f9' : '#0a1628' }]}>{plan.price}</Text>
                  <Text style={[styles.planPerMonth, { color: isDark ? '#7ea3c4' : '#64748b' }]}>{plan.perMonth}</Text>
                  {plan.savings && (
                    <View style={styles.savingsTag}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[
            styles.featuresCard,
            {
              backgroundColor: isDark ? 'rgba(13, 26, 45, 0.8)' : 'rgba(255,255,255,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }
          ]}>
            <Text style={[styles.featuresTitle, { color: isDark ? '#f1f5f9' : '#0a1628' }]}>
              What you get
            </Text>
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <View key={index} style={styles.featureRow}>
                  <View style={[styles.featureIconBg, { backgroundColor: feature.color + '18' }]}>
                    <IconComponent size={18} color={feature.color} />
                  </View>
                  <Text style={[styles.featureText, { color: isDark ? '#d1dff0' : '#334155' }]}>
                    {feature.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, (isPurchasing || isRestoring) && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
            activeOpacity={0.85}
            testID="paywall-subscribe"
          >
            <LinearGradient
              colors={['#00b4d8', '#0096c7', '#0077b6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Continue with {activePlan.label}</Text>
                  <Text style={styles.ctaPriceText}>{activePlan.price}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isPurchasing || isRestoring}
            testID="paywall-restore"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Subscription auto-renews. Cancel anytime at least 24 hours before the end of the current period. Terms apply.
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
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    marginBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crownContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownGlow: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    position: 'relative' as const,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute' as const,
    top: -10,
    alignSelf: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 6,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  planPerMonth: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  savingsTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  selectedIndicator: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00b4d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#00b4d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  ctaPriceText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  premiumActiveContainer: {
    flex: 1,
  },
  premiumActiveContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  premiumActiveTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 10,
  },
  premiumActiveDesc: {
    fontSize: 17,
    color: '#d1fae5',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
