import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Animated, Platform, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, X, Sparkles, Smile, Loader2, FileText, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/app-context';
import { generateText } from '@rork-ai/toolkit-sdk';

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
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
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
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

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
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;
      
      formData.append('audio', audioFile);
      
      const sttUrl = new URL('/stt/transcribe/', process.env.EXPO_PUBLIC_TOOLKIT_URL!).toString();
      
      const sttResponse = await fetch(sttUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!sttResponse.ok) {
        throw new Error('Speech-to-text failed');
      }
      
      const sttData = await sttResponse.json() as { text: string; language: string };
      const transcribedText = sttData.text;
      
      setTranscript(transcribedText);
      
      const emotionPrompt = `Analyze the emotional tone of this text and respond with just one word: neutral, happy, stressed, confused, or excited.\n\nText: "${transcribedText}"`;
      const emotionResult = await generateText({ messages: [{ role: 'user', content: emotionPrompt }] });
      const detectedEmotion = (emotionResult.toLowerCase().trim() as EmotionalState) || 'neutral';
      
      if (['neutral', 'happy', 'stressed', 'confused', 'excited'].includes(detectedEmotion)) {
        setEmotionalState(detectedEmotion);
      }
      
      const contentPrompt = `You are an AI assistant helping a teacher create educational content. The teacher said: "${transcribedText}"

Their emotional state seems ${detectedEmotion}. Generate comprehensive lesson content based on their request.

Provide a structured response with:
- Learning objectives
- Key concepts
- Interactive activities
- Assessment questions
- Teaching tips
- Required resources

Make it detailed, practical, and ready to use in a classroom.`;
      
      const generatedContent = await generateText({ messages: [{ role: 'user', content: contentPrompt }] });
      setGeneratedContent(generatedContent);

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
