import { useRouter } from 'expo-router';
import { ChevronLeft, Video, Sparkles, Send, Camera, Globe, Lock, Mic, MicOff, ChevronRight, CheckCircle, Type } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useApp } from '@/contexts/app-context';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { NCERT_SUBJECTS, LANGUAGES } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { useSubscription } from '@/contexts/subscription-context';
import { LinearGradient } from 'expo-linear-gradient';



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

const MAX_QUESTIONS = 5;

export default function TeacherInterview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useApp();
  const { isPremium } = useSubscription();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const voiceRecordingRef = useRef<Audio.Recording | null>(null);
  const isMountedRef = useRef(true);
  
  const [interviewLanguage, setInterviewLanguage] = useState<string>('english');
  const [interviewTopic, setInterviewTopic] = useState<string>('subject');
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ text: string; voice: string; hasVideo: boolean }[]>([]);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [activeInputMethod, setActiveInputMethod] = useState<'text' | 'voice' | 'video'>('text');
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const [evaluation, setEvaluation] = useState<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallScore?: number;
    questionScores?: { question: number; score: number; feedback: string }[];
  }>({ strengths: [], weaknesses: [], recommendations: [], questionScores: [] });

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);
  const selectedTopicData = INTERVIEW_TOPICS.find((t) => t.id === interviewTopic);

  const animateSlideRef = useRef<() => void>(() => {});

  const tools = useMemo(() => ({
    askQuestion: createRorkTool({
      description: "Present the next interview question to the candidate",
      zodSchema: z.object({
        questionNumber: z.number().min(1).max(5).describe("Question number (1-5)"),
        question: z.string().describe("The interview question to ask"),
        category: z.string().describe("Category of the question (e.g., Technical, Behavioral, Analytical)"),
      }),
      execute(input) {
        console.log('New question received:', input.questionNumber, input.question);
        setQuestions(prev => {
          const newQuestions = [...prev];
          newQuestions[input.questionNumber - 1] = input.question;
          return newQuestions;
        });
        setCurrentQuestionIndex(input.questionNumber - 1);
        animateSlideRef.current();
        return `Question ${input.questionNumber} presented: ${input.question}`;
      },
    }),
    evaluateAnswer: createRorkTool({
      description: "Evaluate a single answer with score and feedback",
      zodSchema: z.object({
        questionNumber: z.number().min(1).max(5).describe("Question number being evaluated"),
        score: z.number().min(1).max(10).describe("Score out of 10"),
        feedback: z.string().describe("Brief feedback on the answer"),
      }),
      execute(input) {
        setEvaluation(prev => ({
          ...prev,
          questionScores: [
            ...(prev.questionScores || []),
            { question: input.questionNumber, score: input.score, feedback: input.feedback }
          ]
        }));
        return `Answer ${input.questionNumber} evaluated`;
      },
    }),
    provideEvaluation: createRorkTool({
      description: "Provide comprehensive final evaluation after all questions",
      zodSchema: z.object({
        strengths: z.array(z.string()).describe("List of candidate's strengths"),
        weaknesses: z.array(z.string()).describe("List of areas needing improvement"),
        recommendations: z.array(z.string()).describe("Specific recommendations"),
        overallScore: z.number().min(1).max(100).describe("Overall score out of 100"),
      }),
      execute(input) {
        setEvaluation(prev => ({
          ...prev,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          recommendations: input.recommendations,
          overallScore: input.overallScore,
        }));
        setIsInterviewEnded(true);
        return "Final evaluation completed";
      },
    }),
  }), []);

  const { sendMessage, setMessages } = useRorkAgent({ tools });

  const animateSlide = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim]);

  animateSlideRef.current = animateSlide;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (voiceRecordingRef.current) {
        voiceRecordingRef.current.stopAndUnloadAsync().catch(console.error);
        voiceRecordingRef.current = null;
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      await requestCameraPermission();
      
      if (Platform.OS !== 'web') {
        const audioStatus = await Audio.requestPermissionsAsync();
        setHasAudioPermission(audioStatus.granted);
      } else {
        setHasAudioPermission(true);
      }
    } catch (err) {
      console.error('Failed to request permissions:', err);
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
    
    const systemPrompt = `You are an AI interviewer for ShikshaSetu conducting a professional interview ${contextInfo}.

Interview Language: ${languageName}
Conduct the ENTIRE interview in ${languageName} language.

IMPORTANT INSTRUCTIONS:
1. You will ask exactly 5 questions, one at a time
2. Use the askQuestion tool to present each question - this will display it as a slide
3. After the candidate answers (via text, voice, or video), evaluate using evaluateAnswer tool
4. Then immediately ask the next question using askQuestion tool
5. After question 5 is answered, provide final evaluation using provideEvaluation tool

Question Format:
- Mix question types: technical knowledge, problem-solving, situational, conceptual
- Make questions progressively challenging
- Keep questions clear and concise

Start now by greeting briefly in ${languageName} and then immediately use askQuestion tool to ask Question 1.`;

    setHasStarted(true);
    setAnswers([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setIsRecording(true);
    
    sendMessage(systemPrompt);
  };

  const stopVideoRecording = async () => {
    setIsRecording(false);
  };

  const startVoiceRecording = async () => {
    if (voiceRecordingRef.current || Platform.OS === 'web') {
      console.log('Recording not available or already active');
      return;
    }
    
    try {
      console.log('Starting voice recording...');
      setIsVoiceRecording(true);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      voiceRecordingRef.current = newRecording;
      console.log('Voice recording started successfully');
    } catch (err) {
      console.error('Failed to start voice recording:', err);
      setIsVoiceRecording(false);
    }
  };

  const stopVoiceRecordingAndTranscribe = async () => {
    if (!voiceRecordingRef.current) {
      setIsVoiceRecording(false);
      return;
    }

    setIsVoiceRecording(false);
    setIsTranscribing(true);
    
    try {
      console.log('Stopping voice recording...');
      const recordingToStop = voiceRecordingRef.current;
      voiceRecordingRef.current = null;
      
      await recordingToStop.stopAndUnloadAsync();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      const uri = recordingToStop.getURI();
      console.log('Recording URI:', uri);
      
      if (uri && isMountedRef.current) {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'm4a';
        
        const formData = new FormData();
        const audioFile = {
          uri,
          name: `recording.${fileType}`,
          type: fileType === 'caf' ? 'audio/x-caf' : `audio/${fileType}`,
        };
        formData.append('audio', audioFile as unknown as Blob);
        
        console.log('Sending audio for transcription...');
        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok && isMountedRef.current) {
          const data = await response.json();
          console.log('Transcription result:', data);
          if (data.text) {
            setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
          }
        } else {
          console.error('Transcription failed:', response.status);
        }
      }
    } catch (err) {
      console.error('Failed to transcribe voice:', err);
    } finally {
      if (isMountedRef.current) {
        setIsTranscribing(false);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    const currentAnswer = {
      text: inputText.trim(),
      voice: '',
      hasVideo: isRecording,
    };
    
    if (!currentAnswer.text) {
      return;
    }
    
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = currentAnswer;
      return newAnswers;
    });
    
    const answerMessage = `Answer for Question ${currentQuestionIndex + 1}: ${currentAnswer.text}${currentAnswer.hasVideo ? ' (with video expression recorded)' : ''}`;
    
    setInputText('');
    
    if (currentQuestionIndex >= MAX_QUESTIONS - 1) {
      sendMessage(`${answerMessage}\n\nThis was the final answer. Please evaluate this answer using evaluateAnswer tool, then provide the comprehensive final evaluation using provideEvaluation tool with overall score, strengths, weaknesses, and recommendations.`);
    } else {
      sendMessage(`${answerMessage}\n\nPlease evaluate this answer briefly using evaluateAnswer tool, then immediately ask the next question (Question ${currentQuestionIndex + 2}) using askQuestion tool.`);
    }
  };

  const handleEndInterview = async () => {
    await stopVideoRecording();
    
    if (evaluation.overallScore) {
      setIsInterviewEnded(true);
      return;
    }
    
    const answeredCount = answers.filter(a => a?.text).length;
    sendMessage(`Interview ended early after ${answeredCount} questions. Please provide comprehensive final evaluation using provideEvaluation tool based on the answers given so far. Include overall score, strengths, weaknesses, and recommendations.`);
  };

  const canStart = (interviewTopic === 'subject' ? (selectedChapter && selectedSubject) : true) && 
                   cameraPermission?.granted && hasAudioPermission;

  const currentQuestion = questions[currentQuestionIndex] || '';
  const progressPercentage = ((currentQuestionIndex + 1) / MAX_QUESTIONS) * 100;

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.premiumHeaderTitle}>Interview Assessment</Text>
          <View style={styles.backButton} />
        </View>
        
        <LinearGradient colors={['#7e22ce', '#9333ea']} style={styles.premiumContainer}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.premiumContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.lockIconContainer}>
              <Lock size={72} color="#fbbf24" strokeWidth={2} />
            </View>
            
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>
              AI Interview Assessment is an advanced feature available exclusively for premium members.
            </Text>

            <View style={styles.premiumFeaturesList}>
              <View style={styles.premiumFeatureItem}>
                <Video size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Live video expression analysis</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>AI-powered voice assessment</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Camera size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Body language evaluation</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Globe size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Multi-language support</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (isInterviewEnded && evaluation.overallScore) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interview Results</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.resultsContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{evaluation.overallScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreGrade}>
              {evaluation.overallScore >= 80 ? 'Excellent' : 
               evaluation.overallScore >= 60 ? 'Good' : 
               evaluation.overallScore >= 40 ? 'Fair' : 'Needs Improvement'}
            </Text>
          </View>

          {evaluation.questionScores && evaluation.questionScores.length > 0 && (
            <View style={styles.questionScoresCard}>
              <Text style={styles.sectionTitle}>Question-wise Performance</Text>
              {evaluation.questionScores.map((qs, idx) => (
                <View key={idx} style={styles.questionScoreItem}>
                  <View style={styles.questionScoreHeader}>
                    <Text style={styles.questionScoreNumber}>Q{qs.question}</Text>
                    <View style={styles.questionScoreBadge}>
                      <Text style={styles.questionScoreValue}>{qs.score}/10</Text>
                    </View>
                  </View>
                  <Text style={styles.questionScoreFeedback}>{qs.feedback}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.evaluationSection}>
            <View style={styles.evaluationCard}>
              <Text style={styles.evaluationTitle}>💪 Strengths</Text>
              {evaluation.strengths.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.evaluationCard, styles.weaknessCard]}>
              <Text style={styles.evaluationTitle}>⚠️ Areas to Improve</Text>
              {evaluation.weaknesses.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.evaluationCard, styles.recommendationCard]}>
              <Text style={styles.evaluationTitle}>💡 Recommendations</Text>
              {evaluation.recommendations.map((item, idx) => (
                <View key={idx} style={styles.evaluationItem}>
                  <ChevronRight size={16} color="#3b82f6" />
                  <Text style={styles.evaluationText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasStarted(false);
              setIsInterviewEnded(false);
              setEvaluation({ strengths: [], weaknesses: [], recommendations: [], questionScores: [] });
              setAnswers([]);
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setMessages([]);
            }}
          >
            <Text style={styles.retryButtonText}>Start New Interview</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

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
              <Text style={styles.infoTitle}>AI Interview</Text>
            </View>
            <Text style={styles.infoText}>
              {"\n"}• 5 Questions presented as slides
              {"\n"}• Answer via Text, Voice, or Video
              {"\n"}• Real-time expression analysis
              {"\n"}• Comprehensive AI evaluation
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
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {MAX_QUESTIONS}</Text>
              <TouchableOpacity style={styles.endButtonSmall} onPress={handleEndInterview}>
                <Text style={styles.endButtonSmallText}>End Interview</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.cameraSection}>
              {Platform.OS !== 'web' ? (
                <CameraView style={styles.camera} facing="front" />
              ) : (
                <View style={[styles.camera, styles.cameraPlaceholder]}>
                  <Camera size={32} color="#94a3b8" />
                  <Text style={styles.cameraPlaceholderText}>Camera</Text>
                </View>
              )}
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC</Text>
                </View>
              )}
            </View>

            <Animated.View 
              style={[
                styles.questionSlide,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 50],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>Question {currentQuestionIndex + 1}</Text>
              </View>
              <Text style={styles.questionText}>
                {currentQuestion || 'Preparing your question...'}
              </Text>
            </Animated.View>

            <View style={styles.inputMethodsContainer}>
              <Text style={styles.inputMethodsTitle}>Answer using:</Text>
              <View style={styles.inputMethodTabs}>
                <TouchableOpacity
                  style={[styles.inputMethodTab, activeInputMethod === 'text' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('text')}
                >
                  <Type size={18} color={activeInputMethod === 'text' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'text' && styles.inputMethodTabTextActive]}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputMethodTab, activeInputMethod === 'voice' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('voice')}
                >
                  <Mic size={18} color={activeInputMethod === 'voice' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'voice' && styles.inputMethodTabTextActive]}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputMethodTab, activeInputMethod === 'video' && styles.inputMethodTabActive]}
                  onPress={() => setActiveInputMethod('video')}
                >
                  <Video size={18} color={activeInputMethod === 'video' ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.inputMethodTabText, activeInputMethod === 'video' && styles.inputMethodTabTextActive]}>Video</Text>
                </TouchableOpacity>
              </View>

              {activeInputMethod === 'voice' && (
                <View style={styles.voiceInputContainer}>
                  <TouchableOpacity
                    style={[styles.voiceButton, isVoiceRecording && styles.voiceButtonActive]}
                    onPress={isVoiceRecording ? stopVoiceRecordingAndTranscribe : startVoiceRecording}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <Text style={styles.voiceButtonText}>Transcribing...</Text>
                    ) : isVoiceRecording ? (
                      <>
                        <MicOff size={24} color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Stop & Transcribe</Text>
                      </>
                    ) : (
                      <>
                        <Mic size={24} color="#ffffff" />
                        <Text style={styles.voiceButtonText}>Start Speaking</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.voiceHint}>Your speech will be converted to text</Text>
                </View>
              )}

              {activeInputMethod === 'video' && (
                <View style={styles.videoInputContainer}>
                  <View style={styles.videoStatusCard}>
                    <Video size={24} color="#10b981" />
                    <Text style={styles.videoStatusText}>
                      {isRecording ? 'Video recording active - Your expressions are being captured' : 'Video paused'}
                    </Text>
                  </View>
                  <Text style={styles.videoHint}>Type or speak your answer while video records your expressions</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.answerInputContainer, { paddingBottom: insets.bottom || 16 }]}>
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.answerInput}
                placeholder="Type your answer here..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[
                  styles.quickVoiceButton,
                  isVoiceRecording && styles.quickVoiceButtonActive,
                  isTranscribing && styles.quickVoiceButtonTranscribing
                ]}
                onPress={isVoiceRecording ? stopVoiceRecordingAndTranscribe : startVoiceRecording}
                disabled={isTranscribing || Platform.OS === 'web'}
                activeOpacity={0.7}
              >
                {isTranscribing ? (
                  <View style={styles.smallSpinner} />
                ) : isVoiceRecording ? (
                  <MicOff size={20} color="#ffffff" />
                ) : (
                  <Mic size={20} color={Platform.OS === 'web' ? '#cbd5e1' : '#64748b'} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, !inputText.trim() && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!inputText.trim()}
            >
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Answer</Text>
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
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 22,
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  endButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  endButtonSmallText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  cameraSection: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  camera: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  recordingText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  questionSlide: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginRight: 140,
    marginBottom: 20,
    minHeight: 180,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  questionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1e293b',
    lineHeight: 28,
  },
  inputMethodsContainer: {
    flex: 1,
  },
  inputMethodsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
  },
  inputMethodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  inputMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputMethodTabActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  inputMethodTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  inputMethodTabTextActive: {
    color: '#ffffff',
  },
  voiceInputContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    backgroundColor: '#10b981',
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  voiceHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  videoInputContainer: {
    paddingVertical: 16,
  },
  videoStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  videoStatusText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    fontWeight: '500' as const,
  },
  videoHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
    textAlign: 'center',
  },
  answerInputContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 100,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickVoiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickVoiceButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  quickVoiceButtonTranscribing: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  smallSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  resultsContainer: {
    padding: 20,
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 6,
    borderColor: '#f59e0b',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#92400e',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#b45309',
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  questionScoresCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  questionScoreItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  questionScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionScoreNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  questionScoreBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionScoreValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400e',
  },
  questionScoreFeedback: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  evaluationSection: {
    gap: 16,
  },
  evaluationCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  weaknessCard: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  recommendationCard: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  evaluationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginTop: 6,
  },
  evaluationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  premiumContainer: {
    flex: 1,
  },
  premiumContent: {
    padding: 24,
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  lockIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#e9d5ff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  premiumFeaturesList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  premiumFeatureText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600' as const,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
      },
    }),
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
});
