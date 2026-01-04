import { useRouter } from 'expo-router';
import { ChevronLeft, Timer, Lock, Flame, MessageCircle, Play, Pause, RotateCcw, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useApp } from '@/contexts/app-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/subscription-context';

export default function StudyOS() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress, addStudyTime } = useApp();
  const { isPremium } = useSubscription();
  
  const [activeTab, setActiveTab] = useState<'timer' | 'blocker' | 'streaks' | 'coach'>('timer');
  
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  
  const [blockerActive, setBlockerActive] = useState(false);
  const [blockedApps] = useState<string[]>(['Social Media', 'Games', 'Entertainment']);
  
  const [coachMessage, setCoachMessage] = useState('');
  const [coachInput, setCoachInput] = useState('');
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && (timerMinutes > 0 || timerSeconds > 0)) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            setIsRunning(false);
            completeSession();
          } else {
            setTimerMinutes(timerMinutes - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(timerSeconds - 1);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timerMinutes, timerSeconds]);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const completeSession = () => {
    setSessionCount(sessionCount + 1);
    addStudyTime(25);
    Alert.alert('Session Complete!', 'Great job! Take a 5-minute break.');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
  };

  const coachMutation = useMutation({
    mutationFn: async (message: string) => {
      const prompt = `You are Setu Sensei, an AI motivational coach for students. The student says: "${message}". 
Respond with encouraging, motivational, and practical advice in 2-3 sentences. Be warm, supportive, and action-oriented.`;
      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setCoachMessage(data);
      setCoachInput('');
    },
  });

  const handleCoachMessage = () => {
    if (coachInput.trim()) {
      coachMutation.mutate(coachInput);
    }
  };

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.premiumHeaderTitle}>Study OS</Text>
          <View style={styles.backButton} />
        </View>
        
        <LinearGradient colors={['#7e22ce', '#9333ea']} style={styles.premiumContainer}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.premiumContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.lockIconContainer}>
              <Lock size={72} color="#fbbf24" strokeWidth={2} />
            </View>
            
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>
              Study OS is an advanced productivity suite available exclusively for premium members.
            </Text>

            <View style={styles.premiumFeaturesList}>
              <View style={styles.premiumFeatureItem}>
                <Timer size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Pomodoro Focus Timer</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Lock size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Distraction Blocker</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Flame size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Streaks & Rewards System</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>AI Motivational Coach</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study OS</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timer' && styles.tabActive]}
          onPress={() => setActiveTab('timer')}
        >
          <Timer size={20} color={activeTab === 'timer' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'timer' && styles.tabTextActive]}>Timer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocker' && styles.tabActive]}
          onPress={() => setActiveTab('blocker')}
        >
          <Lock size={20} color={activeTab === 'blocker' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'blocker' && styles.tabTextActive]}>Blocker</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'streaks' && styles.tabActive]}
          onPress={() => setActiveTab('streaks')}
        >
          <Flame size={20} color={activeTab === 'streaks' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'streaks' && styles.tabTextActive]}>Streaks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coach' && styles.tabActive]}
          onPress={() => setActiveTab('coach')}
        >
          <MessageCircle size={20} color={activeTab === 'coach' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'coach' && styles.tabTextActive]}>Coach</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'timer' && (
          <View style={styles.timerSection}>
            <Text style={styles.sectionTitle}>⏱️ Focus Timer</Text>
            <Text style={styles.sectionDescription}>
              Use the Pomodoro technique: 25 minutes of focused study, then 5-minute break
            </Text>

            <Animated.View style={[styles.timerCircle, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={isRunning ? ['#3b82f6', '#2563eb'] : ['#e2e8f0', '#cbd5e1']}
                style={styles.timerGradient}
              >
                <Text style={[styles.timerText, isRunning && styles.timerTextActive]}>
                  {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                </Text>
                <Text style={[styles.timerLabel, isRunning && styles.timerLabelActive]}>
                  {isRunning ? 'Focus Time' : 'Ready to Start'}
                </Text>
              </LinearGradient>
            </Animated.View>

            <View style={styles.timerControls}>
              <TouchableOpacity
                style={[styles.controlButton, isRunning && styles.controlButtonPause]}
                onPress={() => setIsRunning(!isRunning)}
              >
                {isRunning ? (
                  <>
                    <Pause size={24} color="#ffffff" />
                    <Text style={styles.controlButtonText}>Pause</Text>
                  </>
                ) : (
                  <>
                    <Play size={24} color="#ffffff" />
                    <Text style={styles.controlButtonText}>Start</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButtonSecondary} onPress={resetTimer}>
                <RotateCcw size={20} color="#64748b" />
                <Text style={styles.controlButtonSecondaryText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sessionCount}</Text>
                <Text style={styles.statLabel}>Sessions Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProgress.totalStudyTime}</Text>
                <Text style={styles.statLabel}>Total Minutes</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'blocker' && (
          <View style={styles.blockerSection}>
            <Text style={styles.sectionTitle}>🔒 Distraction Blocker</Text>
            <Text style={styles.sectionDescription}>
              Block distracting apps and websites during study time
            </Text>

            <View style={styles.blockerCard}>
              <View style={styles.blockerHeader}>
                <Text style={styles.blockerTitle}>Blocker Status</Text>
                <TouchableOpacity
                  style={[styles.blockerToggle, blockerActive && styles.blockerToggleActive]}
                  onPress={() => setBlockerActive(!blockerActive)}
                >
                  <View style={[styles.blockerToggleCircle, blockerActive && styles.blockerToggleCircleActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.blockerStatus}>
                {blockerActive ? '🟢 Active - Distractions are blocked' : '⚪ Inactive - Distractions allowed'}
              </Text>
            </View>

            <View style={styles.appsCard}>
              <Text style={styles.appsTitle}>Blocked Categories</Text>
              {blockedApps.map((app, index) => (
                <View key={index} style={styles.appItem}>
                  <Text style={styles.appText}>{app}</Text>
                  <Lock size={16} color="#64748b" />
                </View>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Tip: The blocker reminds you to stay focused. You control when it&apos;s active!
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'streaks' && (
          <View style={styles.streaksSection}>
            <Text style={styles.sectionTitle}>🔥 Streaks & Rewards</Text>
            <Text style={styles.sectionDescription}>
              Keep your daily streak going and earn rewards!
            </Text>

            <LinearGradient
              colors={['#fb923c', '#f97316']}
              style={styles.streakCard}
            >
              <Flame size={64} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.streakNumber}>{userProgress.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakMotivation}>
                {userProgress.currentStreak === 0 ? 'Start your journey today!' :
                 userProgress.currentStreak < 7 ? 'Keep it going!' :
                 userProgress.currentStreak < 30 ? 'You are on fire!' :
                 'Legendary streak!'}
              </Text>
            </LinearGradient>

            <View style={styles.rewardsGrid}>
              <View style={styles.rewardCard}>
                <Text style={styles.rewardEmoji}>🏆</Text>
                <Text style={styles.rewardTitle}>3-Day Warrior</Text>
                <Text style={styles.rewardStatus}>
                  {userProgress.currentStreak >= 3 ? '✓ Unlocked' : `${userProgress.currentStreak}/3`}
                </Text>
              </View>
              <View style={styles.rewardCard}>
                <Text style={styles.rewardEmoji}>⭐</Text>
                <Text style={styles.rewardTitle}>Week Champion</Text>
                <Text style={styles.rewardStatus}>
                  {userProgress.currentStreak >= 7 ? '✓ Unlocked' : `${userProgress.currentStreak}/7`}
                </Text>
              </View>
              <View style={styles.rewardCard}>
                <Text style={styles.rewardEmoji}>💎</Text>
                <Text style={styles.rewardTitle}>Month Legend</Text>
                <Text style={styles.rewardStatus}>
                  {userProgress.currentStreak >= 30 ? '✓ Unlocked' : `${userProgress.currentStreak}/30`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'coach' && (
          <View style={styles.coachSection}>
            <Text style={styles.sectionTitle}>🎯 Setu Sensei - Your AI Coach</Text>
            <Text style={styles.sectionDescription}>
              Get motivational support and study guidance
            </Text>

            <View style={styles.coachCard}>
              <View style={styles.coachAvatar}>
                <Sparkles size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.coachName}>Setu Sensei</Text>
              <Text style={styles.coachRole}>Motivational Coach</Text>
            </View>

            {coachMessage && (
              <View style={styles.coachMessageCard}>
                <Text style={styles.coachMessageText}>{coachMessage}</Text>
              </View>
            )}

            <View style={styles.coachInputContainer}>
              <TextInput
                style={styles.coachInput}
                placeholder="Ask Setu Sensei anything..."
                placeholderTextColor="#94a3b8"
                value={coachInput}
                onChangeText={setCoachInput}
                multiline
                maxLength={500}
                editable={!coachMutation.isPending}
              />
              <TouchableOpacity
                style={[styles.coachSendButton, !coachInput.trim() && styles.coachSendButtonDisabled]}
                onPress={handleCoachMessage}
                disabled={!coachInput.trim() || coachMutation.isPending}
              >
                <Text style={styles.coachSendButtonText}>
                  {coachMutation.isPending ? '...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.coachSuggestions}>
              <Text style={styles.suggestionsTitle}>Quick questions:</Text>
              {['I feel unmotivated', 'How to focus better?', 'Tips for exam prep'].map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionButton}
                  onPress={() => {
                    setCoachInput(suggestion);
                    coachMutation.mutate(suggestion);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  timerSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  timerCircle: {
    alignSelf: 'center',
    marginVertical: 32,
  },
  timerGradient: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
      },
    }),
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: '#64748b',
    fontVariant: ['tabular-nums'] as any,
  },
  timerTextActive: {
    color: '#ffffff',
  },
  timerLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  timerLabelActive: {
    color: '#e0e7ff',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#10b981',
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  controlButtonPause: {
    backgroundColor: '#f59e0b',
    ...Platform.select({
      ios: {
        shadowColor: '#f59e0b',
      },
      web: {
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      },
    }),
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  controlButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  controlButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  blockerSection: {
    gap: 16,
  },
  blockerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  blockerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  blockerToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    padding: 4,
    justifyContent: 'center',
  },
  blockerToggleActive: {
    backgroundColor: '#10b981',
  },
  blockerToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  blockerToggleCircleActive: {
    transform: [{ translateX: 24 }],
  },
  blockerStatus: {
    fontSize: 14,
    color: '#64748b',
  },
  appsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  appsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  appText: {
    fontSize: 15,
    color: '#475569',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  streaksSection: {
    gap: 16,
  },
  streakCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
      },
    }),
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginTop: 16,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginTop: 8,
  },
  streakMotivation: {
    fontSize: 14,
    color: '#fed7aa',
    marginTop: 8,
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardCard: {
    flex: 1,
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
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  rewardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardStatus: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  coachSection: {
    gap: 16,
  },
  coachCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  coachAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  coachRole: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  coachMessageCard: {
    backgroundColor: '#f3e8ff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  coachMessageText: {
    fontSize: 15,
    color: '#6b21a8',
    lineHeight: 24,
  },
  coachInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  coachInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
  },
  coachSendButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
  },
  coachSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  coachSendButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  coachSuggestions: {
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 8,
  },
  suggestionButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
  },
  premiumContainer: {
    flex: 1,
  },
  premiumContent: {
    padding: 24,
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  lockIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#e9d5ff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  premiumFeaturesList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  premiumFeatureText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
      },
    }),
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
