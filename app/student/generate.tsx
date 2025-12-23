import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, FileText, BookText, ScrollText, Loader2, Download, Share2, Network, Volume2, VolumeX } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';

export default function ContentGenerator() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addContentActivity } = useApp();
  
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [contentType, setContentType] = useState<'notes' | 'summary' | 'worksheet' | 'mindmap' | 'questionpaper'>('notes');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const chapterInfo = selectedChapterData 
        ? `Chapter ${selectedChapterData.number}: ${selectedChapterData.title} - ${selectedChapterData.description}`
        : customTopic;
      
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || 'General Topic';
      
      let prompt = '';
      if (contentType === 'notes') {
        prompt = `Generate comprehensive study notes for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING RULES:
1. Use **text** for bold/highlighting important terms and key concepts
2. Use proper heading hierarchy with clear sections
3. For tables, use this format:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
4. Use bullet points with - for lists
5. Add blank lines between sections
6. CRITICAL - For mathematical formulas and equations:
   - DO NOT use LaTeX syntax like \\[ \\] or $ $
   - Use plain text with proper spacing
   - Use Unicode symbols: × (multiplication), ÷ (division), ² ³ (superscripts), ½ ¼ ¾ (fractions)
   - For fractions, write as: numerator/denominator or use ÷
   - Example: SI = (P × R × T) ÷ 100 or SI = (P × R × T)/100
   - Example: Area = πr² where r is radius
   - Example: Quadratic formula: x = (-b ± √(b² - 4ac)) ÷ 2a
   - For chemical formulas: H₂O, CO₂, etc.

Provide detailed notes in ${selectedLanguage} language with:
- Key Concepts and Definitions (with **bold** for important terms)
- Important Formulas and Principles (write clearly without LaTeX)
- Examples and Applications
- Study Tips
- Common Mistakes to Avoid`;
      } else if (contentType === 'summary') {
        prompt = `Create a comprehensive summary for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING:
- Use **bold** for key terms and concepts
- Use bullet points for main ideas
- Create comparison tables where applicable
- Organize in clear sections
- For formulas: Use plain text with Unicode symbols (×, ÷, ², ³, √, etc.) - NO LaTeX syntax
- Example: Force = mass × acceleration (F = m × a)

Provide in ${selectedLanguage} language with all essential information in concise bullet format.`;
      } else if (contentType === 'worksheet') {
        prompt = `Generate a practice worksheet for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING:
- Number all questions clearly
- Use **bold** for question numbers
- For MCQs, format as: **Q1.** Question text
  a) Option 1
  b) Option 2
  c) Option 3
  d) Option 4
- For mathematical expressions: Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX
- Example: Calculate area using A = πr² where r = 5 cm

Create 15 questions in ${selectedLanguage} language:
- 5 MCQs
- 5 Short Answer Questions
- 5 Long Answer/Problem Solving Questions
Vary difficulty levels and include application-based questions.`;
      } else if (contentType === 'questionpaper') {
        prompt = `Generate a comprehensive ICSE board format question paper for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT QUESTION PAPER FORMAT:
Create in ${selectedLanguage} language following ICSE board exam pattern.

CRITICAL - For all mathematical formulas:
- Use plain text with Unicode symbols (×, ÷, ², ³, √, π, Δ, etc.)
- NO LaTeX syntax like \\[ \\] or $ $
- Example: Area = πr², Volume = (4/3)πr³, Force = m × a

STRUCTURE:
**${selectedBoard} Board - Grade ${selectedGrade}**
**Subject: ${subjectName}**
**Time: 2 Hours | Maximum Marks: 80**

**SECTION A (20 Marks)**
Multiple Choice Questions (10 questions × 2 marks)

**SECTION B (20 Marks)**
Short Answer Questions (4 questions × 5 marks)

**SECTION C (25 Marks)**
Long Answer Questions (5 questions × 5 marks)
Attempt any THREE questions

**SECTION D (15 Marks)**
Application/Problem-Solving Questions (3 questions × 5 marks)

REQUIREMENTS:
- Follow ICSE marking scheme strictly
- Include proper question numbering
- Add internal choices where applicable
- Cover entire chapter scope
- Mix difficulty levels (Easy 30%, Medium 50%, Hard 20%)
- Include diagrams/tables where relevant (mention [Diagram Required])
- Use proper ICSE terminology and format`;
      } else {
        prompt = `Generate a colorful and comprehensive mind map for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT MIND MAP FORMAT:
Create a hierarchical, structured mind map in ${selectedLanguage} language.

CRITICAL - For formulas:
- Use plain text with Unicode symbols (×, ÷, ², ³, √) - NO LaTeX

Use this format:
🎯 **CENTRAL TOPIC: ${chapterInfo}**

📌 **Branch 1: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

📌 **Branch 2: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

📌 **Branch 3: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

IMPORTANT REQUIREMENTS:
- Use colorful emojis (🔴🔵🟢🟡🟣🔶💡⭐✨📚🎓💎) to make it vibrant
- Create 5-7 main branches
- Each branch should have 3-5 sub-points
- Keep points concise and clear
- Use **bold** for main concepts
- Make it visually organized and easy to follow
- Include key formulas, definitions, and examples where relevant`;
      }
      
      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      if (selectedChapterData) {
        const activity = {
          id: Date.now().toString(),
          board: selectedBoard,
          type: contentType as 'notes' | 'summary' | 'worksheet',
          subject: subjects.find((s) => s.id === selectedSubject)?.name || '',
          chapter: selectedChapterData.title,
          grade: selectedGrade,
          completedAt: new Date(),
        };
        addContentActivity(activity);
      }
    },
  });

  const exportToPDF = async () => {
    try {
      if (!generatedContent || generatedContent.trim().length === 0) {
        Alert.alert('Error', 'No content to export. Please generate content first.');
        return;
      }

      const chapterTitle = selectedChapterData?.title || customTopic || 'Content';
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      
      const formattedContent = generatedContent
        .replace(/\\\[(.+?)\\\]/gs, '<div class="math">$1</div>')
        .replace(/\$\$(.+?)\$\$/gs, '<div class="math">$1</div>')
        .replace(/\$(.+?)\$/g, '<span class="math-inline">$1</span>')
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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/\n- (.*?)\n/g, '<li>$1</li>\n')
        .replace(/\n• (.*?)\n/g, '<li>$1</li>\n')
        .replace(/\n\n/g, '<br/><br/>');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${chapterTitle}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 30px; line-height: 1.8; background: white; }
              h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-size: 28px; }
              h2 { color: #2563eb; margin-top: 25px; margin-bottom: 15px; font-size: 20px; }
              h3 { color: #3b82f6; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
              strong { color: #1e293b; background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
              th { background-color: #eff6ff; font-weight: bold; color: #1e40af; }
              li { margin: 8px 0 8px 20px; }
              ul { margin: 10px 0; }
              p { margin: 10px 0; }
              .header { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; }
              .meta { color: #64748b; margin-top: 10px; font-size: 14px; }
              .math { background: #f1f5f9; padding: 12px 16px; margin: 12px 0; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; overflow-x: auto; border-left: 3px solid #3b82f6; display: block; }
              .math-inline { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${chapterTitle}</h1>
              <div class="meta">
                <p><strong>Subject:</strong> ${subjectName} | <strong>Grade:</strong> ${selectedGrade} | <strong>Board:</strong> ${selectedBoard}</p>
                <p><strong>Generated by:</strong> ShikshaSetu AI | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div class="content">${formattedContent}</div>
          </body>
        </html>
      `;

      console.log('Generating PDF...');
      const result = await Print.printToFileAsync({ 
        html,
        base64: false,
      });
      
      console.log('PDF result:', result);
      
      if (!result?.uri) {
        throw new Error('PDF generation returned no URI');
      }
      
      const { uri } = result;
      
      if (Platform.OS === 'web') {
        const filename = `${contentType}_${chapterTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = uri;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Success', 'PDF downloaded successfully!');
        } else {
          Alert.alert('Success', 'PDF generated successfully!');
        }
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', `PDF saved at: ${uri}`);
        }
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      Alert.alert('Error', `Failed to export PDF: ${errorMessage}`);
    }
  };

  const contentTypes = [
    { id: 'notes' as const, label: 'Notes', icon: FileText, color: '#3b82f6' },
    { id: 'summary' as const, label: 'Summary', icon: ScrollText, color: '#10b981' },
    { id: 'worksheet' as const, label: 'Worksheet', icon: BookText, color: '#f59e0b' },
    { id: 'mindmap' as const, label: 'Mind Map', icon: Network, color: '#8b5cf6' },
    { id: 'questionpaper' as const, label: 'Question Paper', icon: FileText, color: '#ef4444' },
  ];

  const canGenerate = (selectedChapter || customTopic.trim().length > 0) && selectedSubject;

  const handleTextToSpeech = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak = cleanMarkdown(generatedContent);
      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        language: selectedLanguage === 'hindi' ? 'hi-IN' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Text-to-speech failed. Please try again.');
        },
      });
    }
  };

  const cleanMarkdown = (text: string) => {
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
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Content Generator</Text>
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
            {contentTypes.map((type) => {
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
            <Text style={styles.errorText}>Failed to generate content. Please try again.</Text>
          </View>
        )}

        {generatedContent && (
          <>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleTextToSpeech}>
                {isSpeaking ? (
                  <VolumeX size={18} color="#8b5cf6" />
                ) : (
                  <Volume2 size={18} color="#8b5cf6" />
                )}
                <Text style={styles.actionButtonText}>{isSpeaking ? 'Stop' : 'Listen'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={exportToPDF}>
                <Download size={18} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={async () => {
                  try {
                    if (Platform.OS === 'web') {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(generatedContent);
                        Alert.alert('Success', 'Content copied to clipboard!');
                      } else {
                        Alert.alert('Info', 'Please manually copy the content');
                      }
                    } else {
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) {
                        await Sharing.shareAsync(`data:text/plain;base64,${btoa(generatedContent)}`, {
                          dialogTitle: 'Share Content',
                        });
                      } else {
                        Alert.alert('Error', 'Sharing is not available on this device');
                      }
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                    Alert.alert('Info', 'Content ready to copy manually');
                  }
                }}
              >
                <Share2 size={18} color="#10b981" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Generated Content</Text>
              <Text style={styles.resultContent}>{cleanMarkdown(generatedContent)}</Text>
            </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
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
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chapterNumberActive: {
    color: '#3b82f6',
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    lineHeight: 18,
  },
  chapterTitleActive: {
    color: '#1e40af',
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  contentTypeText: {
    fontSize: 15,
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
    backgroundColor: '#8b5cf6',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
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
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  resultContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
});
