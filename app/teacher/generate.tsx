import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, FileText, BookText, ScrollText, Loader2, Network, Download, Share2 } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

const CONTENT_TYPES = [
  { id: 'lesson' as const, label: 'Lesson Plan', icon: BookText, color: '#3b82f6' },
  { id: 'notes' as const, label: 'Teaching Notes', icon: FileText, color: '#8b5cf6' },
  { id: 'explanation' as const, label: 'Explanation', icon: BookText, color: '#10b981' },
  { id: 'summary' as const, label: 'Summary', icon: ScrollText, color: '#f59e0b' },
  { id: 'worksheet' as const, label: 'Worksheet', icon: FileText, color: '#06b6d4' },
  { id: 'mindmap' as const, label: 'Mind Map', icon: Network, color: '#8b5cf6' },
  { id: 'questionpaper' as const, label: 'Question Paper', icon: FileText, color: '#ef4444' },
];

export default function TeacherContentGenerator() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addTeacherActivity } = useApp();
  
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [contentType, setContentType] = useState<'notes' | 'explanation' | 'summary' | 'worksheet' | 'lesson' | 'mindmap' | 'questionpaper'>('lesson');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const allSubjects = useMemo(
    () => selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS,
    [selectedBoard]
  );
  
  const subjects = useMemo(
    () => allSubjects.filter((s) => s.grade === selectedGrade),
    [allSubjects, selectedGrade]
  );
  
  const chapters = useMemo(
    () => subjects.find((s) => s.id === selectedSubject)?.chapters || [],
    [subjects, selectedSubject]
  );
  
  const selectedChapterData = useMemo(
    () => chapters.find((c) => c.id === selectedChapter),
    [chapters, selectedChapter]
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      const chapterInfo = selectedChapterData 
        ? `Chapter ${selectedChapterData.number}: ${selectedChapterData.title} - ${selectedChapterData.description}`
        : customTopic;
      
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || 'General Topic';
      
      let prompt = '';
      switch (contentType) {
        case 'lesson':
          prompt = `Generate a comprehensive lesson plan for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For all mathematical formulas:\n- Use plain text with Unicode symbols (×, ÷, ², ³, √, π, Δ, etc.)\n- NO LaTeX syntax like \\[ \\] or $ $\n- Example: Area = πr², Force = m × a\n\nCreate a structured lesson plan in ${selectedLanguage} language with: learning objectives, teaching methodology, key concepts, examples, activities, and assessment methods.`;
          break;
        case 'notes':
          prompt = `Generate comprehensive teaching notes for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX\n- Example: SI = (P × R × T)/100\n\nProvide detailed notes in ${selectedLanguage} language with key concepts, definitions, formulas, examples, and teaching tips.`;
          break;
        case 'explanation':
          prompt = `Create a detailed teaching explanation for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nExplain in ${selectedLanguage} language with simple examples, analogies, and step-by-step breakdown suitable for teaching.`;
          break;
        case 'summary':
          prompt = `Create a concise teaching summary for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nSummarize in ${selectedLanguage} language covering all important points in bullet format with teaching notes.`;
          break;
        case 'worksheet':
          prompt = `Generate practice worksheet for students studying ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n- Example: Calculate using A = πr²\n\nCreate 10 practice questions in ${selectedLanguage} language with varying difficulty levels. Include MCQs, short answers, and word problems with answer key.`;
          break;
        case 'mindmap':
          prompt = `Generate a colorful and comprehensive mind map for teaching ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT MIND MAP FORMAT:\nCreate a hierarchical, structured mind map in ${selectedLanguage} language.\n\nCRITICAL - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nUse this format:\n🎯 **CENTRAL TOPIC: ${chapterInfo}**\n\n📌 **Branch 1: [Main Concept Name]**\n  ├─ Key Point 1\n  ├─ Key Point 2\n  └─ Key Point 3\n\n📌 **Branch 2: [Main Concept Name]**\n  ├─ Key Point 1\n  ├─ Key Point 2\n  └─ Key Point 3\n\nIMPORTANT REQUIREMENTS:\n- Use colorful emojis (🔴🔵🟢🟡🟣🔶💡⭐✨📚🎓💎) to make it vibrant\n- Create 5-7 main branches\n- Each branch should have 3-5 sub-points\n- Keep points concise and clear\n- Use **bold** for main concepts\n- Make it visually organized and easy to follow\n- Include teaching tips, key formulas, and examples where relevant`;
          break;
        case 'questionpaper':
          prompt = `Generate a comprehensive ${selectedBoard} board format question paper for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT FORMAT REQUIREMENTS:\nGenerate in ${selectedLanguage} language following official ${selectedBoard} board exam format.\n\nCRITICAL - For all formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX\n\nQuestion Paper Structure:\n\n**SECTION A - Multiple Choice Questions (1 mark each)**\n1. [Question 1]\n   a) Option A\n   b) Option B\n   c) Option C\n   d) Option D\n\n**SECTION B - Very Short Answer Questions (2 marks each)**\n[5-6 questions requiring 2-3 sentence answers]\n\n**SECTION C - Short Answer Questions (3 marks each)**\n[4-5 questions requiring detailed explanations]\n\n**SECTION D - Long Answer Questions (5 marks each)**\n[3-4 questions requiring comprehensive answers with diagrams/derivations]\n\n${selectedBoard === 'ICSE' ? '**SECTION E - Application-Based Questions (6 marks each)**\n[2 questions requiring real-world application and problem-solving]\n\n' : ''}\nIMPORTANT:\n- Total marks: ${selectedBoard === 'ICSE' ? '80' : '100'}\n- Time: ${selectedBoard === 'ICSE' ? '2.5 hours' : '3 hours'}\n- Follow official ${selectedBoard} marking scheme\n- Include questions of varying difficulty\n- Cover all key concepts from the topic\n- Add instruction note at the beginning\n- Provide answer key at the end with detailed solutions`;
          break;
      }
      
      try {
        const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
        if (!result || result.trim().length === 0) {
          throw new Error('Empty response from AI');
        }
        return result;
      } catch (error) {
        console.error('Content generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      if (selectedChapterData) {
        const activity = {
          type: 'quiz' as const,
          title: `Generated ${contentType} for ${selectedChapterData.title}`,
          subject: subjects.find((s) => s.id === selectedSubject)?.name || '',
          timestamp: Date.now(),
        };
        addTeacherActivity(activity);
      }
    },
    onError: (error) => {
      console.error('Generation mutation error:', error);
      Alert.alert('Error', 'Failed to generate content. Please check your internet connection and try again.');
    },
  });



  const canGenerate = useMemo(
    () => (selectedChapter || customTopic.trim().length > 0) && selectedSubject,
    [selectedChapter, customTopic, selectedSubject]
  );

  const cleanMarkdown = useCallback((text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/###? (.+)/g, '$1')
      .replace(/^- /gm, '• ')
      .replace(/^\|(.*)$/gm, '$1')
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
      .replace(/\^3/g, '³')
      .split('\n')
      .filter(line => line.trim().length > 0 || line.includes(' '))
      .join('\n');
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const cleanedContent = cleanMarkdown(generatedContent);
      const contentTypeLabel = CONTENT_TYPES.find(t => t.id === contentType)?.label || 'Content';
      const chapterInfo = selectedChapterData 
        ? `${selectedChapterData.title}`
        : customTopic || 'Custom Topic';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
                color: #1e293b;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #f59e0b;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #f59e0b;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .header h2 {
                color: #64748b;
                margin: 0;
                font-size: 18px;
                font-weight: normal;
              }
              .content {
                white-space: pre-wrap;
                font-size: 14px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
              }
              .math { background: #f1f5f9; padding: 12px 16px; margin: 12px 0; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; overflow-x: auto; border-left: 3px solid #f59e0b; display: block; }
              .math-inline { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${contentTypeLabel}</h1>
              <h2>${chapterInfo}</h2>
            </div>
            <div class="content">${cleanedContent}</div>
            <div class="footer">
              <p>Generated by ShikshaSetu AI Co-Pilot</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
      await Print.printAsync({ uri });
      Alert.alert('Success', 'PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export content. Please try again.');
    }
  }, [generatedContent, cleanMarkdown, contentType, selectedChapterData, customTopic]);

  const handleShare = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const cleanedContent = cleanMarkdown(generatedContent);
      const contentTypeLabel = CONTENT_TYPES.find(t => t.id === contentType)?.label || 'Content';
      const chapterInfo = selectedChapterData 
        ? `${selectedChapterData.title}`
        : customTopic || 'Custom Topic';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
                color: #1e293b;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #f59e0b;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #f59e0b;
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .header h2 {
                color: #64748b;
                margin: 0;
                font-size: 18px;
                font-weight: normal;
              }
              .content {
                white-space: pre-wrap;
                font-size: 14px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
              }
              .math { background: #f1f5f9; padding: 12px 16px; margin: 12px 0; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; overflow-x: auto; border-left: 3px solid #f59e0b; display: block; }
              .math-inline { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${contentTypeLabel}</h1>
              <h2>${chapterInfo}</h2>
            </div>
            <div class="content">${cleanedContent}</div>
            <div class="footer">
              <p>Generated by ShikshaSetu AI Co-Pilot</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
    }
  }, [generatedContent, cleanMarkdown, contentType, selectedChapterData, customTopic]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Co-Pilot</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Board</Text>
          <View style={styles.boardButtons}>
            <TouchableOpacity
              style={[styles.boardButton, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
              onPress={() => {
                setSelectedBoard('NCERT');
                setSelectedGrade(6);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, selectedBoard === 'NCERT' && styles.boardButtonTextActive]}>
                NCERT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boardButton, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
              onPress={() => {
                setSelectedBoard('ICSE');
                setSelectedGrade(9);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, selectedBoard === 'ICSE' && styles.boardButtonTextActive]}>
                ICSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Grade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
            {(selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10] : [9, 10]).map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[styles.optionButton, selectedGrade === grade && styles.optionButtonActive]}
                onPress={() => {
                  setSelectedGrade(grade);
                  setSelectedSubject('');
                  setSelectedChapter('');
                }}
              >
                <Text style={[styles.optionText, selectedGrade === grade && styles.optionTextActive]}>
                  Grade {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Subject</Text>
          <View style={styles.optionGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[styles.gridButton, selectedSubject === subject.id && styles.gridButtonActive]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setSelectedChapter('');
                }}
              >
                <Text style={[styles.gridText, selectedSubject === subject.id && styles.gridTextActive]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedSubject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Chapter (or enter custom topic)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={[styles.chapterButton, selectedChapter === chapter.id && styles.chapterButtonActive]}
                  onPress={() => {
                    setSelectedChapter(chapter.id);
                    setCustomTopic('');
                  }}
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
            
            <TextInput
              style={styles.customInput}
              placeholder="Or enter custom topic..."
              placeholderTextColor="#94a3b8"
              value={customTopic}
              onChangeText={(text) => {
                setCustomTopic(text);
                setSelectedChapter('');
              }}
              multiline
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Type</Text>
          <View style={styles.contentTypeGrid}>
            {CONTENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.contentTypeButton,
                    contentType === type.id && { backgroundColor: type.color + '15', borderColor: type.color },
                  ]}
                  onPress={() => setContentType(type.id)}
                >
                  <Icon size={24} color={contentType === type.id ? type.color : '#64748b'} />
                  <Text
                    style={[
                      styles.contentTypeText,
                      contentType === type.id && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
          onPress={() => generateMutation.mutate()}
          disabled={!canGenerate || generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Sparkles size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Content</Text>
            </>
          )}
        </TouchableOpacity>

        {generateMutation.isError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Failed to generate content. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => generateMutation.mutate()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {generatedContent && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Generated Content</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
                  <Download size={18} color="#f59e0b" />
                  <Text style={styles.actionButtonText}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Share2 size={18} color="#10b981" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.resultContent}>{cleanMarkdown(generatedContent)}</Text>
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
    backgroundColor: '#fff7ed',
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
  customInput: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contentTypeButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  contentTypeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
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
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  errorCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  resultCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  resultContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
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
