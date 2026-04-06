import { useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle, TrendingDown, Target, Brain, Loader2, BookOpen, BarChart3, Sparkles, RefreshCw, CheckCircle, XCircle } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';

import { useMutation } from '@tanstack/react-query';
import { robustGenerateObject } from '@/lib/ai-generate';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStudyTimeTracker } from '@/hooks/useStudyTimeTracker';

const RevisionPlanSchema = z.object({
  weakTopics: z.array(z.object({
    subject: z.string(),
    topic: z.string(),
    weakness: z.enum(['critical', 'moderate', 'mild']),
    score: z.number(),
    insight: z.string(),
    actionPlan: z.array(z.string()),
    estimatedTime: z.string(),
    resources: z.array(z.string()),
  })),
  overallAnalysis: z.string(),
  priorityOrder: z.array(z.string()),
  studySchedule: z.array(z.object({
    day: z.string(),
    tasks: z.array(z.string()),
  })),
});

type WeakTopic = z.infer<typeof RevisionPlanSchema>['weakTopics'][number];
type StudyDay = z.infer<typeof RevisionPlanSchema>['studySchedule'][number];

const WEAKNESS_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', label: 'CRITICAL', icon: XCircle },
  moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', label: 'MODERATE', icon: AlertTriangle },
  mild: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', label: 'MILD', icon: TrendingDown },
};

function WeakTopicCard({ topic, index, isDark }: { topic: WeakTopic; index: number; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = WEAKNESS_CONFIG[topic.weakness];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, index * 100);
    return () => clearTimeout(timer);
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[topicStyles.card, { opacity: fadeAnim, backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? config.borderColor : 'rgba(0,0,0,0.04)' }]}>
      <View style={[topicStyles.severityBar, { backgroundColor: config.color }]} />
      <TouchableOpacity
        onPress={() => {
          setExpanded(!expanded);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        style={topicStyles.cardTouchable}
      >
        <View style={topicStyles.headerRow}>
          <View style={[topicStyles.iconCircle, { backgroundColor: config.bg }]}>
            <Icon size={18} color={config.color} />
          </View>
          <View style={topicStyles.headerText}>
            <Text style={[topicStyles.subject, { color: isDark ? '#7ea3c4' : '#64748b' }]}>{topic.subject}</Text>
            <Text style={[topicStyles.topicName, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{topic.topic}</Text>
          </View>
          <View style={[topicStyles.scoreBadge, { backgroundColor: config.bg, borderColor: config.borderColor }]}>
            <Text style={[topicStyles.scoreText, { color: config.color }]}>{topic.score}%</Text>
          </View>
        </View>

        <View style={topicStyles.metaRow}>
          <View style={[topicStyles.severityChip, { backgroundColor: config.bg }]}>
            <Text style={[topicStyles.severityText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={[topicStyles.timeEst, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>{topic.estimatedTime}</Text>
        </View>

        <Text style={[topicStyles.insight, { color: isDark ? '#b8d0e8' : '#475569' }]}>{topic.insight}</Text>

        {expanded && (
          <View style={topicStyles.expandedContent}>
            <Text style={[topicStyles.sectionTitle, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Action Plan</Text>
            {topic.actionPlan.map((step, i) => (
              <View key={i} style={topicStyles.stepRow}>
                <View style={[topicStyles.stepDot, { backgroundColor: config.color }]} />
                <Text style={[topicStyles.stepText, { color: isDark ? '#b8d0e8' : '#475569' }]}>{step}</Text>
              </View>
            ))}

            <Text style={[topicStyles.sectionTitle, { color: isDark ? '#38bdf8' : '#0077b6', marginTop: 14 }]}>Recommended Resources</Text>
            {topic.resources.map((res, i) => (
              <View key={i} style={topicStyles.resourceRow}>
                <BookOpen size={14} color={isDark ? '#7ea3c4' : '#94a3b8'} />
                <Text style={[topicStyles.resourceText, { color: isDark ? '#b8d0e8' : '#475569' }]}>{res}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[topicStyles.expandHint, { color: isDark ? '#4a6a8a' : '#94a3b8' }]}>
          {expanded ? 'Tap to collapse' : 'Tap for action plan'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const topicStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  severityBar: { height: 4 },
  cardTouchable: { padding: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  subject: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  topicName: { fontSize: 16, fontWeight: '700' as const, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  scoreText: { fontSize: 14, fontWeight: '800' as const },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  severityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.5 },
  timeEst: { fontSize: 12, fontWeight: '500' as const },
  insight: { fontSize: 13, lineHeight: 20, marginTop: 10, fontWeight: '500' as const },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, marginBottom: 10, letterSpacing: 0.3 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resourceText: { flex: 1, fontSize: 12, fontWeight: '500' as const },
  expandHint: { fontSize: 11, fontWeight: '600' as const, textAlign: 'center' as const, marginTop: 12 },
});



export default function WeakTopicIdentifier() {
  useStudyTimeTracker('WeakTopics');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress, selectedLanguage } = useApp();
  const { colors, isDark } = useTheme();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [overallAnalysis, setOverallAnalysis] = useState('');
  const [studySchedule, setStudySchedule] = useState<StudyDay[]>([]);
  const [priorityOrder, setPriorityOrder] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'topics' | 'schedule'>('topics');

  const performanceSummary = useMemo(() => {
    const quizzes = userProgress.quizzesCompleted;
    const exams = userProgress.examActivities;
    const content = userProgress.contentActivities;

    const subjectScores: Record<string, { total: number; correct: number; count: number; chapters: string[] }> = {};
    quizzes.forEach(q => {
      const key = `${q.board} ${q.subject}`;
      if (!subjectScores[key]) subjectScores[key] = { total: 0, correct: 0, count: 0, chapters: [] };
      subjectScores[key].total += q.totalQuestions;
      subjectScores[key].correct += q.score;
      subjectScores[key].count += 1;
      if (!subjectScores[key].chapters.includes(q.chapter)) {
        subjectScores[key].chapters.push(q.chapter);
      }
    });

    return {
      quizCount: quizzes.length,
      examCount: exams.length,
      contentCount: content.length,
      subjectScores,
      avgExamScore: exams.length > 0
        ? Math.round(exams.reduce((a, e) => a + e.percentage, 0) / exams.length)
        : 0,
    };
  }, [userProgress]);

  const hasEnoughData = performanceSummary.quizCount >= 1 || performanceSummary.examCount >= 1;

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const subjectDetails = Object.entries(performanceSummary.subjectScores)
        .map(([key, val]) => `${key}: ${val.correct}/${val.total} correct across ${val.count} quizzes (${Math.round((val.correct / val.total) * 100)}%), chapters: ${val.chapters.join(', ')}`)
        .join('\n');

      const examDetails = userProgress.examActivities
        .map(e => `Exam: ${e.obtainedMarks}/${e.totalMarks} (${e.percentage}%)`)
        .join('\n');

      const prompt = `Analyze this student's performance data and identify weak topics that need improvement.

QUIZ PERFORMANCE BY SUBJECT:
${subjectDetails || 'No quiz data available'}

EXAM SCORES:
${examDetails || 'No exam data available'}

OVERALL STATS:
- Total quizzes: ${performanceSummary.quizCount}
- Total exams scanned: ${performanceSummary.examCount}
- Total content activities: ${performanceSummary.contentCount}
- Average exam score: ${performanceSummary.avgExamScore}%
- Study streak: ${userProgress.currentStreak} days
- Total study time: ${userProgress.totalStudyTime} minutes

Language: ${selectedLanguage}

Based on this data:
1. Identify 3-6 weak topics that need the most improvement
2. For each topic, provide a specific action plan with 3-4 concrete steps
3. Estimate time needed to improve each topic
4. Suggest specific resources
5. Create a 5-day study schedule prioritizing the weakest areas
6. Give an overall analysis paragraph summarizing the student's strengths and weaknesses

Score each topic from 0-100 based on estimated proficiency.
Mark weakness as "critical" (below 40%), "moderate" (40-60%), or "mild" (60-75%).`;

      const result = await robustGenerateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: RevisionPlanSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      setWeakTopics(data.weakTopics);
      setOverallAnalysis(data.overallAnalysis);
      setStudySchedule(data.studySchedule);
      setPriorityOrder(data.priorityOrder);
    },
  });

  const criticalCount = useMemo(() => weakTopics.filter(t => t.weakness === 'critical').length, [weakTopics]);
  const moderateCount = useMemo(() => weakTopics.filter(t => t.weakness === 'moderate').length, [weakTopics]);
  const mildCount = useMemo(() => weakTopics.filter(t => t.weakness === 'mild').length, [weakTopics]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a0a00', '#0d1a2d', '#0a1525'] : ['#fef3c7', '#fff7ed', '#f0f7ff']}
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
              <Brain size={20} color="#f59e0b" />
              <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Weak Topics</Text>
            </View>
            <Text style={[styles.headerSub, { color: isDark ? '#7ea3c4' : '#64748b' }]}>AI-Powered Analysis</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {weakTopics.length === 0 ? (
          <>
            <View style={[styles.statsGrid, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
              <Text style={[styles.statsTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Your Performance Data</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <BarChart3 size={22} color="#3b82f6" />
                  <Text style={[styles.statValue, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{performanceSummary.quizCount}</Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Quizzes</Text>
                </View>
                <View style={styles.statItem}>
                  <Target size={22} color="#10b981" />
                  <Text style={[styles.statValue, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{performanceSummary.examCount}</Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Exams</Text>
                </View>
                <View style={styles.statItem}>
                  <BookOpen size={22} color="#8b5cf6" />
                  <Text style={[styles.statValue, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{performanceSummary.contentCount}</Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Activities</Text>
                </View>
              </View>
              {Object.entries(performanceSummary.subjectScores).length > 0 && (
                <View style={styles.subjectBreakdown}>
                  {Object.entries(performanceSummary.subjectScores).map(([key, val]) => {
                    const pct = Math.round((val.correct / val.total) * 100);
                    const barColor = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <View key={key} style={styles.subjectRow}>
                        <Text style={[styles.subjectName, { color: isDark ? '#b8d0e8' : '#475569' }]} numberOfLines={1}>{key}</Text>
                        <View style={[styles.subjectBar, { backgroundColor: isDark ? '#152a45' : '#f1f5f9' }]}>
                          <View style={[styles.subjectBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                        </View>
                        <Text style={[styles.subjectPct, { color: barColor }]}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {!hasEnoughData && (
              <View style={[styles.emptyState, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }]}>
                <AlertTriangle size={24} color="#f59e0b" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#fcd34d' : '#92400e' }]}>Not Enough Data Yet</Text>
                <Text style={[styles.emptyDesc, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                  Complete at least 1 quiz or scan an exam paper to get AI analysis. The more data, the better the insights!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.analyzeBtn, (!hasEnoughData || analyzeMutation.isPending) && styles.analyzeBtnDisabled]}
              onPress={() => analyzeMutation.mutate()}
              disabled={!hasEnoughData || analyzeMutation.isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={hasEnoughData ? ['#f59e0b', '#d97706', '#b45309'] : ['#94a3b8', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.analyzeBtnGradient}
              >
                {analyzeMutation.isPending ? (
                  <View style={styles.loadRow}>
                    <Loader2 size={22} color="#ffffff" />
                    <Text style={styles.analyzeBtnText}>Analyzing Performance...</Text>
                  </View>
                ) : (
                  <View style={styles.loadRow}>
                    <Brain size={22} color="#ffffff" />
                    <Text style={styles.analyzeBtnText}>Identify Weak Topics</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }]}>
              <Sparkles size={18} color="#f59e0b" />
              <View style={styles.infoCol}>
                <Text style={[styles.infoTitle, { color: isDark ? '#fcd34d' : '#92400e' }]}>How it works</Text>
                <Text style={[styles.infoDesc, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                  AI analyzes your quiz scores, exam results, and study activities to detect weak areas. It then creates a personalized revision plan with specific steps to improve.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.analysisCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
              <Text style={[styles.analysisTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Overall Analysis</Text>
              <Text style={[styles.analysisText, { color: isDark ? '#b8d0e8' : '#475569' }]}>{overallAnalysis}</Text>
              <View style={styles.summaryChips}>
                {criticalCount > 0 && (
                  <View style={[styles.summaryChip, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <XCircle size={14} color="#ef4444" />
                    <Text style={[styles.summaryChipText, { color: '#ef4444' }]}>{criticalCount} Critical</Text>
                  </View>
                )}
                {moderateCount > 0 && (
                  <View style={[styles.summaryChip, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <Text style={[styles.summaryChipText, { color: '#f59e0b' }]}>{moderateCount} Moderate</Text>
                  </View>
                )}
                {mildCount > 0 && (
                  <View style={[styles.summaryChip, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                    <TrendingDown size={14} color="#3b82f6" />
                    <Text style={[styles.summaryChipText, { color: '#3b82f6' }]}>{mildCount} Mild</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'topics' && styles.tabActive]}
                onPress={() => setActiveTab('topics')}
              >
                <Text style={[styles.tabText, activeTab === 'topics' && styles.tabTextActive]}>Weak Topics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
                onPress={() => setActiveTab('schedule')}
              >
                <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Study Plan</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'topics' ? (
              <>
                {priorityOrder.length > 0 && (
                  <View style={[styles.priorityBar, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
                    <Target size={14} color={isDark ? '#38bdf8' : '#0077b6'} />
                    <Text style={[styles.priorityLabel, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Priority: </Text>
                    <Text style={[styles.priorityText, { color: isDark ? '#b8d0e8' : '#475569' }]} numberOfLines={1}>{priorityOrder.join(' → ')}</Text>
                  </View>
                )}
                {weakTopics.map((topic, idx) => (
                  <WeakTopicCard key={idx} topic={topic} index={idx} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {studySchedule.map((day, idx) => (
                  <View key={idx} style={[styles.scheduleCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
                    <View style={styles.dayHeader}>
                      <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        style={styles.dayBadge}
                      >
                        <Text style={styles.dayText}>{day.day}</Text>
                      </LinearGradient>
                    </View>
                    {day.tasks.map((task, ti) => (
                      <View key={ti} style={styles.taskRow}>
                        <CheckCircle size={16} color={isDark ? '#22c55e' : '#10b981'} />
                        <Text style={[styles.taskText, { color: isDark ? '#b8d0e8' : '#475569' }]}>{task}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              onPress={() => { setWeakTopics([]); setOverallAnalysis(''); setStudySchedule([]); setPriorityOrder([]); }}
              style={[styles.resetBtn, { backgroundColor: isDark ? '#152a45' : '#f1f5f9' }]}
            >
              <RefreshCw size={16} color={isDark ? '#38bdf8' : '#0077b6'} />
              <Text style={[styles.resetText, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Re-Analyze</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' as const },
  headerSub: { fontSize: 12, fontWeight: '600' as const, marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  statsGrid: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  statsTitle: { fontSize: 17, fontWeight: '800' as const, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  statItem: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 24, fontWeight: '900' as const },
  statLabel: { fontSize: 11, fontWeight: '600' as const },
  subjectBreakdown: { gap: 10 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subjectName: { width: 100, fontSize: 12, fontWeight: '600' as const },
  subjectBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  subjectBarFill: { height: '100%', borderRadius: 4 },
  subjectPct: { width: 40, fontSize: 12, fontWeight: '800' as const, textAlign: 'right' as const },
  emptyState: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 10, marginBottom: 20, borderWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const },
  emptyDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center' as const, fontWeight: '500' as const },
  analyzeBtn: { marginBottom: 20, borderRadius: 18, overflow: 'hidden' },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyzeBtnText: { fontSize: 17, fontWeight: '800' as const, color: '#ffffff' },
  infoBox: { flexDirection: 'row', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
  infoCol: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 14, fontWeight: '700' as const },
  infoDesc: { fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  analysisCard: {
    borderRadius: 20, padding: 20, marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  analysisTitle: { fontSize: 17, fontWeight: '800' as const, marginBottom: 10 },
  analysisText: { fontSize: 14, lineHeight: 22, fontWeight: '500' as const },
  summaryChips: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  summaryChipText: { fontSize: 12, fontWeight: '700' as const },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center' },
  tabActive: { backgroundColor: '#f59e0b' },
  tabText: { fontSize: 14, fontWeight: '700' as const, color: '#94a3b8' },
  tabTextActive: { color: '#ffffff' },
  priorityBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, borderRadius: 14, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  priorityLabel: { fontSize: 12, fontWeight: '700' as const },
  priorityText: { flex: 1, fontSize: 12, fontWeight: '500' as const },
  scheduleCard: {
    borderRadius: 18, padding: 18, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  dayHeader: { marginBottom: 12 },
  dayBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  dayText: { fontSize: 13, fontWeight: '800' as const, color: '#ffffff' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  taskText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  resetText: { fontSize: 15, fontWeight: '700' as const },
});
