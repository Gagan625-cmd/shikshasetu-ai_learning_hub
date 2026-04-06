import { useRouter } from 'expo-router';
import { ChevronLeft, Crown, Award, Star, Shield, Sparkles, Verified } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { useRef, useEffect } from 'react';

export default function AboutPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a0a0a', '#2d1810', '#3d2015'] : ['#f59e0b', '#d97706', '#b45309']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About ShikshaSetu</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.missionCard, { backgroundColor: isDark ? '#111827' : '#fffbeb', borderColor: isDark ? '#422006' : '#fde68a' }]}>
            <View style={styles.missionIconRow}>
              <Sparkles size={20} color="#f59e0b" />
              <Text style={[styles.missionLabel, { color: isDark ? '#fbbf24' : '#b45309' }]}>Our Mission</Text>
            </View>
            <Text style={[styles.missionText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              ShikshaSetu is an AI-powered educational platform designed to bridge learning gaps and provide equitable educational support using artificial intelligence. We deliver personalized learning journeys and empower teachers with AI-assisted tools.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Founders</Text>
          <View style={styles.founderCardPremium}>
            <LinearGradient
              colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#0f172a', '#1e293b', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.founderGradient}
            >
              <Animated.View style={[styles.founderShimmer, { opacity: shimmerOpacity }]} />
              <View style={styles.founderTopRow}>
                <LinearGradient
                  colors={['#f59e0b', '#f97316', '#ef4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.founderAvatarGradient}
                >
                  <Text style={styles.founderAvatarText}>GN</Text>
                </LinearGradient>
                <View style={styles.founderDetails}>
                  <View style={styles.founderNameRow}>
                    <Text style={styles.founderNamePremium}>Gagandeep.N</Text>
                    <Verified size={16} color="#38bdf8" />
                  </View>
                  <View style={styles.founderBadgeRow}>
                    <LinearGradient
                      colors={['#f59e0b', '#f97316']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.founderBadge}
                    >
                      <Crown size={10} color="#fff" />
                      <Text style={styles.founderBadgeText}>FOUNDER & CEO</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
              <View style={styles.founderStatsRow}>
                <View style={styles.founderStat}>
                  <Star size={12} color="#fbbf24" />
                  <Text style={styles.founderStatText}>Visionary</Text>
                </View>
                <View style={styles.founderStatDivider} />
                <View style={styles.founderStat}>
                  <Shield size={12} color="#38bdf8" />
                  <Text style={styles.founderStatText}>Lead Architect</Text>
                </View>
                <View style={styles.founderStatDivider} />
                <View style={styles.founderStat}>
                  <Award size={12} color="#a78bfa" />
                  <Text style={styles.founderStatText}>Innovator</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {[{ name: 'Kushal', initials: 'K' }, { name: 'Siddharth', initials: 'S' }, { name: 'Prajwal J Athreyas', initials: 'PA' }].map((cofounder, idx) => (
            <View key={idx} style={styles.cofounderCard}>
              <LinearGradient
                colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#1e293b', '#334155', '#475569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cofounderGradient}
              >
                <View style={styles.founderTopRow}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6', '#a78bfa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cofounderAvatarGradient}
                  >
                    <Text style={styles.cofounderAvatarText}>{cofounder.initials}</Text>
                  </LinearGradient>
                  <View style={styles.founderDetails}>
                    <View style={styles.founderNameRow}>
                      <Text style={styles.founderNamePremium}>{cofounder.name}</Text>
                      <Verified size={14} color="#a78bfa" />
                    </View>
                    <View style={styles.founderBadgeRow}>
                      <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.founderBadge}
                      >
                        <Star size={10} color="#fff" />
                        <Text style={styles.founderBadgeText}>CO-FOUNDER</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mentor</Text>
          <View style={styles.mentorCardPremium}>
            <LinearGradient
              colors={isDark ? ['#0c1a2e', '#102040', '#0e2d50'] : ['#042f2e', '#064e3b', '#065f46']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mentorGradient}
            >
              <View style={styles.founderTopRow}>
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.founderAvatarGradient}
                >
                  <Text style={styles.founderAvatarText}>AD</Text>
                </LinearGradient>
                <View style={styles.founderDetails}>
                  <View style={styles.founderNameRow}>
                    <Text style={styles.founderNamePremium}>Aditya Dubey</Text>
                    <Verified size={16} color="#34d399" />
                  </View>
                  <View style={styles.founderBadgeRow}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.founderBadge}
                    >
                      <Award size={10} color="#fff" />
                      <Text style={styles.founderBadgeText}>MENTOR</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>

          {[
            { emoji: '📚', title: 'AI Content Generator', desc: 'Generate comprehensive teaching materials including notes, summaries, worksheets, mind maps, and question papers instantly.' },
            { emoji: '🎯', title: 'Quiz & Assessment Creator', desc: 'Create customized quizzes and assessments with AI-generated questions for any topic or difficulty level.' },
            { emoji: '📊', title: 'Student Performance Analytics', desc: 'Track and analyze student performance with detailed insights and progress reports.' },
            { emoji: '🎤', title: 'Voice Assistant', desc: 'Get instant answers to teaching questions using voice commands with AI-powered assistance.' },
            { emoji: '📖', title: 'NCERT & ICSE Curriculum', desc: 'Complete coverage of NCERT and ICSE syllabi with chapter-wise content and resources.' },
            { emoji: '📤', title: 'Document Upload & Processing', desc: 'Upload teaching materials and let AI extract key concepts and generate study resources automatically.' },
            { emoji: '🌐', title: 'Multilingual Support', desc: 'Create content in multiple languages to support diverse classrooms and language preferences.' },
            { emoji: '💬', title: 'Interview Preparation', desc: 'Help students prepare for competitive exams and interviews with AI-powered mock sessions.' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureItem, { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Text style={styles.featureBullet}>{item.emoji}</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <View style={[styles.techCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.techTitle, { color: colors.text }]}>Technology</Text>
            <Text style={[styles.techText, { color: colors.textSecondary }]}>
              Built with React Native, Expo, and powered by advanced AI models including GPT-4 for content generation and learning assistance.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  missionCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  missionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  missionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  missionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  founderCardPremium: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 24px rgba(245, 158, 11, 0.25)' },
    }),
  },
  founderGradient: {
    padding: 20,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  founderShimmer: {
    position: 'absolute' as const,
    top: 0,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  founderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  founderAvatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  founderAvatarText: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#ffffff',
  },
  founderDetails: {
    flex: 1,
    gap: 6,
  },
  founderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  founderNamePremium: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  founderBadgeRow: {
    flexDirection: 'row',
  },
  founderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  founderBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  founderStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  founderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  founderStatText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  founderStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cofounderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 16px rgba(99, 102, 241, 0.18)' },
    }),
  },
  cofounderGradient: {
    padding: 16,
  },
  cofounderAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cofounderAvatarText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#ffffff',
  },
  mentorCardPremium: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 24px rgba(16, 185, 129, 0.2)' },
    }),
  },
  mentorGradient: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureBullet: {
    fontSize: 24,
    lineHeight: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  techCard: {
    marginTop: 12,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  techText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
