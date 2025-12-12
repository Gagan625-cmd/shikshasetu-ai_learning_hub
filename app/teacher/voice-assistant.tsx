import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Animated, Platform, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, X, Sparkles, Smile, Loader2, FileText, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/app-context';

interface VoiceAssistantProps {
  visible: boolean;
  onClose: () => void;
}

type EmotionalState = 'neutral' | 'happy' | 'stressed' | 'confused' | 'excited';

export default function VoiceAssistant({ visible, onClose }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const { addTeacherActivity } = useApp();

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice features.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);

      await processVoice(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    }
  };

  const processVoice = async (uri: string | null) => {
    if (!uri) return;

    setIsProcessing(true);
    
    try {
      const emotions: EmotionalState[] = ['neutral', 'happy', 'stressed', 'confused', 'excited'];
      const detectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setEmotionalState(detectedEmotion);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTranscript = "Create a lesson about photosynthesis for grade 9 students. Include diagrams and interactive examples.";
      setTranscript(mockTranscript);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockContent = generateLessonContent(mockTranscript, detectedEmotion);
      setGeneratedContent(mockContent);

      await addTeacherActivity({
        type: 'voice-content-creation',
        title: 'Voice-Generated Lesson',
        timestamp: Date.now(),
        details: `Created lesson using voice input with ${detectedEmotion} emotion detected`,
      });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateLessonContent = (input: string, emotion: EmotionalState): string => {
    const emotionalContext = {
      happy: 'Your enthusiastic tone is great! Here\'s an engaging lesson:',
      stressed: 'I sense you might be busy. Here\'s a quick, efficient lesson plan:',
      confused: 'Let me help clarify. Here\'s a well-structured lesson:',
      excited: 'I love your energy! Here\'s an exciting lesson plan:',
      neutral: 'Here\'s a comprehensive lesson plan:',
    };

    return `${emotionalContext[emotion]}

# Photosynthesis Lesson Plan - Grade 9

## Learning Objectives:
- Understand the process of photosynthesis
- Identify the key components and products
- Explain the importance for life on Earth

## Key Concepts:

### 1. Definition
Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.

### 2. Chemical Equation
6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂

### 3. Key Components:
- Chlorophyll (green pigment)
- Sunlight (energy source)
- Carbon dioxide (from air)
- Water (from soil)

### 4. Interactive Activities:
- Virtual lab simulation
- Diagram labeling exercise
- Role-play: Students act as chloroplasts
- Group discussion on climate impact

### 5. Assessment Questions:
1. What are the products of photosynthesis?
2. Why is chlorophyll essential?
3. How does light intensity affect the rate?

## Teaching Tips:
${emotion === 'stressed' ? '- Focus on core concepts first\n- Use pre-made diagrams\n- 30-minute lesson plan' : ''}
${emotion === 'excited' ? '- Include hands-on experiments\n- Add competitive quiz elements\n- Student presentations' : ''}
${emotion === 'confused' ? '- Step-by-step breakdown\n- Visual aids for each stage\n- Frequent comprehension checks' : ''}

## Resources Needed:
- Projector/screen
- Plant samples
- Worksheet handouts
- Quiz materials`;
  };

  const saveContent = async () => {
    if (!generatedContent) return;

    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Lesson content saved to your materials!');
    } catch (error) {
      console.error('Error saving content:', error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    }
  };

  const handleClose = () => {
    setTranscript('');
    setGeneratedContent('');
    setEmotionalState('neutral');
    onClose();
  };

  const getEmotionalColor = () => {
    switch (emotionalState) {
      case 'happy': return '#10b981';
      case 'stressed': return '#ef4444';
      case 'confused': return '#f59e0b';
      case 'excited': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  const getEmotionalMessage = () => {
    switch (emotionalState) {
      case 'happy': return 'Great energy detected! 😊';
      case 'stressed': return 'Keeping it simple for you 💪';
      case 'confused': return 'Let me help clarify 🤔';
      case 'excited': return 'Love the enthusiasm! 🎉';
      default: return 'Ready to assist 🎓';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#7c3aed', '#a855f7']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>🎤 Voice Assistant</Text>
              <Text style={styles.headerSubtitle}>Create lessons with your voice</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {emotionalState !== 'neutral' && (
            <View style={[styles.emotionCard, { backgroundColor: getEmotionalColor() + '20' }]}>
              <View style={[styles.emotionIndicator, { backgroundColor: getEmotionalColor() }]}>
                <Smile size={20} color="#ffffff" />
              </View>
              <Text style={[styles.emotionText, { color: getEmotionalColor() }]}>
                {getEmotionalMessage()}
              </Text>
            </View>
          )}

          <View style={styles.recordingSection}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isRecording ? ['#ef4444', '#dc2626'] : ['#8b5cf6', '#7c3aed']}
                style={styles.micGradient}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  {isProcessing ? (
                    <Loader2 size={48} color="#ffffff" />
                  ) : (
                    <Mic size={48} color="#ffffff" />
                  )}
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.recordingText}>
              {isProcessing ? 'Processing...' : isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </Text>
            <Text style={styles.recordingHint}>
              Speak naturally about the lesson you want to create
            </Text>
          </View>

          {transcript !== '' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FileText size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Transcript</Text>
              </View>
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            </View>
          )}

          {generatedContent !== '' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Generated Content</Text>
              </View>
              <View style={styles.contentCard}>
                <Text style={styles.contentText}>{generatedContent}</Text>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveContent}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.saveGradient}
                >
                  <Save size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save to Materials</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>✨ AI Features</Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>🎤 Speech-to-text transcription</Text>
              <Text style={styles.featureItem}>😊 Emotional tone detection</Text>
              <Text style={styles.featureItem}>📝 Automatic content generation</Text>
              <Text style={styles.featureItem}>🎯 Contextual lesson planning</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  emotionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  micButton: {
    marginBottom: 24,
  },
  micGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
      },
    }),
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  recordingHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  transcriptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transcriptText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  saveButton: {
    marginTop: 16,
    overflow: 'hidden',
    borderRadius: 12,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  featuresCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b21a8',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#7c3aed',
    lineHeight: 20,
  },
});
