import { useRouter } from 'expo-router';
import { ChevronLeft, Video, Sparkles, Send, Camera, Globe } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useApp } from '@/contexts/app-context';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { NCERT_SUBJECTS, LANGUAGES } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

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

export default function TeacherInterview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  const [interviewLanguage, setInterviewLanguage] = useState<string>('english');
  const [interviewTopic, setInterviewTopic] = useState<string>('subject');
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [evaluation, setEvaluation] = useState<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallScore?: number;
  }>({ strengths: [], weaknesses: [], recommendations: [] });
  const [analysisResults, setAnalysisResults] = useState<{
    expression?: string;
    voiceConfidence?: string;
    answerQuality?: string;
  }>({});

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);
  const selectedTopicData = INTERVIEW_TOPICS.find((t) => t.id === interviewTopic);

  const { messages, sendMessage } = useRorkAgent({
    tools: {
      recordExpression: createRorkTool({
        description: "Analyze facial expressions and body language from video recording",
        zodSchema: z.object({
          emotion: z.string().describe("Detected emotion (confident, nervous, focused, professional, etc.)"),
          feedback: z.string().describe("Detailed feedback on body language, expressions, and professionalism"),
          score: z.number().min(1).max(10).describe("Score out of 10 for expression and body language"),
        }),
        execute(input) {
          setAnalysisResults(prev => ({ 
            ...prev, 
            expression: `${input.emotion} (${input.score}/10): ${input.feedback}` 
          }));
          return "Expression analyzed";
        },
      }),
      analyzeVoice: createRorkTool({
        description: "Analyze voice confidence, clarity, and communication skills",
        zodSchema: z.object({
          confidence: z.enum(["high", "medium", "low"]).describe("Voice confidence level"),
          clarity: z.string().describe("Assessment of speech clarity and articulation"),
          pace: z.string().describe("Speaking pace assessment"),
          feedback: z.string().describe("Comprehensive feedback on voice quality and communication"),
          score: z.number().min(1).max(10).describe("Score out of 10 for voice confidence"),
        }),
        execute(input) {
          setAnalysisResults(prev => ({ 
            ...prev, 
            voiceConfidence: `Confidence: ${input.confidence}, Clarity: ${input.clarity}, Pace: ${input.pace} (${input.score}/10). ${input.feedback}` 
          }));
          return "Voice analyzed";
        },
      }),
      assessAnswer: createRorkTool({
        description: "Assess the quality, correctness, and depth of the answer",
        zodSchema: z.object({
          correctness: z.enum(["excellent", "good", "fair", "poor"]).describe("Answer correctness level"),
          depth: z.string().describe("Depth of understanding and knowledge shown"),
          relevance: z.string().describe("How relevant and on-topic the answer was"),
          feedback: z.string().describe("Detailed feedback on the answer quality"),
          score: z.number().min(1).max(10).describe("Score out of 10 for answer quality"),
        }),
        execute(input) {
          setAnalysisResults(prev => ({ 
            ...prev, 
            answerQuality: `${input.correctness} (${input.score}/10): ${input.depth}. Relevance: ${input.relevance}. ${input.feedback}` 
          }));
          return "Answer assessed";
        },
      }),
      provideEvaluation: createRorkTool({
        description: "Provide comprehensive evaluation with strengths, weaknesses, and recommendations",
        zodSchema: z.object({
          strengths: z.array(z.string()).describe("List of candidate's strengths demonstrated"),
          weaknesses: z.array(z.string()).describe("List of areas needing improvement"),
          recommendations: z.array(z.string()).describe("Specific recommendations for improvement"),
          overallScore: z.number().min(1).max(100).describe("Overall interview score out of 100"),
        }),
        execute(input) {
          setEvaluation({
            strengths: input.strengths,
            weaknesses: input.weaknesses,
            recommendations: input.recommendations,
            overallScore: input.overallScore,
          });
          return "Evaluation completed";
        },
      }),
    },
  });

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const requestPermissions = async () => {
    await requestCameraPermission();
    
    if (Platform.OS !== 'web') {
      const audioStatus = await Audio.requestPermissionsAsync();
      setHasAudioPermission(audioStatus.granted);
    } else {
      setHasAudioPermission(true);
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
    
    const systemPrompt = `You are an advanced AI interviewer for professional assessment in ShikshaSetu. Conduct a comprehensive interview ${contextInfo}.

Interview Language: ${languageName}
Conduct the ENTIRE interview in ${languageName} language.

Your responsibilities:
1. Ask 5-7 in-depth professional questions in ${languageName} language
2. Use the recordExpression tool after each answer to analyze facial expressions and body language
3. Use the analyzeVoice tool after each answer to assess voice confidence, clarity, and communication
4. Use the assessAnswer tool after each answer to evaluate answer quality, correctness, and depth
5. Provide immediate feedback after each answer
6. At the end, use the provideEvaluation tool to provide comprehensive feedback including:
   - Detailed strengths demonstrated during the interview
   - Areas for improvement and weaknesses
   - Specific, actionable recommendations
   - Overall score out of 100

Assessment Criteria:
- Content Knowledge & Expertise (30%)
- Communication Skills (25%)
- Confidence & Professionalism (20%)
- Problem-solving Ability (15%)
- Body Language & Presentation (10%)

Start by greeting the interviewee in ${languageName} and explaining the interview process, then ask your first question. After each answer, use all three analysis tools (recordExpression, analyzeVoice, assessAnswer) before proceeding. At the end, provide comprehensive evaluation using provideEvaluation tool.`;

    setHasStarted(true);
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
    sendMessage(systemPrompt);
  };

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { recording: newRecording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.outputFormat,
            audioEncoder: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.audioEncoder,
            sampleRate: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.sampleRate,
            numberOfChannels: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.numberOfChannels,
            bitRate: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.bitRate,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        });
        setRecording(newRecording);
      }
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (recording && Platform.OS !== 'web') {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
    }
    setIsRecording(false);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleEndInterview = async () => {
    await stopRecording();
    
    if (evaluation.strengths.length === 0) {
      sendMessage('The interview has ended. Please provide comprehensive evaluation now using the provideEvaluation tool with detailed strengths, weaknesses, recommendations, and overall score based on all answers given.');
    }
    
    setTimeout(() => {
      setHasStarted(false);
      setAnalysisResults({});
    }, 5000);
  };

  const canStart = (interviewTopic === 'subject' ? (selectedChapter && selectedSubject) : true) && 
                   cameraPermission?.granted && hasAudioPermission;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interview Assessment</Text>
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
              <Text style={styles.infoTitle}>Professional AI Interview</Text>
            </View>
            <Text style={styles.infoText}>
              Comprehensive assessment with:
              {"\n"}• Multi-language interview support
              {"\n"}• Live camera for expression analysis
              {"\n"}• Voice recording for confidence assessment
              {"\n"}• AI-generated questions on any topic
              {"\n"}• Detailed evaluation with strengths, weaknesses, and recommendations
            </Text>
          </View>

          {(!cameraPermission?.granted || !hasAudioPermission) && (
            <View style={styles.permissionWarning}>
              <Sparkles size={20} color="#ef4444" />
              <Text style={styles.permissionWarningText}>
                Camera and microphone permissions required
              </Text>
              <TouchableOpacity style={styles.grantButton} onPress={requestPermissions}>
                <Text style={styles.grantButtonText}>Grant Permissions</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.languageButton, interviewLanguage === lang.id && styles.languageButtonActive]}
                  onPress={() => setInterviewLanguage(lang.id)}
                >
                  <Globe size={16} color={interviewLanguage === lang.id ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.languageText, interviewLanguage === lang.id && styles.languageTextActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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
            <Text style={styles.sectionTitle}>Interview Topic</Text>
            <View style={styles.topicGrid}>
              {INTERVIEW_TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicButton, interviewTopic === topic.id && styles.topicButtonActive]}
                  onPress={() => setInterviewTopic(topic.id)}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[styles.topicText, interviewTopic === topic.id && styles.topicTextActive]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {interviewTopic === 'subject' && (
            <>
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
          <View style={styles.cameraContainer}>
            {Platform.OS !== 'web' ? (
              <CameraView
                style={styles.camera}
                facing="front"
              />
            ) : (
              <View style={[styles.camera, styles.cameraPlaceholder]}>
                <Camera size={48} color="#94a3b8" />
                <Text style={styles.cameraPlaceholderText}>
                  Camera preview (web mode)
                </Text>
              </View>
            )}
            
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording</Text>
              </View>
            )}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 20 }]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <View key={index} style={styles.messageWrapper}>
                <View
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
                    if (part.type === 'tool') {
                      if (part.state === 'output-available') {
                        return (
                          <View key={partIndex} style={styles.toolOutput}>
                            <Text style={styles.toolOutputLabel}>
                              {part.toolName === 'recordExpression' && '📹 Expression Analysis'}
                              {part.toolName === 'analyzeVoice' && '🎤 Voice Analysis'}
                              {part.toolName === 'assessAnswer' && '✅ Answer Assessment'}
                              {part.toolName === 'provideEvaluation' && '🎯 Final Evaluation'}
                            </Text>
                          </View>
                        );
                      }
                    }
                    return null;
                  })}
                </View>
              </View>
            ))}

            {(analysisResults.expression || analysisResults.voiceConfidence || analysisResults.answerQuality) && (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisTitle}>Real-time Analysis</Text>
                {analysisResults.expression && (
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>📹 Expression:</Text>
                    <Text style={styles.analysisValue}>{analysisResults.expression}</Text>
                  </View>
                )}
                {analysisResults.voiceConfidence && (
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>🎤 Voice:</Text>
                    <Text style={styles.analysisValue}>{analysisResults.voiceConfidence}</Text>
                  </View>
                )}
                {analysisResults.answerQuality && (
                  <View style={styles.analysisItem}>
                    <Text style={styles.analysisLabel}>✅ Answer Quality:</Text>
                    <Text style={styles.analysisValue}>{analysisResults.answerQuality}</Text>
                  </View>
                )}
              </View>
            )}

            {evaluation.strengths.length > 0 && (
              <View style={styles.evaluationCard}>
                <Text style={styles.evaluationTitle}>📊 Final Evaluation</Text>
                {evaluation.overallScore && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Overall Score:</Text>
                    <Text style={styles.scoreValue}>{evaluation.overallScore}/100</Text>
                  </View>
                )}
                
                <View style={styles.evaluationSection}>
                  <Text style={styles.evaluationSectionTitle}>💪 Strengths:</Text>
                  {evaluation.strengths.map((strength, idx) => (
                    <Text key={idx} style={styles.evaluationItem}>• {strength}</Text>
                  ))}
                </View>

                <View style={styles.evaluationSection}>
                  <Text style={styles.evaluationSectionTitle}>⚠️ Areas for Improvement:</Text>
                  {evaluation.weaknesses.map((weakness, idx) => (
                    <Text key={idx} style={styles.evaluationItem}>• {weakness}</Text>
                  ))}
                </View>

                <View style={styles.evaluationSection}>
                  <Text style={styles.evaluationSectionTitle}>💡 Recommendations:</Text>
                  {evaluation.recommendations.map((rec, idx) => (
                    <Text key={idx} style={styles.evaluationItem}>• {rec}</Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 20 }]}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndInterview}
            >
              <Text style={styles.endButtonText}>End</Text>
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
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  infoText: {
    fontSize: 15,
    color: '#92400e',
    lineHeight: 24,
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
  interviewContainer: {
    flex: 1,
  },
  cameraContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cameraPlaceholderText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 14,
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
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
  toolOutput: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  toolOutputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  analysisCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 12,
  },
  analysisItem: {
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3b82f6',
    marginBottom: 2,
  },
  analysisValue: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  evaluationCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  evaluationTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#047857',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#047857',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  evaluationSection: {
    marginBottom: 16,
  },
  evaluationSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#047857',
    marginBottom: 8,
  },
  evaluationItem: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 22,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  endButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
});
