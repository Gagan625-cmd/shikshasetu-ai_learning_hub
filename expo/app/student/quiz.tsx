import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateObject } from '@/lib/ai-generate';
import { z } from 'zod';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { useStudyTimeTracker } from '@/hooks/useStudyTimeTracker';

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
      type: z.enum(['mcq', 'assertion-reasoning', 'competency']).optional(),
    })
  ),
});


export default function QuizGenerator() {
  useStudyTimeTracker('Quiz');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addQuizResult, maybeRequestReview, addXP, userProgress } = useApp();
  const { colors } = useTheme();
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [quiz, setQuiz] = useState<z.infer<typeof QuizSchema> | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const chapterInfo = selectedChapterData 
        ? `Chapter ${selectedChapterData.number}: ${selectedChapterData.title} - ${selectedChapterData.description}`
        : '';
      
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      
      const numQuestions = selectedBoard === 'ICSE' ? 20 : 10;
      const prompt = selectedBoard === 'ICSE'
        ? `Generate a challenging quiz with ${numQuestions} questions for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

Create questions in ${selectedLanguage} language following ${selectedBoard} board syllabus.

Question Distribution:
- 10 Standard MCQs (challenging, conceptual)
- 10 Competency-Based questions (application, analysis, problem-solving, real-world scenarios)

Each question should have 4 options.
correctAnswer should be the index (0-3) of the correct option.

Make questions:
1. Board-exam level difficulty
2. Test deep understanding, not just memorization
3. Include numerical problems where applicable
4. Use real-world scenarios for competency questions
5. Cover different aspects of the chapter

Provide detailed explanations showing the reasoning process.`
        : `Generate a challenging quiz with ${numQuestions} questions for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

Create questions in ${selectedLanguage} language following ${selectedBoard} board syllabus.

Question Distribution:
- 4 Standard MCQs (challenging, conceptual)
- 3 Assertion-Reasoning questions (Statement A is true/false, Statement R is true/false, and their relationship)
- 3 Competency-Based questions (application, analysis, problem-solving)

Each question should have 4 options.
correctAnswer should be the index (0-3) of the correct option.

Make questions:
1. Board-exam level difficulty
2. Test deep understanding, not just memorization
3. Include numerical problems where applicable
4. Use real-world scenarios for competency questions
5. Cover different aspects of the chapter

Provide detailed explanations showing the reasoning process.`;

      const result = await robustGenerateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: QuizSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      setQuiz(data);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setShowResults(false);
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResults && quiz) {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQuestion] = answerIndex;
      setSelectedAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    
    if (quiz && selectedChapterData) {
      const score = calculateScore();
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      const result = {
        id: Date.now().toString(),
        board: selectedBoard,
        subject: subjectName,
        chapter: selectedChapterData.title,
        grade: selectedGrade,
        score,
        totalQuestions: quiz.questions.length,
        completedAt: new Date(),
      };
      addQuizResult(result);
      addXP(1, `Quiz: ${subjectName} - ${selectedChapterData.title}`);
      void maybeRequestReview();
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const canGenerate = selectedChapter && selectedSubject;
  const currentQ = quiz?.questions[currentQuestion];
  const allAnswered = quiz && selectedAnswers.length === quiz.questions.length && selectedAnswers.every((a) => a !== undefined);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>MCQ Generator</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {!quiz && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Board</Text>
              <View style={styles.boardButtons}>
                <TouchableOpacity
                  style={[styles.boardButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
                  onPress={() => {
                    setSelectedBoard('NCERT');
                    setSelectedGrade(6);
                    setSelectedSubject('');
                    setSelectedChapter('');
                  }}
                >
                  <Text style={[styles.boardButtonText, { color: colors.textSecondary }, selectedBoard === 'NCERT' && styles.boardButtonTextActive]}>
                    NCERT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.boardButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
                  onPress={() => {
                    setSelectedBoard('ICSE');
                    setSelectedGrade(9);
                    setSelectedSubject('');
                    setSelectedChapter('');
                  }}
                >
                  <Text style={[styles.boardButtonText, { color: colors.textSecondary }, selectedBoard === 'ICSE' && styles.boardButtonTextActive]}>
                    ICSE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                {(selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10, 11, 12] : [9, 10]).map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.optionButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedGrade === grade && styles.optionButtonActive]}
                    onPress={() => {
                      setSelectedGrade(grade);
                      setSelectedSubject('');
                      setSelectedChapter('');
                    }}
                  >
                    <Text style={[styles.optionText, { color: colors.textSecondary }, selectedGrade === grade && styles.optionTextActive]}>
                      Grade {grade}
                    </Text>
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
                    style={[styles.gridButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedSubject === subject.id && styles.gridButtonActive]}
                    onPress={() => {
                      setSelectedSubject(subject.id);
                      setSelectedChapter('');
                    }}
                  >
                    <Text style={[styles.gridText, { color: colors.textSecondary }, selectedSubject === subject.id && styles.gridTextActive]}>
                      {subject.name}
                    </Text>
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
                      style={[styles.chapterButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedChapter === chapter.id && styles.chapterButtonActive]}
                      onPress={() => setSelectedChapter(chapter.id)}
                    >
                      <Text style={[styles.chapterNumber, selectedChapter === chapter.id && styles.chapterNumberActive]}>
                        {chapter.number}
                      </Text>
                      <Text
                        style={[styles.chapterTitle, selectedChapter === chapter.id && styles.chapterTitleActive]}
                        numberOfLines={2}
                      >
                        {chapter.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
              onPress={() => generateMutation.mutate()}
              disabled={!canGenerate || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 size={20} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generating Quiz...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate Quiz</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {quiz && currentQ && (
          <View style={styles.quizContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` },
                ]}
              />
            </View>

            <Text style={[styles.questionNumber, { color: colors.textSecondary }]}>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </Text>

            <View style={[styles.questionCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.questionText, { color: colors.text }]}>{currentQ.question}</Text>

              <View style={styles.optionsContainer}>
                {currentQ.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion] === index;
                  const isCorrect = index === currentQ.correctAnswer;
                  const showCorrectness = showResults;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionCard, { backgroundColor: colors.inputBg, borderColor: colors.border },
                        isSelected && !showCorrectness && styles.optionCardSelected,
                        showCorrectness && isSelected && isCorrect && styles.optionCardCorrect,
                        showCorrectness && isSelected && !isCorrect && styles.optionCardWrong,
                        showCorrectness && !isSelected && isCorrect && styles.optionCardCorrect,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showResults}
                    >
                      <View style={styles.optionContent}>
                        <Text style={[
                          styles.optionLetter,
                          { color: colors.textSecondary },
                          isSelected && !showCorrectness && { color: '#1e40af', backgroundColor: '#bfdbfe' },
                          showCorrectness && isCorrect && { color: '#065f46', backgroundColor: '#a7f3d0' },
                          showCorrectness && isSelected && !isCorrect && { color: '#991b1b', backgroundColor: '#fecaca' },
                        ]}>{String.fromCharCode(65 + index)}</Text>
                        <Text style={[
                          styles.optionText2,
                          { color: colors.text },
                          isSelected && !showCorrectness && { color: '#1e3a5f' },
                          showCorrectness && isCorrect && { color: '#065f46' },
                          showCorrectness && isSelected && !isCorrect && { color: '#991b1b' },
                        ]}>{option}</Text>
                      </View>
                      {showCorrectness && isSelected && isCorrect && (
                        <CheckCircle size={20} color="#10b981" />
                      )}
                      {showCorrectness && isSelected && !isCorrect && (
                        <XCircle size={20} color="#ef4444" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showResults && (
                <View style={styles.explanationCard}>
                  <Text style={[styles.explanationTitle, { color: colors.text }]}>Explanation:</Text>
                  <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{currentQ.explanation}</Text>
                </View>
              )}
            </View>

            <View style={styles.navigationButtons}>
              {currentQuestion > 0 && (
                <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              {currentQuestion < quiz.questions.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonPrimary, { borderColor: '#3b82f6' }]}
                  onPress={handleNext}
                >
                  <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Next</Text>
                </TouchableOpacity>
              )}

              {currentQuestion === quiz.questions.length - 1 && !showResults && allAnswered && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonSuccess]}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Submit Quiz</Text>
                </TouchableOpacity>
              )}
            </View>

            {showResults && (
              <View style={[styles.resultsCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.resultsTitle, { color: colors.text }]}>Quiz Results</Text>
                <Text style={styles.resultsScore}>
                  Score: {calculateScore()} / {quiz.questions.length}
                </Text>
                <Text style={styles.resultsPercentage}>
                  {Math.round((calculateScore() / quiz.questions.length) * 100)}%
                </Text>
                <View style={styles.xpEarnedBadge}>
                  <Text style={styles.xpEarnedText}>+1 XP Earned!</Text>
                  <Text style={styles.xpTotalText}>Total: {userProgress.totalXP} XP</Text>
                </View>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => {
                    setQuiz(null);
                    setSelectedAnswers([]);
                    setShowResults(false);
                    setCurrentQuestion(0);
                  }}
                >
                  <Text style={styles.retakeButtonText}>Generate New Quiz</Text>
                </TouchableOpacity>
              </View>
            )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
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
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chapterNumberActive: {
    color: '#10b981',
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    lineHeight: 18,
  },
  chapterTitleActive: {
    color: '#047857',
  },
  generateButton: {
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
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  quizContainer: {
    gap: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  questionCard: {
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
  questionText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionCardCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  optionCardWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  optionText2: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  explanationCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  navButtonSuccess: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  navButtonTextPrimary: {
    color: '#ffffff',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
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
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#10b981',
    marginBottom: 4,
  },
  resultsPercentage: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#10b981',
    marginBottom: 20,
  },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  xpEarnedBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  xpEarnedText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#d97706',
  },
  xpTotalText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#92400e',
    marginTop: 2,
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
});
