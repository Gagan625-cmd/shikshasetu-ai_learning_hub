import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ExternalLink, Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UsefulLinkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenLink = async () => {
    const url = 'https://teaching-video-downl-ogpg.bolt.host/';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Useful Link</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.linkCard}>
          <View style={styles.iconCircle}>
            <Globe size={40} color="#3b82f6" strokeWidth={2} />
          </View>

          <Text style={styles.cardTitle}>Teaching Video Resources</Text>
          <Text style={styles.cardDescription}>
            Access teaching video download resources to enhance your learning experience.
          </Text>

          <TouchableOpacity style={styles.linkButton} onPress={handleOpenLink} activeOpacity={0.8}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.linkButtonGradient}>
              <Text style={styles.linkButtonText}>Open Link</Text>
              <ExternalLink size={20} color="#ffffff" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>URL:</Text>
            <Text style={styles.urlText} numberOfLines={2}>
              https://teaching-video-downl-ogpg.bolt.host/
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About this resource</Text>
          <Text style={styles.infoText}>
            This external resource provides teaching video downloads to supplement your studies. Make sure you have an internet connection to access it.
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  linkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  linkButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  linkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  urlContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 6,
  },
  urlText: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', web: 'monospace' }),
  },
  infoCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
