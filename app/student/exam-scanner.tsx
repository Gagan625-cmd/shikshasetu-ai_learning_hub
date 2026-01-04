import { useRouter } from 'expo-router';
import { ChevronLeft, ExternalLink, Sparkles, Lock } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/subscription-context';
import { LinearGradient } from 'expo-linear-gradient';

const EXAM_SCANNER_APP_URL = 'https://shikshasetu-exam-scanner-loajhcw.rork.app';

export default function ExamScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();

  const openExamScannerApp = async () => {
    try {
      const supported = await Linking.canOpenURL(EXAM_SCANNER_APP_URL);
      if (supported) {
        await Linking.openURL(EXAM_SCANNER_APP_URL);
      } else {
        Alert.alert('Error', 'Unable to open the exam scanner app. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Error opening exam scanner:', error);
      Alert.alert('Error', 'Failed to open exam scanner app.');
    }
  };

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.premiumHeaderTitle}>AI Exam Scanner</Text>
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
              AI Exam Scanner is an advanced feature available exclusively for premium members.
            </Text>

            <View style={styles.premiumFeaturesList}>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>AI-powered answer evaluation</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Instant detailed feedback</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Performance analytics</Text>
              </View>
              <View style={styles.premiumFeatureItem}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.premiumFeatureText}>Personalized improvement plans</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Exam Scanner</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Sparkles size={48} color="#3b82f6" />
          </View>
          <Text style={styles.heroTitle}>AI-Powered Exam Scanner</Text>
          <Text style={styles.heroDescription}>
            Scan your exam papers with advanced AI technology and get instant detailed feedback, marks, and personalized improvement plans.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📝 How it works</Text>
          <Text style={styles.infoText}>
            1. Click the button below to open the exam scanner app{' \n'}
            2. Take a photo or upload your written exam paper{'\n'}
            3. AI will scan and extract your answers{'\n'}
            4. Get instant marks, solutions, and improvement plan
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Accurate Grading</Text>
            <Text style={styles.featureText}>AI-powered answer evaluation with detailed feedback</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureTitle}>Performance Analytics</Text>
            <Text style={styles.featureText}>Track your progress and identify weak areas</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💡</Text>
            <Text style={styles.featureTitle}>Smart Suggestions</Text>
            <Text style={styles.featureText}>Personalized improvement plans for better scores</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Instant Results</Text>
            <Text style={styles.featureText}>Get your results in seconds, not days</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={openExamScannerApp}>
          <ExternalLink size={24} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Open Exam Scanner App</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            💡 You will be redirected to our specialized exam scanner application for the best scanning experience.
          </Text>
        </View>
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
  infoCard: {
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  actionSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      },
    }),
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  previewSection: {
    gap: 16,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  previewActions: {
    gap: 12,
  },
  scanButton: {
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
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  retakeButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  errorCard: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  scoreCard: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    gap: 20,
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
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#3b82f6',
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1e40af',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  scoreDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreDetailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  scoreDetailValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  sectionCard: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    flex: 1,
  },
  answerMarks: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  answerBody: {
    gap: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#10b981',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  feedbackText: {
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  feedbackContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bulletGreen: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
    width: 20,
  },
  bulletRed: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ef4444',
    width: 20,
  },
  bulletBlue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3b82f6',
    width: 20,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    marginTop: 8,
  },
  newScanButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  noteCard: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noteText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 20,
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
