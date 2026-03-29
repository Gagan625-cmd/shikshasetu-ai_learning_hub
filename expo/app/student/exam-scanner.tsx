import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, ImagePlus, X, Sparkles, Trophy, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw, FileText, Lock } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Alert, Animated, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/subscription-context';
import { useTheme } from '@/contexts/theme-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateObject } from '@/lib/ai-generate';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';

interface UploadedImage {
  uri: string;
  base64: string;
  label: 'question' | 'answer';
}

const analysisSchema = z.object({
  totalMarks: z.number(),
  obtainedMarks: z.number(),
  percentage: z.number(),
  grade: z.string(),
  overallRemarks: z.string(),
  questions: z.array(z.object({
    questionNumber: z.number(),
    questionSummary: z.string(),
    maxMarks: z.number(),
    obtainedMarks: z.number(),
    feedback: z.string(),
    isCorrect: z.boolean(),
  })),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvementTips: z.array(z.string()),
  subjectArea: z.string(),
});

type AnalysisResult = z.infer<typeof analysisSchema>;

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return '#10b981';
  if (percentage >= 75) return '#22c55e';
  if (percentage >= 60) return '#eab308';
  if (percentage >= 40) return '#f97316';
  return '#ef4444';
}

export default function ExamScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();
  const { colors, isDark } = useTheme();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(50)).current;
  const scoreScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const pickFromLibrary = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.7,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const newImages: UploadedImage[] = result.assets
          .filter(a => a.base64)
          .map(asset => ({
            uri: asset.uri,
            base64: asset.base64!,
            label: 'answer' as const,
          }));
        setImages(prev => [...prev, ...newImages]);
        console.log(`[ExamScanner] Added ${newImages.length} images from library`);
      }
    } catch (error) {
      console.error('[ExamScanner] Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const newImage: UploadedImage = {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          label: 'answer',
        };
        setImages(prev => [...prev, newImage]);
        console.log('[ExamScanner] Added photo from camera');
      }
    } catch (error) {
      console.error('[ExamScanner] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleLabel = useCallback((index: number) => {
    setImages(prev => prev.map((img, i) =>
      i === index ? { ...img, label: img.label === 'question' ? 'answer' : 'question' } : img
    ));
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (images.length === 0) throw new Error('Please upload at least one image');

      const questionImages = images.filter(i => i.label === 'question');
      const answerImages = images.filter(i => i.label === 'answer');

      const imageParts = images.map(img => ({
        type: 'image' as const,
        image: `data:image/jpeg;base64,${img.base64}`,
      }));

      const contextParts: string[] = [];
      if (questionImages.length > 0) {
        contextParts.push(`There are ${questionImages.length} question paper image(s) and ${answerImages.length} answer paper image(s).`);
      } else {
        contextParts.push(`There are ${images.length} image(s) which contain both questions and answers.`);
      }

      const prompt = `You are an expert exam evaluator and education analyst. Analyze the uploaded exam paper images carefully.

${contextParts.join(' ')}

INSTRUCTIONS:
1. Identify each question from the images
2. Evaluate the student's answers against expected correct answers
3. Assign marks for each question based on correctness, completeness, and presentation
4. Provide detailed feedback for each answer
5. Identify overall strengths and weaknesses
6. Give actionable improvement tips

Be fair but thorough in evaluation. If you cannot read a portion clearly, mention it in feedback.
For partial answers, give partial marks. Consider the board exam marking scheme (CBSE/ICSE style).

Analyze ALL visible questions and answers.`;

      const response = await robustGenerateObject({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageParts,
          ],
        }],
        schema: analysisSchema,
      });

      return response;
    },
    onSuccess: (data) => {
      console.log('[ExamScanner] Analysis complete:', JSON.stringify(data).slice(0, 200));
      setResult(data);

      resultFade.setValue(0);
      resultSlide.setValue(50);
      scoreScale.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(resultFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(resultSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]),
        Animated.spring(scoreScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();
    },
    onError: (error: Error) => {
      console.error('[ExamScanner] Analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not analyze the papers. Please ensure images are clear and try again.');
    },
  });

  const handleAnalyze = useCallback(() => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please upload or capture at least one image of your exam paper.');
      return;
    }
    analyzeMutation.mutate();
  }, [images, analyzeMutation]);

  const handleReset = useCallback(() => {
    setResult(null);
    setImages([]);
    setExpandedQuestion(null);
  }, []);

  const gradeColor = useMemo(() => result ? getGradeColor(result.percentage) : '#10b981', [result]);

  const questionCount = useMemo(() => images.filter(i => i.label === 'question').length, [images]);
  const answerCount = useMemo(() => images.filter(i => i.label === 'answer').length, [images]);

  if (!isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1a0a2e', '#2d1b4e', '#1a0a2e'] : ['#1e1040', '#3b1f7a', '#2a1260']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.premiumFull, { paddingTop: insets.top }]}
        >
          <View style={styles.premiumHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.premiumHeaderTitle}>AI Exam Scanner</Text>
            <View style={styles.backBtn} />
          </View>

          <ScrollView contentContainerStyle={[styles.premiumContent, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.lockCircle}>
              <Lock size={56} color="#fbbf24" />
            </View>
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDesc}>
              AI Exam Scanner uses advanced AI to evaluate your answers, assign marks, and provide detailed feedback.
            </Text>

            <View style={styles.premiumFeatures}>
              {[
                'Upload question & answer papers',
                'AI-powered answer evaluation',
                'Detailed marks & feedback per question',
                'Strengths & weakness analysis',
                'Personalized improvement tips',
              ].map((feat, i) => (
                <View key={i} style={styles.premiumFeatItem}>
                  <Sparkles size={16} color="#fbbf24" />
                  <Text style={styles.premiumFeatText}>{feat}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push('/paywall' as never)}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>AI Exam Scanner</Text>
            <Text style={styles.headerSub}>Scan, analyze & improve</Text>
          </View>
          {result && (
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
        {!result ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={[styles.card, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.cardIconBg}>
                  <FileText size={18} color="#ffffff" />
                </LinearGradient>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Upload Papers</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>Question paper + answer sheets</Text>
                </View>
              </View>

              <View style={styles.uploadActions}>
                <TouchableOpacity
                  style={[styles.uploadBtn, { backgroundColor: isDark ? '#132640' : '#eff6ff', borderColor: isDark ? '#1e3a5f' : '#bfdbfe' }]}
                  onPress={pickFromLibrary}
                  activeOpacity={0.7}
                  testID="pick-gallery"
                >
                  <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.uploadIconBg}>
                    <ImagePlus size={22} color="#ffffff" />
                  </LinearGradient>
                  <Text style={[styles.uploadBtnTitle, { color: colors.text }]}>Gallery</Text>
                  <Text style={[styles.uploadBtnSub, { color: colors.textTertiary }]}>Pick images</Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.uploadBtn, { backgroundColor: isDark ? '#132640' : '#f0fdf4', borderColor: isDark ? '#1e3a5f' : '#bbf7d0' }]}
                    onPress={takePhoto}
                    activeOpacity={0.7}
                    testID="take-photo"
                  >
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.uploadIconBg}>
                      <Camera size={22} color="#ffffff" />
                    </LinearGradient>
                    <Text style={[styles.uploadBtnTitle, { color: colors.text }]}>Camera</Text>
                    <Text style={[styles.uploadBtnSub, { color: colors.textTertiary }]}>Take photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {images.length > 0 && (
                <View style={styles.imageSection}>
                  <View style={styles.imageSectionHeader}>
                    <Text style={[styles.imageSectionTitle, { color: colors.text }]}>{images.length} image(s) added</Text>
                    <View style={styles.labelCounts}>
                      {questionCount > 0 && (
                        <View style={[styles.labelBadge, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                          <Text style={[styles.labelBadgeText, { color: '#8b5cf6' }]}>Q: {questionCount}</Text>
                        </View>
                      )}
                      <View style={[styles.labelBadge, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                        <Text style={[styles.labelBadgeText, { color: '#3b82f6' }]}>A: {answerCount}</Text>
                      </View>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {images.map((img, idx) => (
                      <View key={idx} style={styles.imageThumbWrap}>
                        <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                        <TouchableOpacity
                          style={styles.imageRemoveBtn}
                          onPress={() => removeImage(idx)}
                        >
                          <X size={12} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.imageLabelBtn,
                            { backgroundColor: img.label === 'question' ? '#8b5cf6' : '#3b82f6' },
                          ]}
                          onPress={() => toggleLabel(idx)}
                        >
                          <Text style={styles.imageLabelText}>
                            {img.label === 'question' ? 'Q' : 'A'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={[styles.hintRow, { backgroundColor: isDark ? 'rgba(251,191,36,0.06)' : '#fffbeb' }]}>
                    <AlertCircle size={13} color="#f59e0b" />
                    <Text style={[styles.hintText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                      Tap Q/A badge to toggle between question paper and answer sheet
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.analyzeBtn, (analyzeMutation.isPending || images.length === 0) && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={analyzeMutation.isPending || images.length === 0}
              activeOpacity={0.85}
              testID="analyze-button"
            >
              <LinearGradient
                colors={analyzeMutation.isPending ? ['#475569', '#475569'] : images.length === 0 ? ['#64748b', '#64748b'] : ['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeBtnGradient}
              >
                {analyzeMutation.isPending ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.analyzeBtnText}>Analyzing papers...</Text>
                  </View>
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.06)' : '#eff6ff', borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }]}>
              <Text style={[styles.infoTitle, { color: isDark ? '#60a5fa' : '#1e40af' }]}>How it works</Text>
              {[
                'Upload clear photos of your question paper & answer sheets',
                'Label images as Question (Q) or Answer (A) paper',
                'AI analyzes your answers against expected solutions',
                'Get marks, feedback, strengths & improvement tips',
              ].map((step, i) => (
                <View key={i} style={styles.infoStep}>
                  <View style={[styles.infoStepNum, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)' }]}>
                    <Text style={[styles.infoStepNumText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.infoStepText, { color: isDark ? '#93c5fd' : '#1e3a5f' }]}>{step}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: resultFade, transform: [{ translateY: resultSlide }] }}>
            <LinearGradient
              colors={isDark ? ['#0a1525', '#0d2240'] : ['#ffffff', '#f8fafc']}
              style={[styles.scoreCard, { borderColor: isDark ? '#1e3a5f' : '#e2e8f0' }]}
            >
              <View style={styles.scoreHeader}>
                <Trophy size={24} color={gradeColor} />
                <Text style={[styles.scoreTitle, { color: colors.text }]}>Exam Results</Text>
              </View>

              <Animated.View style={[styles.scoreCircleWrap, { transform: [{ scale: scoreScale }] }]}>
                <View style={[styles.scoreCircle, { borderColor: gradeColor }]}>
                  <Text style={[styles.scorePercent, { color: gradeColor }]}>{Math.round(result.percentage)}%</Text>
                  <Text style={[styles.scoreGrade, { color: gradeColor }]}>Grade {result.grade}</Text>
                </View>
              </Animated.View>

              <View style={styles.scoreStats}>
                <View style={[styles.scoreStat, { backgroundColor: isDark ? '#0a1525' : '#f0fdf4' }]}>
                  <Text style={[styles.scoreStatValue, { color: '#10b981' }]}>{result.obtainedMarks}</Text>
                  <Text style={[styles.scoreStatLabel, { color: colors.textTertiary }]}>Obtained</Text>
                </View>
                <View style={[styles.scoreStatDivider, { backgroundColor: isDark ? '#1e3a5f' : '#e2e8f0' }]} />
                <View style={[styles.scoreStat, { backgroundColor: isDark ? '#0a1525' : '#eff6ff' }]}>
                  <Text style={[styles.scoreStatValue, { color: '#3b82f6' }]}>{result.totalMarks}</Text>
                  <Text style={[styles.scoreStatLabel, { color: colors.textTertiary }]}>Total</Text>
                </View>
                <View style={[styles.scoreStatDivider, { backgroundColor: isDark ? '#1e3a5f' : '#e2e8f0' }]} />
                <View style={[styles.scoreStat, { backgroundColor: isDark ? '#0a1525' : '#fefce8' }]}>
                  <Text style={[styles.scoreStatValue, { color: '#eab308' }]}>{result.questions.length}</Text>
                  <Text style={[styles.scoreStatLabel, { color: colors.textTertiary }]}>Questions</Text>
                </View>
              </View>

              <Text style={[styles.overallRemarks, { color: colors.textSecondary }]}>{result.overallRemarks}</Text>

              {result.subjectArea ? (
                <View style={[styles.subjectBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)' }]}>
                  <FileText size={13} color="#3b82f6" />
                  <Text style={[styles.subjectBadgeText, { color: '#3b82f6' }]}>{result.subjectArea}</Text>
                </View>
              ) : null}
            </LinearGradient>

            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Question-wise Analysis</Text>
              {result.questions.map((q, i) => (
                <View key={i}>
                  <TouchableOpacity
                    style={[
                      styles.questionRow,
                      {
                        backgroundColor: isDark ? '#0a1525' : '#f8fafc',
                        borderColor: q.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                      },
                    ]}
                    onPress={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.questionLeft}>
                      {q.isCorrect ? (
                        <CheckCircle2 size={18} color="#10b981" />
                      ) : (
                        <XCircle size={18} color="#ef4444" />
                      )}
                      <View style={styles.questionInfo}>
                        <Text style={[styles.questionNum, { color: colors.text }]}>Q{q.questionNumber}</Text>
                        <Text style={[styles.questionSummary, { color: colors.textSecondary }]} numberOfLines={expandedQuestion === i ? undefined : 1}>
                          {q.questionSummary}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.questionRight}>
                      <Text style={[styles.questionMarks, { color: q.isCorrect ? '#10b981' : '#ef4444' }]}>
                        {q.obtainedMarks}/{q.maxMarks}
                      </Text>
                      {expandedQuestion === i ? (
                        <ChevronUp size={16} color={colors.textTertiary} />
                      ) : (
                        <ChevronDown size={16} color={colors.textTertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {expandedQuestion === i && (
                    <View style={[styles.questionDetail, { backgroundColor: isDark ? '#091420' : '#f0f7ff', borderColor: isDark ? '#152a45' : '#dbeafe' }]}>
                      <Text style={[styles.feedbackLabel, { color: colors.textTertiary }]}>Feedback</Text>
                      <Text style={[styles.feedbackText, { color: colors.text }]}>{q.feedback}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.prosConsHeader}>
                <TrendingUp size={18} color="#10b981" />
                <Text style={[styles.sectionTitle, { color: '#10b981', marginBottom: 0 }]}>Strengths</Text>
              </View>
              {result.strengths.map((s, i) => (
                <View key={i} style={styles.prosConRow}>
                  <View style={[styles.prosConDot, { backgroundColor: '#10b981' }]} />
                  <Text style={[styles.prosConText, { color: colors.text }]}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.prosConsHeader}>
                <TrendingDown size={18} color="#ef4444" />
                <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 0 }]}>Areas to Improve</Text>
              </View>
              {result.weaknesses.map((w, i) => (
                <View key={i} style={styles.prosConRow}>
                  <View style={[styles.prosConDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.prosConText, { color: colors.text }]}>{w}</Text>
                </View>
              ))}
            </View>

            <LinearGradient
              colors={isDark ? ['rgba(59,130,246,0.08)', 'rgba(139,92,246,0.08)'] : ['#eff6ff', '#f5f3ff']}
              style={[styles.tipsCard, { borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#c7d2fe' }]}
            >
              <View style={styles.prosConsHeader}>
                <Sparkles size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#60a5fa' : '#3b82f6', marginBottom: 0 }]}>Improvement Tips</Text>
              </View>
              {result.improvementTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipNum, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)' }]}>
                    <Text style={[styles.tipNumText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.tipText, { color: isDark ? '#c7d2fe' : '#1e293b' }]}>{tip}</Text>
                </View>
              ))}
            </LinearGradient>

            <TouchableOpacity
              style={styles.newScanBtn}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeBtnGradient}
              >
                <RotateCcw size={18} color="#ffffff" />
                <Text style={styles.analyzeBtnText}>Scan Another Paper</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    gap: 8,
  },
  uploadIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  uploadBtnSub: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  imageSection: {
    marginTop: 18,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  labelCounts: {
    flexDirection: 'row',
    gap: 6,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  labelBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  imageScroll: {
    marginBottom: 12,
  },
  imageThumbWrap: {
    width: 90,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageRemoveBtn: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239,68,68,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabelBtn: {
    position: 'absolute' as const,
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabelText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  analyzeBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(59,130,246,0.35)' },
    }),
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  infoStepNum: {
    width: 26,
    height: 26,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoStepNumText: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  infoStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  scoreCircleWrap: {
    marginBottom: 18,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercent: {
    fontSize: 36,
    fontWeight: '800' as const,
  },
  scoreGrade: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  scoreStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    width: '100%',
    marginBottom: 16,
  },
  scoreStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  scoreStatDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 4,
  },
  scoreStatValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  scoreStatLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  overallRemarks: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  subjectBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  questionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  questionInfo: {
    flex: 1,
  },
  questionNum: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  questionSummary: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  questionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  questionMarks: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  questionDetail: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: -4,
    borderWidth: 1,
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  prosConsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  prosConRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  prosConDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  prosConText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  tipsCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumText: {
    fontSize: 12,
    fontWeight: '800' as const,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  newScanBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 5 },
      web: { boxShadow: '0 6px 16px rgba(59,130,246,0.3)' },
    }),
  },
  premiumFull: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  premiumHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  premiumContent: {
    padding: 24,
    alignItems: 'center',
  },
  lockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251,191,36,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 15,
    color: '#d8b4fe',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  premiumFeatures: {
    width: '100%',
    gap: 10,
    marginBottom: 32,
  },
  premiumFeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    borderRadius: 12,
  },
  premiumFeatText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
  upgradeBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(251,191,36,0.4)' },
    }),
  },
  upgradeBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1a0a2e',
  },
});
