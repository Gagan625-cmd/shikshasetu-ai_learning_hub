import { useRouter } from 'expo-router';
import { BookOpen, BrainCircuit, Settings, FileText, LogOut, Video, Upload, TrendingUp, Info, Link2, Mic } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { LANGUAGES } from '@/constants/ncert-data';
import VoiceAssistant from './voice-assistant';

export default function TeacherDashboard() {
  const router = useRouter();
  const { resetApp, selectedLanguage, changeLanguage } = useApp();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  const handleLogout = async () => {
    await signOut();
    await resetApp();
    router.replace('/auth' as any);
  };

  const features = [
    {
      id: 'content',
      title: 'NCERT Content',
      description: 'Browse and teach from Grade 6-10',
      icon: BookOpen,
      color: '#3b82f6',
      route: '/teacher/content',
    },
    {
      id: 'icse-content',
      title: 'ICSE Content',
      description: 'Physics, Chemistry, Biology & Maths',
      icon: BookOpen,
      color: '#059669',
      route: '/teacher/icse-content',
    },
    {
      id: 'generate',
      title: 'AI Co-Pilot',
      description: 'Generate teaching materials & resources',
      icon: BrainCircuit,
      color: '#8b5cf6',
      route: '/teacher/generate',
    },
    {
      id: 'quiz',
      title: 'Quiz Generator',
      description: 'Create AI-powered assessment quizzes',
      icon: FileText,
      color: '#10b981',
      route: '/teacher/quiz',
    },
    {
      id: 'interview',
      title: 'Interview Assessment',
      description: 'Advanced interview with video & voice analysis',
      icon: Video,
      color: '#f59e0b',
      route: '/teacher/interview',
    },
    {
      id: 'upload',
      title: 'Upload Content',
      description: 'Upload videos and text summaries',
      icon: Upload,
      color: '#06b6d4',
      route: '/teacher/upload',
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'View teaching stats and analytics',
      icon: TrendingUp,
      color: '#ec4899',
      route: '/teacher/performance',
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn about ShikshaSetu',
      icon: Info,
      color: '#6366f1',
      route: '/teacher/about',
    },
    {
      id: 'useful-link',
      title: 'Useful Link',
      description: 'Teaching video resources',
      icon: Link2,
      color: '#14b8a6',
      route: '/teacher/useful-link',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#92400e', '#b45309']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome, Teacher!</Text>
            <Text style={styles.subtitle}>Empower your students with AI</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={24} color="#ffffff" />
          </TouchableOpacity>
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
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Teacher Tools</Text>
        <View style={styles.grid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => router.push(feature.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: feature.color + '20' }]}>
                  <Icon size={32} color={feature.color} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎓 AI Teaching Assistant</Text>
          <Text style={styles.infoText}>
            Use AI to create personalized learning materials, generate quizzes, and assess student understanding through advanced interviews.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.voiceButton, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowVoiceAssistant(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#fed7aa',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsPanel: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fef3c7',
    marginBottom: 12,
  },
  languageScroll: {
    marginBottom: 12,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
  },
  languageButtonActive: {
    backgroundColor: '#ffffff',
  },
  languageText: {
    fontSize: 14,
    color: '#fef3c7',
    fontWeight: '500' as const,
  },
  languageTextActive: {
    color: '#92400e',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    color: '#fca5a5',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  grid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  infoCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
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
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
      },
    }),
  },
  voiceGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
