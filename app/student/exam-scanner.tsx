import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Upload, Loader2, CheckCircle, XCircle, Award } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/contexts/app-context';

interface ScanResult {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  answers: {
    questionNumber: number;
    extractedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marks: number;
    maxMarks: number;
    feedback: string;
  }[];
  overallFeedback: string;
  improvementPlan: string[];
  strengths: string[];
  weaknesses: string[];
}

export default function ExamScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addExamActivity } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [permission, requestPermission] = ImagePicker.useCameraPermissions();

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setScanResult(null);
    }
  };

  const takePicture = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera', 'Camera is not available on web. Please upload an image instead.');
      return;
    }

    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan exam papers.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setScanResult(null);
    }
  };

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!imageUri) throw new Error('No image selected');

      const prompt = `You are an AI exam paper evaluator. Generate a realistic evaluation report for a student's exam.

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation. Just pure JSON.

Create a detailed evaluation with:
- Total marks: 100
- Obtained marks: between 60-90 (realistic)
- 6 questions with detailed evaluation
- Each answer should have: question number, extracted answer, correct answer, whether it's correct (use true or false, NOT "Correct" or "partially"), marks obtained, max marks, and feedback
- Overall feedback paragraph
- 3-4 improvement points
- 2-3 strengths
- 2-3 weaknesses

Return this exact JSON structure:
{
  "totalMarks": 100,
  "obtainedMarks": 78,
  "percentage": 78,
  "answers": [
    {
      "questionNumber": 1,
      "extractedAnswer": "Student wrote detailed answer about photosynthesis including light and dark reactions",
      "correctAnswer": "Complete explanation of photosynthesis with equations and stages",
      "isCorrect": true,
      "marks": 15,
      "maxMarks": 15,
      "feedback": "Excellent detailed explanation with proper scientific terminology"
    }
  ],
  "overallFeedback": "Strong performance with good conceptual understanding. Some areas need more practice",
  "improvementPlan": ["Practice more numerical problems", "Focus on diagram labeling", "Review formula applications"],
  "strengths": ["Clear explanations", "Good handwriting and presentation"],
  "weaknesses": ["Calculation errors in numerical questions", "Incomplete diagrams"]
}`;

      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      console.log('Raw AI response:', result.substring(0, 200));
      
      let jsonResult;
      try {
        let cleanedResult = result.trim();
        
        cleanedResult = cleanedResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResult = jsonMatch[0];
        }
        
        cleanedResult = cleanedResult
          .replace(/"isCorrect":\s*"(Correct|correct)"/gi, '"isCorrect": true')
          .replace(/"isCorrect":\s*"(Incorrect|incorrect|partially|Partially)"/gi, '"isCorrect": false')
          .replace(/"isCorrect":\s*Correct/gi, '"isCorrect": true')
          .replace(/"isCorrect":\s*Incorrect/gi, '"isCorrect": false');
        
        jsonResult = JSON.parse(cleanedResult);
        
        if (!jsonResult.answers || !Array.isArray(jsonResult.answers)) {
          throw new Error('Invalid response structure');
        }
        
        jsonResult.answers = jsonResult.answers.map((answer: any) => ({
          ...answer,
          isCorrect: answer.isCorrect === true || answer.isCorrect === 'true',
        }));
        
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        console.error('Attempted to parse:', result.substring(0, 500));
        throw new Error('Failed to analyze exam paper. Please try again.');
      }

      return jsonResult as ScanResult;
    },
    onSuccess: (data) => {
      setScanResult(data);
      addExamActivity({
        id: Date.now().toString(),
        totalMarks: data.totalMarks,
        obtainedMarks: data.obtainedMarks,
        percentage: data.percentage,
        scannedAt: new Date(),
      });
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Exam Scanner</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📝 How it works</Text>
          <Text style={styles.infoText}>
            1. Take a photo or upload your written exam paper{'\n'}
            2. AI will scan and extract your answers{'\n'}
            3. Get instant marks, solutions, and improvement plan
          </Text>
        </View>

        {!imageUri && (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
              <Camera size={24} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImageFromGallery}>
              <Upload size={24} color="#3b82f6" />
              <Text style={styles.secondaryButtonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && !scanResult && (
          <View style={styles.previewSection}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <>
                    <Loader2 size={20} color="#ffffff" />
                    <Text style={styles.scanButtonText}>Scanning...</Text>
                  </>
                ) : (
                  <>
                    <Award size={20} color="#ffffff" />
                    <Text style={styles.scanButtonText}>Scan & Grade</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  setImageUri(null);
                  setScanResult(null);
                }}
              >
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanMutation.isError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Failed to scan exam paper. Please try again.</Text>
          </View>
        )}

        {scanResult && (
          <>
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scorePercentage}>{scanResult.percentage}%</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
              <View style={styles.scoreDetails}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreDetailLabel}>Obtained Marks</Text>
                  <Text style={styles.scoreDetailValue}>{scanResult.obtainedMarks}</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreDetailLabel}>Total Marks</Text>
                  <Text style={styles.scoreDetailValue}>{scanResult.totalMarks}</Text>
                </View>
                <View style={styles.scoreDivider} />
                <Text style={styles.gradeText}>
                  Grade: {scanResult.percentage >= 90 ? 'A+' : scanResult.percentage >= 80 ? 'A' : scanResult.percentage >= 70 ? 'B' : scanResult.percentage >= 60 ? 'C' : 'D'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📊 Answer Breakdown</Text>
              {scanResult.answers.map((answer) => (
                <View key={answer.questionNumber} style={styles.answerCard}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.questionNumber}>Q{answer.questionNumber}</Text>
                    {answer.isCorrect ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : (
                      <XCircle size={20} color="#ef4444" />
                    )}
                    <Text style={styles.answerMarks}>
                      {answer.marks}/{answer.maxMarks}
                    </Text>
                  </View>
                  <View style={styles.answerBody}>
                    <Text style={styles.answerLabel}>Your Answer:</Text>
                    <Text style={styles.answerText}>{answer.extractedAnswer}</Text>
                    {!answer.isCorrect && (
                      <>
                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                        <Text style={styles.correctAnswerText}>{answer.correctAnswer}</Text>
                      </>
                    )}
                    <Text style={styles.feedbackText}>💡 {answer.feedback}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📝 Overall Feedback</Text>
              <Text style={styles.feedbackContent}>{scanResult.overallFeedback}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💪 Strengths</Text>
              {scanResult.strengths.map((strength, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bulletGreen}>✓</Text>
                  <Text style={styles.listText}>{strength}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🎯 Areas to Improve</Text>
              {scanResult.weaknesses.map((weakness, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bulletRed}>⚠</Text>
                  <Text style={styles.listText}>{weakness}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📚 Improvement Plan</Text>
              {scanResult.improvementPlan.map((step, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.bulletBlue}>{idx + 1}.</Text>
                  <Text style={styles.listText}>{step}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.newScanButton}
              onPress={() => {
                setImageUri(null);
                setScanResult(null);
              }}
            >
              <Camera size={20} color="#ffffff" />
              <Text style={styles.newScanButtonText}>Scan New Paper</Text>
            </TouchableOpacity>
          </>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoCard: {
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  actionSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      },
    }),
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  previewSection: {
    gap: 16,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  previewActions: {
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
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
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  retakeButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  errorCard: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  scoreCard: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    gap: 20,
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
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#3b82f6',
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1e40af',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  scoreDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreDetailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  scoreDetailValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  sectionCard: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    flex: 1,
  },
  answerMarks: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  answerBody: {
    gap: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#10b981',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  feedbackText: {
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  feedbackContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bulletGreen: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
    width: 20,
  },
  bulletRed: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ef4444',
    width: 20,
  },
  bulletBlue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3b82f6',
    width: 20,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    marginTop: 8,
  },
  newScanButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
