import { useRouter } from 'expo-router';
import { ChevronLeft, BookOpen, Atom, FlaskConical, Microscope, Calculator, Sparkles, Landmark, Cpu, BookText, Languages } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { useApp } from '@/contexts/app-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';

type SubjectType = 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'History and Civics' | 'Computer Applications' | 'English Literature' | 'English Language';

const subjectIcons: Record<SubjectType, any> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Microscope,
  Mathematics: Calculator,
  'History and Civics': Landmark,
  'Computer Applications': Cpu,
  'English Literature': BookText,
  'English Language': Languages,
};

const subjectColors: Record<SubjectType, string> = {
  Physics: '#3b82f6',
  Chemistry: '#8b5cf6',
  Biology: '#10b981',
  Mathematics: '#f59e0b',
  'History and Civics': '#ec4899',
  'Computer Applications': '#06b6d4',
  'English Literature': '#ef4444',
  'English Language': '#14b8a6',
};

export default function ICESEContentBrowser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const [selectedGrade, setSelectedGrade] = useState<number>(9);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<{ title: string; number: number; subject: string; grade: number } | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');

  const grades = [9, 10];

  const getSubjectsByType = (type: SubjectType) => {
    return ICSE_SUBJECTS.filter((s) => s.grade === selectedGrade && s.name === type);
  };

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/###? (.+)/g, '$1')
      .replace(/^- /gm, '• ')
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
      .replace(/\\gamma/g, 'γ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\omega/g, 'ω')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^\{([^}]+)\}/g, '^($1)')
      .replace(/\_\{([^}]+)\}/g, '_($1)')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\infty/g, '∞');
  };

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChapter) return '';
      
      const prompt = `Generate comprehensive and elaborate ICSE study content for Grade ${selectedChapter.grade} ${selectedChapter.subject}.
Chapter ${selectedChapter.number}: ${selectedChapter.title}

Provide detailed content in ${selectedLanguage} language with proper formatting:

IMPORTANT FORMATTING RULES:
1. Use ## for main headings (e.g., ## Key Concepts)
2. Use ### for subheadings (e.g., ### Definition)
3. Use **text** for bold/highlighting important terms and concepts
4. Use bullet points with - or • for lists
5. For tables, use proper markdown table format with clear spacing:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
   Keep table rows aligned and add blank lines before and after tables
6. Add blank lines between sections for better readability
7. Use *italics* for emphasis where needed
8. CRITICAL - For all mathematical formulas:
   - Use plain text with Unicode (×, ÷, ², ³, √, π, Δ, ≤, ≥, etc.) - NO LaTeX
   - For fractions: use (numerator)/(denominator) format
   - Example: SI = (P × R × T)/100, Area = πr², a² + b² = c²
   - For complex equations: E = mc², F = ma, V = IR

Content structure:
## Overview
Provide a brief introduction to the chapter

## Key Concepts and Definitions
- Define all important terms with **bold** highlighting
- Explain core concepts in detail

## Important Formulas and Principles
- List all relevant formulas with proper formatting
- Explain derivations and applications
- Use tables for formula comparisons if applicable

## Theories and Laws
- Detailed explanation of relevant theories
- Historical context where applicable

## Examples and Applications
- Provide 3-4 detailed examples
- Show step-by-step solutions with clear headings
- Real-world applications

## Common Misconceptions
- List common mistakes
- Explain correct understanding

## Exam Strategy and Tips
- Important points for ICSE exams
- Question pattern insights
- Time management tips

## Practice Questions
- 5-7 practice questions with varying difficulty
- Include MCQs, short answers, and long answers
- Provide detailed solutions

## Summary
- Quick recap of key points in bullet format

Make it thorough, well-formatted, exam-oriented, and aligned with ICSE syllabus requirements.`;
      
      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
    },
  });

  const handleChapterPress = (chapter: any, subjectName: string) => {
    setSelectedChapter({
      title: chapter.title,
      number: chapter.number,
      subject: subjectName,
      grade: selectedGrade,
    });
    setGeneratedContent('');
    setModalVisible(true);
  };

  const renderSubjectSection = (type: SubjectType) => {
    const subjects = getSubjectsByType(type);
    if (subjects.length === 0) return null;

    const Icon = subjectIcons[type];
    const color = subjectColors[type];

    return (
      <View key={type} style={styles.subjectSection}>
        <View style={styles.subjectSectionHeader}>
          <View style={[styles.subjectIconContainer, { backgroundColor: color + '20' }]}>
            <Icon size={28} color={color} strokeWidth={2} />
          </View>
          <Text style={[styles.subjectSectionTitle, { color }]}>{type}</Text>
        </View>

        {subjects.map((subject) => (
          <View key={subject.id} style={[styles.subjectCard, { borderLeftColor: color }]}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.chapterCount}>{subject.chapters.length} Chapters</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chaptersScrollContent}
            >
              {subject.chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={[styles.chapterCard, { borderColor: color }]}
                  activeOpacity={0.7}
                  onPress={() => handleChapterPress(chapter, subject.name)}
                >
                  <View style={[styles.chapterNumberBadge, { backgroundColor: color }]}>
                    <Text style={styles.chapterNumberBadgeText}>{chapter.number}</Text>
                  </View>
                  <Text style={styles.chapterCardTitle} numberOfLines={3}>
                    {chapter.title}
                  </Text>
                  <Text style={styles.chapterCardDescription} numberOfLines={2}>
                    {chapter.description}
                  </Text>
                  <View style={styles.generateIconContainer}>
                    <Sparkles size={14} color={color} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ICSE Content</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.gradeSelector}>
        <Text style={styles.gradeSelectorLabel}>Select Grade:</Text>
        <View style={styles.gradeButtons}>
          {grades.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[styles.gradeButton, selectedGrade === grade && styles.gradeButtonActive]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={[styles.gradeButtonText, selectedGrade === grade && styles.gradeButtonTextActive]}>
                Grade {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <BookOpen size={20} color="#059669" />
          <Text style={styles.infoBoxText}>
            ICSE Board content with AI-powered generation for thorough understanding
          </Text>
        </View>

        {renderSubjectSection('Physics')}
        {renderSubjectSection('Chemistry')}
        {renderSubjectSection('Biology')}
        {renderSubjectSection('Mathematics')}
        {renderSubjectSection('History and Civics')}
        {renderSubjectSection('Computer Applications')}
        {renderSubjectSection('English Literature')}
        {renderSubjectSection('English Language')}
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
                <View style={styles.icseBadge}>
                  <Text style={styles.icseBadgeText}>ICSE</Text>
                </View>
              </View>
            </View>

            {!generatedContent && !generateContentMutation.isPending && (
              <TouchableOpacity
                style={styles.generateContentButton}
                onPress={() => generateContentMutation.mutate()}
              >
                <Sparkles size={20} color="#ffffff" />
                <Text style={styles.generateContentButtonText}>Generate Detailed Content</Text>
              </TouchableOpacity>
            )}

            {generateContentMutation.isPending && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Generating elaborate ICSE content...</Text>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  gradeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
  },
  gradeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  gradeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  gradeButtonActive: {
    backgroundColor: '#059669',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  subjectSection: {
    marginBottom: 32,
  },
  subjectSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectSectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  chapterCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  chaptersScrollContent: {
    gap: 12,
  },
  chapterCard: {
    width: 180,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
  },
  chapterNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterNumberBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  chapterCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 20,
    minHeight: 60,
  },
  chapterCardDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    minHeight: 36,
  },
  generateIconContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  chapterInfoTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#065f46',
    marginBottom: 8,
  },
  chapterInfoSubject: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
    marginBottom: 8,
  },
  chapterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterInfoGrade: {
    fontSize: 14,
    color: '#047857',
  },
  icseBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  icseBadgeText: {
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
    backgroundColor: '#059669',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
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
