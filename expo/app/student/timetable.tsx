import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, BookOpen, Sparkles, ChevronRight, ChevronDown, RotateCcw, CheckCircle2, AlertTriangle, Flame, Target, Brain } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/contexts/theme-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { LinearGradient } from 'expo-linear-gradient';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

type Board = 'CBSE' | 'ICSE';

interface DayPlan {
  day: number;
  date: string;
  sessions: SessionPlan[];
  tip: string;
}

interface SessionPlan {
  subject: string;
  chapter: string;
  duration: string;
  activity: string;
  priority: 'high' | 'medium' | 'low';
}

interface GeneratedTimetable {
  title: string;
  overview: string;
  dailyPlans: DayPlan[];
  revisionStrategy: string;
  tips: string[];
}

const GRADES_CBSE = [6, 7, 8, 9, 10, 11, 12];
const GRADES_ICSE = [9, 10];

const STUDY_HOURS = [2, 3, 4, 5, 6, 7, 8, 10, 12];

function getSubjectsForGrade(board: Board, grade: number): string[] {
  const subjects = board === 'CBSE' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  return [...new Set(subjects.filter(s => s.grade === grade).map(s => s.name))];
}

function getChaptersForSubject(board: Board, grade: number, subjectName: string): string[] {
  const subjects = board === 'CBSE' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subject = subjects.find(s => s.grade === grade && s.name === subjectName);
  return subject ? subject.chapters.map(c => `Ch ${c.number}: ${c.title}`) : [];
}

function parseTimetable(text: string): GeneratedTimetable {
  const lines = text.split('\n').filter(l => l.trim());
  const dailyPlans: DayPlan[] = [];
  let overview = '';
  let revisionStrategy = '';
  const tips: string[] = [];
  let currentDay: DayPlan | null = null;
  let currentSection = '';
  let title = 'Your Study Timetable';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^(#|TITLE:|Study Plan)/i) && !title.includes('Day')) {
      title = trimmed.replace(/^#+\s*/, '').replace(/^TITLE:\s*/i, '').trim() || title;
      continue;
    }

    if (trimmed.match(/^(OVERVIEW|Summary|Introduction)/i)) {
      currentSection = 'overview';
      continue;
    }

    if (trimmed.match(/^(REVISION|Revision Strategy)/i)) {
      currentSection = 'revision';
      continue;
    }

    if (trimmed.match(/^(TIPS|Study Tips|General Tips)/i)) {
      currentSection = 'tips';
      continue;
    }

    const dayMatch = trimmed.match(/^(DAY|Day)\s*(\d+)/i);
    if (dayMatch) {
      if (currentDay) dailyPlans.push(currentDay);
      const dateMatch = trimmed.match(/\(([^)]+)\)/);
      currentDay = {
        day: parseInt(dayMatch[2], 10),
        date: dateMatch ? dateMatch[1] : `Day ${dayMatch[2]}`,
        sessions: [],
        tip: '',
      };
      currentSection = 'day';
      continue;
    }

    if (currentSection === 'overview') {
      overview += (overview ? ' ' : '') + trimmed.replace(/^[-•*]\s*/, '');
      continue;
    }

    if (currentSection === 'revision') {
      revisionStrategy += (revisionStrategy ? ' ' : '') + trimmed.replace(/^[-•*]\s*/, '');
      continue;
    }

    if (currentSection === 'tips') {
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        tips.push(trimmed.replace(/^[-•*\d.]\s*/, ''));
      }
      continue;
    }

    if (currentDay && currentSection === 'day') {
      if (trimmed.toLowerCase().startsWith('tip:')) {
        currentDay.tip = trimmed.replace(/^tip:\s*/i, '');
        continue;
      }

      const sessionMatch = trimmed.match(/^[-•*]\s*(.+)/);
      if (sessionMatch) {
        const sessionText = sessionMatch[1];
        const parts = sessionText.split(/[|–—:,]/).map(p => p.trim()).filter(Boolean);

        let subject = parts[0] || 'Study';
        let chapter = parts[1] || '';
        let duration = '';
        let activity = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';

        for (const part of parts) {
          if (part.match(/\d+\s*(hr|hour|min|minute)/i)) duration = part;
          if (part.match(/(revise|practice|solve|read|learn|review|memorize|write|test)/i)) activity = part;
          if (part.match(/(high|important|critical)/i)) priority = 'high';
          if (part.match(/(low|light|easy)/i)) priority = 'low';
        }

        if (!duration) duration = '1-2 hrs';
        if (!activity) activity = 'Study & Practice';

        currentDay.sessions.push({ subject, chapter, duration, activity, priority });
      }
    }
  }

  if (currentDay) dailyPlans.push(currentDay);

  if (dailyPlans.length === 0) {
    const textLines = text.split('\n').filter(l => l.trim());
    let dayNum = 1;
    let currentSessions: SessionPlan[] = [];

    for (const line of textLines) {
      const t = line.trim();
      if (t.startsWith('-') || t.startsWith('•') || t.startsWith('*')) {
        currentSessions.push({
          subject: t.replace(/^[-•*]\s*/, ''),
          chapter: '',
          duration: '1-2 hrs',
          activity: 'Study',
          priority: 'medium',
        });

        if (currentSessions.length >= 3) {
          dailyPlans.push({
            day: dayNum,
            date: `Day ${dayNum}`,
            sessions: [...currentSessions],
            tip: '',
          });
          currentSessions = [];
          dayNum++;
        }
      }
    }

    if (currentSessions.length > 0) {
      dailyPlans.push({
        day: dayNum,
        date: `Day ${dayNum}`,
        sessions: currentSessions,
        tip: '',
      });
    }
  }

  return {
    title,
    overview: overview || 'A personalized study plan tailored to your exam schedule.',
    dailyPlans,
    revisionStrategy: revisionStrategy || 'Dedicate the last 20% of your preparation time for revision and practice tests.',
    tips: tips.length > 0 ? tips : [
      'Start with difficult subjects when your energy is highest',
      'Take 10-minute breaks every 45 minutes',
      'Use active recall instead of passive reading',
      'Solve previous year papers in the last week',
    ],
  };
}

export default function TimetableScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [board, setBoard] = useState<Board>('CBSE');
  const [grade, setGrade] = useState<number>(10);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [daysLeft, setDaysLeft] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [timetable, setTimetable] = useState<GeneratedTimetable | null>(null);
  const [rawText, setRawText] = useState('');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const availableSubjects = useMemo(
    () => getSubjectsForGrade(board, grade),
    [board, grade]
  );

  useEffect(() => {
    setSelectedSubjects([]);
  }, [board, grade]);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  }, []);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(daysLeft, 10);
      if (!days || days < 1) throw new Error('Enter valid days');
      if (selectedSubjects.length === 0) throw new Error('Select at least one subject');

      const chaptersInfo = selectedSubjects.map(subj => {
        const chapters = getChaptersForSubject(board, grade, subj);
        return `${subj}: ${chapters.join(', ')}`;
      }).join('\n');

      const prompt = `You are an expert Indian education planner. Generate a detailed day-by-day study timetable.

STUDENT INFO:
- Board: ${board}
- Grade: ${grade}
- Subjects: ${selectedSubjects.join(', ')}
- Days until exam: ${days}
- Study hours per day: ${hoursPerDay} hours

CHAPTERS TO COVER:
${chaptersInfo}

RULES:
1. Create a plan for ALL ${days} days (or up to 30 days if more)
2. Each day should have 3-5 study sessions
3. Distribute subjects evenly across days
4. Keep last 20-25% days for REVISION ONLY
5. Prioritize difficult/important chapters earlier
6. Include breaks and light revision days
7. For science subjects, allocate time for numericals/practicals
8. Mix theory with practice problems daily

FORMAT (follow EXACTLY):
TITLE: [Catchy plan title]

OVERVIEW
[2-3 sentence overview of the plan strategy]

DAY 1 (Date label)
- Subject | Chapter details | Duration (e.g., 2 hrs) | Activity (Read/Practice/Solve/Revise) | Priority (high/medium/low)
- Subject | Chapter details | Duration | Activity | Priority
- Subject | Chapter details | Duration | Activity | Priority
Tip: [Daily motivational or strategy tip]

DAY 2 (Date label)
...continue for all days...

REVISION STRATEGY
[Detailed revision approach for the last phase]

TIPS
- Tip 1
- Tip 2
- Tip 3
- Tip 4
- Tip 5`;

      const response = await generateText({
        messages: [{ role: 'user', content: prompt }],
      });
      return response;
    },
    onSuccess: (response) => {
      setRawText(response);
      const parsed = parseTimetable(response);
      setTimetable(parsed);
      setExpandedDay(1);

      resultFade.setValue(0);
      resultSlide.setValue(50);
      Animated.parallel([
        Animated.timing(resultFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(resultSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to generate timetable');
    },
  });

  const handleGenerate = useCallback(() => {
    const days = parseInt(daysLeft, 10);
    if (!days || days < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of days.');
      return;
    }
    if (selectedSubjects.length === 0) {
      Alert.alert('No Subjects', 'Please select at least one subject.');
      return;
    }
    generateMutation.mutate();
  }, [daysLeft, selectedSubjects, generateMutation]);

  const handleReset = useCallback(() => {
    setTimetable(null);
    setRawText('');
    setExpandedDay(null);
  }, []);

  const priorityConfig = useMemo(() => ({
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'HIGH' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'MED' },
    low: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'LOW' },
  }), []);

  const grades = board === 'CBSE' ? GRADES_CBSE : GRADES_ICSE;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0a0f1a', '#0d1f35', '#0a2840'] : ['#0a1628', '#0d2847', '#0e3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Study Planner</Text>
            <Text style={styles.headerSub}>Plan smart, score big</Text>
          </View>
          {timetable && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={18} color="#38bdf8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!timetable ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={[styles.card, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.cardIconBg}>
                  <Calendar size={18} color="#ffffff" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Exam Details</Text>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Board</Text>
              <View style={styles.boardRow}>
                {(['CBSE', 'ICSE'] as Board[]).map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.boardChip,
                      {
                        backgroundColor: board === b
                          ? (isDark ? '#0ea5e9' : '#0077b6')
                          : (isDark ? '#132640' : '#f0f7ff'),
                        borderColor: board === b ? 'transparent' : (isDark ? '#1e3a5f' : '#d6e4f0'),
                      },
                    ]}
                    onPress={() => setBoard(b)}
                  >
                    <Text style={[
                      styles.boardChipText,
                      { color: board === b ? '#ffffff' : colors.textSecondary },
                    ]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
                {grades.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gradeChip,
                      {
                        backgroundColor: grade === g
                          ? (isDark ? '#0ea5e9' : '#0077b6')
                          : (isDark ? '#132640' : '#f0f7ff'),
                        borderColor: grade === g ? 'transparent' : (isDark ? '#1e3a5f' : '#d6e4f0'),
                      },
                    ]}
                    onPress={() => setGrade(g)}
                  >
                    <Text style={[
                      styles.gradeChipText,
                      { color: grade === g ? '#ffffff' : colors.textSecondary },
                    ]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Subjects</Text>
              <TouchableOpacity
                style={[styles.subjectPickerBtn, { backgroundColor: isDark ? '#132640' : '#f0f7ff', borderColor: isDark ? '#1e3a5f' : '#d6e4f0' }]}
                onPress={() => setShowSubjectPicker(!showSubjectPicker)}
              >
                <Text style={[styles.subjectPickerText, { color: selectedSubjects.length > 0 ? colors.text : colors.textTertiary }]}>
                  {selectedSubjects.length > 0 ? `${selectedSubjects.length} subject(s) selected` : 'Tap to select subjects'}
                </Text>
                <ChevronDown size={18} color={colors.textTertiary} />
              </TouchableOpacity>

              {showSubjectPicker && (
                <View style={styles.subjectsList}>
                  {availableSubjects.length === 0 ? (
                    <Text style={[styles.noSubjects, { color: colors.textTertiary }]}>No subjects available for this grade</Text>
                  ) : (
                    availableSubjects.map(subj => (
                      <TouchableOpacity
                        key={subj}
                        style={[
                          styles.subjectItem,
                          {
                            backgroundColor: selectedSubjects.includes(subj)
                              ? (isDark ? 'rgba(14,165,233,0.15)' : 'rgba(0,119,182,0.08)')
                              : 'transparent',
                            borderColor: selectedSubjects.includes(subj)
                              ? (isDark ? '#0ea5e9' : '#0077b6')
                              : (isDark ? '#1e3a5f' : '#e2e8f0'),
                          },
                        ]}
                        onPress={() => toggleSubject(subj)}
                      >
                        <View style={[
                          styles.subjectCheck,
                          {
                            backgroundColor: selectedSubjects.includes(subj) ? (isDark ? '#0ea5e9' : '#0077b6') : 'transparent',
                            borderColor: selectedSubjects.includes(subj) ? (isDark ? '#0ea5e9' : '#0077b6') : (isDark ? '#3d5a80' : '#94a3b8'),
                          },
                        ]}>
                          {selectedSubjects.includes(subj) && <CheckCircle2 size={14} color="#ffffff" />}
                        </View>
                        <Text style={[styles.subjectItemText, { color: colors.text }]}>{subj}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {selectedSubjects.length > 0 && (
                <View style={styles.selectedTags}>
                  {selectedSubjects.map(s => (
                    <View key={s} style={[styles.selectedTag, { backgroundColor: isDark ? 'rgba(14,165,233,0.18)' : 'rgba(0,119,182,0.1)' }]}>
                      <Text style={[styles.selectedTagText, { color: isDark ? '#38bdf8' : '#0077b6' }]}>{s}</Text>
                      <TouchableOpacity onPress={() => toggleSubject(s)}>
                        <Text style={[styles.selectedTagX, { color: isDark ? '#38bdf8' : '#0077b6' }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={['#f97316', '#ea580c']} style={styles.cardIconBg}>
                  <Clock size={18} color="#ffffff" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Schedule</Text>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Days until exam</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#132640' : '#f0f7ff', borderColor: isDark ? '#1e3a5f' : '#d6e4f0', color: colors.text }]}
                placeholder="e.g., 30"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={daysLeft}
                onChangeText={setDaysLeft}
                maxLength={3}
                testID="days-input"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Study hours per day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
                {STUDY_HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.gradeChip,
                      {
                        backgroundColor: hoursPerDay === h
                          ? (isDark ? '#f97316' : '#ea580c')
                          : (isDark ? '#132640' : '#f0f7ff'),
                        borderColor: hoursPerDay === h ? 'transparent' : (isDark ? '#1e3a5f' : '#d6e4f0'),
                      },
                    ]}
                    onPress={() => setHoursPerDay(h)}
                  >
                    <Text style={[
                      styles.gradeChipText,
                      { color: hoursPerDay === h ? '#ffffff' : colors.textSecondary },
                    ]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, generateMutation.isPending && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={generateMutation.isPending}
              activeOpacity={0.85}
              testID="generate-button"
            >
              <LinearGradient
                colors={generateMutation.isPending ? ['#475569', '#475569'] : ['#0ea5e9', '#0077b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateGradient}
              >
                {generateMutation.isPending ? (
                  <View style={styles.loadingRow}>
                    <Animated.View style={styles.spinnerDot} />
                    <Text style={styles.generateText}>Crafting your plan...</Text>
                  </View>
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.generateText}>Generate Study Plan</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.hintCard, { backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', borderColor: isDark ? 'rgba(251,191,36,0.2)' : '#fde68a' }]}>
              <AlertTriangle size={16} color="#f59e0b" />
              <Text style={[styles.hintText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                AI will create a day-by-day plan covering all chapters with revision phases and smart scheduling.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: resultFade, transform: [{ translateY: resultSlide }] }}>
            <LinearGradient
              colors={isDark ? ['#0a1525', '#0d2240'] : ['#eff6ff', '#dbeafe']}
              style={[styles.overviewCard, { borderColor: isDark ? '#1e3a5f' : '#93c5fd' }]}
            >
              <View style={styles.overviewHeader}>
                <Target size={22} color={isDark ? '#38bdf8' : '#0077b6'} />
                <Text style={[styles.overviewTitle, { color: isDark ? '#38bdf8' : '#0077b6' }]}>{timetable.title}</Text>
              </View>
              <Text style={[styles.overviewText, { color: isDark ? '#b8d0e8' : '#1e3a5f' }]}>{timetable.overview}</Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Calendar size={14} color={isDark ? '#7dd3fc' : '#0369a1'} />
                  <Text style={[styles.overviewStatText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>{timetable.dailyPlans.length} days</Text>
                </View>
                <View style={styles.overviewStat}>
                  <BookOpen size={14} color={isDark ? '#7dd3fc' : '#0369a1'} />
                  <Text style={[styles.overviewStatText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>{selectedSubjects.length} subjects</Text>
                </View>
                <View style={styles.overviewStat}>
                  <Clock size={14} color={isDark ? '#7dd3fc' : '#0369a1'} />
                  <Text style={[styles.overviewStatText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>{hoursPerDay}h/day</Text>
                </View>
              </View>
            </LinearGradient>

            {timetable.dailyPlans.map((dayPlan) => (
              <View key={dayPlan.day} style={[styles.dayCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => setExpandedDay(expandedDay === dayPlan.day ? null : dayPlan.day)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayHeaderLeft}>
                    <LinearGradient
                      colors={dayPlan.day <= Math.ceil(timetable.dailyPlans.length * 0.75) ? ['#0ea5e9', '#0284c7'] : ['#f59e0b', '#d97706']}
                      style={styles.dayBadge}
                    >
                      <Text style={styles.dayBadgeText}>{dayPlan.day}</Text>
                    </LinearGradient>
                    <View>
                      <Text style={[styles.dayTitle, { color: colors.text }]}>Day {dayPlan.day}</Text>
                      <Text style={[styles.dayDate, { color: colors.textTertiary }]}>{dayPlan.date}</Text>
                    </View>
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <Text style={[styles.sessionCount, { color: colors.textTertiary }]}>{dayPlan.sessions.length} sessions</Text>
                    <ChevronRight
                      size={18}
                      color={colors.textTertiary}
                      style={{ transform: [{ rotate: expandedDay === dayPlan.day ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </TouchableOpacity>

                {expandedDay === dayPlan.day && (
                  <View style={styles.dayContent}>
                    {dayPlan.sessions.map((session, sIdx) => {
                      const pc = priorityConfig[session.priority];
                      return (
                        <View
                          key={sIdx}
                          style={[styles.sessionCard, { backgroundColor: isDark ? '#0a1525' : '#f8fafc', borderLeftColor: pc.color }]}
                        >
                          <View style={styles.sessionTop}>
                            <Text style={[styles.sessionSubject, { color: colors.text }]}>{session.subject}</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                              <Text style={[styles.priorityText, { color: pc.color }]}>{pc.label}</Text>
                            </View>
                          </View>
                          {session.chapter ? (
                            <Text style={[styles.sessionChapter, { color: colors.textSecondary }]}>{session.chapter}</Text>
                          ) : null}
                          <View style={styles.sessionMeta}>
                            <View style={styles.sessionMetaItem}>
                              <Clock size={12} color={colors.textTertiary} />
                              <Text style={[styles.sessionMetaText, { color: colors.textTertiary }]}>{session.duration}</Text>
                            </View>
                            <View style={styles.sessionMetaItem}>
                              <Brain size={12} color={colors.textTertiary} />
                              <Text style={[styles.sessionMetaText, { color: colors.textTertiary }]}>{session.activity}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    {dayPlan.tip ? (
                      <View style={[styles.dayTip, { backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb' }]}>
                        <Flame size={14} color="#f59e0b" />
                        <Text style={[styles.dayTipText, { color: isDark ? '#fbbf24' : '#92400e' }]}>{dayPlan.tip}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            ))}

            {timetable.revisionStrategy ? (
              <View style={[styles.revisionCard, { backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff', borderColor: isDark ? 'rgba(139,92,246,0.3)' : '#c4b5fd' }]}>
                <View style={styles.revisionHeader}>
                  <Brain size={18} color={isDark ? '#a78bfa' : '#7c3aed'} />
                  <Text style={[styles.revisionTitle, { color: isDark ? '#a78bfa' : '#7c3aed' }]}>Revision Strategy</Text>
                </View>
                <Text style={[styles.revisionText, { color: isDark ? '#c4b5fd' : '#4c1d95' }]}>{timetable.revisionStrategy}</Text>
              </View>
            ) : null}

            {timetable.tips.length > 0 && (
              <View style={[styles.tipsCard, { backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4', borderColor: isDark ? 'rgba(34,197,94,0.25)' : '#86efac' }]}>
                <View style={styles.tipsHeader}>
                  <Sparkles size={18} color={isDark ? '#4ade80' : '#16a34a'} />
                  <Text style={[styles.tipsTitle, { color: isDark ? '#4ade80' : '#16a34a' }]}>Pro Tips</Text>
                </View>
                {timetable.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={[styles.tipDot, { backgroundColor: isDark ? '#4ade80' : '#16a34a' }]} />
                    <Text style={[styles.tipText, { color: isDark ? '#bbf7d0' : '#14532d' }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {rawText ? (
              <View style={[styles.rawCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
                <Text style={[styles.rawTitle, { color: colors.textSecondary }]}>Full AI Response</Text>
                <Text style={[styles.rawText, { color: colors.text }]} selectable>{rawText}</Text>
              </View>
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#7dd3fc',
    fontWeight: '500' as const,
    marginTop: 2,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(56,189,248,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  cardIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  boardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boardChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  boardChipText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  gradeScroll: {
    marginBottom: 4,
  },
  gradeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  gradeChipText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  subjectPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectPickerText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  subjectsList: {
    marginTop: 10,
    gap: 6,
  },
  noSubjects: {
    fontSize: 13,
    fontStyle: 'italic' as const,
    textAlign: 'center',
    paddingVertical: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  subjectCheck: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectItemText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  selectedTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  selectedTagX: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600' as const,
    borderWidth: 1,
  },
  generateBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(14,165,233,0.35)' },
    }),
  },
  generateBtnDisabled: {
    opacity: 0.7,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  overviewText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500' as const,
    marginBottom: 14,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  overviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  overviewStatText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dayCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionCount: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  dayContent: {
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  sessionCard: {
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  sessionChapter: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  dayTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  dayTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500' as const,
  },
  revisionCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  revisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  revisionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  revisionText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  tipsCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  rawCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  rawTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  rawText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
