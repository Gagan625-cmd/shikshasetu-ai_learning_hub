import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  distractions: number;
  duration: number;
}

interface FocusStats {
  totalSessions: number;
  totalFocusTime: number;
  totalDistractions: number;
  longestStreak: number;
}

export const [FocusModeContext, useFocusMode] = createContextHook(() => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState<FocusStats>({
    totalSessions: 0,
    totalFocusTime: 0,
    totalDistractions: 0,
    longestStreak: 0,
  });
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasInBackground = useRef<boolean>(false);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('focus_sessions');
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem('focus_stats');
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSessions = async (newSessions: FocusSession[]) => {
    try {
      await AsyncStorage.setItem('focus_sessions', JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const saveStats = async (newStats: FocusStats) => {
    try {
      await AsyncStorage.setItem('focus_stats', JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const endFocusMode = useCallback(() => {
    if (!currentSession) return;

    const duration = Math.floor((Date.now() - currentSession.startTime) / 1000);
    const completedSession: FocusSession = {
      ...currentSession,
      endTime: Date.now(),
      duration,
      distractions: distractionCount,
    };

    const newSessions = [completedSession, ...sessions].slice(0, 50);
    saveSessions(newSessions);

    const newStats: FocusStats = {
      totalSessions: stats.totalSessions + 1,
      totalFocusTime: stats.totalFocusTime + duration,
      totalDistractions: stats.totalDistractions + distractionCount,
      longestStreak: Math.max(stats.longestStreak, duration),
    };
    saveStats(newStats);

    const minutes = Math.floor(duration / 60);
    Alert.alert(
      '✅ Focus Session Complete!',
      `Great job! You studied for ${minutes} minute${minutes !== 1 ? 's' : ''}.\n\nDistractions: ${distractionCount}\n\nKeep up the great work!`,
      [{ text: 'Done' }]
    );

    setIsFocusMode(false);
    setCurrentSession(null);
    setDistractionCount(0);
    setSessionDuration(0);

    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, [currentSession, distractionCount, sessions, stats]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (isFocusMode && currentSession) {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        wasInBackground.current = true;
        console.log('User left the app during focus mode');
        
        if (Platform.OS !== 'web') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎯 Stay Focused!',
              body: 'Remember: You blocked social media to study. Get back to learning!',
              sound: true,
            },
            trigger: null,
          });
        }
      } else if (nextAppState === 'active' && wasInBackground.current) {
        wasInBackground.current = false;
        const newDistractionCount = distractionCount + 1;
        setDistractionCount(newDistractionCount);
        
        setCurrentSession({
          ...currentSession,
          distractions: newDistractionCount,
        });

        Alert.alert(
          '⚠️ Distraction Detected',
          `You left the app ${newDistractionCount} time${newDistractionCount > 1 ? 's' : ''} during this focus session.\n\nRemember: You committed to staying focused on your studies!`,
          [
            {
              text: 'End Session',
              style: 'destructive',
              onPress: () => endFocusMode(),
            },
            {
              text: 'Continue Studying',
              style: 'default',
            },
          ]
        );
      }
    }
    appState.current = nextAppState;
  }, [isFocusMode, currentSession, distractionCount, endFocusMode]);

  useEffect(() => {
    loadSessions();
    loadStats();

    if (Platform.OS !== 'web') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  useEffect(() => {
    if (isFocusMode && currentSession) {
      timerInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
        setSessionDuration(elapsed);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isFocusMode, currentSession]);

  const startFocusMode = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Required',
          'Please enable notifications to receive focus reminders when you leave the app.'
        );
      }
    }

    Alert.alert(
      '🎯 Start Focus Mode?',
      'By starting Focus Mode, you commit to staying in the app and focusing on your studies.\n\nYou will receive reminders if you try to switch to other apps like YouTube, Instagram, Facebook, or Snapchat.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Focusing',
          style: 'default',
          onPress: () => {
            const session: FocusSession = {
              id: Date.now().toString(),
              startTime: Date.now(),
              distractions: 0,
              duration: 0,
            };
            setCurrentSession(session);
            setIsFocusMode(true);
            setDistractionCount(0);
            setSessionDuration(0);
          },
        },
      ]
    );
  };



  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem('focus_sessions');
      await AsyncStorage.removeItem('focus_stats');
      setSessions([]);
      setStats({
        totalSessions: 0,
        totalFocusTime: 0,
        totalDistractions: 0,
        longestStreak: 0,
      });
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return {
    isFocusMode,
    currentSession,
    sessions,
    stats,
    distractionCount,
    sessionDuration,
    startFocusMode,
    endFocusMode,
    clearAllData,
  };
});
