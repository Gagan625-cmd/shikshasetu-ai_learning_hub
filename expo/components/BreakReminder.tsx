import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  AppState,
  Platform,
} from 'react-native';
import { Clock, Coffee, Play, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const USAGE_THRESHOLD_MS = 25 * 60 * 1000;
const BREAK_DURATION_MS = 5 * 60 * 1000;
const { width } = Dimensions.get('window');

export default function BreakReminder() {
  const [visible, setVisible] = useState(false);
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_DURATION_MS);
  const usageStartRef = useRef(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const showModal = useCallback(() => {
    setVisible(true);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setBreakActive(false);
      setBreakTimeLeft(BREAK_DURATION_MS);
      usageStartRef.current = Date.now();
      progressAnim.setValue(0);
    });
  }, [fadeAnim, scaleAnim, progressAnim]);

  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - usageStartRef.current;
      if (elapsed >= USAGE_THRESHOLD_MS) {
        showModal();
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      }
    }, 10000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        usageStartRef.current = Date.now();
      }
    });

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      subscription.remove();
    };
  }, [showModal]);

  const startBreak = useCallback(() => {
    setBreakActive(true);
    setBreakTimeLeft(BREAK_DURATION_MS);

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: BREAK_DURATION_MS,
      useNativeDriver: false,
    }).start();

    breakIntervalRef.current = setInterval(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1000) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          setTimeout(() => {
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            hideModal();
          }, 500);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, [hideModal, progressAnim]);

  const skipBreak = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    hideModal();
  }, [hideModal]);

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            {breakActive ? (
              <Coffee size={38} color="#fff" />
            ) : (
              <Clock size={38} color="#fff" />
            )}
          </Animated.View>

          {!breakActive ? (
            <>
              <Text style={styles.title}>Time for a Break!</Text>
              <Text style={styles.subtitle}>
                You've been studying for 25 minutes.{'\n'}Your eyes and mind need a rest.
              </Text>

              <View style={styles.tipCard}>
                <Heart size={16} color="#e85d75" />
                <Text style={styles.tipText}>
                  Taking regular breaks improves focus and retention by up to 30%
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={startBreak}
                activeOpacity={0.85}
                testID="break-start-btn"
              >
                <Coffee size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Take 5-Min Break</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={skipBreak}
                activeOpacity={0.7}
                testID="break-skip-btn"
              >
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Relax & Recharge</Text>
              <Text style={styles.subtitle}>
                Look away from the screen.{'\n'}Stretch, breathe, or grab some water.
              </Text>

              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{formatTime(breakTimeLeft)}</Text>
                <Text style={styles.timerLabel}>remaining</Text>
              </View>

              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>

              <View style={styles.tipsRow}>
                <View style={styles.miniTip}>
                  <Text style={styles.miniTipEmoji}>👀</Text>
                  <Text style={styles.miniTipText}>Rest your eyes</Text>
                </View>
                <View style={styles.miniTip}>
                  <Text style={styles.miniTipEmoji}>🧘</Text>
                  <Text style={styles.miniTipText}>Deep breaths</Text>
                </View>
                <View style={styles.miniTip}>
                  <Text style={styles.miniTipEmoji}>💧</Text>
                  <Text style={styles.miniTipText}>Hydrate</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.resumeBtn}
                onPress={skipBreak}
                activeOpacity={0.7}
                testID="break-resume-btn"
              >
                <Play size={16} color="#3d7c6b" />
                <Text style={styles.resumeBtnText}>Resume Studying</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 13, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: width - 48,
    maxWidth: 380,
    backgroundColor: '#0f1f35',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.2)',
    shadowColor: '#00b4d8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0e7490',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 93, 117, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 117, 0.15)',
  },
  tipText: {
    fontSize: 13,
    color: '#f0a0b0',
    flex: 1,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0e7490',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '200' as const,
    color: '#e0f2fe',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06b6d4',
    borderRadius: 3,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  miniTip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  miniTipEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  miniTipText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(61, 124, 107, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(61, 124, 107, 0.25)',
  },
  resumeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6ee7b7',
  },
});
