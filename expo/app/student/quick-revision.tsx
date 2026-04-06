import { useRouter } from 'expo-router';
import { ChevronLeft, Zap, Clock, Loader2, RefreshCw, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon, Sparkles, Brain, Lightbulb, FlaskConical, ImageIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated, Dimensions, Alert, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useSubscription } from '@/contexts/subscription-context';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateObject } from '@/lib/ai-generate';
import { z } from 'zod';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

const RevisionCardSchema = z.object({
  cards: z.array(z.object({
    type: z.enum(['formula', 'keypoint', 'mnemonic', 'tip', 'theory', 'definition']),
    title: z.string(),
    content: z.string(),
    importance: z.enum(['critical', 'important', 'good-to-know']),
  })),
});

type RevisionCard = z.infer<typeof RevisionCardSchema>['cards'][number];

const TYPE_CONFIG: Record<string, { icon: typeof Zap; gradient: [string, string]; label: string }> = {
  formula: { icon: FlaskConical, gradient: ['#ef4444', '#dc2626'], label: 'Formula' },
  keypoint: { icon: Lightbulb, gradient: ['#f59e0b', '#d97706'], label: 'Key Point' },
  mnemonic: { icon: Brain, gradient: ['#8b5cf6', '#7c3aed'], label: 'Mnemonic' },
  tip: { icon: Sparkles, gradient: ['#06b6d4', '#0891b2'], label: 'Exam Tip' },
  theory: { icon: Zap, gradient: ['#10b981', '#059669'], label: 'Theory' },
  definition: { icon: Lightbulb, gradient: ['#6366f1', '#4f46e5'], label: 'Definition' },
};

const IMPORTANCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#ef4444', text: '#ffffff', label: 'CRITICAL' },
  important: { bg: '#f59e0b', text: '#1a1a2e', label: 'IMPORTANT' },
  'good-to-know': { bg: '#22c55e', text: '#ffffff', label: 'GOOD TO KNOW' },
};

function SwipeableCard({ card, index, total, onNext, onPrev, isDark }: {
  card: RevisionCard;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  isDark: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const config = TYPE_CONFIG[card.type] || TYPE_CONFIG.keypoint;
  const importance = IMPORTANCE_COLORS[card.importance] || IMPORTANCE_COLORS.important;
  const Icon = config.icon;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View style={[cardStyles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[cardStyles.card, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={cardStyles.topStripe}
        />

        <View style={cardStyles.headerRow}>
          <View style={cardStyles.typeChip}>
            <LinearGradient colors={config.gradient} style={cardStyles.typeChipGradient}>
              <Icon size={14} color="#ffffff" />
              <Text style={cardStyles.typeChipText}>{config.label}</Text>
            </LinearGradient>
          </View>
          <View style={[cardStyles.importanceBadge, { backgroundColor: importance.bg }]}>
            <Text style={[cardStyles.importanceText, { color: importance.text }]}>{importance.label}</Text>
          </View>
        </View>

        <Text style={[cardStyles.title, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{card.title}</Text>

        <ScrollView style={cardStyles.contentScroll} showsVerticalScrollIndicator={false}>
          <Text style={[cardStyles.content, { color: isDark ? '#b8d0e8' : '#475569' }]}>{card.content}</Text>
        </ScrollView>

        <View style={cardStyles.footer}>
          <TouchableOpacity
            onPress={onPrev}
            style={[cardStyles.navBtn, index === 0 && cardStyles.navBtnDisabled]}
            disabled={index === 0}
          >
            <ChevronLeftIcon size={20} color={index === 0 ? '#94a3b8' : (isDark ? '#38bdf8' : '#0077b6')} />
          </TouchableOpacity>
          <View style={cardStyles.progressDots}>
            <Text style={[cardStyles.progressText, { color: isDark ? '#7ea3c4' : '#64748b' }]}>
              {index + 1} / {total}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onNext}
            style={[cardStyles.navBtn, index === total - 1 && cardStyles.navBtnDisabled]}
            disabled={index === total - 1}
          >
            <ChevronRightIcon size={20} color={index === total - 1 ? '#94a3b8' : (isDark ? '#38bdf8' : '#0077b6')} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 380,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
    }),
  },
  topStripe: {
    height: 5,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  typeChip: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeChipGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  importanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  importanceText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    lineHeight: 28,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: 220,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,119,182,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  progressDots: {
    alignItems: 'center' as const,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
});

export default function QuickRevisionMode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const { colors, isDark } = useTheme();
  const { isPremium } = useSubscription();

  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(10);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [cards, setCards] = useState<RevisionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerAnim = useRef(new Animated.Value(1)).current;
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const allSubjects = useMemo(() =>
    selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS,
    [selectedBoard]
  );
  const subjects = useMemo(() => allSubjects.filter(s => s.grade === selectedGrade), [allSubjects, selectedGrade]);
  const grades = useMemo(() => {
    const set = new Set(allSubjects.map(s => s.grade));
    return Array.from(set).sort((a, b) => a - b);
  }, [allSubjects]);

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('Time Up!', 'Your 5-minute quick revision session is complete. Good luck on your exam!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  useEffect(() => {
    if (timerRunning) {
      Animated.timing(timerAnim, {
        toValue: timeLeft / 300,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, timerRunning, timerAnim]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
      const prompt = `Generate a comprehensive "5-minute before exam" quick revision set for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.

Create exactly 30 revision cards covering the MOST IMPORTANT content across ALL chapters of this subject.
Language: ${selectedLanguage}

Include a balanced mix of ALL these types:
- "formula": Critical FORMULAS with the formula clearly written (about 6-8 cards)
- "keypoint": KEY POINTS that are commonly tested in exams - important facts, statements, properties (about 6-8 cards)
- "theory": THEORY explanations - concise explanations of important concepts, laws, theorems, principles, reactions, processes. Include WHY something works, not just what it is. (about 5-6 cards)
- "definition": Important DEFINITIONS that are frequently asked in exams - precise definitions of key terms and concepts (about 4-5 cards)
- "mnemonic": MNEMONICS to remember lists, sequences, or concepts (about 3-4 cards)
- "tip": EXAM TIPS for common mistakes to avoid, marking scheme tips, and answer-writing strategies (about 3-4 cards)

Focus on:
1. Most frequently asked topics in board exams
2. Formulas students commonly forget
3. Tricky concepts that need last-minute review with proper theory explanation
4. Memory aids for complex information
5. Important theorems, laws, and their applications
6. Key definitions that examiners expect word-perfect
7. Conceptual understanding - not just rote memorization

For theory cards: Include a brief but clear explanation of the concept, why it matters, and how it connects to other topics.
For keypoint cards: Include important facts, properties, exceptions, and special cases.
For definition cards: Give the precise textbook definition along with a one-line explanation.
For formula cards: Include the formula, what each variable represents, and when to use it.

Each card should be concise but complete - designed for quick scanning 5 minutes before an exam.
Mark importance as "critical" for must-know items, "important" for frequently tested, and "good-to-know" for extras.`;

      const result = await robustGenerateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: RevisionCardSchema,
      });
      return result.cards;
    },
    onSuccess: (data) => {
      setCards(data);
      setCurrentIndex(0);
      setTimeLeft(300);
      setTimerRunning(true);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate revision cards. Please try again.');
    },
  });

  const handleGenerate = useCallback(() => {
    if (!selectedSubject) {
      Alert.alert('Select Subject', 'Please select a subject first.');
      return;
    }
    if (!isPremium) {
      router.push('/paywall' as any);
      return;
    }
    generateMutation.mutate();
  }, [selectedSubject, isPremium, router, generateMutation]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentIndex]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleRestart = useCallback(() => {
    setTimeLeft(300);
    setTimerRunning(true);
    setCurrentIndex(0);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a0a10', '#0d1a2d', '#0a1525'] : ['#fff5f5', '#fef3c7', '#f0f7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={isDark ? '#f1f5f9' : '#1a1a2e'} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Zap size={20} color="#ef4444" />
              <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Quick Revision</Text>
            </View>
            <Text style={[styles.headerSub, { color: isDark ? '#7ea3c4' : '#64748b' }]}>5 min before exam</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {cards.length > 0 && (
        <View style={[styles.timerBar, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
          <Clock size={16} color={timeLeft <= 60 ? '#ef4444' : (isDark ? '#38bdf8' : '#0077b6')} />
          <Text style={[styles.timerText, { color: timeLeft <= 60 ? '#ef4444' : (isDark ? '#f1f5f9' : '#1a1a2e') }]}>
            {formatTime(timeLeft)}
          </Text>
          <View style={styles.timerProgress}>
            <Animated.View
              style={[
                styles.timerFill,
                {
                  width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: timeLeft <= 60 ? '#ef4444' : '#22c55e',
                },
              ]}
            />
          </View>
          <TouchableOpacity onPress={handleRestart} style={styles.restartBtn}>
            <RefreshCw size={16} color={isDark ? '#38bdf8' : '#0077b6'} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <>
            <View style={[styles.selectionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Board</Text>
              <View style={styles.chipRow}>
                {(['NCERT', 'ICSE'] as const).map(board => (
                  <TouchableOpacity
                    key={board}
                    style={[styles.chip, selectedBoard === board && styles.chipActive]}
                    onPress={() => { setSelectedBoard(board); setSelectedSubject(''); }}
                  >
                    <Text style={[styles.chipText, selectedBoard === board && styles.chipTextActive]}>{board}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: isDark ? '#38bdf8' : '#0077b6', marginTop: 18 }]}>Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {grades.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, selectedGrade === g && styles.chipActive]}
                    onPress={() => { setSelectedGrade(g); setSelectedSubject(''); }}
                  >
                    <Text style={[styles.chipText, selectedGrade === g && styles.chipTextActive]}>Grade {g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.sectionLabel, { color: isDark ? '#38bdf8' : '#0077b6', marginTop: 18 }]}>Subject</Text>
              <View style={styles.chipRow}>
                {subjects.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, selectedSubject === s.id && styles.chipActive]}
                    onPress={() => setSelectedSubject(s.id)}
                  >
                    <Text style={[styles.chipText, selectedSubject === s.id && styles.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={generateMutation.isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateBtnGradient}
              >
                {generateMutation.isPending ? (
                  <View style={styles.loadingRow}>
                    <Loader2 size={22} color="#ffffff" />
                    <Text style={styles.generateBtnText}>Generating Cards...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingRow}>
                    <Zap size={22} color="#ffffff" />
                    <Text style={styles.generateBtnText}>Start Quick Revision</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' }]}>
              <Zap size={18} color="#ef4444" />
              <View style={styles.infoTextCol}>
                <Text style={[styles.infoTitle, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>How it works</Text>
                <Text style={[styles.infoDesc, { color: isDark ? '#f1a1a1' : '#dc2626' }]}>
                  Get the most critical formulas, key points, and mnemonics in swipeable cards. A 5-minute countdown timer keeps you focused. Perfect for last-minute revision right before your exam!
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.filterRow}>
              {['all', 'formula', 'keypoint', 'mnemonic', 'tip'].map(f => {
                const isAll = f === 'all';
                const count = isAll ? cards.length : cards.filter(c => c.type === f).length;
                return (
                  <TouchableOpacity key={f} style={styles.filterChip} onPress={() => {
                    if (isAll) { setCurrentIndex(0); return; }
                    const idx = cards.findIndex(c => c.type === f);
                    if (idx >= 0) setCurrentIndex(idx);
                  }}>
                    <Text style={[styles.filterChipText, { color: isDark ? '#b8d0e8' : '#475569' }]}>
                      {isAll ? 'All' : TYPE_CONFIG[f]?.label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SwipeableCard
              card={cards[currentIndex]}
              index={currentIndex}
              total={cards.length}
              onNext={handleNext}
              onPrev={handlePrev}
              isDark={isDark}
            />

            <TouchableOpacity
              style={[styles.imageGenBtn, isGeneratingImage && { opacity: 0.6 }]}
              onPress={async () => {
                if (isGeneratingImage) return;
                setIsGeneratingImage(true);
                setCardImage(null);
                try {
                  const card = cards[currentIndex];
                  const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
                  const prompt = `Create a clean educational diagram for ${selectedBoard} Grade ${selectedGrade} ${subjectName}: ${card.title}. ${card.content.slice(0, 200)}. Make it a clear, labeled educational illustration with professional colors, suitable for quick revision. No text-heavy content.`;
                  const toolkitBase = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
                  const response = await fetch(`${toolkitBase.replace(/\/$/, '')}/images/generate/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, size: '1024x1024' }),
                  });
                  if (!response.ok) throw new Error('Failed');
                  const data = await response.json();
                  if (data?.image?.base64Data) {
                    setCardImage(`data:${data.image.mimeType};base64,${data.image.base64Data}`);
                  }
                } catch {
                  Alert.alert('Error', 'Failed to generate illustration.');
                } finally {
                  setIsGeneratingImage(false);
                }
              }}
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : (
                <ImageIcon size={16} color="#f97316" />
              )}
              <Text style={styles.imageGenBtnText}>
                {isGeneratingImage ? 'Generating...' : 'Generate Illustration'}
              </Text>
            </TouchableOpacity>

            {cardImage && (
              <View style={[styles.cardImageWrap, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
                <Image source={{ uri: cardImage }} style={styles.cardImage} resizeMode="contain" />
              </View>
            )}

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#152a45' : '#e2e8f0' }]}>
                <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]} />
              </View>
              <Text style={[styles.progressLabel, { color: isDark ? '#7ea3c4' : '#64748b' }]}>
                {currentIndex + 1} of {cards.length} cards reviewed
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => { setCards([]); setTimerRunning(false); setTimeLeft(300); }}
              style={[styles.newSessionBtn, { backgroundColor: isDark ? '#152a45' : '#f1f5f9' }]}
            >
              <RefreshCw size={16} color={isDark ? '#38bdf8' : '#0077b6'} />
              <Text style={[styles.newSessionText, { color: isDark ? '#38bdf8' : '#0077b6' }]}>New Session</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' as const },
  headerSub: { fontSize: 12, fontWeight: '600' as const, marginTop: 2 },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  timerText: { fontSize: 18, fontWeight: '800' as const, width: 50 },
  timerProgress: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  restartBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,119,182,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  selectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#64748b' },
  chipTextActive: { color: '#ffffff' },
  generateBtn: { marginBottom: 20, borderRadius: 18, overflow: 'hidden' },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtnText: { fontSize: 17, fontWeight: '800' as const, color: '#ffffff' },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  infoTextCol: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 14, fontWeight: '700' as const },
  infoDesc: { fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  filterChipText: { fontSize: 12, fontWeight: '600' as const },
  progressBarContainer: { marginTop: 8, marginBottom: 20, gap: 8 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#ef4444' },
  progressLabel: { fontSize: 12, fontWeight: '600' as const, textAlign: 'center' as const },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  newSessionText: { fontSize: 15, fontWeight: '700' as const },
  imageGenBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  imageGenBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#f97316',
  },
  cardImageWrap: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  cardImage: {
    width: '100%' as const,
    height: 260,
    borderRadius: 14,
  },
});
