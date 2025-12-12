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
            ShikshaSetu is an AI-powered educational platform designed to bridge learning gaps and provide equitable educational support using artificial intelligence. We deliver personalized learning journeys and empower teachers with AI-assisted tools.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founders & CEOs</Text>
          <View style={styles.founderCard}>
            <View style={styles.founderInitials}>
              <Text style={styles.founderInitialsText}>GN</Text>
            </View>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Gagandeep.N</Text>
              <Text style={styles.founderRole}>Co-Founder & CEO</Text>
            </View>
          </View>
          <View style={styles.founderCard}>
            <View style={styles.founderInitials}>
              <Text style={styles.founderInitialsText}>AK</Text>
            </View>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>Atharva Kulkarni</Text>
              <Text style={styles.founderRole}>Co-Founder & CEO</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.sectionText}>
            • AI-generated notes, summaries, and worksheets{'\n'}
            • Personalized quiz generation{'\n'}
            • Interview practice with AI feedback{'\n'}
            • NCERT & ICSE content coverage{'\n'}
            • Multilingual support{'\n'}
            • Offline & online accessibility{'\n'}
            • Teacher co-pilot features{'\n'}
            • Performance analytics
          </Text>
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
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  founderInitialsText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#f59e0b',
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
});
