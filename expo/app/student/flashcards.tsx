import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, RotateCcw, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon, Loader2, Crown, Zap, BookOpen, Layers } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useSubscription } from '@/contexts/subscription-context';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateText } from '@/lib/ai-generate';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = 380;

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tag?: string;
}

const DIFFICULTY_COLORS = {
  easy: { bg: '#059669', text: '#ecfdf5', label: 'Easy' },
  medium: { bg: '#d97706', text: '#fffbeb', label: 'Medium' },
  hard: { bg: '#dc2626', text: '#fef2f2', label: 'Hard' },
};

const FlashcardItem = ({ card, index, currentIndex }: { card: Flashcard; index: number; currentIndex: number }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (index !== currentIndex) {
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  }, [currentIndex, index, flipAnim]);

  const handleFlip = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, useNativeDriver: true }).start(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    });

    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim, scaleAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const diff = DIFFICULTY_COLORS[card.difficulty];

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={cardStyles.wrapper}>
      <Animated.View style={[cardStyles.container, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View
          style={[
            cardStyles.face,
            cardStyles.front,
            {
              transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
              opacity: frontOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardStyles.gradient}
          >
            <View style={cardStyles.topRow}>
              <View style={[cardStyles.diffBadge, { backgroundColor: diff.bg }]}>
                <Text style={[cardStyles.diffText, { color: diff.text }]}>{diff.label}</Text>
              </View>
              {card.tag && (
                <View style={cardStyles.tagBadge}>
                  <Text style={cardStyles.tagText}>{card.tag}</Text>
                </View>
              )}
              <Text style={cardStyles.cardCount}>#{index + 1}</Text>
            </View>

            <View style={cardStyles.questionSection}>
              <View style={cardStyles.qIconWrap}>
                <Text style={cardStyles.qIcon}>Q</Text>
              </View>
              <Text style={cardStyles.questionLabel}>QUESTION</Text>
              <ScrollView style={cardStyles.questionScroll} showsVerticalScrollIndicator={false}>
                <Text style={cardStyles.questionText}>{card.question}</Text>
              </ScrollView>
            </View>

            <View style={cardStyles.tapHint}>
              <RotateCcw size={14} color="#64748b" />
              <Text style={cardStyles.tapHintText}>Tap to reveal answer</Text>
            </View>

            <View style={cardStyles.decorCircle1} />
            <View style={cardStyles.decorCircle2} />
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            cardStyles.face,
            cardStyles.back,
            {
              transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
              opacity: backOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#022c22', '#064e3b', '#065f46']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardStyles.gradient}
          >
            <View style={cardStyles.topRow}>
              <View style={[cardStyles.diffBadge, { backgroundColor: '#10b981' }]}>
                <Text style={[cardStyles.diffText, { color: '#ecfdf5' }]}>Answer</Text>
              </View>
              <Text style={cardStyles.cardCount}>#{index + 1}</Text>
            </View>

            <View style={cardStyles.answerSection}>
              <View style={cardStyles.aIconWrap}>
                <Text style={cardStyles.aIcon}>A</Text>
              </View>
              <Text style={cardStyles.answerLabel}>ANSWER</Text>
              <ScrollView style={cardStyles.answerScroll} showsVerticalScrollIndicator={false}>
                <Text style={cardStyles.answerText}>{card.answer}</Text>
              </ScrollView>
            </View>

            <View style={cardStyles.tapHint}>
              <RotateCcw size={14} color="#6ee7b7" />
              <Text style={[cardStyles.tapHintText, { color: '#6ee7b7' }]}>Tap to see question</Text>
            </View>

            <View style={[cardStyles.decorCircle1, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]} />
            <View style={[cardStyles.decorCircle2, { backgroundColor: 'rgba(52, 211, 153, 0.06)' }]} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
  },
  face: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      web: { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)' },
    }),
  },
  front: {},
  back: {},
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  diffBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#a5b4fc',
  },
  cardCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginLeft: 'auto' as const,
  },
  questionSection: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  qIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  qIcon: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#60a5fa',
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#475569',
    letterSpacing: 2,
    marginBottom: 12,
  },
  questionScroll: {
    maxHeight: 160,
    width: '100%',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#f1f5f9',
    lineHeight: 26,
    textAlign: 'center' as const,
  },
  answerSection: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  aIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  aIcon: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#34d399',
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#6ee7b7',
    letterSpacing: 2,
    marginBottom: 12,
  },
  answerScroll: {
    maxHeight: 160,
    width: '100%',
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#d1fae5',
    lineHeight: 26,
    textAlign: 'center' as const,
  },
  tapHint: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingTop: 8,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  decorCircle1: {
    position: 'absolute' as const,
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  decorCircle2: {
    position: 'absolute' as const,
    bottom: -50,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
});

export default function FlashcardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const { colors, isDark } = useTheme();
  const { isPremium } = useSubscription();

  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCards, setAnsweredCards] = useState<Set<string>>(new Set());
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);

  useEffect(() => {
    if (flashcards.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (currentIndex + 1) / flashcards.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, flashcards.length, progressAnim]);

  const parseFlashcards = useCallback((text: string): Flashcard[] => {
    const cards: Flashcard[] = [];
    const _blocks = text.split(/---+|\n\n(?=\*?\*?(?:Q|Question|Flashcard)\s*\d)/i);

    let questionPattern = /(?:\*?\*?(?:Q|Question|Flashcard)\s*\d+[.:)]*\s*\*?\*?\s*)([\s\S]*?)(?:\n\s*\*?\*?(?:A|Answer)[.:)]*\s*\*?\*?\s*)([\s\S]*?)(?:\n\s*\*?\*?(?:Difficulty|Level)[.:)]*\s*\*?\*?\s*(\w+))?(?:\n\s*\*?\*?(?:Tag|Topic)[.:)]*\s*\*?\*?\s*(.+))?/gi;
    
    let match;
    while ((match = questionPattern.exec(text)) !== null) {
      const question = match[1].trim().replace(/\*\*/g, '');
      const answer = match[2].trim().replace(/\*\*/g, '');
      const diffRaw = (match[3] || 'medium').toLowerCase().trim();
      const tag = match[4]?.trim().replace(/\*\*/g, '');
      
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (diffRaw.includes('easy')) difficulty = 'easy';
      else if (diffRaw.includes('hard')) difficulty = 'hard';

      if (question && answer) {
        cards.push({
          id: `fc-${cards.length}`,
          question,
          answer,
          difficulty,
          tag,
        });
      }
    }

    if (cards.length === 0) {
      const lines = text.split('\n').filter(l => l.trim());
      let currentQ = '';
      let currentA = '';
      let currentDiff: 'easy' | 'medium' | 'hard' = 'medium';
      let currentTag = '';

      for (const line of lines) {
        const trimmed = line.trim().replace(/\*\*/g, '');
        if (/^(?:Q|Question|Flashcard)\s*\d/i.test(trimmed)) {
          if (currentQ && currentA) {
            cards.push({
              id: `fc-${cards.length}`,
              question: currentQ,
              answer: currentA,
              difficulty: currentDiff,
              tag: currentTag || undefined,
            });
          }
          currentQ = trimmed.replace(/^(?:Q|Question|Flashcard)\s*\d+[.:)]*\s*/i, '');
          currentA = '';
          currentDiff = 'medium';
          currentTag = '';
        } else if (/^(?:A|Answer)[.:)]/i.test(trimmed)) {
          currentA = trimmed.replace(/^(?:A|Answer)[.:)]*\s*/i, '');
        } else if (/^(?:Difficulty|Level)[.:)]/i.test(trimmed)) {
          const d = trimmed.toLowerCase();
          if (d.includes('easy')) currentDiff = 'easy';
          else if (d.includes('hard')) currentDiff = 'hard';
        } else if (/^(?:Tag|Topic)[.:)]/i.test(trimmed)) {
          currentTag = trimmed.replace(/^(?:Tag|Topic)[.:)]*\s*/i, '');
        } else if (currentQ && !currentA) {
          currentQ += ' ' + trimmed;
        } else if (currentA) {
          currentA += ' ' + trimmed;
        }
      }
      if (currentQ && currentA) {
        cards.push({
          id: `fc-${cards.length}`,
          question: currentQ,
          answer: currentA,
          difficulty: currentDiff,
          tag: currentTag || undefined,
        });
      }
    }

    return cards;
  }, []);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!isPremium) {
        Alert.alert('Premium Feature', 'Flashcards are a premium feature. Please upgrade to access AI-generated flashcards for all subjects and chapters.');
        throw new Error('Premium required');
      }

      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      const chapterInfo = selectedChapterData
        ? `Chapter ${selectedChapterData.number}: ${selectedChapterData.title} - ${selectedChapterData.description}`
        : '';

      const prompt = `Generate 15 premium study flashcards for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Chapter: ${chapterInfo}

Language: ${selectedLanguage}

STRICT FORMAT - Follow this EXACT format for each flashcard:

Question 1: [Clear, concise question testing key concept]
Answer: [Detailed but focused answer with key facts]
Difficulty: Easy
Tag: [Subtopic name]

Question 2: [Question]
Answer: [Answer]
Difficulty: Medium
Tag: [Subtopic]

...continue for all 15 flashcards.

REQUIREMENTS:
- 5 Easy flashcards (definitions, basic recall)
- 5 Medium flashcards (application, understanding)
- 5 Hard flashcards (analysis, problem-solving, higher-order thinking)
- Cover ALL major topics/subtopics of the chapter
- Questions should be clear and specific
- Answers should be comprehensive but concise (2-4 sentences)
- Include formulas using Unicode (×, ÷, ², ³, √, π) - NO LaTeX
- For science subjects: include numerical-type flashcards
- For humanities: include date, event, significance-type flashcards
- Tag each card with its subtopic for easy identification
- Make questions exam-oriented and board-relevant`;

      const result = await robustGenerateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      const parsed = parseFlashcards(data);
      if (parsed.length === 0) {
        const fallbackCards: Flashcard[] = data.split('\n\n').filter((b: string) => b.trim().length > 20).slice(0, 10).map((block: string, i: number) => {
          const lines = block.split('\n').filter((l: string) => l.trim());
          return {
            id: `fc-${i}`,
            question: lines[0]?.replace(/^[^:]*:\s*/, '') || `Flashcard ${i + 1}`,
            answer: lines.slice(1).join(' ').replace(/^[^:]*:\s*/, '') || block,
            difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
          };
        });
        setFlashcards(fallbackCards);
      } else {
        setFlashcards(parsed);
      }
      setCurrentIndex(0);
      setAnsweredCards(new Set());
    },
  });

  const goToNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -CARD_WIDTH, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: CARD_WIDTH, duration: 0, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, flashcards.length, slideAnim]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: CARD_WIDTH, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -CARD_WIDTH, duration: 0, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, slideAnim]);

  const markKnown = useCallback(() => {
    if (flashcards[currentIndex]) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setAnsweredCards(prev => new Set(prev).add(flashcards[currentIndex].id));
      if (currentIndex < flashcards.length - 1) {
        goToNext();
      }
    }
  }, [currentIndex, flashcards, goToNext]);

  const knownCount = answeredCards.size;
  const totalCards = flashcards.length;

  const canGenerate = selectedSubject && selectedChapter;

  const grades = useMemo(() => selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10, 11, 12] : [9, 10], [selectedBoard]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flashcards</Text>
          <View style={styles.premiumTag}>
            <Crown size={10} color="#fbbf24" />
            <Text style={styles.premiumTagText}>PREMIUM</Text>
          </View>
        </View>
        <View style={styles.backButton} />
      </View>

      {flashcards.length > 0 ? (
        <View style={styles.flashcardView}>
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Layers size={14} color={isDark ? '#60a5fa' : '#3b82f6'} />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>
                    {currentIndex + 1}/{totalCards}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Zap size={14} color="#10b981" />
                  <Text style={[styles.statText, { color: '#10b981' }]}>
                    {knownCount} mastered
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
          </View>

          <Animated.View style={[styles.cardArea, { transform: [{ translateX: slideAnim }] }]}>
            <FlashcardItem
              card={flashcards[currentIndex]}
              index={currentIndex}
              currentIndex={currentIndex}
            />
          </Animated.View>

          <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', opacity: currentIndex === 0 ? 0.4 : 1 }]}
                onPress={goToPrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeftIcon size={22} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.knownButton}
                onPress={markKnown}
              >
                <LinearGradient
                  colors={['#059669', '#10b981']}
                  style={styles.knownGradient}
                >
                  <Zap size={18} color="#ffffff" />
                  <Text style={styles.knownText}>I Know This</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', opacity: currentIndex === flashcards.length - 1 ? 0.4 : 1 }]}
                onPress={goToNext}
                disabled={currentIndex === flashcards.length - 1}
              >
                <ChevronRightIcon size={22} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
              onPress={() => {
                setFlashcards([]);
                setCurrentIndex(0);
                setAnsweredCards(new Set());
              }}
            >
              <RotateCcw size={14} color={colors.textSecondary} />
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>Generate New Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.selectionContent}
          contentContainerStyle={[styles.selectionContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={isDark ? ['#0a1628', '#0d2847'] : ['#0f172a', '#1e293b']}
            style={styles.heroBanner}
          >
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />
            <View style={styles.heroIconWrap}>
              <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.heroIconBg}>
                <Layers size={28} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>AI Flashcards</Text>
            <Text style={styles.heroSubtitle}>
              Master any chapter with interactive flashcards. Tap to flip, swipe to navigate, and track your progress.
            </Text>
            <View style={styles.heroFeatures}>
              <View style={styles.heroFeature}>
                <Sparkles size={12} color="#fbbf24" />
                <Text style={styles.heroFeatureText}>AI Generated</Text>
              </View>
              <View style={styles.heroFeature}>
                <BookOpen size={12} color="#60a5fa" />
                <Text style={styles.heroFeatureText}>All Subjects</Text>
              </View>
              <View style={styles.heroFeature}>
                <Crown size={12} color="#f97316" />
                <Text style={styles.heroFeatureText}>Premium</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Board</Text>
            <View style={styles.boardButtons}>
              <TouchableOpacity
                style={[styles.boardBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'NCERT' && styles.boardBtnActiveNCERT]}
                onPress={() => { setSelectedBoard('NCERT'); setSelectedGrade(6); setSelectedSubject(''); setSelectedChapter(''); }}
              >
                <Text style={[styles.boardBtnText, { color: colors.textSecondary }, selectedBoard === 'NCERT' && styles.boardBtnTextActive]}>NCERT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.boardBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'ICSE' && styles.boardBtnActiveICSE]}
                onPress={() => { setSelectedBoard('ICSE'); setSelectedGrade(9); setSelectedSubject(''); setSelectedChapter(''); }}
              >
                <Text style={[styles.boardBtnText, { color: colors.textSecondary }, selectedBoard === 'ICSE' && styles.boardBtnTextActive]}>ICSE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {grades.map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[styles.gradeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedGrade === grade && styles.gradeBtnActive]}
                  onPress={() => { setSelectedGrade(grade); setSelectedSubject(''); setSelectedChapter(''); }}
                >
                  <Text style={[styles.gradeBtnText, { color: colors.textSecondary }, selectedGrade === grade && styles.gradeBtnTextActive]}>
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subject</Text>
            <View style={styles.subjectGrid}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.subjectBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedSubject === subject.id && styles.subjectBtnActive]}
                  onPress={() => { setSelectedSubject(subject.id); setSelectedChapter(''); }}
                >
                  <Text style={[styles.subjectBtnText, { color: colors.textSecondary }, selectedSubject === subject.id && styles.subjectBtnTextActive]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedSubject && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Chapter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chapters.map((chapter) => (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[styles.chapterBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedChapter === chapter.id && styles.chapterBtnActive]}
                    onPress={() => setSelectedChapter(chapter.id)}
                  >
                    <Text style={[styles.chapterNum, { color: colors.textTertiary }, selectedChapter === chapter.id && styles.chapterNumActive]}>
                      Ch {chapter.number}
                    </Text>
                    <Text
                      style={[styles.chapterTitle, { color: colors.textSecondary }, selectedChapter === chapter.id && styles.chapterTitleActive]}
                      numberOfLines={2}
                    >
                      {chapter.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
            onPress={() => generateMutation.mutate()}
            disabled={!canGenerate || generateMutation.isPending}
          >
            <LinearGradient
              colors={canGenerate ? ['#f59e0b', '#f97316'] : ['#94a3b8', '#94a3b8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 size={20} color="#ffffff" />
                  <Text style={styles.generateText}>Generating Flashcards...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#ffffff" />
                  <Text style={styles.generateText}>Generate Flashcards</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {generateMutation.isError && generateMutation.error?.message !== 'Premium required' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>Failed to generate flashcards. Please try again.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  premiumTagText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  flashcardView: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressRow: {
    marginBottom: 10,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  controls: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knownButton: {
    flex: 1,
    maxWidth: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  knownGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  knownText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  selectionContent: {
    flex: 1,
  },
  selectionContainer: {
    padding: 20,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative' as const,
    alignItems: 'center',
  },
  heroDecor1: {
    position: 'absolute' as const,
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  heroDecor2: {
    position: 'absolute' as const,
    bottom: -40,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  heroIconWrap: {
    marginBottom: 16,
  },
  heroIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
    maxWidth: 300,
  },
  heroFeatures: {
    flexDirection: 'row',
    gap: 12,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroFeatureText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#cbd5e1',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  boardButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  boardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  boardBtnActiveNCERT: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  boardBtnActiveICSE: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  boardBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  boardBtnTextActive: {
    color: '#ffffff',
  },
  gradeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  gradeBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  gradeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  gradeBtnTextActive: {
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  subjectBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  subjectBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  subjectBtnTextActive: {
    color: '#ffffff',
  },
  chapterBtn: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  chapterBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chapterNum: {
    fontSize: 11,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  chapterNumActive: {
    color: '#3b82f6',
  },
  chapterTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 17,
  },
  chapterTitleActive: {
    color: '#1e40af',
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)' },
    }),
  },
  generateBtnDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0.1 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
    }),
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  errorCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
});
