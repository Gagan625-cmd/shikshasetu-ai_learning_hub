import { useRouter } from 'expo-router';
import { ChevronLeft, Award, TrendingUp, BookOpen, CheckCircle, Clock, FileText, Flame } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/app-context';
import { useMemo } from 'react';

export default function StudentPerformance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress } = useApp();

  const stats = useMemo(() => {
    const quizzesCompleted = userProgress.quizzesCompleted.length;
    const lessonsCompleted = userProgress.contentActivities.length;
    const totalStudyTime = userProgress.totalStudyTime;
    const currentStreak = userProgress.currentStreak;
    
    const averageScore = quizzesCompleted > 0
      ? Math.round(
          userProgress.quizzesCompleted.reduce((acc, quiz) => 
            acc + (quiz.score / quiz.totalQuestions) * 100, 0
          ) / quizzesCompleted
        )
      : 0;

    return {
      quizzesCompleted,
      lessonsCompleted,
      averageScore,
      totalStudyTime,
      currentStreak,
    };
  }, [userProgress]);

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
    }[] = [];
    
    userProgress.quizzesCompleted.slice(-10).forEach(quiz => {
      activities.push({
        id: quiz.id,
        type: 'quiz' as const,
        board: quiz.board,
        subject: quiz.subject,
        topic: quiz.chapter,
        score: Math.round((quiz.score / quiz.totalQuestions) * 100),
        date: new Date(quiz.completedAt).toLocaleDateString(),
      });
    });

    userProgress.contentActivities.slice(-10).forEach(activity => {
      activities.push({
        id: activity.id,
        type: activity.type,
        board: activity.board,
        subject: activity.subject,
        topic: activity.chapter,
        completed: true,
        date: new Date(activity.completedAt).toLocaleDateString(),
      });
    });

    return activities
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 15);
  }, [userProgress]);

  const getActivityIcon = (type: string) => {
    if (type === 'quiz') return CheckCircle;
    if (type === 'notes' || type === 'summary') return BookOpen;
    if (type === 'worksheet') return FileText;
    return Clock;
  };

  const getActivityColor = (type: string) => {
    if (type === 'quiz') return '#10b981';
    if (type === 'notes') return '#3b82f6';
    if (type === 'summary') return '#8b5cf6';
    if (type === 'worksheet') return '#f59e0b';
    return '#64748b';
  };

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
        {stats.currentStreak > 0 && (
          <View style={styles.streakCard}>
            <Flame size={48} color="#f59e0b" />
            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>Current Streak</Text>
              <Text style={styles.streakDays}>{stats.currentStreak} Days</Text>
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
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
              <Clock size={24} color="#ec4899" />
            </View>
            <Text style={styles.statValue}>{Math.floor(stats.totalStudyTime / 60)}h</Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>

        {userProgress.quizzesCompleted.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Quiz Performance by Board</Text>
            {['NCERT', 'ICSE'].map(board => {
              const boardQuizzes = userProgress.quizzesCompleted.filter(q => q.board === board);
              if (boardQuizzes.length === 0) return null;
              
              const boardAvg = Math.round(
                boardQuizzes.reduce((acc, q) => acc + (q.score / q.totalQuestions) * 100, 0) / boardQuizzes.length
              );

              return (
                <View key={board} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{board}</Text>
                  <View style={styles.summaryStats}>
                    <Text style={styles.summaryCount}>{boardQuizzes.length} quizzes</Text>
                    <Text style={styles.summaryScore}>{boardAvg}% avg</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
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
                        <View style={[styles.boardBadge, { 
                          backgroundColor: activity.board === 'NCERT' ? '#eff6ff' : '#d1fae5' 
                        }]}>
                          <Text style={[styles.boardBadgeText, {
                            color: activity.board === 'NCERT' ? '#2563eb' : '#059669'
                          }]}>{activity.board}</Text>
                        </View>
                      </View>
                      <Text style={styles.activitySubtitle} numberOfLines={1}>{activity.topic}</Text>
                      <Text style={styles.activityDate}>{activity.date}</Text>
                    </View>
                    {activity.type === 'quiz' && activity.score !== undefined && (
                      <View style={[styles.activityScore, {
                        backgroundColor: activity.score >= 70 ? '#d1fae5' : activity.score >= 50 ? '#fef3c7' : '#fee2e2'
                      }]}>
                        <Text style={[styles.activityScoreText, {
                          color: activity.score >= 70 ? '#047857' : activity.score >= 50 ? '#92400e' : '#b91c1c'
                        }]}>{activity.score}%</Text>
                      </View>
                    )}
                    {activity.completed && activity.type !== 'quiz' && (
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryScore: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  boardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  boardBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
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
    paddingVertical: 60,
    paddingHorizontal: 40,
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
});
