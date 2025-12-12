import { useRouter } from 'expo-router';
import { ChevronLeft, Users, FileText, Video, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/app-context';
import { useMemo } from 'react';

export default function TeacherPerformance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress } = useApp();

  const stats = useMemo(() => {
    const activities = userProgress.teacherActivities || [];
    return {
      contentUploaded: activities.filter(a => a.type === 'upload').length,
      quizzesCreated: activities.filter(a => a.type === 'quiz').length,
      interviewsConducted: activities.filter(a => a.type === 'interview').length,
      totalStudents: 45,
    };
  }, [userProgress.teacherActivities]);

  const recentActivity = useMemo(() => {
    const activities = userProgress.teacherActivities || [];
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [userProgress.teacherActivities]);

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
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Video size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats.contentUploaded}</Text>
            <Text style={styles.statLabel}>Content</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <FileText size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.quizzesCreated}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <TrendingUp size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.interviewsConducted}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
              <Users size={24} color="#ec4899" />
            </View>
            <Text style={styles.statValue}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activities yet. Start uploading content, creating quizzes, or conducting interviews!</Text>
              </View>
            ) : (
              recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    {activity.type === 'upload' && <Video size={20} color="#3b82f6" />}
                    {activity.type === 'quiz' && <FileText size={20} color="#10b981" />}
                    {activity.type === 'interview' && <Users size={20} color="#f59e0b" />}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subject || 'General'}</Text>
                    <Text style={styles.activityDate}>{new Date(activity.timestamp).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
