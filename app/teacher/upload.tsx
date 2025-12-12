import { useRouter } from 'expo-router';
import { ChevronLeft, Upload, Video, FileText, Loader2 } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

export default function TeacherUpload() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addTeacherUpload } = useApp();
  
  const [uploadType, setUploadType] = useState<'video' | 'text'>('video');
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];

  const handleUpload = async () => {
    if (!title.trim() || !selectedChapter) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (uploadType === 'video' && !videoUrl.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    if (uploadType === 'text' && !content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    setIsUploading(true);
    
    try {
      const chapterData = chapters.find(c => c.id === selectedChapter);
      const subjectData = subjects.find(s => s.id === selectedSubject);
      
      const upload = {
        id: Date.now().toString(),
        type: uploadType,
        title: title.trim(),
        content: uploadType === 'text' ? content.trim() : '',
        videoUrl: uploadType === 'video' ? videoUrl.trim() : undefined,
        board: selectedBoard,
        grade: selectedGrade,
        subject: subjectData?.name || '',
        chapter: chapterData?.title || '',
        uploadedAt: new Date(),
      };
      
      await addTeacherUpload(upload);
      
      setIsUploading(false);
      Alert.alert('Success', 'Content uploaded successfully! Students will be notified.');
      setTitle('');
      setContent('');
      setVideoUrl('');
      setSelectedChapter('');
    } catch {
      setIsUploading(false);
      Alert.alert('Error', 'Failed to upload content. Please try again.');
    }
  };

  const canUpload = title.trim() && selectedChapter && 
    (uploadType === 'video' ? videoUrl.trim() : content.trim());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Content</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Board</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
              onPress={() => {
                setSelectedBoard('NCERT');
                setSelectedGrade(6);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.typeButtonText, selectedBoard === 'NCERT' && styles.typeButtonTextActive]}>
                NCERT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
              onPress={() => {
                setSelectedBoard('ICSE');
                setSelectedGrade(9);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.typeButtonText, selectedBoard === 'ICSE' && styles.typeButtonTextActive]}>
                ICSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Type</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, uploadType === 'video' && styles.typeButtonActive]}
              onPress={() => setUploadType('video')}
            >
              <Video size={20} color={uploadType === 'video' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.typeButtonText, uploadType === 'video' && styles.typeButtonTextActive]}>
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, uploadType === 'text' && styles.typeButtonActive]}
              onPress={() => setUploadType('text')}
            >
              <FileText size={20} color={uploadType === 'text' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.typeButtonText, uploadType === 'text' && styles.typeButtonTextActive]}>
                Text Summary
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${uploadType} title...`}
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {uploadType === 'video' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter video URL (YouTube, Vimeo, etc)..."
              placeholderTextColor="#94a3b8"
              value={videoUrl}
              onChangeText={setVideoUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Supported: YouTube, Vimeo, or direct video URLs
            </Text>
          </View>
        )}

        {uploadType === 'text' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content *</Text>
            <TextInput
              style={styles.textArea}
              placeholder={`Write your summary in ${selectedLanguage}...`}
              placeholderTextColor="#94a3b8"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, !canUpload && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!canUpload || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Upload size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload Content</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  typeButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  optionScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
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
    backgroundColor: '#fff7ed',
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
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  uploadButton: {
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
  uploadButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  boardButtonActiveNCERT: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  boardButtonActiveICSE: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
});
