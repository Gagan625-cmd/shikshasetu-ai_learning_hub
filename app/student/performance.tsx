import { useRouter } from 'expo-router';
import { ChevronLeft, Award, TrendingUp, BookOpen, CheckCircle, Clock, FileText, Flame, Target, AlertTriangle, Star, Calendar, BarChart3, Brain, Zap } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/app-context';
import { useMemo, useState } from 'react';

type TimeFilter = 'week' | 'month' | 'all';

export default function StudentPerformance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress } = useApp();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filteredProgress = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filterByDate = <T extends { completedAt: Date }>(items: T[]) => {
      if (timeFilter === 'all') return items;
      const cutoff = timeFilter === 'week' ? weekAgo : monthAgo;
      return items.filter(item => new Date(item.completedAt) >= cutoff);
    };

    return {
      quizzes: filterByDate(userProgress.quizzesCompleted),
      content: filterByDate(userProgress.contentActivities),
      exams: timeFilter === 'all' 
        ? userProgress.examActivities 
        : userProgress.examActivities.filter(e => {
            const cutoff = timeFilter === 'week' ? weekAgo : monthAgo;
            return new Date(e.scannedAt) >= cutoff;
          }),
    };
  }, [userProgress, timeFilter]);

  const stats = useMemo(() => {
    const quizzesCompleted = filteredProgress.quizzes.length;
    const lessonsCompleted = filteredProgress.content.length;
    const totalStudyTime = userProgress.totalStudyTime;
    const currentStreak = userProgress.currentStreak;
    
    const averageScore = quizzesCompleted > 0
      ? Math.round(
          filteredProgress.quizzes.reduce((acc, quiz) => 
            acc + (quiz.score / quiz.totalQuestions) * 100, 0
          ) / quizzesCompleted
        )
      : 0;

    const examsScanned = filteredProgress.exams.length;
    const examAverage = examsScanned > 0
      ? Math.round(
          filteredProgress.exams.reduce((acc, exam) => acc + exam.percentage, 0) / examsScanned
        )
      : 0;

    return {
      quizzesCompleted,
      lessonsCompleted,
      averageScore,
      totalStudyTime,
      currentStreak,
      examsScanned,
      examAverage,
    };
  }, [filteredProgress, userProgress.totalStudyTime, userProgress.currentStreak]);

  const subjectPerformance = useMemo(() => {
    const subjects: Record<string, {
      subject: string;
      board: string;
      quizCount: number;
      totalScore: number;
      contentCount: number;
      chapters: Set<string>;
    }> = {};

    filteredProgress.quizzes.forEach(quiz => {
      const key = `${quiz.board}-${quiz.subject}`;
      if (!subjects[key]) {
        subjects[key] = {
          subject: quiz.subject,
          board: quiz.board,
          quizCount: 0,
          totalScore: 0,
          contentCount: 0,
          chapters: new Set(),
        };
      }
      subjects[key].quizCount++;
      subjects[key].totalScore += (quiz.score / quiz.totalQuestions) * 100;
      subjects[key].chapters.add(quiz.chapter);
    });

    filteredProgress.content.forEach(activity => {
      const key = `${activity.board}-${activity.subject}`;
      if (!subjects[key]) {
        subjects[key] = {
          subject: activity.subject,
          board: activity.board,
          quizCount: 0,
          totalScore: 0,
          contentCount: 0,
          chapters: new Set(),
        };
      }
      subjects[key].contentCount++;
      subjects[key].chapters.add(activity.chapter);
    });

    return Object.values(subjects)
      .map(s => ({
        ...s,
        averageScore: s.quizCount > 0 ? Math.round(s.totalScore / s.quizCount) : null,
        chaptersStudied: s.chapters.size,
      }))
      .sort((a, b) => (b.quizCount + b.contentCount) - (a.quizCount + a.contentCount));
  }, [filteredProgress]);

  const weakAreas = useMemo(() => {
    const chapterScores: Record<string, {
      chapter: string;
      subject: string;
      board: string;
      scores: number[];
    }> = {};

    filteredProgress.quizzes.forEach(quiz => {
      const key = `${quiz.board}-${quiz.subject}-${quiz.chapter}`;
      if (!chapterScores[key]) {
        chapterScores[key] = {
          chapter: quiz.chapter,
          subject: quiz.subject,
          board: quiz.board,
          scores: [],
        };
      }
      chapterScores[key].scores.push((quiz.score / quiz.totalQuestions) * 100);
    });

    return Object.values(chapterScores)
      .map(c => ({
        ...c,
        averageScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
        attempts: c.scores.length,
      }))
      .filter(c => c.averageScore < 60)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5);
  }, [filteredProgress.quizzes]);

  const strongAreas = useMemo(() => {
    const chapterScores: Record<string, {
      chapter: string;
      subject: string;
      board: string;
      scores: number[];
    }> = {};

    filteredProgress.quizzes.forEach(quiz => {
      const key = `${quiz.board}-${quiz.subject}-${quiz.chapter}`;
      if (!chapterScores[key]) {
        chapterScores[key] = {
          chapter: quiz.chapter,
          subject: quiz.subject,
          board: quiz.board,
          scores: [],
        };
      }
      chapterScores[key].scores.push((quiz.score / quiz.totalQuestions) * 100);
    });

    return Object.values(chapterScores)
      .map(c => ({
        ...c,
        averageScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
        attempts: c.scores.length,
      }))
      .filter(c => c.averageScore >= 80)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }, [filteredProgress.quizzes]);

  const recentActivity = useMemo(() => {
    const activities: {
      id: string;
      type: string;
      board: string;
      subject: string;
      topic: string;
      score?: number;
      completed?: boolean;
      date: string;
      timestamp: number;
    }[] = [];
    
    filteredProgress.quizzes.forEach(quiz => {
      activities.push({
        id: quiz.id,
        type: 'quiz',
        board: quiz.board,
        subject: quiz.subject,
        topic: quiz.chapter,
        score: Math.round((quiz.score / quiz.totalQuestions) * 100),
        date: new Date(quiz.completedAt).toLocaleDateString(),
        timestamp: new Date(quiz.completedAt).getTime(),
      });
    });

    filteredProgress.content.forEach(activity => {
      activities.push({
        id: activity.id,
        type: activity.type,
        board: activity.board,
        subject: activity.subject,
        topic: activity.chapter,
        completed: true,
        date: new Date(activity.completedAt).toLocaleDateString(),
        timestamp: new Date(activity.completedAt).getTime(),
      });
    });

    filteredProgress.exams.forEach(exam => {
      activities.push({
        id: exam.id,
        type: 'exam',
        board: 'Exam',
        subject: 'Scanned Paper',
        topic: `${exam.obtainedMarks}/${exam.totalMarks}`,
        score: Math.round(exam.percentage),
        date: new Date(exam.scannedAt).toLocaleDateString(),
        timestamp: new Date(exam.scannedAt).getTime(),
      });
    });

    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
  }, [filteredProgress]);

  const weeklyProgress = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateStr = date.toISOString().split('T')[0];
      
      const quizzes = userProgress.quizzesCompleted.filter(q => 
        new Date(q.completedAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const content = userProgress.contentActivities.filter(c => 
        new Date(c.completedAt).toISOString().split('T')[0] === dateStr
      ).length;

      return {
        day,
        date: dateStr,
        activities: quizzes + content,
        isToday: index === 6,
      };
    });

    const maxActivities = Math.max(...weekData.map(d => d.activities), 1);
    return weekData.map(d => ({
      ...d,
      height: (d.activities / maxActivities) * 100,
    }));
  }, [userProgress]);

  const getActivityIcon = (type: string) => {
    if (type === 'quiz') return CheckCircle;
    if (type === 'notes' || type === 'summary') return BookOpen;
    if (type === 'worksheet') return FileText;
    if (type === 'exam') return BarChart3;
    return Clock;
  };

  const getActivityColor = (type: string) => {
    if (type === 'quiz') return '#10b981';
    if (type === 'notes') return '#3b82f6';
    if (type === 'summary') return '#8b5cf6';
    if (type === 'worksheet') return '#f59e0b';
    if (type === 'exam') return '#ec4899';
    return '#64748b';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: '#10b981' };
    if (score >= 80) return { grade: 'A', color: '#22c55e' };
    if (score >= 70) return { grade: 'B', color: '#84cc16' };
    if (score >= 60) return { grade: 'C', color: '#eab308' };
    if (score >= 50) return { grade: 'D', color: '#f97316' };
    return { grade: 'F', color: '#ef4444' };
  };

  const hasAnyData = stats.quizzesCompleted > 0 || stats.lessonsCompleted > 0 || stats.examsScanned > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterContainer}>
          {(['week', 'month', 'all'] as TimeFilter[]).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, timeFilter === filter && styles.filterButtonActive]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {userProgress.currentStreak > 0 && (
          <View style={styles.streakCard}>
            <Flame size={48} color="#f59e0b" />
            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>Current Streak</Text>
              <Text style={styles.streakDays}>{userProgress.currentStreak} Days</Text>
              <Text style={styles.streakSubtitle}>Keep it going!</Text>
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <BookOpen size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Content</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <CheckCircle size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.quizzesCompleted}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <TrendingUp size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.averageScore}%</Text>
            <Text style={styles.statLabel}>Quiz Avg</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
              <Clock size={24} color="#ec4899" />
            </View>
            <Text style={styles.statValue}>{Math.floor(stats.totalStudyTime / 60)}h</Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>

        {stats.examsScanned > 0 && (
          <View style={styles.examCard}>
            <View style={styles.examHeader}>
              <BarChart3 size={24} color="#8b5cf6" />
              <Text style={styles.examTitle}>Exam Performance</Text>
            </View>
            <View style={styles.examStats}>
              <View style={styles.examStatItem}>
                <Text style={styles.examStatValue}>{stats.examsScanned}</Text>
                <Text style={styles.examStatLabel}>Papers Scanned</Text>
              </View>
              <View style={styles.examStatDivider} />
              <View style={styles.examStatItem}>
                <Text style={[styles.examStatValue, { color: getScoreGrade(stats.examAverage).color }]}>
                  {stats.examAverage}%
                </Text>
                <Text style={styles.examStatLabel}>Average Score</Text>
              </View>
              <View style={styles.examStatDivider} />
              <View style={styles.examStatItem}>
                <Text style={[styles.examStatValue, { color: getScoreGrade(stats.examAverage).color }]}>
                  {getScoreGrade(stats.examAverage).grade}
                </Text>
                <Text style={styles.examStatLabel}>Grade</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.weeklyCard}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
          </View>
          <View style={styles.weeklyChart}>
            {weeklyProgress.map((day, index) => (
              <View key={index} style={styles.weeklyBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: `${Math.max(day.height, 5)}%`,
                        backgroundColor: day.isToday ? '#3b82f6' : day.activities > 0 ? '#93c5fd' : '#e2e8f0',
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.weeklyLabel, day.isToday && styles.weeklyLabelActive]}>
                  {day.day}
                </Text>
                <Text style={styles.weeklyCount}>{day.activities}</Text>
              </View>
            ))}
          </View>
        </View>

        {subjectPerformance.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Brain size={20} color="#64748b" />
              <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
            </View>
            <View style={styles.subjectList}>
              {subjectPerformance.map((subject, index) => (
                <View key={index} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.subject}</Text>
                      <View style={[styles.boardBadge, { 
                        backgroundColor: subject.board === 'NCERT' ? '#eff6ff' : '#d1fae5' 
                      }]}>
                        <Text style={[styles.boardBadgeText, {
                          color: subject.board === 'NCERT' ? '#2563eb' : '#059669'
                        }]}>{subject.board}</Text>
                      </View>
                    </View>
                    {subject.averageScore !== null && (
                      <View style={[styles.scoreBadge, {
                        backgroundColor: subject.averageScore >= 70 ? '#d1fae5' : subject.averageScore >= 50 ? '#fef3c7' : '#fee2e2'
                      }]}>
                        <Text style={[styles.scoreBadgeText, {
                          color: subject.averageScore >= 70 ? '#047857' : subject.averageScore >= 50 ? '#92400e' : '#b91c1c'
                        }]}>{subject.averageScore}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.subjectStats}>
                    <View style={styles.subjectStatItem}>
                      <CheckCircle size={14} color="#10b981" />
                      <Text style={styles.subjectStatText}>{subject.quizCount} quizzes</Text>
                    </View>
                    <View style={styles.subjectStatItem}>
                      <BookOpen size={14} color="#3b82f6" />
                      <Text style={styles.subjectStatText}>{subject.contentCount} content</Text>
                    </View>
                    <View style={styles.subjectStatItem}>
                      <Target size={14} color="#8b5cf6" />
                      <Text style={styles.subjectStatText}>{subject.chaptersStudied} chapters</Text>
                    </View>
                  </View>
                  {subject.averageScore !== null && (
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${subject.averageScore}%` }]} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {strongAreas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Strong Areas</Text>
            </View>
            <View style={styles.areaList}>
              {strongAreas.map((area, index) => (
                <View key={index} style={styles.strongAreaCard}>
                  <View style={styles.areaContent}>
                    <Text style={styles.areaChapter} numberOfLines={1}>{area.chapter}</Text>
                    <Text style={styles.areaSubject}>{area.subject} • {area.board}</Text>
                  </View>
                  <View style={styles.areaScore}>
                    <Text style={styles.strongScoreText}>{area.averageScore}%</Text>
                    <Text style={styles.areaAttempts}>{area.attempts} {area.attempts === 1 ? 'quiz' : 'quizzes'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {weakAreas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={styles.sectionTitle}>Needs Improvement</Text>
            </View>
            <View style={styles.areaList}>
              {weakAreas.map((area, index) => (
                <View key={index} style={styles.weakAreaCard}>
                  <View style={styles.areaContent}>
                    <Text style={styles.areaChapter} numberOfLines={1}>{area.chapter}</Text>
                    <Text style={styles.areaSubject}>{area.subject} • {area.board}</Text>
                  </View>
                  <View style={styles.areaScore}>
                    <Text style={styles.weakScoreText}>{area.averageScore}%</Text>
                    <Text style={styles.areaAttempts}>{area.attempts} {area.attempts === 1 ? 'quiz' : 'quizzes'}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.tipCard}>
              <Zap size={16} color="#f59e0b" />
              <Text style={styles.tipText}>
                Practice these chapters more with quizzes and generate summaries for better understanding
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {recentActivity.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);

                return (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={[styles.activityIcon, { backgroundColor: color + '20' }]}>
                      <Icon size={20} color={color} />
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityTitle}>{activity.subject}</Text>
                        {activity.board !== 'Exam' && (
                          <View style={[styles.boardBadgeSmall, { 
                            backgroundColor: activity.board === 'NCERT' ? '#eff6ff' : '#d1fae5' 
                          }]}>
                            <Text style={[styles.boardBadgeTextSmall, {
                              color: activity.board === 'NCERT' ? '#2563eb' : '#059669'
                            }]}>{activity.board}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.activitySubtitle} numberOfLines={1}>{activity.topic}</Text>
                      <Text style={styles.activityDate}>{activity.date}</Text>
                    </View>
                    {activity.score !== undefined && (
                      <View style={[styles.activityScore, {
                        backgroundColor: activity.score >= 70 ? '#d1fae5' : activity.score >= 50 ? '#fef3c7' : '#fee2e2'
                      }]}>
                        <Text style={[styles.activityScoreText, {
                          color: activity.score >= 70 ? '#047857' : activity.score >= 50 ? '#92400e' : '#b91c1c'
                        }]}>{activity.score}%</Text>
                      </View>
                    )}
                    {activity.completed && activity.type !== 'quiz' && activity.type !== 'exam' && (
                      <View style={styles.activityBadge}>
                        <CheckCircle size={16} color={color} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Award size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No activity yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete quizzes and generate content to see your progress here
              </Text>
            </View>
          )}
        </View>

        {!hasAnyData && (
          <View style={styles.getStartedCard}>
            <View style={styles.getStartedIcon}>
              <Target size={32} color="#3b82f6" />
            </View>
            <Text style={styles.getStartedTitle}>Start Your Learning Journey</Text>
            <Text style={styles.getStartedText}>
              Take quizzes, generate study materials, and scan your exam papers to track your progress and identify areas for improvement.
            </Text>
            <TouchableOpacity 
              style={styles.getStartedButton}
              onPress={() => router.push('/student/quiz' as any)}
            >
              <Text style={styles.getStartedButtonText}>Take Your First Quiz</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  filterTextActive: {
    color: '#1e293b',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fed7aa',
    ...Platform.select({
      ios: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
      },
    }),
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400e',
    marginBottom: 4,
  },
  streakDays: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#f59e0b',
    marginBottom: 2,
  },
  streakSubtitle: {
    fontSize: 13,
    color: '#92400e',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  examCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#7c3aed',
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  examStatItem: {
    alignItems: 'center',
  },
  examStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  examStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  examStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9d5ff',
  },
  weeklyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  weeklyBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    flex: 1,
    width: 24,
    justifyContent: 'flex-end',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  weeklyLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  weeklyLabelActive: {
    color: '#3b82f6',
    fontWeight: '700' as const,
  },
  weeklyCount: {
    fontSize: 10,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  subjectList: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  boardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  boardBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  boardBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  boardBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  subjectStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  subjectStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subjectStatText: {
    fontSize: 12,
    color: '#64748b',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  areaList: {
    gap: 10,
  },
  strongAreaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  weakAreaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  areaContent: {
    flex: 1,
  },
  areaChapter: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 2,
  },
  areaSubject: {
    fontSize: 12,
    color: '#64748b',
  },
  areaScore: {
    alignItems: 'flex-end',
  },
  strongScoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#16a34a',
  },
  weakScoreText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#dc2626',
  },
  areaAttempts: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activityScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activityScoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  activityBadge: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  getStartedCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  getStartedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  getStartedText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  getStartedButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
