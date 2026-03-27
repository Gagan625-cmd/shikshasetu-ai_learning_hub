import { useRouter } from 'expo-router';
import { BookOpen, BrainCircuit, MessageSquare, Settings, FileText, LogOut, TrendingUp, MessageCircle, Info, ScanText, Target, Video, Bell, Link2, Palette, Zap, Star, Crown, Shield, Award, Trophy, Gamepad2, Moon, Sun, ChevronRight, Quote, Mail, Sparkles, Key, Layers, CalendarClock } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { LANGUAGES } from '@/constants/ncert-data';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useTheme } from '@/contexts/theme-context';
import { useMessaging } from '@/contexts/messaging-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DAILY_QUOTES = [
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "Intelligence plus character — that is the goal of true education.", author: "Martin Luther King Jr." },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "Self-discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
];

function getDailyQuote() {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24)) % DAILY_QUOTES.length;
  return DAILY_QUOTES[dayIndex];
}

const DailyQuoteCard = memo(({ isDark }: { isDark: boolean }) => {
  const quote = useMemo(() => getDailyQuote(), []);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View style={[quoteStyles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={isDark ? ['#091525', '#0a1e35', '#0d2848'] : ['#0a1628', '#0d2847', '#0e3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={quoteStyles.gradient}
      >
        <View style={quoteStyles.accentLine} />
        <Animated.View style={[quoteStyles.decorOrb1, { opacity: shimmerOpacity }]} />
        <Animated.View style={[quoteStyles.decorOrb2, { opacity: shimmerOpacity }]} />
        <View style={quoteStyles.quoteIconWrap}>
          <LinearGradient
            colors={['#ff9f1c', '#ff6b35']}
            style={quoteStyles.quoteIconBg}
          >
            <Quote size={14} color="#0a1628" fill="#0a1628" />
          </LinearGradient>
        </View>
        <Text style={quoteStyles.quoteText}>{quote.text}</Text>
        <View style={quoteStyles.authorRow}>
          <View style={quoteStyles.authorLine} />
          <Text style={quoteStyles.authorText}>{quote.author}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

DailyQuoteCard.displayName = 'DailyQuoteCard';

const quoteStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0077b6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 8px 32px rgba(0, 119, 182, 0.35)' },
    }),
  },
  gradient: {
    padding: 22,
    paddingLeft: 30,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    backgroundColor: '#ff6b35',
  },
  decorOrb1: {
    position: 'absolute' as const,
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  decorOrb2: {
    position: 'absolute' as const,
    bottom: -40,
    left: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 180, 216, 0.1)',
  },
  quoteIconWrap: {
    marginBottom: 12,
  },
  quoteIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#caf0f8',
    lineHeight: 25,
    fontStyle: 'italic' as const,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  authorLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ff9f1c',
  },
  authorText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#ff9f1c',
    letterSpacing: 0.5,
  },
});

const FunLearningCard = memo(({ feature, onPress }: { feature: any; onPress: () => void }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    ).start();
  }, [borderAnim, glowAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'],
  });

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const Icon = feature.icon;
  return (
    <Animated.View style={[styles.funCardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[styles.funCardBorderWrap, { borderColor: animatedBorderColor, ...Platform.select({ ios: { shadowOpacity: animatedShadowOpacity as any }, android: {}, web: {} }) }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.funCardTouchable}
        >
          <LinearGradient
            colors={['#1a0a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.funCardGradient}
          >
            <View style={styles.funCardStars}>
              <Text style={styles.funStar1}>✦</Text>
              <Text style={styles.funStar2}>✧</Text>
              <Text style={styles.funStar3}>✦</Text>
              <Text style={styles.funStar4}>✧</Text>
            </View>

            <View style={styles.funCardHeader}>
              <View style={styles.funIconWrap}>
                <LinearGradient
                  colors={['#f97316', '#ec4899', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.funIconGradient}
                >
                  <Icon size={30} color="#ffffff" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <View style={styles.funBadge}>
                <Zap size={12} color="#fbbf24" />
                <Text style={styles.funBadgeText}>ENHANCED</Text>
              </View>
            </View>

            <Text style={styles.funCardTitle}>{feature.title}</Text>
            <Text style={styles.funCardDesc}>{feature.description}</Text>

            <View style={styles.funCardFooter}>
              <View style={styles.funGameTags}>
                <View style={[styles.funGameTag, { backgroundColor: 'rgba(249, 115, 22, 0.25)' }]}>
                  <Text style={[styles.funGameTagText, { color: '#fb923c' }]}>Pacman</Text>
                </View>
                <View style={[styles.funGameTag, { backgroundColor: 'rgba(34, 197, 94, 0.25)' }]}>
                  <Text style={[styles.funGameTagText, { color: '#4ade80' }]}>Fox</Text>
                </View>
                <View style={[styles.funGameTag, { backgroundColor: 'rgba(139, 92, 246, 0.25)' }]}>
                  <Text style={[styles.funGameTagText, { color: '#a78bfa' }]}>GK Quiz</Text>
                </View>
              </View>
              <View style={styles.funPlayBtn}>
                <Text style={styles.funPlayText}>PLAY</Text>
                <ChevronRight size={14} color="#ffffff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

FunLearningCard.displayName = 'FunLearningCard';

const FeatureCard = memo(({ feature, onPress, isDark, index }: { feature: any; onPress: () => void; isDark: boolean; index: number }) => {
  const Icon = feature.icon;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 600);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, index]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
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
            borderColor: isDark ? feature.color + '35' : 'rgba(0,0,0,0.04)',
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.featureCardInner}>
          <View style={styles.featureCardLeft}>
            <LinearGradient
              colors={[feature.color + '25', feature.color + '10']}
              style={styles.iconCircle}
            >
              <Icon size={26} color={feature.color} strokeWidth={2} />
            </LinearGradient>
          </View>
          <View style={styles.featureCardMiddle}>
            <Text style={[styles.featureTitle, { color: isDark ? feature.color : '#1a1a2e' }]}>{feature.title}</Text>
            <Text style={[styles.featureDescription, { color: isDark ? '#b0bec5' : '#64748b' }]}>{feature.description}</Text>
          </View>
          <View style={[styles.featureArrow, { backgroundColor: isDark ? feature.color + '30' : feature.color + '15' }]}>
            <ChevronRight size={18} color={feature.color} />
          </View>
        </View>
        <View style={[styles.featureAccent, { backgroundColor: feature.color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
});

FeatureCard.displayName = 'FeatureCard';

const UploadCard = memo(({ upload, onPress, isDark }: { upload: any; onPress: () => void; isDark: boolean }) => (
  <TouchableOpacity
    style={[styles.uploadCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#ffffff', borderColor: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.04)' }]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <LinearGradient
      colors={upload.type === 'video' ? ['#3b82f6', '#2563eb'] : ['#f59e0b', '#d97706']}
      style={styles.uploadIconCircle}
    >
      {upload.type === 'video' ? (
        <Video size={20} color="#ffffff" />
      ) : (
        <FileText size={20} color="#ffffff" />
      )}
    </LinearGradient>
    <Text style={[styles.uploadTitle, { color: isDark ? '#7dd3fc' : '#1a1a2e' }]} numberOfLines={2}>{upload.title}</Text>
    <Text style={styles.uploadMeta}>{upload.board} Grade {upload.grade}</Text>
    <Text style={[styles.uploadSubject, { color: isDark ? '#90caf9' : '#64748b' }]} numberOfLines={1}>{upload.subject}</Text>
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
  const { signOut, user } = useAuth();
  const { colors, isDark, toggleDarkMode } = useTheme();
  const { unreadCount, registerContact } = useMessaging();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user && !user.isGuest) {
      void registerContact(user.email, user.name, 'student');
    }
  }, [user, registerContact]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerSlide]);

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
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
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
    { id: 'content', title: 'NCERT Content', description: 'Browse chapters from Grade 6-10', icon: BookOpen, color: '#3b82f6', route: '/student/content' },
    { id: 'icse-content', title: 'ICSE Content', description: 'Physics, Chemistry, Biology & Maths', icon: BookOpen, color: '#059669', route: '/student/icse-content' },
    { id: 'generate', title: 'AI Content Generator', description: 'Generate notes, summaries & worksheets', icon: BrainCircuit, color: '#8b5cf6', route: '/student/generate' },
    { id: 'flashcards', title: 'AI Flashcards', description: 'Premium interactive flashcards for all chapters', icon: Layers, color: '#f59e0b', route: '/student/flashcards' },
    { id: 'quiz', title: 'AI Quiz', description: 'Practice with AI-generated quizzes', icon: FileText, color: '#10b981', route: '/student/quiz' },
    { id: 'interview', title: 'Interview Practice', description: 'Personalized AI interview session', icon: MessageSquare, color: '#f59e0b', route: '/student/interview' },
    { id: 'performance', title: 'Performance', description: 'View your progress and achievements', icon: TrendingUp, color: '#ec4899', route: '/student/performance' },
    { id: 'exam-scanner', title: 'AI Exam Scanner', description: 'Scan & grade your exam papers', icon: ScanText, color: '#06b6d4', route: '/student/exam-scanner' },
    { id: 'timetable', title: 'AI Study Planner', description: 'Generate a smart exam timetable', icon: CalendarClock, color: '#0ea5e9', route: '/student/timetable' },
    { id: 'study-os', title: 'Study OS', description: 'Focus timer, streaks & AI coach', icon: Target, color: '#f97316', route: '/student/study-os' },
    { id: 'comic-learn', title: 'Comic Learn', description: 'Learn chapters through fun comics', icon: Palette, color: '#ef4444', route: '/student/comic-learn' },
    { id: 'fun-learning', title: 'Fun with Learning', description: 'Pacman, Jumping Fox & GK Quiz!', icon: Gamepad2, color: '#f97316', route: '/student/fun-learning' },
    { id: 'competition', title: 'Monthly Challenge', description: 'Compete & win Premium rewards!', icon: Trophy, color: '#eab308', route: '/student/competition' },
    { id: 'about', title: 'About', description: 'Learn about ShikshaSetu', icon: Info, color: '#6366f1', route: '/student/about' },
    { id: 'useful-link', title: 'Useful Link', description: 'Teaching video resources', icon: Link2, color: '#14b8a6', route: '/student/useful-link' },
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.headerGradientStudent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#ff6b35', '#ff9f1c']}
              style={styles.logoCircle}
            >
              <Zap size={20} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <Text style={styles.greeting}>ShikshaSetu</Text>
              <Text style={styles.subtitle}>Let&apos;s learn something new today</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/student/messages' as any)}
            >
              <Mail size={18} color="#38bdf8" />
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
              {isDark ? <Sun size={18} color="#ff9f1c" /> : <Moon size={18} color="#7da0c4" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Settings size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.xpBar}>
          <View style={styles.levelRow}>
            <Animated.View style={[styles.levelIconOuter, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={[levelInfo.color, levelInfo.color + 'AA']}
                style={styles.levelIconGradient}
              >
                <Text style={styles.levelNumber}>{levelInfo.level}</Text>
              </LinearGradient>
            </Animated.View>
            <View style={styles.levelTextCol}>
              <View style={styles.levelTitleRow}>
                <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                {hasXPReward && (
                  <LinearGradient
                    colors={['#ff9f1c', '#ff6b35']}
                    style={styles.xpRewardBadge}
                  >
                    <Crown size={10} color="#ffffff" />
                    <Text style={styles.xpRewardText}>Premium</Text>
                  </LinearGradient>
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
              <Animated.View style={[styles.xpProgressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
                <LinearGradient
                  colors={['#ff9f1c', '#ff6b35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.xpProgressGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.xpProgressLabels}>
              <Text style={styles.xpGoalText}>
                {levelInfo.level < 10 ? `${levelInfo.nextLevelXP - userProgress.totalXP} XP to Level ${levelInfo.level + 1}` : 'Max Level!'}
              </Text>
              <Text style={styles.xpGoalText}>
                {userProgress.totalXP >= 10000 ? 'Free Premium!' : `${Math.max(10000 - userProgress.totalXP, 0)} to Premium`}
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
            {user?.authCode && !user?.isGuest && (
              <View style={styles.authCodePanel}>
                <View style={styles.authCodeRow}>
                  <Key size={16} color="#0ea5e9" />
                  <Text style={styles.authCodeLabel}>Your Auth Code</Text>
                </View>
                <View style={styles.authCodeDigits}>
                  {user.authCode.split('').map((digit, i) => (
                    <View key={i} style={styles.authDigitBox}>
                      <Text style={styles.authDigitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.authCodeHint}>Use this code to sign in quickly</Text>
              </View>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <DailyQuoteCard isDark={isDark} />

        {userProgress.teacherUploads.length > 0 && (
          <View style={styles.uploadsSection}>
            <View style={styles.uploadsSectionHeader}>
              <LinearGradient
                colors={['#ff9f1c', '#ff6b35']}
                style={styles.uploadBellBg}
              >
                <Bell size={14} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.uploadsSectionTitle, { color: colors.text }]}>New from your Teacher!</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.uploadsScroll}
            >
              {recentUploads.map((item) => (
                <UploadCard key={item.id} upload={item} onPress={() => handleUploadPress(item)} isDark={isDark} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.sectionTitleRow}>
          <Sparkles size={20} color={isDark ? '#38bdf8' : '#0077b6'} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
        </View>
        <View style={styles.featuresList}>
          {features.map((item, idx) => (
            item.id === 'fun-learning' ? (
              <FunLearningCard key={item.id} feature={item} onPress={() => handleFeaturePress(item.route)} />
            ) : (
              <FeatureCard key={item.id} feature={item} onPress={() => handleFeaturePress(item.route)} isDark={isDark} index={idx} />
            )
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#eef4ff', borderLeftColor: isDark ? '#818cf8' : '#6366f1' }]}>
          <View style={styles.infoCardHeader}>
            <Sparkles size={16} color={isDark ? '#a5b4fc' : '#0077b6'} />
            <Text style={[styles.infoTitle, { color: isDark ? '#a5b4fc' : '#006da3' }]}>Offline & Online</Text>
          </View>
          <Text style={[styles.infoText, { color: isDark ? '#c7d2fe' : '#005f8a' }]}>
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
          colors={['#0077b6', '#00b4d8', '#48cae4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chatbotGradient}
        >
          <MessageCircle size={26} color="#ffffff" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showChatbot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatbot(false)}
      >
        <View style={[styles.chatbotModal, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <LinearGradient
            colors={isDark ? ['#141928', '#1c2236'] : ['#ffffff', '#f8faff']}
            style={[styles.chatHeader, { borderBottomColor: colors.border }]}
          >
            <View style={styles.chatHeaderLeft}>
              <LinearGradient
                colors={['#0077b6', '#00b4d8']}
                style={styles.chatAvatarBg}
              >
                <BrainCircuit size={18} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={[styles.chatTitle, { color: colors.text }]}>ShikshaBuddy</Text>
                <Text style={[styles.chatSubtitle, { color: colors.textSecondary }]}>Your AI Learning Assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowChatbot(false)} style={[styles.closeButton, { backgroundColor: isDark ? '#1e2640' : '#f0f4ff' }]}>
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView 
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
          >
            {messages.length === 0 && (
              <LinearGradient
                colors={isDark ? ['#1a1040', '#141928'] : ['#eef2ff', '#e0e7ff']}
                style={styles.welcomeMessage}
              >
                <Text style={[styles.welcomeEmoji]}>👋</Text>
                <Text style={[styles.welcomeText, { color: isDark ? '#38bdf8' : '#006da3' }]}>Hello! I&apos;m ShikshaBuddy.</Text>
                <Text style={[styles.welcomeSubtext, { color: isDark ? '#4a6a8a' : '#0077b6' }]}>Ask me any questions about your studies!</Text>
              </LinearGradient>
            )}
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : [styles.assistantBubble, { backgroundColor: isDark ? '#1c2236' : '#f0f4ff', borderColor: isDark ? '#1e2640' : '#dde4f0' }],
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : [styles.assistantText, { color: colors.text }],
                ]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.chatInput, { paddingBottom: insets.bottom + 8, backgroundColor: isDark ? '#141928' : '#ffffff', borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.chatTextInput, { backgroundColor: isDark ? '#1c2236' : '#f0f4ff', borderColor: isDark ? '#1e2640' : '#dde4f0', color: colors.text }]}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textTertiary}
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
              <LinearGradient
                colors={inputText.trim() ? ['#0077b6', '#00b4d8'] : ['#7a8faa', '#7a8faa']}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>{isSending ? '...' : '→'}</Text>
              </LinearGradient>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    color: '#7dd3fc',
    fontWeight: '500' as const,
  },
  xpBar: {
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  levelIconOuter: {
    width: 50,
    height: 50,
  },
  levelIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '900' as const,
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
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#7dd3fc',
    marginTop: 3,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpRewardText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  streakMini: {
    alignItems: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakMiniText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fb923c',
  },
  xpProgressContainer: {
    gap: 8,
  },
  xpProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressGradient: {
    flex: 1,
    borderRadius: 4,
  },
  xpProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpGoalText: {
    fontSize: 11,
    color: '#7dd3fc',
    fontWeight: '600' as const,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsPanel: {
    marginTop: 18,
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#caf0f8',
    marginBottom: 12,
  },
  languageScroll: {
    marginBottom: 12,
  },
  languageButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  languageButtonActive: {
    backgroundColor: '#ff9f1c',
    borderColor: '#ff9f1c',
  },
  languageText: {
    fontSize: 14,
    color: '#90e0ef',
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
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
        shadowColor: '#0077b6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0, 119, 182, 0.1)' },
    }),
  },
  featureCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  featureCardLeft: {},
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
  funCardOuter: {
    borderRadius: 22,
  },
  funCardBorderWrap: {
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#f97316',
    ...Platform.select({
      ios: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      web: { boxShadow: '0 6px 30px rgba(249, 115, 22, 0.35)' },
    }),
  },
  funCardTouchable: {
    borderRadius: 19,
    overflow: 'hidden',
  },
  funCardGradient: {
    padding: 22,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  funCardStars: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  funStar1: {
    position: 'absolute' as const,
    top: 12,
    right: 18,
    fontSize: 14,
    color: 'rgba(251, 191, 36, 0.5)',
  },
  funStar2: {
    position: 'absolute' as const,
    top: 40,
    right: 60,
    fontSize: 10,
    color: 'rgba(236, 72, 153, 0.4)',
  },
  funStar3: {
    position: 'absolute' as const,
    bottom: 30,
    left: 20,
    fontSize: 12,
    color: 'rgba(139, 92, 246, 0.4)',
  },
  funStar4: {
    position: 'absolute' as const,
    bottom: 14,
    right: 40,
    fontSize: 8,
    color: 'rgba(6, 182, 212, 0.5)',
  },
  funCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  funIconWrap: {
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 3px 12px rgba(236, 72, 153, 0.4)' },
    }),
  },
  funIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  funBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  funBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ff9f1c',
    letterSpacing: 1,
  },
  funCardTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  funCardDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  funCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  funGameTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  funGameTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  funGameTagText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  funPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  funPlayText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: 1,
  },
  infoCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    borderLeftWidth: 4,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatbotButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#0077b6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 24px rgba(0, 119, 182, 0.45)' },
    }),
  },
  chatbotGradient: {
    width: 60,
    height: 60,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotModal: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatAvatarBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  chatSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    gap: 12,
  },
  welcomeMessage: {
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0077b6',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {},
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chatTextInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 10,
    marginBottom: 14,
  },
  uploadBellBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  uploadsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  uploadCard: {
    width: 165,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0077b6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 12px rgba(0, 119, 182, 0.1)' },
    }),
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 6,
    lineHeight: 18,
  },
  uploadMeta: {
    fontSize: 12,
    color: '#ff9f1c',
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  uploadSubject: {
    fontSize: 11,
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
    borderColor: '#0a1628',
  },
  msgBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  authCodePanel: {
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.15)',
  },
  authCodeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  authCodeLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#7dd3fc',
  },
  authCodeDigits: {
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  authDigitBox: {
    width: 40,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  authDigitText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#38bdf8',
  },
  authCodeHint: {
    fontSize: 11,
    color: '#7dd3fc',
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
});
