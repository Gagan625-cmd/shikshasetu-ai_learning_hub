import { useRouter } from 'expo-router';
import { ChevronLeft, BookOpen, GraduationCap, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { useApp } from '@/contexts/app-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';

export default function TeacherContentBrowser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<{ title: string; number: number; subject: string; grade: number } | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');

  const subjects = useMemo(
    () => NCERT_SUBJECTS.filter((s) => s.grade === selectedGrade),
    [selectedGrade]
  );
  const grades = useMemo(() => [6, 7, 8, 9, 10], []);

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/###? (.+)/g, '$1')
      .replace(/^- /gm, '• ')
      .replace(/^\| /gm, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\pi/g, 'π')
      .replace(/\\theta/g, 'θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³');
  };

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChapter) return '';
      
      const prompt = `Generate comprehensive and elaborate NCERT teaching material for Grade ${selectedChapter.grade} ${selectedChapter.subject}.
Chapter ${selectedChapter.number}: ${selectedChapter.title}

Provide detailed teaching content in ${selectedLanguage} language with proper formatting for teachers:

IMPORTANT FORMATTING RULES:
1. Use ## for main headings (e.g., ## Key Concepts)
2. Use ### for subheadings (e.g., ### Definition)
3. Use **text** for bold/highlighting important terms and concepts
4. Use bullet points with - or • for lists
5. For tables, use proper markdown table format:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
6. Add blank lines between sections for better readability
7. Use *italics* for emphasis where needed
8. CRITICAL - For all mathematical formulas:
   - Use plain text with Unicode (×, ÷, ², ³, √, π, Δ, etc.) - NO LaTeX
   - Example: SI = (P × R × T)/100, Area = πr², Force = m × a

Content structure for teachers:
## Teaching Objectives
List clear learning outcomes and objectives for this chapter

## Curriculum Overview
Brief overview of chapter content aligned with NCERT syllabus

## Key Concepts and Definitions
- Define all important terms with **bold** highlighting
- Explain core concepts in detail with teaching notes
- Provide analogies and real-world connections

## Important Formulas and Principles
- List all relevant formulas with proper formatting
- Explain derivations step by step
- Use tables for formula comparisons if applicable
- Teaching tips for formula memorization

## Theories and Laws
- Detailed explanation of relevant theories
- Historical context and discoverers
- Modern applications and relevance

## Lesson Plan Suggestions
- Recommended teaching sequence
- Time allocation for topics
- Engagement strategies
- Discussion questions for class

## Teaching Activities and Demonstrations
- Hands-on activities and experiments
- Group work suggestions
- Real-world examples to demonstrate concepts
- Visual aids recommendations

## Common Student Misconceptions
- List frequent mistakes students make
- Explain correct understanding
- Strategies to address misconceptions

## Differentiated Instruction
- Strategies for advanced learners
- Support for struggling students
- Alternative explanations and approaches

## Assessment Ideas
- Question types for this chapter
- Sample questions with solutions
- Marking schemes
- Formative assessment strategies

## Resources and References
- Recommended textbooks and materials
- Online resources and videos
- Laboratory equipment needs

## NCERT Exam Pattern
- Weightage of this chapter
- Typical question formats
- Past year question trends
- Time management advice

## Practice Questions Bank
- 10-12 varied practice questions
- Include MCQs, short answers, long answers
- Provide detailed solutions and marking points

## Quick Reference Summary
- Key points for revision in bullet format
- Formula sheet
- Important diagrams and illustrations

Make it thorough, well-formatted, teaching-oriented, and aligned with NCERT syllabus requirements.`;
      
      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
    },
  });

  const handleChapterPress = (chapter: any, subject: any) => {
    setSelectedChapter({
      title: chapter.title,
      number: chapter.number,
      subject: subject.name,
      grade: selectedGrade,
    });
    setGeneratedContent('');
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NCERT Content</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.gradeSelector}>
        <Text style={styles.gradeSelectorLabel}>Select Grade:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gradeScrollContent}
        >
          {grades.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[styles.gradeButton, selectedGrade === grade && styles.gradeButtonActive]}
              onPress={() => setSelectedGrade(grade)}
            >
              <GraduationCap
                size={20}
                color={selectedGrade === grade ? '#ffffff' : '#64748b'}
              />
              <Text
                style={[
                  styles.gradeButtonText,
                  selectedGrade === grade && styles.gradeButtonTextActive,
                ]}
              >
                Grade {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <View style={styles.subjectIconContainer}>
                <BookOpen size={24} color="#f59e0b" strokeWidth={2} />
              </View>
              <Text style={styles.subjectName}>{subject.name}</Text>
            </View>

            <View style={styles.chaptersContainer}>
              {subject.chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.chapterItem}
                  activeOpacity={0.7}
                  onPress={() => handleChapterPress(chapter, subject)}
                >
                  <View style={styles.chapterNumber}>
                    <Text style={styles.chapterNumberText}>{chapter.number}</Text>
                  </View>
                  <View style={styles.chapterContent}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterDescription} numberOfLines={2}>
                      {chapter.description}
                    </Text>
                  </View>
                  <Sparkles size={16} color="#f59e0b" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setModalVisible(false)}>
              <ChevronLeft size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedChapter?.title}
            </Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={[styles.modalContentContainer, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.chapterInfoCard}>
              <Text style={styles.chapterInfoTitle}>Chapter {selectedChapter?.number}</Text>
              <Text style={styles.chapterInfoSubject}>{selectedChapter?.subject}</Text>
              <View style={styles.chapterInfoRow}>
                <Text style={styles.chapterInfoGrade}>Grade {selectedChapter?.grade}</Text>
                <View style={styles.ncertBadge}>
                  <Text style={styles.ncertBadgeText}>NCERT</Text>
                </View>
              </View>
            </View>

            {!generatedContent && !generateContentMutation.isPending && (
              <TouchableOpacity
                style={styles.generateContentButton}
                onPress={() => generateContentMutation.mutate()}
              >
                <Sparkles size={20} color="#ffffff" />
                <Text style={styles.generateContentButtonText}>Generate Teaching Material</Text>
              </TouchableOpacity>
            )}

            {generateContentMutation.isPending && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Generating comprehensive teaching material...</Text>
              </View>
            )}

            {generateContentMutation.isError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to generate content. Please try again.</Text>
              </View>
            )}

            {generatedContent && (
              <View style={styles.contentCard}>
                <Text style={styles.contentText}>{cleanMarkdown(generatedContent)}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  gradeSelector: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  gradeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  gradeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  gradeButtonActive: {
    backgroundColor: '#f59e0b',
  },
  gradeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  gradeButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  chaptersContainer: {
    gap: 12,
  },
  chapterItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  chapterInfoCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  chapterInfoTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ea580c',
    marginBottom: 8,
  },
  chapterInfoSubject: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f59e0b',
    marginBottom: 8,
  },
  chapterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterInfoGrade: {
    fontSize: 14,
    color: '#ea580c',
  },
  ncertBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ncertBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  generateContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      },
    }),
  },
  generateContentButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748b',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  contentCard: {
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
  contentText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
});
