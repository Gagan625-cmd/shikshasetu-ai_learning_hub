import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/app-context';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function WelcomeScreen() {
  const router = useRouter();
  const { selectRole } = useApp();
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.replace('/auth');
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, isLoading, router, fadeAnim, slideAnim]);

  if (isLoading || !user) {
    return (
      <LinearGradient colors={['#1e3c72', '#2a5298', '#7e22ce']} style={{ flex: 1 }} />
    );
  }

  const handleRoleSelect = async (role: 'student' | 'teacher') => {
    await selectRole(role);
    if (role === 'student') {
      router.replace('/student/' as any);
    } else {
      router.replace('/teacher/' as any);
    }
  };

  return (
    <LinearGradient colors={['#1e3c72', '#2a5298', '#7e22ce']} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi {user.name}! 👋</Text>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vgf5j406eh85pmh23mp8' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Bridging Learning Gaps with AI</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect('student')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ffffff', '#f0f9ff']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <BookOpen size={48} color="#2563eb" strokeWidth={2} />
              </View>
              <Text style={styles.cardTitle}>Student</Text>
              <Text style={styles.cardDescription}>
                Access NCERT content, AI-powered learning, and personalized interviews
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect('teacher')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ffffff', '#fef3c7']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <GraduationCap size={48} color="#d97706" strokeWidth={2} />
              </View>
              <Text style={styles.cardTitle}>Teacher</Text>
              <Text style={styles.cardDescription}>
                AI co-pilot tools, interview assessments, and content generation
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TECHFEST 2025-26 • Made for India</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },

  tagline: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  cardContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#bfdbfe',
    fontWeight: '500' as const,
  },
});
