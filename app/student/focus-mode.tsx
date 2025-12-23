import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useFocusMode } from '@/contexts/focus-mode-context';
import { Target, Clock, AlertCircle, TrendingUp, Shield, Play, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FocusModeScreen() {
  const {
    isFocusMode,
    sessions,
    stats,
    distractionCount,
    sessionDuration,
    startFocusMode,
    endFocusMode,
  } = useFocusMode();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Focus Mode',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isFocusMode ? (
          <View style={styles.activeSessionContainer}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.activeSessionGradient}
            >
              <View style={styles.activeSessionContent}>
                <Shield color="#fff" size={48} />
                <Text style={styles.activeSessionTitle}>Focus Mode Active</Text>
                <Text style={styles.activeSessionSubtitle}>Stay committed to your studies</Text>
                
                <View style={styles.timerContainer}>
                  <Clock color="#fff" size={32} />
                  <Text style={styles.timerText}>{formatTime(sessionDuration)}</Text>
                </View>

                <View style={styles.distractionBadge}>
                  <AlertCircle color={distractionCount > 0 ? '#ef4444' : '#10b981'} size={20} />
                  <Text style={styles.distractionText}>
                    {distractionCount} {distractionCount === 1 ? 'Distraction' : 'Distractions'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.endButton}
                  onPress={endFocusMode}
                  activeOpacity={0.8}
                >
                  <Square color="#fff" size={20} fill="#fff" />
                  <Text style={styles.endButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.blockedAppsContainer}>
              <Text style={styles.blockedAppsTitle}>🚫 Blocked Apps Reminder</Text>
              <Text style={styles.blockedAppsText}>
                You committed to avoiding these distractions:
              </Text>
              <View style={styles.blockedAppsList}>
                <View style={styles.blockedAppItem}>
                  <Text style={styles.blockedAppText}>📱 YouTube</Text>
                </View>
                <View style={styles.blockedAppItem}>
                  <Text style={styles.blockedAppText}>📷 Instagram</Text>
                </View>
                <View style={styles.blockedAppItem}>
                  <Text style={styles.blockedAppText}>👥 Facebook</Text>
                </View>
                <View style={styles.blockedAppItem}>
                  <Text style={styles.blockedAppText}>👻 Snapchat</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.inactiveContainer}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.heroGradient}
            >
              <Target color="#fff" size={64} />
              <Text style={styles.heroTitle}>Focus Mode</Text>
              <Text style={styles.heroSubtitle}>
                Block distractions and stay committed to your studies
              </Text>
            </LinearGradient>

            <View style={styles.featuresContainer}>
              <View style={styles.featureCard}>
                <Shield color="#6366f1" size={32} />
                <Text style={styles.featureTitle}>Stay Focused</Text>
                <Text style={styles.featureText}>
                  Get reminders when you try to leave the app
                </Text>
              </View>

              <View style={styles.featureCard}>
                <AlertCircle color="#6366f1" size={32} />
                <Text style={styles.featureTitle}>Track Distractions</Text>
                <Text style={styles.featureText}>
                  See how many times you got distracted
                </Text>
              </View>

              <View style={styles.featureCard}>
                <TrendingUp color="#6366f1" size={32} />
                <Text style={styles.featureTitle}>Build Habits</Text>
                <Text style={styles.featureText}>
                  Improve your focus over time with stats
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startFocusMode}
              activeOpacity={0.8}
            >
              <Play color="#fff" size={24} />
              <Text style={styles.startButtonText}>Start Focus Session</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Focus Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(stats.totalFocusTime)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalDistractions}</Text>
              <Text style={styles.statLabel}>Distractions</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(stats.longestStreak)}</Text>
              <Text style={styles.statLabel}>Longest Session</Text>
            </View>
          </View>
        </View>

        {sessions.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Sessions</Text>
            {sessions.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Clock color="#6366f1" size={20} />
                  <Text style={styles.historyDuration}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDate}>
                    {new Date(session.startTime).toLocaleDateString()} at{' '}
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.historyDistractions}>
                    <AlertCircle 
                      color={session.distractions > 0 ? '#ef4444' : '#10b981'} 
                      size={16} 
                    />
                    <Text style={[
                      styles.historyDistractionsText,
                      { color: session.distractions > 0 ? '#ef4444' : '#10b981' }
                    ]}>
                      {session.distractions} {session.distractions === 1 ? 'distraction' : 'distractions'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  activeSessionContainer: {
    padding: 20,
  },
  activeSessionGradient: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  activeSessionContent: {
    padding: 32,
    alignItems: 'center',
  },
  activeSessionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  activeSessionSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    gap: 12,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  distractionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    marginBottom: 24,
  },
  distractionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  blockedAppsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  blockedAppsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  blockedAppsText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  blockedAppsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  blockedAppItem: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  blockedAppText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  inactiveContainer: {
    padding: 20,
  },
  heroGradient: {
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresContainer: {
    marginTop: 24,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  historyContainer: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historyDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    color: '#64748b',
  },
  historyDistractions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDistractionsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
