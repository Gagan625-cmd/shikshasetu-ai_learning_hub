import { useRouter } from 'expo-router';
import { BookOpen, BrainCircuit, Settings, FileText, LogOut, Video, Upload, TrendingUp, Info, Link2, Mic, Moon, Sun, Mail, ChevronRight, Sparkles, GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { LANGUAGES } from '@/constants/ncert-data';
import VoiceAssistant from './voice-assistant';
import { useTheme } from '@/contexts/theme-context';
import { useMessaging } from '@/contexts/messaging-context';

const FeatureCard = memo(({ feature, onPress, isDark, index }: { feature: any; onPress: () => void; isDark: boolean; index: number }) => {
  const Icon = feature.icon;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 70, 700);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.featureCard,
          {
            backgroundColor: isDark ? feature.color + '18' : '#ffffff',
            borderColor: isDark ? feature.color + '35' : feature.color + '18',
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.featureCardInner}>
          <LinearGradient
            colors={[feature.color + '30', feature.color + '12']}
            style={styles.iconCircle}
          >
            <Icon size={26} color={feature.color} strokeWidth={2} />
          </LinearGradient>
          <View style={styles.featureCardMiddle}>
            <Text style={[styles.featureTitle, { color: isDark ? feature.color : '#1a1a2e' }]}>{feature.title}</Text>
            <Text style={[styles.featureDescription, { color: isDark ? '#b0bec5' : '#64748b' }]}>{feature.description}</Text>
          </View>
          <View style={[styles.featureArrow, { backgroundColor: isDark ? feature.color + '30' : feature.color + '18' }]}>
            <ChevronRight size={18} color={feature.color} />
          </View>
        </View>
        <View style={[styles.featureAccent, { backgroundColor: feature.color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
});

FeatureCard.displayName = 'FeatureCard';

export default function TeacherDashboard() {
  const router = useRouter();
  const { resetApp, selectedLanguage, changeLanguage } = useApp();
  const { signOut, user } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
  const { unreadCount, registerContact } = useMessaging();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;

  useEffect(() => {
    if (user && !user.isGuest) {
      void registerContact(user.email, user.name, 'teacher');
    }
  }, [user, registerContact]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [headerAnim, headerSlide]);

  const handleLogout = async () => {
    await signOut();
    await resetApp();
    router.replace('/auth' as any);
  };

  const handleFeaturePress = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  const features = [
    { id: 'content', title: 'NCERT Content', description: 'Browse and teach from Grade 6-10', icon: BookOpen, color: '#3b82f6', route: '/teacher/content' },
    { id: 'icse-content', title: 'ICSE Content', description: 'Physics, Chemistry, Biology & Maths', icon: BookOpen, color: '#059669', route: '/teacher/icse-content' },
    { id: 'generate', title: 'AI Co-Pilot', description: 'Generate teaching materials & resources', icon: BrainCircuit, color: '#8b5cf6', route: '/teacher/generate' },
    { id: 'quiz', title: 'Quiz Generator', description: 'Create AI-powered assessment quizzes', icon: FileText, color: '#10b981', route: '/teacher/quiz' },
    { id: 'interview', title: 'Interview Assessment', description: 'Advanced interview with video & voice', icon: Video, color: '#f59e0b', route: '/teacher/interview' },
    { id: 'upload', title: 'Upload Content', description: 'Upload videos and text summaries', icon: Upload, color: '#06b6d4', route: '/teacher/upload' },
    { id: 'performance', title: 'Performance', description: 'View teaching stats and analytics', icon: TrendingUp, color: '#ec4899', route: '/teacher/performance' },
    { id: 'about', title: 'About', description: 'Learn about ShikshaSetu', icon: Info, color: '#6366f1', route: '/teacher/about' },
    { id: 'useful-link', title: 'Useful Link', description: 'Teaching video resources', icon: Link2, color: '#14b8a6', route: '/teacher/useful-link' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#0c0f1a' : '#f0f4ff' }]}>
      <LinearGradient
        colors={isDark ? ['#1a0f00', '#2d1a05', '#3d2008'] : ['#c2410c', '#ea580c', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecoOrb1} />
        <View style={styles.headerDecoOrb2} />

        <Animated.View style={[styles.headerContent, { opacity: headerAnim, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.logoCircle}
            >
              <GraduationCap size={22} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <Text style={styles.greeting}>Welcome, Teacher!</Text>
              <Text style={styles.subtitle}>Empower students with AI</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/teacher/messages' as any)}
            >
              <Mail size={18} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.msgBadge}>
                  <Text style={styles.msgBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={toggleDarkMode}
            >
              {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Settings size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>9</Text>
            <Text style={styles.statLabel}>Tools</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>AI</Text>
            <Text style={styles.statLabel}>Powered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>6-10</Text>
            <Text style={styles.statLabel}>Grades</Text>
          </View>
        </View>

        {showSettings && (
          <View style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Language</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.languageScroll}
            >
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageButton,
                    selectedLanguage === lang.id && styles.languageButtonActive,
                  ]}
                  onPress={() => changeLanguage(lang.id as any)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage === lang.id && styles.languageTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionTitleRow}>
          <Sparkles size={20} color={isDark ? '#fbbf24' : '#ea580c'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#fbbf24' : '#1a1a2e' }]}>Teacher Tools</Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((feature, idx) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onPress={() => handleFeaturePress(feature.route)}
              isDark={isDark}
              index={idx}
            />
          ))}
        </View>

        <LinearGradient
          colors={isDark ? ['#1a1040', '#0f0a2e'] : ['#fff7ed', '#fef3c7']}
          style={styles.infoCard}
        >
          <View style={styles.infoAccent} />
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoEmoji}>🎓</Text>
            <Text style={[styles.infoTitle, { color: isDark ? '#fcd34d' : '#92400e' }]}>AI Teaching Assistant</Text>
          </View>
          <Text style={[styles.infoText, { color: isDark ? '#fde68a' : '#a16207' }]}>
            Use AI to create personalized learning materials, generate quizzes, and assess student understanding through advanced interviews.
          </Text>
        </LinearGradient>
      </ScrollView>

      <TouchableOpacity
        style={[styles.voiceButton, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowVoiceAssistant(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#f97316', '#ea580c', '#c2410c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.voiceGradient}
        >
          <Mic size={28} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      <VoiceAssistant
        visible={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  headerDecoOrb1: {
    position: 'absolute' as const,
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerDecoOrb2: {
    position: 'absolute' as const,
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsPanel: {
    marginTop: 18,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  languageScroll: {
    marginBottom: 12,
  },
  languageButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  languageButtonActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  languageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600' as const,
  },
  languageTextActive: {
    color: '#1a1a2e',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutText: {
    fontSize: 14,
    color: '#fca5a5',
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  featuresList: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' },
    }),
  },
  featureCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  featureCardMiddle: {
    flex: 1,
  },
  featureAccent: {
    height: 3,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  featureArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  infoAccent: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#f59e0b',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingLeft: 8,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 8,
  },
  voiceButton: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 20px rgba(234, 88, 12, 0.45)' },
    }),
  },
  voiceGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#c2410c',
  },
  msgBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
});
