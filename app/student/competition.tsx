import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Medal, Crown, Flame, Clock, Users, ChevronRight, Swords, Zap, Lock, CheckCircle, XCircle, Loader2, BookOpen, Shield } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { CompetitionEntry } from '@/types';

const COMPETITION_QUESTIONS = 20;
const TIME_PER_QUESTION = 30;
const TOP_QUALIFIERS = 30;
const PREMIUM_WINNERS = 3;
const PREMIUM_REWARD_MONTHS = 3;

const CompetitionQuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })
  ),
});

type CompetitionQuestion = z.infer<typeof CompetitionQuizSchema>['questions'][number];

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCompetitionDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return { startDate, endDate, daysLeft, monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' }) };
}

function generateMockLeaderboard(board: 'CBSE' | 'ICSE'): CompetitionEntry[] {
  const names = board === 'CBSE'
    ? ['Aarav S.', 'Priya M.', 'Rohan K.', 'Diya P.', 'Arjun R.', 'Ananya V.', 'Vihaan T.', 'Ishaan D.', 'Kavya L.', 'Aditya N.', 'Sneha G.', 'Rahul B.', 'Pooja S.', 'Vikram C.', 'Neha W.', 'Karan J.', 'Riya A.', 'Siddharth M.', 'Tanvi K.', 'Manish P.', 'Shruti R.', 'Amit D.', 'Nisha T.', 'Deepak L.', 'Meera N.', 'Raj G.', 'Swati B.', 'Akash S.', 'Parul C.', 'Varun W.', 'Simran J.', 'Harsh A.', 'Divya M.', 'Nikhil K.', 'Anjali P.']
    : ['Zara K.', 'Advait M.', 'Myra S.', 'Reyansh P.', 'Anika R.', 'Vivaan T.', 'Saanvi D.', 'Kabir L.', 'Kiara N.', 'Dhruv G.', 'Aadhya B.', 'Aryan S.', 'Navya C.', 'Arnav W.', 'Tara J.', 'Shaurya A.', 'Ira M.', 'Yash K.', 'Avni P.', 'Rudra R.', 'Anvi D.', 'Parth T.', 'Mira L.', 'Veer N.', 'Sia G.', 'Krish B.', 'Riya S.', 'Om C.', 'Dhriti W.', 'Aarush J.', 'Naina A.', 'Sai M.', 'Trisha K.', 'Ritvik P.', 'Jiya R.'];

  return names.map((name, i) => ({
    id: `${board}-${i}`,
    userName: name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    board,
    score: Math.max(20 - i, Math.floor(Math.random() * 5) + 1),
    totalQuestions: COMPETITION_QUESTIONS,
    accuracy: Math.max(100 - i * 2.5 - Math.random() * 5, 10),
    timeTaken: Math.floor(120 + i * 15 + Math.random() * 60),
    completedAt: new Date().toISOString(),
    rank: i + 1,
  }));
}

const CBSE_SYLLABUS_TOPICS = [
  { subject: 'Mathematics', topics: 'Number Systems, Algebra, Geometry, Trigonometry, Statistics & Probability' },
  { subject: 'Science', topics: 'Physics, Chemistry, Biology - All core chapters from Grade 6-10' },
  { subject: 'Social Science', topics: 'History, Geography, Civics, Economics' },
];

const ICSE_SYLLABUS_TOPICS = [
  { subject: 'Physics', topics: 'Mechanics, Heat, Light, Sound, Electricity & Magnetism' },
  { subject: 'Chemistry', topics: 'Periodic Table, Bonding, Acids & Bases, Organic Chemistry' },
  { subject: 'Biology', topics: 'Cell Biology, Plant & Animal Physiology, Genetics, Ecology' },
  { subject: 'Mathematics', topics: 'Algebra, Geometry, Trigonometry, Statistics, Mensuration' },
];

const RankBadge = memo(({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={20} color="#fbbf24" />;
  if (rank === 2) return <Medal size={20} color="#94a3b8" />;
  if (rank === 3) return <Medal size={20} color="#cd7f32" />;
  return <Text style={styles.rankNumber}>#{rank}</Text>;
});
RankBadge.displayName = 'RankBadge';

const LeaderboardRow = memo(({ entry, isUser }: { entry: CompetitionEntry; isUser: boolean }) => {
  const rank = entry.rank ?? 0;
  const isTop3 = rank <= PREMIUM_WINNERS;
  const isQualified = rank <= TOP_QUALIFIERS;

  return (
    <View style={[styles.leaderboardRow, isUser && styles.leaderboardRowUser, isTop3 && styles.leaderboardRowTop3]}>
      <View style={styles.rankCol}>
        <RankBadge rank={rank} />
      </View>
      <View style={styles.nameCol}>
        <Text style={[styles.leaderboardName, isUser && styles.leaderboardNameUser]} numberOfLines={1}>
          {entry.userName}{isUser ? ' (You)' : ''}
        </Text>
        <Text style={styles.leaderboardAccuracy}>{entry.accuracy.toFixed(1)}% accuracy</Text>
      </View>
      <View style={styles.scoreCol}>
        <Text style={[styles.leaderboardScore, isTop3 && styles.leaderboardScoreTop3]}>
          {entry.score}/{entry.totalQuestions}
        </Text>
        {isTop3 && (
          <View style={styles.premiumBadge}>
            <Crown size={10} color="#fbbf24" />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        )}
        {!isTop3 && isQualified && (
          <View style={styles.qualifiedBadge}>
            <Text style={styles.qualifiedBadgeText}>Top 30</Text>
          </View>
        )}
      </View>
    </View>
  );
});
LeaderboardRow.displayName = 'LeaderboardRow';

export default function CompetitionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addQuizResult, addXP, userProgress } = useApp();
  const { user } = useAuth();

  const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'ICSE'>('CBSE');
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'syllabus'>('overview');
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<CompetitionQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);


  const competitionDates = useMemo(() => getCompetitionDates(), []);
  const monthKey = useMemo(() => getMonthKey(), []);

  const hasParticipatedThisMonth = useMemo(() => {
    return userProgress.quizzesCompleted.some(
      (q) => q.id.startsWith(`comp-${monthKey}`) && q.board === (selectedBoard === 'CBSE' ? 'NCERT' : 'ICSE')
    );
  }, [userProgress.quizzesCompleted, monthKey, selectedBoard]);

  const leaderboardData = useMemo(() => generateMockLeaderboard(selectedBoard), [selectedBoard]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(shineAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
    ).start();
  }, [shineAnim]);

  const finishQuiz = useCallback((answers: number[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResults(true);

    const finalScore = answers.reduce((acc, ans, i) => {
      return acc + (ans === questions[i]?.correctAnswer ? 1 : 0);
    }, 0);

    const boardForResult = selectedBoard === 'CBSE' ? 'NCERT' as const : 'ICSE' as const;

    addQuizResult({
      id: `comp-${monthKey}-${selectedBoard}-${Date.now()}`,
      board: boardForResult,
      subject: 'Competition',
      chapter: `Monthly Challenge - ${competitionDates.monthName}`,
      grade: 0,
      score: finalScore,
      totalQuestions: questions.length,
      completedAt: new Date(),
    });

    const xpEarned = finalScore * 2;
    addXP(xpEarned, `Monthly Competition (${selectedBoard})`);

    console.log('Competition finished. Score:', finalScore, '/', questions.length, 'XP earned:', xpEarned);
  }, [questions, selectedBoard, monthKey, competitionDates.monthName, addQuizResult, addXP]);

  const handleTimeUp = useCallback(() => {
    setSelectedAnswers((prev) => {
      const updated = [...prev, -1];
      if (currentQuestion + 1 >= questions.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => finishQuiz(updated), 300);
      } else {
        setCurrentQuestion((q) => q + 1);
        setTimeLeft(TIME_PER_QUESTION);
      }
      return updated;
    });
  }, [currentQuestion, questions.length, finishQuiz]);

  useEffect(() => {
    if (quizStarted && !showResults && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return TIME_PER_QUESTION;
          }
          return prev - 1;
        });
        setTotalTimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, showResults, currentQuestion, questions.length, handleTimeUp]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const boardName = selectedBoard === 'CBSE' ? 'NCERT/CBSE' : 'ICSE';
      const subjects = selectedBoard === 'CBSE'
        ? 'Mathematics, Science, Social Science'
        : 'Physics, Chemistry, Biology, Mathematics';

      const result = await generateObject({
        messages: [{
          role: 'user',
          content: `Generate a competitive quiz of exactly ${COMPETITION_QUESTIONS} questions for a monthly ${boardName} competition.
          
Cover these subjects: ${subjects}
Grade range: 6-10

Requirements:
- Mix of easy (5), medium (10), and hard (5) questions
- Each question must have exactly 4 options
- correctAnswer is the 0-based index of the correct option
- Cover a wide variety of topics across all subjects
- Questions should be challenging and test deep understanding
- Include application-based and analytical questions
- Language: ${selectedLanguage}

This is a competitive exam - make it appropriately challenging.`
        }],
        schema: CompetitionQuizSchema,
      });

      return result;
    },
    onSuccess: (data) => {
      setQuestions(data.questions);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setTimeLeft(TIME_PER_QUESTION);
      setTotalTimeTaken(0);
      setQuizStarted(true);
      setShowResults(false);
      console.log('Competition quiz generated:', data.questions.length, 'questions');
    },
    onError: (error) => {
      console.log('Competition quiz generation error:', error);
      Alert.alert('Error', 'Failed to generate competition quiz. Please try again.');
    },
  });

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const updatedAnswers = [...selectedAnswers, answerIndex];
    setSelectedAnswers(updatedAnswers);

    if (currentQuestion + 1 >= questions.length) {
      setTimeout(() => finishQuiz(updatedAnswers), 500);
    } else {
      setTimeout(() => {
        setCurrentQuestion((q) => q + 1);
        setTimeLeft(TIME_PER_QUESTION);
      }, 500);
    }
  }, [selectedAnswers, currentQuestion, questions.length, finishQuiz]);

  const score = useMemo(() => {
    if (!showResults) return 0;
    return selectedAnswers.reduce((acc, ans, i) => acc + (ans === questions[i]?.correctAnswer ? 1 : 0), 0);
  }, [showResults, selectedAnswers, questions]);

  const accuracy = useMemo(() => {
    if (!showResults || questions.length === 0) return 0;
    return (score / questions.length) * 100;
  }, [showResults, score, questions.length]);

  const handleStartCompetition = useCallback(() => {
    if (hasParticipatedThisMonth) {
      Alert.alert('Already Participated', `You have already participated in this month's ${selectedBoard} competition. Come back next month!`);
      return;
    }
    generateMutation.mutate();
  }, [hasParticipatedThisMonth, selectedBoard, generateMutation]);

  const handleReturnToOverview = useCallback(() => {
    setQuizStarted(false);
    setShowResults(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setActiveTab('leaderboard');
  }, []);

  if (quizStarted && !showResults && questions.length > 0) {
    const question = questions[currentQuestion];
    const progress = (currentQuestion + 1) / questions.length;
    const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981';

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.quizHeader}>
          <View style={styles.quizHeaderRow}>
            <TouchableOpacity onPress={() => {
              Alert.alert('Quit Competition?', 'Your progress will be lost.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Quit', style: 'destructive', onPress: handleReturnToOverview },
              ]);
            }}>
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.quizHeaderCenter}>
              <Text style={styles.quizHeaderTitle}>Question {currentQuestion + 1}/{questions.length}</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: timerColor + '20', borderColor: timerColor }]}>
              <Clock size={14} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
            </View>
          </View>
          {question?.difficulty && (
            <View style={[styles.difficultyBadge, {
              backgroundColor: question.difficulty === 'hard' ? '#ef444420' : question.difficulty === 'medium' ? '#f59e0b20' : '#10b98120'
            }]}>
              <Text style={[styles.difficultyText, {
                color: question.difficulty === 'hard' ? '#ef4444' : question.difficulty === 'medium' ? '#f59e0b' : '#10b981'
              }]}>{question.difficulty.toUpperCase()}</Text>
            </View>
          )}
        </LinearGradient>

        <ScrollView style={styles.quizBody} contentContainerStyle={styles.quizBodyContent}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question?.question}</Text>
          </View>

          <View style={styles.optionsGrid}>
            {question?.options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.optionButton, selectedAnswers[currentQuestion] === i && styles.optionSelected]}
                onPress={() => handleSelectAnswer(i)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionLabel, selectedAnswers[currentQuestion] === i && styles.optionLabelSelected]}>
                  <Text style={[styles.optionLabelText, selectedAnswers[currentQuestion] === i && styles.optionLabelTextSelected]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optionText, selectedAnswers[currentQuestion] === i && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showResults) {
    const percentage = accuracy;
    const estimatedRank = Math.max(1, Math.floor(35 - (percentage / 100) * 34));

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={[styles.resultsContainer, { paddingBottom: insets.bottom + 20 }]}>
          <LinearGradient
            colors={percentage >= 80 ? ['#059669', '#10b981'] : percentage >= 50 ? ['#d97706', '#f59e0b'] : ['#dc2626', '#ef4444']}
            style={styles.resultsBanner}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              {percentage >= 80 ? <Trophy size={64} color="#ffffff" /> :
               percentage >= 50 ? <Medal size={64} color="#ffffff" /> :
               <Shield size={64} color="#ffffff" />}
            </Animated.View>
            <Text style={styles.resultsTitle}>
              {percentage >= 80 ? 'Outstanding!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
            </Text>
            <Text style={styles.resultsSubtitle}>Monthly {selectedBoard} Competition</Text>
          </LinearGradient>

          <View style={styles.resultsStats}>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatValue}>{score}/{questions.length}</Text>
              <Text style={styles.resultStatLabel}>Score</Text>
            </View>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatValue}>{accuracy.toFixed(1)}%</Text>
              <Text style={styles.resultStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatValue}>{Math.floor(totalTimeTaken / 60)}:{String(totalTimeTaken % 60).padStart(2, '0')}</Text>
              <Text style={styles.resultStatLabel}>Time</Text>
            </View>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatValue}>~#{estimatedRank}</Text>
              <Text style={styles.resultStatLabel}>Est. Rank</Text>
            </View>
          </View>

          <View style={styles.xpEarnedCard}>
            <Zap size={24} color="#fbbf24" />
            <Text style={styles.xpEarnedText}>+{score * 2} XP Earned</Text>
          </View>

          {estimatedRank <= PREMIUM_WINNERS && (
            <View style={styles.winnerCard}>
              <Crown size={28} color="#fbbf24" />
              <Text style={styles.winnerTitle}>You&apos;re in the Top 3!</Text>
              <Text style={styles.winnerText}>You may win {PREMIUM_REWARD_MONTHS} months of free Premium!</Text>
            </View>
          )}

          <Text style={styles.reviewTitle}>Question Review</Text>
          {questions.map((q, i) => {
            const isCorrect = selectedAnswers[i] === q.correctAnswer;
            const wasSkipped = selectedAnswers[i] === -1;
            return (
              <View key={i} style={[styles.reviewCard, isCorrect ? styles.reviewCardCorrect : styles.reviewCardWrong]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewQNum}>
                    {isCorrect ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                    <Text style={styles.reviewQNumText}>Q{i + 1}</Text>
                  </View>
                  {q.difficulty && (
                    <Text style={[styles.reviewDifficulty, {
                      color: q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'medium' ? '#f59e0b' : '#10b981'
                    }]}>{q.difficulty}</Text>
                  )}
                </View>
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                {wasSkipped ? (
                  <Text style={styles.reviewSkipped}>Time&apos;s up - Skipped</Text>
                ) : !isCorrect ? (
                  <Text style={styles.reviewYourAnswer}>Your answer: {q.options[selectedAnswers[i]]}</Text>
                ) : null}
                <Text style={styles.reviewCorrectAnswer}>Correct: {q.options[q.correctAnswer]}</Text>
                <Text style={styles.reviewExplanation}>{q.explanation}</Text>
              </View>
            );
          })}

          <TouchableOpacity style={styles.returnButton} onPress={handleReturnToOverview} activeOpacity={0.8}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.returnButtonGradient}>
              <Text style={styles.returnButtonText}>View Leaderboard</Text>
              <ChevronRight size={20} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0f172a', '#1a1a2e', '#16213e']} style={styles.heroHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <Animated.View style={[styles.heroLogoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} style={styles.heroLogo}>
            <Trophy size={40} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.heroTitle}>Monthly Challenge</Text>
        <Text style={styles.heroSubtitle}>{competitionDates.monthName}</Text>

        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <Clock size={14} color="#94a3b8" />
            <Text style={styles.heroBadgeText}>{competitionDates.daysLeft} days left</Text>
          </View>
          <View style={styles.heroBadgeDivider} />
          <View style={styles.heroBadge}>
            <Users size={14} color="#94a3b8" />
            <Text style={styles.heroBadgeText}>{selectedBoard} Track</Text>
          </View>
        </View>

        <View style={styles.boardToggle}>
          <TouchableOpacity
            style={[styles.boardToggleBtn, selectedBoard === 'CBSE' && styles.boardToggleBtnActive]}
            onPress={() => setSelectedBoard('CBSE')}
          >
            <Text style={[styles.boardToggleText, selectedBoard === 'CBSE' && styles.boardToggleTextActive]}>CBSE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boardToggleBtn, selectedBoard === 'ICSE' && styles.boardToggleBtnActive]}
            onPress={() => setSelectedBoard('ICSE')}
          >
            <Text style={[styles.boardToggleText, selectedBoard === 'ICSE' && styles.boardToggleTextActive]}>ICSE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        {(['overview', 'leaderboard', 'syllabus'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Overview' : tab === 'leaderboard' ? 'Leaderboard' : 'Syllabus'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={[styles.mainContentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <>
            <View style={styles.rulesCard}>
              <View style={styles.rulesHeader}>
                <Swords size={22} color="#f59e0b" />
                <Text style={styles.rulesTitle}>How It Works</Text>
              </View>
              <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleNum, { backgroundColor: '#dbeafe' }]}>
                    <Text style={[styles.ruleNumText, { color: '#2563eb' }]}>1</Text>
                  </View>
                  <View style={styles.ruleTextCol}>
                    <Text style={styles.ruleMainText}>Take the Monthly Quiz</Text>
                    <Text style={styles.ruleSubText}>{COMPETITION_QUESTIONS} questions, {TIME_PER_QUESTION}s per question</Text>
                  </View>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleNum, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.ruleNumText, { color: '#d97706' }]}>2</Text>
                  </View>
                  <View style={styles.ruleTextCol}>
                    <Text style={styles.ruleMainText}>Top {TOP_QUALIFIERS} Qualify</Text>
                    <Text style={styles.ruleSubText}>Best {TOP_QUALIFIERS} from each board (CBSE & ICSE) compete</Text>
                  </View>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleNum, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.ruleNumText, { color: '#16a34a' }]}>3</Text>
                  </View>
                  <View style={styles.ruleTextCol}>
                    <Text style={styles.ruleMainText}>Top {PREMIUM_WINNERS} Win Premium!</Text>
                    <Text style={styles.ruleSubText}>{PREMIUM_REWARD_MONTHS} months free Premium subscription</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.prizesCard}>
              <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.prizesGradient}>
                <Crown size={28} color="#92400e" />
                <Text style={styles.prizesTitle}>Prizes</Text>
                <View style={styles.prizesList}>
                  <View style={styles.prizeRow}>
                    <View style={[styles.prizeIcon, { backgroundColor: '#fbbf24' }]}>
                      <Text style={styles.prizeIconText}>1st</Text>
                    </View>
                    <Text style={styles.prizeText}>{PREMIUM_REWARD_MONTHS} months Premium + Trophy Badge</Text>
                  </View>
                  <View style={styles.prizeRow}>
                    <View style={[styles.prizeIcon, { backgroundColor: '#94a3b8' }]}>
                      <Text style={styles.prizeIconText}>2nd</Text>
                    </View>
                    <Text style={styles.prizeText}>{PREMIUM_REWARD_MONTHS} months Premium + Medal Badge</Text>
                  </View>
                  <View style={styles.prizeRow}>
                    <View style={[styles.prizeIcon, { backgroundColor: '#cd7f32' }]}>
                      <Text style={styles.prizeIconText}>3rd</Text>
                    </View>
                    <Text style={styles.prizeText}>{PREMIUM_REWARD_MONTHS} months Premium + Star Badge</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={[styles.startButton, (hasParticipatedThisMonth || generateMutation.isPending) && styles.startButtonDisabled]}
              onPress={handleStartCompetition}
              activeOpacity={0.8}
              disabled={generateMutation.isPending}
            >
              <LinearGradient
                colors={hasParticipatedThisMonth ? ['#64748b', '#475569'] : ['#f59e0b', '#d97706']}
                style={styles.startButtonGradient}
              >
                {generateMutation.isPending ? (
                  <Loader2 size={24} color="#ffffff" />
                ) : hasParticipatedThisMonth ? (
                  <Lock size={24} color="#ffffff" />
                ) : (
                  <Flame size={24} color="#ffffff" />
                )}
                <Text style={styles.startButtonText}>
                  {generateMutation.isPending ? 'Generating Quiz...' :
                   hasParticipatedThisMonth ? 'Already Participated' : 'Start Competition'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {hasParticipatedThisMonth && (
              <Text style={styles.alreadyParticipatedNote}>
                You can participate once per month per board. Try the other board or come back next month!
              </Text>
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.leaderboardTitle}>{selectedBoard} Leaderboard</Text>
              <Text style={styles.leaderboardSubtitle}>{competitionDates.monthName}</Text>
            </View>

            <View style={styles.topThreeSection}>
              {leaderboardData.slice(0, 3).map((entry, i) => (
                <View key={entry.id} style={[styles.topThreeCard, i === 0 && styles.topThreeCardFirst]}>
                  <View style={[styles.topThreeCrown, {
                    backgroundColor: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#cd7f32'
                  }]}>
                    {i === 0 ? <Crown size={16} color="#ffffff" /> :
                     <Medal size={16} color="#ffffff" />}
                  </View>
                  <View style={[styles.topThreeAvatar, {
                    borderColor: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#cd7f32'
                  }]}>
                    <Text style={styles.topThreeAvatarText}>
                      {entry.userName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.topThreeName} numberOfLines={1}>{entry.userName}</Text>
                  <Text style={styles.topThreeScore}>{entry.score}/{entry.totalQuestions}</Text>
                  <View style={styles.topThreePremium}>
                    <Crown size={10} color="#fbbf24" />
                    <Text style={styles.topThreePremiumText}>Premium</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.leaderboardList}>
              {leaderboardData.slice(3).map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  isUser={entry.email === user?.email}
                />
              ))}
            </View>
          </>
        )}

        {activeTab === 'syllabus' && (
          <>
            <View style={styles.syllabusHeader}>
              <BookOpen size={24} color="#3b82f6" />
              <Text style={styles.syllabusTitle}>{selectedBoard} Competition Syllabus</Text>
            </View>
            <Text style={styles.syllabusSubtitle}>
              Questions are drawn from Grade 6-10 across all major subjects
            </Text>

            {(selectedBoard === 'CBSE' ? CBSE_SYLLABUS_TOPICS : ICSE_SYLLABUS_TOPICS).map((item, i) => (
              <View key={i} style={styles.syllabusCard}>
                <View style={styles.syllabusCardHeader}>
                  <View style={[styles.syllabusIcon, { backgroundColor: ['#dbeafe', '#fef3c7', '#dcfce7', '#f3e8ff'][i % 4] }]}>
                    <BookOpen size={18} color={['#2563eb', '#d97706', '#16a34a', '#7c3aed'][i % 4]} />
                  </View>
                  <Text style={styles.syllabusSubjectName}>{item.subject}</Text>
                </View>
                <Text style={styles.syllabusTopics}>{item.topics}</Text>
              </View>
            ))}

            <View style={styles.syllabusChaptersSection}>
              <Text style={styles.syllabusChaptersTitle}>Detailed Chapter List</Text>
              {(selectedBoard === 'CBSE' ? NCERT_SUBJECTS : ICSE_SUBJECTS).slice(0, 6).map((subject) => (
                <View key={subject.id} style={styles.syllabusSubjectSection}>
                  <Text style={styles.syllabusSubjectLabel}>
                    {subject.name} - Grade {subject.grade}
                  </Text>
                  {subject.chapters.slice(0, 5).map((ch) => (
                    <View key={ch.id} style={styles.syllabusChapterRow}>
                      <View style={styles.syllabusChapterDot} />
                      <Text style={styles.syllabusChapterText}>
                        Ch {ch.number}: {ch.title}
                      </Text>
                    </View>
                  ))}
                  {subject.chapters.length > 5 && (
                    <Text style={styles.syllabusMoreText}>
                      +{subject.chapters.length - 5} more chapters
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroLogoContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  heroLogo: {
    width: 80,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 24px rgba(251, 191, 36, 0.5)' },
    }),
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  heroBadgeDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  boardToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    width: 220,
  },
  boardToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  boardToggleBtnActive: {
    backgroundColor: '#fbbf24',
  },
  boardToggleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#94a3b8',
  },
  boardToggleTextActive: {
    color: '#1e293b',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#f59e0b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#1e293b',
  },
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    padding: 16,
    gap: 16,
  },
  rulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    }),
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  rulesList: {
    gap: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ruleNum: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleNumText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  ruleTextCol: {
    flex: 1,
  },
  ruleMainText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  ruleSubText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  prizesCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)' },
    }),
  },
  prizesGradient: {
    padding: 20,
    alignItems: 'center',
  },
  prizesTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#92400e',
    marginTop: 8,
    marginBottom: 16,
  },
  prizesList: {
    width: '100%',
    gap: 12,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 12,
    borderRadius: 12,
  },
  prizeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeIconText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400e',
    flex: 1,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)' },
    }),
  },
  startButtonDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0.1 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    }),
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  alreadyParticipatedNote: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  leaderboardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1e293b',
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  topThreeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  topThreeCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    width: 100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    }),
  },
  topThreeCardFirst: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    transform: [{ scale: 1.05 }],
  },
  topThreeCrown: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  topThreeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  topThreeAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#475569',
  },
  topThreeName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1e293b',
    textAlign: 'center',
  },
  topThreeScore: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#f59e0b',
    marginTop: 4,
  },
  topThreePremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  topThreePremiumText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  leaderboardList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leaderboardRowUser: {
    backgroundColor: '#eff6ff',
  },
  leaderboardRowTop3: {
    backgroundColor: '#fffbeb',
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  nameCol: {
    flex: 1,
    marginLeft: 8,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  leaderboardNameUser: {
    color: '#2563eb',
    fontWeight: '700' as const,
  },
  leaderboardAccuracy: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  leaderboardScore: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  leaderboardScoreTop3: {
    color: '#f59e0b',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  qualifiedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  qualifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  syllabusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  syllabusTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1e293b',
  },
  syllabusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  syllabusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
    }),
  },
  syllabusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  syllabusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syllabusSubjectName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  syllabusTopics: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  syllabusChaptersSection: {
    marginTop: 8,
  },
  syllabusChaptersTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  syllabusSubjectSection: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
  },
  syllabusSubjectLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3b82f6',
    marginBottom: 8,
  },
  syllabusChapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  syllabusChapterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  syllabusChapterText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  syllabusMoreText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600' as const,
    marginTop: 4,
    marginLeft: 14,
  },
  quizHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizHeaderCenter: {
    flex: 1,
  },
  quizHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  quizBody: {
    flex: 1,
  },
  quizBodyContent: {
    padding: 16,
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.1)' },
    }),
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1e293b',
    lineHeight: 26,
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabelSelected: {
    backgroundColor: '#3b82f6',
  },
  optionLabelText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  optionLabelTextSelected: {
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#1e40af',
    fontWeight: '600' as const,
  },
  resultsContainer: {
    padding: 16,
    gap: 16,
  },
  resultsBanner: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  resultsSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  resultsStats: {
    flexDirection: 'row',
    gap: 10,
  },
  resultStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    }),
  },
  resultStatValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1e293b',
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  xpEarnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  xpEarnedText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#92400e',
  },
  winnerCard: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
    gap: 8,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#92400e',
  },
  winnerText: {
    fontSize: 14,
    color: '#a16207',
    textAlign: 'center',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  reviewCardCorrect: {
    borderLeftColor: '#10b981',
  },
  reviewCardWrong: {
    borderLeftColor: '#ef4444',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewQNum: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewQNumText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  reviewDifficulty: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
  },
  reviewQuestion: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewSkipped: {
    fontSize: 13,
    color: '#f59e0b',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  reviewYourAnswer: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 4,
  },
  reviewCorrectAnswer: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  reviewExplanation: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  returnButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  returnButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
