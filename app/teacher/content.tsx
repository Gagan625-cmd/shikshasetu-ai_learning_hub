import { useRouter } from 'expo-router';
import { ChevronLeft, BookOpen, GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';

export default function TeacherContentBrowser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedGrade, setSelectedGrade] = useState<number>(6);

  const subjects = useMemo(
    () => NCERT_SUBJECTS.filter((s) => s.grade === selectedGrade),
    [selectedGrade]
  );
  const grades = useMemo(() => [6, 7, 8, 9, 10], []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NCERT Content</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.gradeSelector}>
        <Text style={styles.gradeSelectorLabel}>Select Grade:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gradeScrollContent}
        >
          {grades.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[styles.gradeButton, selectedGrade === grade && styles.gradeButtonActive]}
              onPress={() => setSelectedGrade(grade)}
            >
              <GraduationCap
                size={20}
                color={selectedGrade === grade ? '#ffffff' : '#64748b'}
              />
              <Text
                style={[
                  styles.gradeButtonText,
                  selectedGrade === grade && styles.gradeButtonTextActive,
                ]}
              >
                Grade {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <View style={styles.subjectIconContainer}>
                <BookOpen size={24} color="#f59e0b" strokeWidth={2} />
              </View>
              <Text style={styles.subjectName}>{subject.name}</Text>
            </View>

            <View style={styles.chaptersContainer}>
              {subject.chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.chapterItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.chapterNumber}>
                    <Text style={styles.chapterNumberText}>{chapter.number}</Text>
                  </View>
                  <View style={styles.chapterContent}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterDescription} numberOfLines={2}>
                      {chapter.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
  gradeSelector: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  gradeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  gradeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  gradeButtonActive: {
    backgroundColor: '#f59e0b',
  },
  gradeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  gradeButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  chaptersContainer: {
    gap: 12,
  },
  chapterItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});
