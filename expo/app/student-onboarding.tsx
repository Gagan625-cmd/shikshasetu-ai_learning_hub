import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraduationCap, BookOpen, Calendar, ChevronRight, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOARDS = [
  { id: 'CBSE', label: 'CBSE', emoji: '📘', color: '#0077b6' },
  { id: 'ICSE', label: 'ICSE', emoji: '📗', color: '#059669' },
  { id: 'State Board', label: 'State Board', emoji: '📙', color: '#f59e0b' },
  { id: 'Other', label: 'Other', emoji: '📕', color: '#ef4444' },
];

const CLASSES = [
  { id: '6', label: 'Class 6' },
  { id: '7', label: 'Class 7' },
  { id: '8', label: 'Class 8' },
  { id: '9', label: 'Class 9' },
  { id: '10', label: 'Class 10' },
  { id: '11', label: 'Class 11' },
  { id: '12', label: 'Class 12' },
];

const EXAM_OPTIONS = [
  { id: 'weekly', label: 'This Week', icon: '⚡' },
  { id: 'monthly', label: 'This Month', icon: '📅' },
  { id: '3months', label: 'In 3 Months', icon: '🗓️' },
  { id: 'board', label: 'Board Exams', icon: '🎯' },
  { id: 'none', label: 'No Upcoming Exam', icon: '😌' },
];

export default function StudentOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [examDate, setExamDate] = useState('');
  const [customExamDate, setCustomExamDate] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, orb1, orb2]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / 2,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  const animateStep = useCallback(() => {
    stepFade.setValue(0);
    stepSlide.setValue(30);
    Animated.parallel([
      Animated.timing(stepFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(stepSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [stepFade, stepSlide]);

  const handleNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) {
      setStep(s => s + 1);
      animateStep();
    }
  }, [step, animateStep]);

  const handleFinish = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AsyncStorage.setItem('student_onboarding', JSON.stringify({
        board: selectedBoard,
        class: selectedClass,
        examDate: examDate,
        customExamDate: customExamDate,
        completedAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem('student_onboarding_done', 'true');
    } catch (e) {
      console.log('Error saving onboarding:', e);
    }
    router.replace('/student/' as any);
  }, [selectedBoard, selectedClass, examDate, customExamDate, router]);

  const canProceed = step === 0 ? !!selectedBoard : step === 1 ? !!selectedClass : !!examDate;

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const orb2X = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });

  const renderBoardStep = () => (
    <View style={s.stepContent}>
      <View style={s.stepIconRow}>
        <LinearGradient colors={['#0077b6', '#00b4d8']} style={s.stepIconBg}>
          <BookOpen size={28} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>Which board are you studying?</Text>
      <Text style={s.stepSubtitle}>This helps us personalize your content</Text>
      <View style={s.optionsGrid}>
        {BOARDS.map(b => {
          const selected = selectedBoard === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              style={[s.boardCard, selected && { borderColor: b.color, borderWidth: 2.5 }]}
              onPress={() => { setSelectedBoard(b.id); void Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selected ? [b.color + '25', b.color + '10'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={s.boardCardInner}
              >
                <Text style={s.boardEmoji}>{b.emoji}</Text>
                <Text style={[s.boardLabel, selected && { color: b.color }]}>{b.label}</Text>
                {selected && (
                  <View style={[s.checkMark, { backgroundColor: b.color }]}>
                    <CheckCircle size={14} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderClassStep = () => (
    <View style={s.stepContent}>
      <View style={s.stepIconRow}>
        <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={s.stepIconBg}>
          <GraduationCap size={28} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>What class are you in?</Text>
      <Text style={s.stepSubtitle}>We'll show you relevant chapters & syllabus</Text>
      <View style={s.classGrid}>
        {CLASSES.map(c => {
          const selected = selectedClass === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[s.classChip, selected && s.classChipActive]}
              onPress={() => { setSelectedClass(c.id); void Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selected ? ['#8b5cf6', '#7c3aed'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                style={s.classChipInner}
              >
                <Text style={[s.classText, selected && s.classTextActive]}>{c.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderExamStep = () => (
    <View style={s.stepContent}>
      <View style={s.stepIconRow}>
        <LinearGradient colors={['#f59e0b', '#f97316']} style={s.stepIconBg}>
          <Calendar size={28} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={s.stepTitle}>When is your next exam?</Text>
      <Text style={s.stepSubtitle}>We'll help you plan your revision schedule</Text>
      <View style={s.examOptions}>
        {EXAM_OPTIONS.map(e => {
          const selected = examDate === e.id;
          return (
            <TouchableOpacity
              key={e.id}
              style={[s.examOption, selected && s.examOptionActive]}
              onPress={() => { setExamDate(e.id); void Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Text style={s.examEmoji}>{e.icon}</Text>
              <Text style={[s.examLabel, selected && s.examLabelActive]}>{e.label}</Text>
              {selected && <CheckCircle size={18} color="#f59e0b" />}
            </TouchableOpacity>
          );
        })}
      </View>
      {examDate === 'board' && (
        <View style={s.customDateWrap}>
          <TextInput
            style={s.customDateInput}
            placeholder="e.g. March 2027"
            placeholderTextColor="#4a6a8a"
            value={customExamDate}
            onChangeText={setCustomExamDate}
          />
        </View>
      )}
    </View>
  );

  const STEP_LABELS = ['Board', 'Class', 'Exam'];

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#070e1a', '#0a1a30', '#0d2445', '#091b33']}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[s.orbA, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[s.orbB, { transform: [{ translateX: orb2X }] }]} />

      <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.topBar}>
          <View style={s.progressRow}>
            {STEP_LABELS.map((label, i) => (
              <View key={i} style={s.progressItem}>
                <View style={[s.progressDot, i <= step && s.progressDotActive]}>
                  {i < step ? (
                    <CheckCircle size={14} color="#fff" />
                  ) : (
                    <Text style={[s.progressDotText, i <= step && s.progressDotTextActive]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[s.progressLabel, i <= step && s.progressLabelActive]}>{label}</Text>
                {i < STEP_LABELS.length - 1 && <View style={[s.progressLine, i < step && s.progressLineActive]} />}
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: stepFade, transform: [{ translateY: stepSlide }] }}>
            {step === 0 && renderBoardStep()}
            {step === 1 && renderClassStep()}
            {step === 2 && renderExamStep()}
          </Animated.View>
        </ScrollView>

        <View style={s.bottomBar}>
          {step > 0 && (
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => { setStep(s => s - 1); animateStep(); }}
              activeOpacity={0.8}
            >
              <Text style={s.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, !canProceed && s.nextBtnDisabled]}
            onPress={step === 2 ? handleFinish : handleNext}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canProceed ? ['#0077b6', '#00b4d8'] : ['#1a2a40', '#1a2a40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextBtnGradient}
            >
              <Text style={[s.nextBtnText, !canProceed && s.nextBtnTextDisabled]}>
                {step === 2 ? "Let's Go!" : 'Continue'}
              </Text>
              {canProceed && <ChevronRight size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.skipBtn} onPress={handleFinish} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  orbA: {
    position: 'absolute' as const,
    top: '15%',
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 119, 182, 0.12)',
  },
  orbB: {
    position: 'absolute' as const,
    bottom: '20%',
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 0,
  },
  progressItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressDotActive: {
    backgroundColor: '#0077b6',
    borderColor: '#00b4d8',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#4a6a8a',
  },
  progressDotTextActive: {
    color: '#ffffff',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#4a6a8a',
    marginLeft: 6,
  },
  progressLabelActive: {
    color: '#7dd3fc',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  progressLineActive: {
    backgroundColor: '#0077b6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingVertical: 20,
  },
  stepContent: {
    alignItems: 'center' as const,
  },
  stepIconRow: {
    marginBottom: 20,
  },
  stepIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...Platform.select({
      ios: { shadowColor: '#0077b6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(0, 119, 182, 0.35)' },
    }),
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#7dd3fc',
    textAlign: 'center' as const,
    marginBottom: 28,
    fontWeight: '500' as const,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 14,
    justifyContent: 'center' as const,
    width: '100%',
  },
  boardCard: {
    width: '46%',
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  boardCardInner: {
    padding: 20,
    alignItems: 'center' as const,
    gap: 10,
    position: 'relative' as const,
  },
  boardEmoji: {
    fontSize: 36,
  },
  boardLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#caf0f8',
  },
  checkMark: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  classGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    justifyContent: 'center' as const,
    width: '100%',
  },
  classChip: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  classChipActive: {
    borderColor: '#8b5cf6',
    borderWidth: 2,
  },
  classChipInner: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  classText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#94a3b8',
  },
  classTextActive: {
    color: '#ffffff',
  },
  examOptions: {
    width: '100%',
    gap: 10,
  },
  examOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  examOptionActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
  },
  examEmoji: {
    fontSize: 24,
  },
  examLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  examLabelActive: {
    color: '#fbbf24',
  },
  customDateWrap: {
    width: '100%',
    marginTop: 14,
  },
  customDateInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  bottomBar: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingVertical: 12,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#7dd3fc',
  },
  nextBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  nextBtnTextDisabled: {
    color: '#4a6a8a',
  },
  skipBtn: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginBottom: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#4a6a8a',
    fontWeight: '600' as const,
  },
});
