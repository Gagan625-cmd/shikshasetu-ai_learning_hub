import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, MessageCircle, Send } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';

export default function StudentInterview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [inputText, setInputText] = useState('');

  const subjects = NCERT_SUBJECTS.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);

  const { messages, sendMessage } = useRorkAgent({
    tools: {},
  });

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startInterview = () => {
    const chapterInfo = selectedChapterData 
      ? `Chapter ${selectedChapterData.number}: ${selectedChapterData.title}`
      : '';
    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
    
    const systemPrompt = `You are an educational AI interviewer for ShikshaSetu. Conduct a friendly interview to assess the student's understanding of Grade ${selectedGrade} ${subjectName}, ${chapterInfo}.

Instructions:
- Ask questions in ${selectedLanguage} language
- Start with basic concepts, then gradually increase difficulty
- Ask follow-up questions based on their answers
- Provide encouragement and constructive feedback
- Ask 5-7 questions total
- Be supportive and patient
- After the last question, provide a summary of their performance

Start by greeting the student and asking your first question.`;

    setHasStarted(true);
    sendMessage(systemPrompt);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const canStart = !!(selectedChapter && selectedSubject);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interview Practice</Text>
        <View style={styles.backButton} />
      </View>

      {!hasStarted ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <MessageCircle size={48} color="#f59e0b" />
            <Text style={styles.infoTitle}>AI-Powered Interview</Text>
            <Text style={styles.infoText}>
              Practice your knowledge with an AI interviewer. Select a topic and get personalized questions to test your understanding.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {[6, 7, 8, 9, 10].map((grade) => (
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
              <Text style={styles.sectionTitle}>Select Chapter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                {chapters.map((chapter) => (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[styles.chapterButton, selectedChapter === chapter.id && styles.chapterButtonActive]}
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
            style={[styles.startButton, !canStart && styles.startButtonDisabled]}
            onPress={startInterview}
            disabled={!canStart}
          >
            <Sparkles size={20} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Interview</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                {message.parts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return (
                      <Text
                        key={partIndex}
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userMessageText : styles.aiMessageText,
                        ]}
                      >
                        {part.text}
                      </Text>
                    );
                  }
                  return null;
                })}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 20 }]}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={20} color="#ffffff" />
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
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#92400e',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 22,
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
  startButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#f59e0b',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#1e293b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
