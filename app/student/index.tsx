import { useRouter } from 'expo-router';
import { BookOpen, BrainCircuit, MessageSquare, Settings, FileText, LogOut, TrendingUp, MessageCircle, Info, ScanText, Target, Video, Bell, Link2, Palette, Zap, Star, Crown, Shield, Award, Trophy } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { LANGUAGES } from '@/constants/ncert-data';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FeatureCard = memo(({ feature, onPress }: { feature: any; onPress: () => void }) => {
  const Icon = feature.icon;
  return (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: feature.color + '20' }]}>
        <Icon size={32} color={feature.color} strokeWidth={2} />
      </View>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
    </TouchableOpacity>
  );
});

FeatureCard.displayName = 'FeatureCard';

const UploadCard = memo(({ upload, onPress }: { upload: any; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.uploadCard}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={[styles.uploadIconCircle, { backgroundColor: upload.type === 'video' ? '#eff6ff' : '#fef3c7' }]}>
      {upload.type === 'video' ? (
        <Video size={24} color="#3b82f6" />
      ) : (
        <FileText size={24} color="#f59e0b" />
      )}
    </View>
    <Text style={styles.uploadTitle} numberOfLines={2}>{upload.title}</Text>
    <Text style={styles.uploadMeta}>{upload.board} Grade {upload.grade}</Text>
    <Text style={styles.uploadSubject} numberOfLines={1}>{upload.subject}</Text>
  </TouchableOpacity>
));

UploadCard.displayName = 'UploadCard';

function getLevel(xp: number): { level: number; title: string; icon: typeof Star; color: string; nextLevelXP: number; currentLevelXP: number } {
  if (xp >= 10000) return { level: 10, title: 'Legend', icon: Crown, color: '#fbbf24', nextLevelXP: 10000, currentLevelXP: 10000 };
  if (xp >= 7500) return { level: 9, title: 'Master', icon: Crown, color: '#f59e0b', nextLevelXP: 10000, currentLevelXP: 7500 };
  if (xp >= 5000) return { level: 8, title: 'Expert', icon: Award, color: '#8b5cf6', nextLevelXP: 7500, currentLevelXP: 5000 };
  if (xp >= 3500) return { level: 7, title: 'Scholar', icon: Award, color: '#6366f1', nextLevelXP: 5000, currentLevelXP: 3500 };
  if (xp >= 2000) return { level: 6, title: 'Achiever', icon: Shield, color: '#3b82f6', nextLevelXP: 3500, currentLevelXP: 2000 };
  if (xp >= 1000) return { level: 5, title: 'Warrior', icon: Shield, color: '#0ea5e9', nextLevelXP: 2000, currentLevelXP: 1000 };
  if (xp >= 500) return { level: 4, title: 'Explorer', icon: Star, color: '#14b8a6', nextLevelXP: 1000, currentLevelXP: 500 };
  if (xp >= 200) return { level: 3, title: 'Learner', icon: Star, color: '#10b981', nextLevelXP: 500, currentLevelXP: 200 };
  if (xp >= 50) return { level: 2, title: 'Starter', icon: Star, color: '#22c55e', nextLevelXP: 200, currentLevelXP: 50 };
  return { level: 1, title: 'Novice', icon: Star, color: '#84cc16', nextLevelXP: 50, currentLevelXP: 0 };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { resetApp, selectedLanguage, changeLanguage, userProgress, hasXPReward } = useApp();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const levelInfo = useMemo(() => getLevel(userProgress.totalXP), [userProgress.totalXP]);
  const levelProgress = useMemo(() => {
    const range = levelInfo.nextLevelXP - levelInfo.currentLevelXP;
    if (range === 0) return 1;
    return (userProgress.totalXP - levelInfo.currentLevelXP) / range;
  }, [userProgress.totalXP, levelInfo]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: levelProgress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [levelProgress, progressAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleLogout = useCallback(async () => {
    await signOut();
    await resetApp();
    router.replace('/auth' as any);
  }, [signOut, resetApp, router]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const systemPrompt = `You are ShikshaBuddy, an AI educational assistant for students. Help with doubts, questions, and learning. Be encouraging and educational.`;
      const response = await generateText({ 
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${chatHistory ? 'Previous conversation:\n' + chatHistory + '\n\n' : ''}Student question: ${userMessage}` }
        ] 
      });
      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, 
        { role: 'user', content: inputText },
        { role: 'assistant', content: response }
      ]);
      setInputText('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to get response. Please try again.');
    },
  });

  const { mutate: sendMessage, isPending: isSending } = chatMutation;

  const handleSendMessage = useCallback(() => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
    }
  }, [inputText, sendMessage]);

  const features = useMemo(() => [
    {
      id: 'content',
      title: 'NCERT Content',
      description: 'Browse chapters from Grade 6-10',
      icon: BookOpen,
      color: '#3b82f6',
      route: '/student/content',
    },
    {
      id: 'icse-content',
      title: 'ICSE Content',
      description: 'Physics, Chemistry, Biology & Maths',
      icon: BookOpen,
      color: '#059669',
      route: '/student/icse-content',
    },
    {
      id: 'generate',
      title: 'AI Content Generator',
      description: 'Generate notes, summaries & worksheets',
      icon: BrainCircuit,
      color: '#8b5cf6',
      route: '/student/generate',
    },
    {
      id: 'quiz',
      title: 'AI Quiz',
      description: 'Practice with AI-generated quizzes',
      icon: FileText,
      color: '#10b981',
      route: '/student/quiz',
    },
    {
      id: 'interview',
      title: 'Interview Practice',
      description: 'Personalized AI interview session',
      icon: MessageSquare,
      color: '#f59e0b',
      route: '/student/interview',
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'View your progress and achievements',
      icon: TrendingUp,
      color: '#ec4899',
      route: '/student/performance',
    },
    {
      id: 'exam-scanner',
      title: 'AI Exam Scanner',
      description: 'Scan & grade your exam papers',
      icon: ScanText,
      color: '#06b6d4',
      route: '/student/exam-scanner',
    },
    {
      id: 'study-os',
      title: 'Study OS',
      description: 'Focus timer, streaks & AI coach',
      icon: Target,
      color: '#f59e0b',
      route: '/student/study-os',
    },
    {
      id: 'comic-learn',
      title: 'Comic Learn',
      description: 'Learn chapters through fun comics',
      icon: Palette,
      color: '#f97316',
      route: '/student/comic-learn',
    },
    {
      id: 'competition',
      title: 'Monthly Challenge',
      description: 'Compete & win Premium rewards!',
      icon: Trophy,
      color: '#f59e0b',
      route: '/student/competition',
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn about ShikshaSetu',
      icon: Info,
      color: '#6366f1',
      route: '/student/about',
    },
    {
      id: 'useful-link',
      title: 'Useful Link',
      description: 'Teaching video resources',
      icon: Link2,
      color: '#14b8a6',
      route: '/student/useful-link',
    },
  ], []);

  const recentUploads = useMemo(() => 
    userProgress.teacherUploads.slice(-5).reverse(),
    [userProgress.teacherUploads]
  );

  const handleUploadPress = useCallback((upload: any) => {
    if (upload.type === 'video' && upload.videoUrl) {
      Alert.alert(
        upload.title,
        `Watch video: ${upload.videoUrl}\n\nGrade: ${upload.grade}\nSubject: ${upload.subject}\nChapter: ${upload.chapter}`,
        [
          { text: 'Copy Link', onPress: () => {} },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        upload.title,
        `${upload.content}\n\nGrade: ${upload.grade}\nSubject: ${upload.subject}\nChapter: ${upload.chapter}`
      );
    }
  }, []);

  const handleFeaturePress = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Zap size={22} color="#fbbf24" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.greeting}>ShikshaSetu</Text>
              <Text style={styles.subtitle}>Let&apos;s learn something new today</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.xpBar}>
          <View style={styles.levelRow}>
            <Animated.View style={[styles.levelIconOuter, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={[levelInfo.color, levelInfo.color + 'CC']}
                style={styles.levelIconGradient}
              >
                <Text style={styles.levelNumber}>{levelInfo.level}</Text>
              </LinearGradient>
            </Animated.View>
            <View style={styles.levelTextCol}>
              <View style={styles.levelTitleRow}>
                <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                {hasXPReward && (
                  <View style={styles.xpRewardBadge}>
                    <Crown size={10} color="#fbbf24" />
                    <Text style={styles.xpRewardText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.xpValue}>{userProgress.totalXP.toLocaleString()} XP</Text>
            </View>
            <View style={styles.streakMini}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakMiniText}>{userProgress.currentStreak}</Text>
            </View>
          </View>
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressBg}>
              <Animated.View style={[styles.xpProgressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <View style={styles.xpProgressLabels}>
              <Text style={styles.xpGoalText}>
                {levelInfo.level < 10 ? `${levelInfo.nextLevelXP - userProgress.totalXP} XP to Level ${levelInfo.level + 1}` : '🏆 Max Level!'}
              </Text>
              <Text style={styles.xpGoalText}>
                {userProgress.totalXP >= 10000 ? '✨ Free Premium!' : `${Math.max(10000 - userProgress.totalXP, 0)} to Premium`}
              </Text>
            </View>
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
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {userProgress.teacherUploads.length > 0 && (
          <View style={styles.uploadsSection}>
            <View style={styles.uploadsSectionHeader}>
              <Bell size={20} color="#f59e0b" />
              <Text style={styles.uploadsSectionTitle}>New from your Teacher!</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.uploadsScroll}
            >
              {recentUploads.map((item) => (
                <UploadCard key={item.id} upload={item} onPress={() => handleUploadPress(item)} />
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresList}>
          {features.map((item) => (
            <FeatureCard key={item.id} feature={item} onPress={() => handleFeaturePress(item.route)} />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✨ Offline & Online</Text>
          <Text style={styles.infoText}>
            All NCERT content is available both offline and online. Download once and access anytime!
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={() => setShowChatbot(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8b5cf6', '#6366f1']}
          style={styles.chatbotGradient}
        >
          <MessageCircle size={28} color="#ffffff" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showChatbot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatbot(false)}
      >
        <View style={[styles.chatbotModal, { paddingTop: insets.top }]}>
          <View style={styles.chatHeader}>
            <View>
              <Text style={styles.chatTitle}>ShikshaBuddy</Text>
              <Text style={styles.chatSubtitle}>Your AI Learning Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setShowChatbot(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
          >
            {messages.length === 0 && (
              <View style={styles.welcomeMessage}>
                <Text style={styles.welcomeText}>👋 Hello! I&apos;m ShikshaBuddy.</Text>
                <Text style={styles.welcomeSubtext}>Ask me any questions about your studies!</Text>
              </View>
            )}
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText,
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.chatInput, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
            >
              <Text style={styles.sendButtonText}>{isSending ? '...' : '→'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  xpBar: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  levelIconOuter: {
    width: 48,
    height: 48,
  },
  levelIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  levelTextCol: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginTop: 2,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpRewardText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fbbf24',
  },
  streakMini: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakMiniText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fb923c',
  },
  xpProgressContainer: {
    gap: 6,
  },
  xpProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  xpProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpGoalText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500' as const,
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
    color: '#e0e7ff',
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
    color: '#e0e7ff',
    fontWeight: '500' as const,
  },
  languageTextActive: {
    color: '#1e3c72',
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
  featuresList: {
    gap: 16,
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
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  chatbotButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 32,
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
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
      },
    }),
  },
  chatbotGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotModal: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  chatSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    gap: 12,
  },
  welcomeMessage: {
    padding: 24,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1e293b',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  chatTextInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700' as const,
  },
  uploadsSection: {
    marginBottom: 24,
  },
  uploadsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  uploadsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  uploadsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  uploadCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
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
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 18,
  },
  uploadMeta: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  uploadSubject: {
    fontSize: 11,
    color: '#64748b',
  },
});
