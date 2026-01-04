import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About ShikshaSetu</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            ShikshaSetu is an AI-powered educational platform designed to bridge learning gaps and provide equitable educational support using artificial intelligence. We deliver personalized learning journeys and empower students with AI-generated resources.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founders</Text>
          <View style={styles.founderCard}>
            <View style={styles.founderInitials}>
              <Text style={styles.founderInitialsText}>GN</Text>
            </View>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Gagandeep.N</Text>
              <Text style={styles.founderRole}>Founder & CEO</Text>
            </View>
          </View>
          <View style={styles.founderCard}>
            <View style={styles.founderInitials}>
              <Text style={styles.founderInitialsText}>AK</Text>
            </View>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Atharva Kulkarni</Text>
              <Text style={styles.founderRole}>Founder & CEO</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentor</Text>
          <View style={styles.founderCard}>
            <View style={styles.founderInitials}>
              <Text style={styles.founderInitialsText}>SB</Text>
            </View>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Soniya Babu</Text>
              <Text style={styles.founderRole}>Mentor</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📚</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Content Generator</Text>
              <Text style={styles.featureDescription}>
                Generate comprehensive notes, summaries, worksheets, mind maps, and question papers for any chapter with AI assistance.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📝</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Exam Scanner</Text>
              <Text style={styles.featureDescription}>
                Scan your exam papers and get instant AI-powered grading, detailed feedback, and personalized improvement plans.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Adaptive Quiz Generation</Text>
              <Text style={styles.featureDescription}>
                Practice with AI-generated quizzes that adapt to your learning level and provide instant feedback on your performance.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>💬</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Interview Practice</Text>
              <Text style={styles.featureDescription}>
                Prepare for interviews with AI-powered mock interviews, real-time feedback, and comprehensive performance analysis.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>NCERT & ICSE Content</Text>
              <Text style={styles.featureDescription}>
                Complete syllabus coverage for NCERT (Grades 6-10) and ICSE (Grades 9-10) with chapter-wise content generation.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>🌐</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Multilingual Support</Text>
              <Text style={styles.featureDescription}>
                Study in your preferred language with support for English, Hindi, and more regional languages.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Performance Analytics</Text>
              <Text style={styles.featureDescription}>
                Track your learning progress with detailed analytics, activity history, and personalized insights.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>🔊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Text-to-Speech</Text>
              <Text style={styles.featureDescription}>
                Listen to any generated content with high-quality text-to-speech in multiple languages for better accessibility.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology</Text>
          <Text style={styles.sectionText}>
            Built with React Native, Expo, and powered by advanced AI models including GPT-4 for content generation and learning assistance.
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  founderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  founderInitials: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  founderInitialsText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3b82f6',
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  founderRole: {
    fontSize: 14,
    color: '#64748b',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  featureBullet: {
    fontSize: 24,
    lineHeight: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
