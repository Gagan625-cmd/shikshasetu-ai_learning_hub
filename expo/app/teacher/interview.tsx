import { useRouter } from 'expo-router';
import { ChevronLeft, Video, Sparkles, Send, Camera, Globe, Lock, Mic, MicOff, ChevronRight, CheckCircle, Type, Square, Clock } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync } from 'expo-audio';
import { useApp } from '@/contexts/app-context';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { NCERT_SUBJECTS, LANGUAGES } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { useSubscription } from '@/contexts/subscription-context';
import { useTheme } from '@/contexts/theme-context';
import { LinearGradient } from 'expo-linear-gradient';

const INTERVIEW_TOPICS = [
  { id: 'subject', label: 'Subject Expert', icon: '📚' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'doctor', label: 'Medical/Doctor', icon: '⚕️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'technology', label: 'Technology/IT', icon: '💻' },
  { id: 'law', label: 'Law/Legal', icon: '⚖️' },
  { id: 'management', label: 'Management', icon: '📊' },
  { id: 'teaching', label: 'Teaching/Education', icon: '👨‍🏫' },
];

const MAX_QUESTIONS = 5;

interface AnswerRecord {
  text: string;
  audioUri: string | null;
  videoUri: string | null;
  duration: number;
}

export default function TeacherInterview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useApp();
  const { isPremium } = useSubscription();
  const { colors } = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isMountedRef = useRef(true);
  const isRecordingInProgressRef = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRecordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  const [interviewLanguage, setInterviewLanguage] = useState<string>('english');
  const [interviewTopic, setInterviewTopic] = useState<string>('subject');
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [activeInputMethod, setActiveInputMethod] = useState<'text' | 'voice' | 'video'>('text');
  const [cameraReady, setCameraReady] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [evaluation, setEvaluation] = useState<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallScore?: number;
    questionScores?: { question: number; score: number; feedback: string }[];
  }>({ strengths: [], weaknesses: [], recommendations: [], questionScores: [] });

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);
  const selectedTopicData = INTERVIEW_TOPICS.find((t) => t.id === interviewTopic);

  const animateSlideRef = useRef<() => void>(() => {});

  const tools = useMemo(() => ({
    evaluateAndAskNext: createRorkTool({
      description: "Evaluate the previous answer (if any) and present the next question in one step. Use this for questions 1-5.",
      zodSchema: z.object({
        previousScore: z.number().min(0).max(10).describe("Score for previous answer (0 if first question)"),
        previousFeedback: z.string().describe("Brief feedback for previous answer (empty if first question)"),
        questionNumber: z.number().min(1).max(5).describe("Question number (1-5)"),
        question: z.string().describe("The interview question to ask"),
        category: z.string().describe("Category: Technical, Behavioral, Analytical, Conceptual, Problem-solving"),
      }),
      execute(input) {
        console.log('[Interview] Q' + input.questionNumber + ':', input.question);
        if (input.previousScore > 0 && input.questionNumber > 1) {
          setEvaluation(prev => ({
            ...prev,
            questionScores: [
              ...(prev.questionScores || []),
              { question: input.questionNumber - 1, score: input.previousScore, feedback: input.previousFeedback }
            ]
          }));
        }
        setQuestions(prev => {
          const newQuestions = [...prev];
          newQuestions[input.questionNumber - 1] = input.question;
          return newQuestions;
        });
        setCurrentQuestionIndex(input.questionNumber - 1);
        setIsAIThinking(false);
        animateSlideRef.current();
        return `Question ${input.questionNumber} presented`;
      },
    }),
    provideEvaluation: createRorkTool({
      description: "Provide final evaluation after all questions answered. Evaluate the last answer too.",
      zodSchema: z.object({
        lastAnswerScore: z.number().min(1).max(10).describe("Score for the last answer"),
        lastAnswerFeedback: z.string().describe("Feedback for the last answer"),
        strengths: z.array(z.string()).describe("3-5 candidate strengths"),
        weaknesses: z.array(z.string()).describe("2-4 areas needing improvement"),
        recommendations: z.array(z.string()).describe("3-5 specific recommendations"),
        overallScore: z.number().min(1).max(100).describe("Overall score out of 100"),
      }),
      execute(input) {
        console.log('[Interview] Final evaluation, score:', input.overallScore);
        setEvaluation(prev => ({
          ...prev,
          questionScores: [
            ...(prev.questionScores || []),
            { question: MAX_QUESTIONS, score: input.lastAnswerScore, feedback: input.lastAnswerFeedback }
          ],
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          recommendations: input.recommendations,
          overallScore: input.overallScore,
        }));
        setIsAIThinking(false);
        setIsInterviewEnded(true);
        return "Final evaluation completed";
      },
    }),
  }), []);

  const { sendMessage, setMessages } = useRorkAgent({ tools });

  useEffect(() => {
    if (isVoiceRecording || isCameraRecording) {
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setRecordingTimer(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setRecordingTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isVoiceRecording, isCameraRecording]);

  useEffect(() => {
    if (isVoiceRecording || isCameraRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isVoiceRecording, isCameraRecording, pulseAnim]);

  const animateSlide = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim]);

  animateSlideRef.current = animateSlide;

  useEffect(() => {
    isMountedRef.current = true;
    const initAudio = async () => {
      if (Platform.OS !== 'web') {
        try {
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        } catch (err) {
          console.log('Audio init error:', err);
        }
      }
    };
    void initAudio();
    return () => {
      isMountedRef.current = false;
      isRecordingInProgressRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const cleanup = async () => {
        try {
          const status = audioRecorder.getStatus();
          if (status.isRecording) await audioRecorder.stop();
        } catch (err) { console.log('Cleanup error:', err); }
      };
      void cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermissions = async () => {
    try {
      await requestCameraPermission();
      if (Platform.OS !== 'web') {
        const audioStatus = await AudioModule.requestRecordingPermissionsAsync();
        setHasAudioPermission(audioStatus.granted);
      } else {
        setHasAudioPermission(true);
      }
    } catch (err) {
      console.error('Failed to request permissions:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startVideoRecording = async () => {
    if (Platform.OS === 'web' || !cameraRef.current || !cameraReady) {
      console.log('[Interview] Cannot start video recording - camera not ready or web platform');
      setIsCameraRecording(true);
      return;
    }
    try {
      console.log('[Interview] Starting video recording...');
      setIsCameraRecording(true);
      videoRecordingPromiseRef.current = cameraRef.current.recordAsync({ maxDuration: 300 });
      console.log('[Interview] Video recording started');
    } catch (err) {
      console.error('[Interview] Failed to start video recording:', err);
      setIsCameraRecording(true);
    }
  };

  const stopVideoRecording = async (): Promise<string | null> => {
    if (Platform.OS === 'web' || !cameraRef.current) {
      setIsCameraRecording(false);
      return null;
    }
    try {
      console.log('[Interview] Stopping video recording...');
      cameraRef.current.stopRecording();
      const result = await videoRecordingPromiseRef.current;
      videoRecordingPromiseRef.current = null;
      setIsCameraRecording(false);
      if (result?.uri) {
        console.log('[Interview] Video saved:', result.uri);
        return result.uri;
      }
      return null;
    } catch (err) {
      console.error('[Interview] Failed to stop video recording:', err);
      setIsCameraRecording(false);
      return null;
    }
  };

  const startInterview = async () => {
    if (!cameraPermission?.granted || !hasAudioPermission) {
      await requestPermissions();
      return;
    }

    let contextInfo = '';
    if (interviewTopic === 'subject' && selectedChapterData) {
      const chapterInfo = `Chapter ${selectedChapterData.number}: ${selectedChapterData.title}`;
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      contextInfo = `for Grade ${selectedGrade} ${subjectName}, ${chapterInfo}`;
    } else {
      const topicLabel = selectedTopicData?.label || interviewTopic;
      contextInfo = `for ${topicLabel} position`;
    }

    const languageName = LANGUAGES.find(l => l.id === interviewLanguage)?.name || 'English';

    const systemPrompt = `You are an AI interviewer conducting a professional interview ${contextInfo}.
Language: ${languageName}. Conduct the ENTIRE interview in ${languageName}.

RULES:
1. Ask exactly 5 questions using evaluateAndAskNext tool - one at a time
2. For Q1: set previousScore=0 and previousFeedback=""
3. For Q2-Q5: evaluate the previous answer AND ask next question in ONE tool call
4. After Q5 is answered: use provideEvaluation tool (evaluate last answer + give final results)
5. Mix question types: technical, problem-solving, situational, conceptual
6. Be concise - no unnecessary text between tool calls
7. Make questions progressively challenging

Start NOW: greet briefly in ${languageName}, then IMMEDIATELY call evaluateAndAskNext for Q1.`;

    setHasStarted(true);
    setAnswers([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setIsAIThinking(true);

    if (Platform.OS !== 'web' && cameraRef.current && cameraReady) {
      void startVideoRecording();
    }

    sendMessage(systemPrompt);
  };

  const startVoiceRecording = async () => {
    if (Platform.OS === 'web') {
      console.log('Recording not available on web');
      return;
    }
    if (isRecordingInProgressRef.current) {
      console.log('Recording already in progress');
      return;
    }
    isRecordingInProgressRef.current = true;
    setIsProcessingVoice(true);
    try {
      const permissionResult = await AudioModule.getRecordingPermissionsAsync();
      if (!permissionResult.granted) {
        const newPermission = await AudioModule.requestRecordingPermissionsAsync();
        if (!newPermission.granted) {
          isRecordingInProgressRef.current = false;
          setIsProcessingVoice(false);
          return;
        }
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      if (!isMountedRef.current) {
        await audioRecorder.stop();
        isRecordingInProgressRef.current = false;
        return;
      }
      setIsVoiceRecording(true);
      console.log('[Interview] Voice recording started');
    } catch (err) {
      console.error('[Interview] Failed to start voice recording:', err);
      setIsVoiceRecording(false);
    } finally {
      if (isMountedRef.current) setIsProcessingVoice(false);
    }
  };

  const stopVoiceRecordingAndTranscribe = async (): Promise<{ uri: string | null; text: string }> => {
    const recorderStatus = audioRecorder.getStatus();
    if (!recorderStatus.isRecording) {
      setIsVoiceRecording(false);
      isRecordingInProgressRef.current = false;
      return { uri: null, text: '' };
    }
    setIsVoiceRecording(false);
    setIsTranscribing(true);
    let audioUri: string | null = null;
    let transcribedText = '';
    try {
      await audioRecorder.stop();
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch (err) { console.log('Audio mode reset error:', err); }

      audioUri = audioRecorder.uri;
      console.log('[Interview] Audio saved:', audioUri);

      if (audioUri && isMountedRef.current) {
        const uriParts = audioUri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'm4a';
        const formData = new FormData();
        const audioFile = {
          uri: audioUri,
          name: `recording.${fileType}`,
          type: fileType === 'caf' ? 'audio/x-caf' : `audio/${fileType}`,
        };
        formData.append('audio', audioFile as unknown as Blob);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.ok && isMountedRef.current) {
            const data = await response.json();
            console.log('[Interview] Transcription:', data.text);
            if (data.text) {
              transcribedText = data.text;
              setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
            }
          }
        } catch (fetchErr: unknown) {
          clearTimeout(timeoutId);
          if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
            console.error('[Interview] Transcription timed out');
          } else {
            console.error('[Interview] Transcription error:', fetchErr);
          }
        }
      }
    } catch (err) {
      console.error('[Interview] Failed to transcribe voice:', err);
    } finally {
      isRecordingInProgressRef.current = false;
      if (isMountedRef.current) setIsTranscribing(false);
    }
    return { uri: audioUri, text: transcribedText };
  };

  const handleSubmitAnswer = async () => {
    const answerText = inputText.trim();
    if (!answerText) return;

    let audioUri: string | null = null;

    if (isVoiceRecording) {
      const result = await stopVoiceRecordingAndTranscribe();
      audioUri = result.uri;
    }

    const currentAnswer: AnswerRecord = {
      text: answerText,
      audioUri,
      videoUri: null,
      duration: recordingTimer,
    };

    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = currentAnswer;
      return newAnswers;
    });

    setInputText('');
    setIsAIThinking(true);

    const mediaInfo: string[] = [];
    if (audioUri) mediaInfo.push('voice recorded');
    if (isCameraRecording) mediaInfo.push('video expression captured');
    const mediaStr = mediaInfo.length > 0 ? ` [${mediaInfo.join(', ')}]` : '';

    if (currentQuestionIndex >= MAX_QUESTIONS - 1) {
      sendMessage(`Answer for Q${currentQuestionIndex + 1}: ${answerText}${mediaStr}\n\nThis is the FINAL answer. Use provideEvaluation tool NOW.`);
    } else {
      sendMessage(`Answer for Q${currentQuestionIndex + 1}: ${answerText}${mediaStr}\n\nEvaluate and ask next question using evaluateAndAskNext tool NOW.`);
    }
  };

  const handleEndInterview = async () => {
    if (isCameraRecording) {
      await stopVideoRecording();
    }

    if (evaluation.overallScore) {
      setIsInterviewEnded(true);
      return;
    }

    setIsAIThinking(true);
    const answeredCount = answers.filter(a => a?.text).length;
    sendMessage(`Interview ended early after ${answeredCount} questions. Use provideEvaluation tool NOW with evaluation based on answers given.`);
  };

  const canStart = (interviewTopic === 'subject' ? (selectedChapter && selectedSubject) : true) &&
                   cameraPermission?.granted && hasAudioPermission;

  const currentQuestion = questions[currentQuestionIndex] || '';
  const progressPercentage = ((currentQuestionIndex + 1) / MAX_QUESTIONS) * 100;

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.premiumHeaderTitle}>Interview Assessment</Text>
          <View style={styles.backButton} />
        </View>
        <LinearGradient colors={['#7e22ce', '#9333ea']} style={styles.premiumContainer}>
          <ScrollView style={styles.content} contentContainerStyle={[styles.premiumContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.lockIconContainer}>
              <Lock size={72} color="#fbbf24" strokeWidth={2} />
            </View>
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>AI Interview Assessment is an advanced feature available exclusively for premium members.</Text>
            <View style={styles.premiumFeaturesList}>
              <View style={styles.premiumFeatureItem}>
                <Video size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Live video recording & expression analysis</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Mic size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Voice recording with AI transcription</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>AI-powered comprehensive assessment</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Globe size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Multi-language support</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall' as any)}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (isInterviewEnded && evaluation.overallScore) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Interview Results</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView style={styles.content} contentContainerStyle={[styles.resultsContainer, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Score</Text>
            <View style={[styles.scoreCircle, {
              borderColor: evaluation.overallScore >= 70 ? '#10b981' : evaluation.overallScore >= 40 ? '#f59e0b' : '#ef4444'
            }]}>
              <Text style={styles.scoreValue}>{evaluation.overallScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={[styles.scoreGrade, {
              color: evaluation.overallScore >= 80 ? '#10b981' : evaluation.overallScore >= 60 ? '#f59e0b' : evaluation.overallScore >= 40 ? '#f97316' : '#ef4444'
            }]}>
              {evaluation.overallScore >= 80 ? 'Excellent' :
               evaluation.overallScore >= 60 ? 'Good' :
               evaluation.overallScore >= 40 ? 'Fair' : 'Needs Improvement'}
            </Text>
          </View>

          {evaluation.questionScores && evaluation.questionScores.length > 0 && (
            <View style={[styles.questionScoresCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Question-wise Performance</Text>
              {evaluation.questionScores.map((qs, idx) => (
                <View key={idx} style={styles.questionScoreItem}>
                  <View style={styles.questionScoreHeader}>
                    <Text style={[styles.questionScoreNumber, { color: colors.text }]}>Q{qs.question}</Text>
                    <View style={[styles.questionScoreBadge, {
                      backgroundColor: qs.score >= 7 ? '#dcfce7' : qs.score >= 4 ? '#fef3c7' : '#fee2e2'
                    }]}>
                      <Text style={[styles.questionScoreValue, {
                        color: qs.score >= 7 ? '#166534' : qs.score >= 4 ? '#92400e' : '#991b1b'
                      }]}>{qs.score}/10</Text>
                    </View>
                  </View>
                  <Text style={styles.questionScoreFeedback}>{qs.feedback}</Text>
                  {answers[qs.question - 1] && (
                    <View style={styles.answerMediaRow}>
                      {answers[qs.question - 1]?.audioUri && (
                        <View style={styles.mediaTag}>
                          <Mic size={12} color="#6366f1" />
                          <Text style={styles.mediaTagText}>Voice Recorded</Text>
                        </View>
                      )}
                      {answers[qs.question - 1]?.videoUri && (
                        <View style={styles.mediaTag}>
                          <Video size={12} color="#10b981" />
                          <Text style={styles.mediaTagText}>Video Captured</Text>
                        </View>
                      )}
                      {answers[qs.question - 1]?.duration > 0 && (
                        <View style={styles.mediaTag}>
                          <Clock size={12} color="#f59e0b" />
                          <Text style={styles.mediaTagText}>{formatTime(answers[qs.question - 1].duration)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.evaluationSection}>
            <View style={styles.evaluationCard}>
              <Text style={styles.evaluationTitle}>💪 Strengths</Text>
              {evaluation.strengths.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.evaluationCard, styles.weaknessCard]}>
              <Text style={styles.evaluationTitle}>⚠️ Areas to Improve</Text>
              {evaluation.weaknesses.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.evaluationCard, styles.recommendationCard]}>
              <Text style={styles.evaluationTitle}>💡 Recommendations</Text>
              {evaluation.recommendations.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <ChevronRight size={16} color="#3b82f6" />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasStarted(false);
              setIsInterviewEnded(false);
              setEvaluation({ strengths: [], weaknesses: [], recommendations: [], questionScores: [] });
              setAnswers([]);
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setMessages([]);
              setIsCameraRecording(false);
              setCameraReady(false);
            }}
          >
            <Text style={styles.retryButtonText}>Start New Interview</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Interview Assessment</Text>
        <View style={styles.backButton} />
      </View>

      {!hasStarted ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Camera size={40} color="#f59e0b" />
              <Text style={styles.infoTitle}>AI Interview</Text>
            </View>
            <Text style={styles.infoText}>
              {"\n"}• 5 Questions — fast AI response
              {"\n"}• Real voice recording & transcription
              {"\n"}• Video recording of your expressions
              {"\n"}• Comprehensive AI evaluation
            </Text>
          </View>

          {(!cameraPermission?.granted || !hasAudioPermission) && (
            <View style={styles.permissionWarning}>
              <Sparkles size={20} color="#ef4444" />
              <Text style={styles.permissionWarningText}>Camera and microphone permissions required</Text>
              <TouchableOpacity style={styles.grantButton} onPress={requestPermissions}>
                <Text style={styles.grantButtonText}>Grant Permissions</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interview Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }, interviewLanguage === lang.id && styles.languageButtonActive]}
                  onPress={() => setInterviewLanguage(lang.id)}
                >
                  <Globe size={16} color={interviewLanguage === lang.id ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.languageText, interviewLanguage === lang.id && styles.languageTextActive]}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Board</Text>
            <View style={styles.boardButtons}>
              <TouchableOpacity
                style={[styles.boardButton, { backgroundColor: colors.surface, borderColor: colors.border }, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
                onPress={() => { setSelectedBoard('NCERT'); setSelectedGrade(6); setSelectedSubject(''); setSelectedChapter(''); }}
              >
                <Text style={[styles.boardButtonText, selectedBoard === 'NCERT' && styles.boardButtonTextActive]}>NCERT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.boardButton, { backgroundColor: colors.surface, borderColor: colors.border }, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
                onPress={() => { setSelectedBoard('ICSE'); setSelectedGrade(9); setSelectedSubject(''); setSelectedChapter(''); }}
              >
                <Text style={[styles.boardButtonText, selectedBoard === 'ICSE' && styles.boardButtonTextActive]}>ICSE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interview Topic</Text>
            <View style={styles.topicGrid}>
              {INTERVIEW_TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicButton, { backgroundColor: colors.surface, borderColor: colors.border }, interviewTopic === topic.id && styles.topicButtonActive]}
                  onPress={() => setInterviewTopic(topic.id)}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[styles.topicText, interviewTopic === topic.id && styles.topicTextActive]}>{topic.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {interviewTopic === 'subject' && (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  {(selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10, 11, 12] : [9, 10]).map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }, selectedGrade === grade && styles.optionButtonActive]}
                      onPress={() => { setSelectedGrade(grade); setSelectedSubject(''); setSelectedChapter(''); }}
                    >
                      <Text style={[styles.optionText, selectedGrade === grade && styles.optionTextActive]}>Grade {grade}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subject</Text>
                <View style={styles.optionGrid}>
                  {subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[styles.gridButton, { backgroundColor: colors.surface, borderColor: colors.border }, selectedSubject === subject.id && styles.gridButtonActive]}
                      onPress={() => { setSelectedSubject(subject.id); setSelectedChapter(''); }}
                    >
                      <Text style={[styles.gridText, selectedSubject === subject.id && styles.gridTextActive]}>{subject.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {selectedSubject && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Chapter</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                    {chapters.map((chapter) => (
                      <TouchableOpacity
                        key={chapter.id}
                        style={[styles.chapterButton, { backgroundColor: colors.surface, borderColor: colors.border }, selectedChapter === chapter.id && styles.chapterButtonActive]}
                        onPress={() => setSelectedChapter(chapter.id)}
                      >
                        <Text style={[styles.chapterNumber, selectedChapter === chapter.id && styles.chapterNumberActive]}>{chapter.number}</Text>
                        <Text style={[styles.chapterTitle, selectedChapter === chapter.id && styles.chapterTitleActive]} numberOfLines={2}>{chapter.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.startButton, !canStart && styles.startButtonDisabled]}
            onPress={startInterview}
            disabled={!canStart}
          >
            <Video size={20} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Interview</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.interviewContainer}>
          <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {MAX_QUESTIONS}</Text>
              {(isVoiceRecording || isCameraRecording) && (
                <View style={styles.liveTimerBadge}>
                  <Animated.View style={[styles.liveDotOuter, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.liveDot} />
                  </Animated.View>
                  <Text style={styles.liveTimerText}>{formatTime(recordingTimer)}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.endButtonSmall} onPress={handleEndInterview}>
                <Text style={styles.endButtonSmallText}>End</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.cameraSection}>
              {Platform.OS !== 'web' ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  mode="video"
                  onCameraReady={() => {
                    console.log('[Interview] Camera ready');
                    setCameraReady(true);
                  }}
                />
              ) : (
                <View style={[styles.camera, styles.cameraPlaceholder]}>
                  <Camera size={32} color="#94a3b8" />
                  <Text style={styles.cameraPlaceholderText}>Camera</Text>
                </View>
              )}
              {isCameraRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC</Text>
                </View>
              )}
            </View>

            {isAIThinking ? (
              <View style={styles.thinkingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                  {currentQuestionIndex === 0 && questions.length === 0
                    ? 'Preparing your first question...'
                    : 'Evaluating & preparing next question...'}
                </Text>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.questionSlide,
                  { backgroundColor: colors.surface },
                  {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }],
                  },
                ]}
              >
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>Question {currentQuestionIndex + 1}</Text>
                </View>
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {currentQuestion || 'Preparing your question...'}
                </Text>
              </Animated.View>
            )}

            <View style={styles.inputMethodsContainer}>
              <View style={styles.inputMethodTabs}>
                <TouchableOpacity
                  style={[styles.inputMethodTab, { backgroundColor: colors.surface, borderColor: colors.border }, activeInputMethod === 'text' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('text')}
                >
                  <Type size={16} color={activeInputMethod === 'text' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'text' && styles.inputMethodTabTextActive]}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputMethodTab, { backgroundColor: colors.surface, borderColor: colors.border }, activeInputMethod === 'voice' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('voice')}
                >
                  <Mic size={16} color={activeInputMethod === 'voice' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'voice' && styles.inputMethodTabTextActive]}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputMethodTab, { backgroundColor: colors.surface, borderColor: colors.border }, activeInputMethod === 'video' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('video')}
                >
                  <Video size={16} color={activeInputMethod === 'video' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'video' && styles.inputMethodTabTextActive]}>Video</Text>
                </TouchableOpacity>
              </View>

              {activeInputMethod === 'voice' && (
                <View style={styles.voiceInputContainer}>
                  <TouchableOpacity
                    style={[styles.voiceButton, isVoiceRecording && styles.voiceButtonActive]}
                    onPress={isVoiceRecording ? () => stopVoiceRecordingAndTranscribe() : startVoiceRecording}
                    disabled={isTranscribing || isProcessingVoice}
                  >
                    {isTranscribing ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Transcribing...</Text>
                      </>
                    ) : isProcessingVoice ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Starting...</Text>
                      </>
                    ) : isVoiceRecording ? (
                      <>
                        <Square size={20} color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Stop Recording ({formatTime(recordingTimer)})</Text>
                      </>
                    ) : (
                      <>
                        <Mic size={20} color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Start Speaking</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.voiceHint, { color: colors.textTertiary }]}>
                    {isVoiceRecording ? 'Recording your voice — tap to stop & transcribe' : 'Your speech will be converted to text'}
                  </Text>
                </View>
              )}

              {activeInputMethod === 'video' && (
                <View style={styles.videoInputContainer}>
                  <View style={[styles.videoStatusCard, { borderColor: isCameraRecording ? '#a7f3d0' : '#fde68a' }]}>
                    {isCameraRecording ? (
                      <>
                        <Video size={20} color="#10b981" />
                        <Text style={styles.videoStatusText}>Video recording active — your expressions are being captured</Text>
                      </>
                    ) : (
                      <>
                        <Camera size={20} color="#f59e0b" />
                        <Text style={[styles.videoStatusText, { color: '#92400e' }]}>Camera preview active</Text>
                      </>
                    )}
                  </View>
                  <Text style={[styles.videoHint, { color: colors.textTertiary }]}>Type or speak your answer while video records</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.answerInputContainer, { paddingBottom: insets.bottom || 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.textInputRow}>
              <TextInput
                style={[styles.answerInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[
                  styles.quickVoiceButton,
                  isVoiceRecording && styles.quickVoiceButtonActive,
                  isTranscribing && styles.quickVoiceButtonTranscribing
                ]}
                onPress={isVoiceRecording ? () => stopVoiceRecordingAndTranscribe() : startVoiceRecording}
                disabled={isTranscribing || isProcessingVoice || Platform.OS === 'web'}
                activeOpacity={0.7}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : isVoiceRecording ? (
                  <MicOff size={20} color="#ffffff" />
                ) : (
                  <Mic size={20} color={Platform.OS === 'web' ? '#cbd5e1' : '#64748b'} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, (!inputText.trim() || isAIThinking) && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!inputText.trim() || isAIThinking}
            >
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {isAIThinking ? 'Processing...' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  infoCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 22,
  },
  permissionWarning: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    gap: 12,
  },
  permissionWarningText: {
    fontSize: 14,
    color: '#b91c1c',
    fontWeight: '600' as const,
  },
  grantButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  optionScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  languageButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  languageTextActive: {
    color: '#ffffff',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  topicButtonActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  topicIcon: {
    fontSize: 20,
  },
  topicText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  topicTextActive: {
    color: '#92400e',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  gridText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  gridTextActive: {
    color: '#ffffff',
  },
  chapterButton: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chapterButtonActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chapterNumberActive: {
    color: '#f59e0b',
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    lineHeight: 18,
  },
  chapterTitleActive: {
    color: '#92400e',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' },
    }),
  },
  startButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  interviewContainer: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  liveTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDotOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveTimerText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#dc2626',
    fontVariant: ['tabular-nums'],
  },
  endButtonSmall: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  endButtonSmallText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  cameraSection: {
    width: 110,
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' },
    }),
  },
  camera: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  recordingText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  thinkingContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 20,
    padding: 32,
    marginRight: 130,
    marginBottom: 20,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  questionSlide: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginRight: 130,
    marginBottom: 20,
    minHeight: 140,
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' },
    }),
  },
  questionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1e293b',
    lineHeight: 26,
  },
  inputMethodsContainer: {
    flex: 1,
  },
  inputMethodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inputMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputMethodTabActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  inputMethodTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  inputMethodTabTextActive: {
    color: '#ffffff',
  },
  voiceInputContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    backgroundColor: '#10b981',
    ...Platform.select({
      ios: { shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
    }),
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  voiceHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
  },
  videoInputContainer: {
    paddingVertical: 8,
  },
  videoStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  videoStatusText: {
    flex: 1,
    fontSize: 13,
    color: '#047857',
    fontWeight: '500' as const,
  },
  videoHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  answerInputContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 100,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickVoiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickVoiceButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  quickVoiceButtonTranscribing: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  resultsContainer: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' },
    }),
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 6,
    borderColor: '#f59e0b',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#92400e',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#b45309',
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  questionScoresCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  questionScoreItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  questionScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionScoreNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  questionScoreBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionScoreValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questionScoreFeedback: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  answerMediaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  mediaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mediaTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#475569',
  },
  evaluationSection: {
    gap: 16,
  },
  evaluationCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  weaknessCard: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  recommendationCard: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  evaluationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginTop: 6,
  },
  evaluationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  boardButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  boardButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  boardButtonActiveNCERT: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  boardButtonActiveICSE: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  boardButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  boardButtonTextActive: {
    color: '#ffffff',
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
      ios: { shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)' },
    }),
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
