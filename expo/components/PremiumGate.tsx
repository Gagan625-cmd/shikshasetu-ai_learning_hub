import { useRouter } from 'expo-router';
import { Lock, Sparkles, ChevronLeft, Crown } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react-native';

interface PremiumFeatureItem {
  icon?: LucideIcon;
  text: string;
}

interface PremiumGateProps {
  title: string;
  description: string;
  features: PremiumFeatureItem[];
}

export default function PremiumGate({ title, description, features }: PremiumGateProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const lockPulse = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(lockPulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(lockPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, lockPulse, glowAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0a0f1a', '#121a30', '#0d1f3a'] : ['#0f1729', '#162544', '#1a3055']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.lockCircle, { transform: [{ scale: lockPulse }] }]}>
              <Animated.View style={[styles.lockGlow, { opacity: glowAnim }]} />
              <LinearGradient
                colors={['#fbbf24', '#f59e0b', '#d97706']}
                style={styles.lockInner}
              >
                <Lock size={40} color="#1a0a2e" strokeWidth={2.5} />
              </LinearGradient>
            </Animated.View>

            <View style={styles.premiumBadge}>
              <Crown size={14} color="#fbbf24" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>

            <Text style={styles.heroTitle}>Unlock {title}</Text>
            <Text style={styles.heroDesc}>{description}</Text>
          </Animated.View>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresHeading}>What you get</Text>
            {features.map((feat, i) => {
              const Icon = feat.icon || Sparkles;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.featureRow,
                    { opacity: fadeAnim },
                  ]}
                >
                  <View style={styles.featureIconBg}>
                    <Icon size={16} color="#fbbf24" />
                  </View>
                  <Text style={styles.featureText}>{feat.text}</Text>
                </Animated.View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/paywall' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706', '#b45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtnGradient}
            >
              <Crown size={20} color="#ffffff" />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockGlow: {
    position: 'absolute' as const,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  lockInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 24px rgba(251, 191, 36, 0.35)' },
    }),
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    marginBottom: 16,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fbbf24',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    fontWeight: '500' as const,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featuresHeading: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  featureIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
    lineHeight: 20,
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)' },
    }),
  },
  upgradeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  upgradeBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  backLink: {
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600' as const,
  },
});
