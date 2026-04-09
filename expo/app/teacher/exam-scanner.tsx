import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, ImagePlus, X, Sparkles, Trophy, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw, FileText } from 'lucide-react-native';
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
import PremiumGate from '@/components/PremiumGate';

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

export default function TeacherExamScanner() {
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

  if (!isPremium) {
    return (
      <PremiumGate
        title="AI Exam Scanner"
        description="Scan and evaluate student answer papers with AI. Get detailed marks, feedback, and improvement suggestions for each student."
        features={[
          { text: 'Upload question & answer papers' },
          { text: 'AI-powered answer evaluation' },
          { text: 'Detailed marks & feedback per question' },
          { text: 'Strengths & weakness analysis' },
          { text: 'Personalized improvement tips for students' },
        ]}
      />
    );
  }

  const pickFromLibrary = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.7,
        selectionLimit: 10,
      });

      if (!res.canceled && res.assets) {
        const newImages: UploadedImage[] = res.assets
          .filter(a => a.base64)
          .map(asset => ({ uri: asset.uri, base64: asset.base64!, label: 'answer' as const }));
        setImages(prev => [...prev, ...newImages]);
        console.log(`[TeacherExamScanner] Added ${newImages.length} images from library`);
      }
    } catch (error) {
      console.error('[TeacherExamScanner] Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
      if (!res.canceled && res.assets[0]?.base64) {
        setImages(prev => [...prev, { uri: res.assets[0].uri, base64: res.assets[0].base64!, label: 'answer' }]);
        console.log('[TeacherExamScanner] Added photo from camera');
      }
    } catch (error) {
      console.error('[TeacherExamScanner] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

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

      const prompt = `You are an expert exam evaluator helping a TEACHER grade student papers. Analyze the uploaded exam paper images carefully.

${contextParts.join(' ')}

INSTRUCTIONS:
1. Identify each question from the images
2. Evaluate the student's answers against expected correct answers
3. Assign marks for each question based on correctness, completeness, and presentation
4. Provide detailed feedback for each answer that the teacher can share with the student
5. Identify overall strengths and weaknesses
6. Give actionable improvement tips the teacher can share

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
      console.log('[TeacherExamScanner] Analysis complete:', JSON.stringify(data).slice(0, 200));
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
      console.error('[TeacherExamScanner] Analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not analyze the papers. Please ensure images are clear and try again.');
    },
  });

  const handleAnalyze = useCallback(() => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please upload or capture at least one image of the exam paper.');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0a0f1a', '#0d1f35', '#0a2840'] : ['#431407', '#7c2d12', '#9a3412']}
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
            <Text style={styles.headerSub}>Grade student papers with AI</Text>
          </View>
          {result && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={18} color="#f97316" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {!result ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={[styles.card, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.cardIconBg}>
                  <FileText size={18} color="#ffffff" />
                </LinearGradient>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Upload Student Papers</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>Question paper + answer sheets</Text>
                </View>
              </View>

              <View style={styles.uploadActions}>
                <TouchableOpacity
                  style={[styles.uploadBtn, { backgroundColor: isDark ? '#132640' : '#fff7ed', borderColor: isDark ? '#1e3a5f' : '#fed7aa' }]}
                  onPress={pickFromLibrary}
                  activeOpacity={0.7}
                  testID="pick-gallery"
                >
                  <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.uploadIconBg}>
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
                      <View style={[styles.labelBadge, { backgroundColor: 'rgba(234,88,12,0.12)' }]}>
                        <Text style={[styles.labelBadgeText, { color: '#ea580c' }]}>A: {answerCount}</Text>
                      </View>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {images.map((img, idx) => (
                      <View key={idx} style={styles.imageThumbWrap}>
                        <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                        <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(idx)}>
                          <X size={12} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.imageLabelBtn, { backgroundColor: img.label === 'question' ? '#8b5cf6' : '#ea580c' }]}
                          onPress={() => toggleLabel(idx)}
                        >
                          <Text style={styles.imageLabelText}>{img.label === 'question' ? 'Q' : 'A'}</Text>
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
                colors={analyzeMutation.isPending ? ['#475569', '#475569'] : images.length === 0 ? ['#64748b', '#64748b'] : ['#ea580c', '#c2410c']}
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

            <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(234,88,12,0.06)' : '#fff7ed', borderColor: isDark ? 'rgba(234,88,12,0.2)' : '#fed7aa' }]}>
              <Text style={[styles.infoTitle, { color: isDark ? '#fb923c' : '#9a3412' }]}>How it works</Text>
              {[
                'Upload clear photos of question paper & answer sheets',
                'Label images as Question (Q) or Answer (A) paper',
                'AI analyzes answers against expected solutions',
                'Get marks, feedback, strengths & tips to share with students',
              ].map((step, i) => (
                <View key={i} style={styles.infoStep}>
                  <View style={[styles.infoStepNum, { backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : 'rgba(234,88,12,0.1)' }]}>
                    <Text style={[styles.infoStepNumText, { color: isDark ? '#fb923c' : '#c2410c' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.infoStepText, { color: isDark ? '#fdba74' : '#431407' }]}>{step}</Text>
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
                <Text style={[styles.scoreTitle, { color: colors.text }]}>Student Results</Text>
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
                <View style={[styles.scoreStat, { backgroundColor: isDark ? '#0a1525' : '#fff7ed' }]}>
                  <Text style={[styles.scoreStatValue, { color: '#ea580c' }]}>{result.totalMarks}</Text>
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
                <View style={[styles.subjectBadge, { backgroundColor: isDark ? 'rgba(234,88,12,0.12)' : 'rgba(234,88,12,0.08)' }]}>
                  <FileText size={13} color="#ea580c" />
                  <Text style={[styles.subjectBadgeText, { color: '#ea580c' }]}>{result.subjectArea}</Text>
                </View>
              ) : null}
            </LinearGradient>

            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Question-wise Analysis</Text>
              {result.questions.map((q, i) => (
                <View key={i}>
                  <TouchableOpacity
                    style={[styles.questionRow, { backgroundColor: isDark ? '#0a1525' : '#f8fafc', borderColor: q.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }]}
                    onPress={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.questionLeft}>
                      {q.isCorrect ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                      <View style={styles.questionInfo}>
                        <Text style={[styles.questionNum, { color: colors.text }]}>Q{q.questionNumber}</Text>
                        <Text style={[styles.questionSummary, { color: colors.textSecondary }]} numberOfLines={expandedQuestion === i ? undefined : 1}>{q.questionSummary}</Text>
                      </View>
                    </View>
                    <View style={styles.questionRight}>
                      <Text style={[styles.questionMarks, { color: q.isCorrect ? '#10b981' : '#ef4444' }]}>{q.obtainedMarks}/{q.maxMarks}</Text>
                      {expandedQuestion === i ? <ChevronUp size={16} color={colors.textTertiary} /> : <ChevronDown size={16} color={colors.textTertiary} />}
                    </View>
                  </TouchableOpacity>
                  {expandedQuestion === i && (
                    <View style={[styles.questionDetail, { backgroundColor: isDark ? '#091420' : '#fff7ed', borderColor: isDark ? '#152a45' : '#fed7aa' }]}>
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
              colors={isDark ? ['rgba(234,88,12,0.08)', 'rgba(249,115,22,0.08)'] : ['#fff7ed', '#fef3c7']}
              style={[styles.tipsCard, { borderColor: isDark ? 'rgba(234,88,12,0.2)' : '#fed7aa' }]}
            >
              <View style={styles.prosConsHeader}>
                <Sparkles size={18} color={isDark ? '#fb923c' : '#ea580c'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#fb923c' : '#ea580c', marginBottom: 0 }]}>Improvement Tips</Text>
              </View>
              {result.improvementTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipNum, { backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : 'rgba(234,88,12,0.1)' }]}>
                    <Text style={[styles.tipNumText, { color: isDark ? '#fb923c' : '#c2410c' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.tipText, { color: isDark ? '#fed7aa' : '#431407' }]}>{tip}</Text>
                </View>
              ))}
            </LinearGradient>

            <TouchableOpacity style={styles.newScanBtn} onPress={handleReset} activeOpacity={0.85}>
              <LinearGradient colors={['#ea580c', '#c2410c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeBtnGradient}>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: '#ffffff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: '#fdba74', fontWeight: '500' as const, marginTop: 2 },
  resetBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.15)', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 18, gap: 16 },
  card: {
    borderRadius: 20, padding: 20, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  cardIconBg: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' as const },
  cardSubtitle: { fontSize: 12, fontWeight: '500' as const, marginTop: 2 },
  uploadActions: { flexDirection: 'row', gap: 12 },
  uploadBtn: { flex: 1, alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed' as const, gap: 8 },
  uploadIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  uploadBtnTitle: { fontSize: 14, fontWeight: '700' as const },
  uploadBtnSub: { fontSize: 11, fontWeight: '500' as const },
  imageSection: { marginTop: 18 },
  imageSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  imageSectionTitle: { fontSize: 14, fontWeight: '600' as const },
  labelCounts: { flexDirection: 'row', gap: 6 },
  labelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  labelBadgeText: { fontSize: 11, fontWeight: '700' as const },
  imageScroll: { marginBottom: 12 },
  imageThumbWrap: { width: 90, height: 120, borderRadius: 12, marginRight: 10, overflow: 'hidden', position: 'relative' as const },
  imageThumb: { width: '100%', height: '100%', borderRadius: 12 },
  imageRemoveBtn: { position: 'absolute' as const, top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(239,68,68,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageLabelBtn: { position: 'absolute' as const, bottom: 4, left: 4, width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  imageLabelText: { fontSize: 12, fontWeight: '800' as const, color: '#ffffff' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  hintText: { flex: 1, fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  analyzeBtn: {
    borderRadius: 18, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#ea580c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(234,88,12,0.35)' },
    }),
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 24 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#ffffff' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700' as const, marginBottom: 14 },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  infoStepNum: { width: 26, height: 26, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoStepNumText: { fontSize: 13, fontWeight: '800' as const },
  infoStepText: { flex: 1, fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  scoreCard: {
    borderRadius: 20, padding: 22, borderWidth: 1, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    }),
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  scoreTitle: { fontSize: 20, fontWeight: '800' as const },
  scoreCircleWrap: { marginBottom: 18 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
  scorePercent: { fontSize: 36, fontWeight: '800' as const },
  scoreGrade: { fontSize: 14, fontWeight: '700' as const, marginTop: 2 },
  scoreStats: { flexDirection: 'row', alignItems: 'center', gap: 0, width: '100%', marginBottom: 16 },
  scoreStat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  scoreStatDivider: { width: 1, height: 30, marginHorizontal: 4 },
  scoreStatValue: { fontSize: 22, fontWeight: '800' as const },
  scoreStatLabel: { fontSize: 11, fontWeight: '600' as const, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  overallRemarks: { fontSize: 14, lineHeight: 21, fontWeight: '500' as const, textAlign: 'center' },
  subjectBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 12 },
  subjectBadgeText: { fontSize: 13, fontWeight: '600' as const },
  sectionCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 14 },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  questionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  questionInfo: { flex: 1 },
  questionNum: { fontSize: 14, fontWeight: '700' as const },
  questionSummary: { fontSize: 12, fontWeight: '500' as const, marginTop: 2 },
  questionRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  questionMarks: { fontSize: 15, fontWeight: '800' as const },
  questionDetail: { padding: 14, borderRadius: 12, marginBottom: 8, marginTop: -4, borderWidth: 1 },
  feedbackLabel: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 },
  feedbackText: { fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  prosConsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  prosConRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  prosConDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  prosConText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  tipsCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipNum: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 12, fontWeight: '800' as const },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  newScanBtn: {
    borderRadius: 18, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#ea580c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 5 },
      web: { boxShadow: '0 6px 16px rgba(234,88,12,0.3)' },
    }),
  },
});
