import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap, Sparkles, ArrowRight, Rocket } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen() {
  const router = useRouter();
  const { selectRole, userRole, isLoading: appIsLoading } = useApp();
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const studentScale = useRef(new Animated.Value(1)).current;
  const teacherScale = useRef(new Animated.Value(1)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading || appIsLoading) return;
    
    if (!user) {
      router.replace('/auth' as any);
      return;
    }

    if (userRole) {
      if (userRole === 'student') {
        router.replace('/student/' as any);
      } else {
        router.replace('/teacher/' as any);
      }
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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
        Animated.timing(orb1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb2Anim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [user, isLoading, appIsLoading, userRole, router, fadeAnim, slideAnim, orb1Anim, orb2Anim, glowAnim, sparkleAnim, badgePulse]);

  if (isLoading || appIsLoading || !user) {
    return (
      <LinearGradient colors={['#0a1628', '#0d2137', '#132f4c']} style={{ flex: 1 }} />
    );
  }

  const handleRoleSelect = async (role: 'student' | 'teacher') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await selectRole(role);
    if (role === 'student') {
      router.replace('/student/' as any);
    } else {
      router.replace('/teacher/' as any);
    }
  };

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.95, friction: 8, useNativeDriver: true }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const displayName = user.isGuest ? 'Guest' : user.name;

  const orb1TranslateY = orb1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const orb2TranslateX = orb2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#0a1628', '#0d2847', '#0e3460', '#0a2a4a']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1TranslateY }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: orb2TranslateX }] }]} />
      <View style={styles.orb3} />
      <View style={styles.orb4} />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <Text style={styles.hi}>Hi</Text>
            <LinearGradient
              colors={['#ff6b35', '#ff9f1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nameBadge}
            >
              <Text style={styles.nameText}>{displayName}</Text>
            </LinearGradient>
            <Text style={styles.wave}>👋</Text>
          </View>

          <View style={styles.logoSection}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            <View style={styles.logoRing}>
              <LinearGradient
                colors={['rgba(255,107,53,0.3)', 'rgba(0,180,216,0.3)', 'rgba(114,9,183,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoRingGradient}
              />
            </View>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vgf5j406eh85pmh23mp8' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.taglineRow}>
            <Animated.View style={{ opacity: sparkleOpacity }}>
              <Sparkles size={16} color="#ff9f1c" />
            </Animated.View>
            <Text style={styles.tagline}>Bridging Learning Gaps with AI</Text>
            <Animated.View style={{ opacity: sparkleOpacity }}>
              <Sparkles size={16} color="#00b4d8" />
            </Animated.View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Animated.View style={{ transform: [{ scale: studentScale }] }}>
            <TouchableOpacity
              onPress={() => handleRoleSelect('student')}
              onPressIn={() => handlePressIn(studentScale)}
              onPressOut={() => handlePressOut(studentScale)}
              activeOpacity={1}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={['#0077b6', '#00b4d8', '#0096c7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardDecoCircle1} />
                <View style={styles.cardDecoCircle2} />
                <View style={styles.cardDecoLine} />

                <View style={styles.cardRow}>
                  <View style={styles.cardIconWrap}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)']}
                      style={styles.cardIconBg}
                    >
                      <BookOpen size={30} color="#ffffff" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle}>Student</Text>
                    <Text style={styles.cardDescription}>
                      NCERT content, AI learning & interviews
                    </Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <ArrowRight size={22} color="#ffffff" />
                  </View>
                </View>

                <View style={styles.cardTags}>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>📚 NCERT</Text>
                  </View>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>🤖 AI Quiz</Text>
                  </View>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>🎮 Games</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: teacherScale }] }}>
            <TouchableOpacity
              onPress={() => handleRoleSelect('teacher')}
              onPressIn={() => handlePressIn(teacherScale)}
              onPressOut={() => handlePressOut(teacherScale)}
              activeOpacity={1}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={['#ff6b35', '#ff9f1c', '#f77f00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardDecoCircle1} />
                <View style={styles.cardDecoCircle2} />
                <View style={styles.cardDecoLine} />

                <View style={styles.cardRow}>
                  <View style={styles.cardIconWrap}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.12)']}
                      style={styles.cardIconBg}
                    >
                      <GraduationCap size={30} color="#ffffff" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle}>Teacher</Text>
                    <Text style={styles.cardDescription}>
                      AI co-pilot, assessments & content gen
                    </Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <ArrowRight size={22} color="#ffffff" />
                  </View>
                </View>

                <View style={styles.cardTags}>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>📝 Generate</Text>
                  </View>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>🎤 Interview</Text>
                  </View>
                  <View style={[styles.cardTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.cardTagText}>📊 Analytics</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: badgePulse }] }}>
            <LinearGradient
              colors={['rgba(0,180,216,0.15)', 'rgba(255,107,53,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerBadge}
            >
              <Rocket size={14} color="#00b4d8" />
              <Text style={styles.footerText}>TECHFEST 2025-26 • Made for India 🇮🇳</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb1: {
    position: 'absolute' as const,
    top: '12%',
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
  },
  orb2: {
    position: 'absolute' as const,
    top: '40%',
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  orb3: {
    position: 'absolute' as const,
    bottom: '15%',
    left: '25%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(114, 9, 183, 0.08)',
  },
  orb4: {
    position: 'absolute' as const,
    top: '60%',
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  hi: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  nameBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  wave: {
    fontSize: 28,
  },
  logoSection: {
    position: 'relative' as const,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoGlow: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 180, 216, 0.2)',
  },
  logoRing: {
    position: 'absolute' as const,
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  logoRingGradient: {
    flex: 1,
    borderRadius: 90,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#7dd3fc',
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  cardContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cardTouchable: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0077b6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 28px rgba(0, 119, 182, 0.3)' },
    }),
  },
  cardGradient: {
    padding: 22,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  cardDecoCircle1: {
    position: 'absolute' as const,
    top: -35,
    right: -25,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardDecoCircle2: {
    position: 'absolute' as const,
    bottom: -25,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardDecoLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 5,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  cardIconWrap: {},
  cardIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  cardArrow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTag: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardTagText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
  },
  footerText: {
    fontSize: 13,
    color: '#7dd3fc',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
});
