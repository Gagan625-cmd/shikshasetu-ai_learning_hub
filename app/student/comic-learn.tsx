import { useState, useCallback, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Sparkles, BookOpen, Zap, RefreshCw } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

interface ComicPanel {
  id: number;
  character: string;
  characterEmoji: string;
  dialogue: string;
  action: string;
  mood: 'happy' | 'excited' | 'thinking' | 'surprised' | 'teaching';
  position: 'left' | 'right' | 'center';
}

const BOARDS = [
  { id: 'ncert', name: 'NCERT' },
  { id: 'icse', name: 'ICSE' },
];

const NCERT_GRADES = [6, 7, 8, 9, 10];
const ICSE_GRADES = [9, 10];

const CHARACTER_COLORS: Record<string, string> = {
  'Professor Wisdom': '#6366f1',
  'Curious Cat': '#f59e0b',
  'Brainy Bot': '#10b981',
  'Wonder Kid': '#ec4899',
  'Science Owl': '#8b5cf6',
  'Math Monkey': '#3b82f6',
  'History Hero': '#ef4444',
  'default': '#64748b',
};

const MOOD_BACKGROUNDS: Record<string, string[]> = {
  happy: ['#fef3c7', '#fde68a'],
  excited: ['#fce7f3', '#fbcfe8'],
  thinking: ['#e0e7ff', '#c7d2fe'],
  surprised: ['#ccfbf1', '#99f6e4'],
  teaching: ['#f0fdf4', '#dcfce7'],
};

export default function ComicLearnScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [comicPanels, setComicPanels] = useState<ComicPanel[]>([]);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;

  const subjects = useMemo(() => {
    if (!selectedBoard || !selectedGrade) return [];
    const data = selectedBoard === 'ncert' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
    return data.filter(s => s.grade === selectedGrade);
  }, [selectedBoard, selectedGrade]);

  const chapters = useMemo(() => {
    if (!selectedSubject) return [];
    const data = selectedBoard === 'ncert' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
    const subject = data.find(s => s.id === selectedSubject);
    return subject?.chapters || [];
  }, [selectedBoard, selectedSubject]);

  const selectedSubjectName = useMemo(() => {
    const data = selectedBoard === 'ncert' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
    return data.find(s => s.id === selectedSubject)?.name || '';
  }, [selectedBoard, selectedSubject]);

  const selectedChapterTitle = useMemo(() => {
    const chapter = chapters.find(c => c.id === selectedChapter);
    return chapter?.title || '';
  }, [chapters, selectedChapter]);

  const grades = selectedBoard === 'ncert' ? NCERT_GRADES : ICSE_GRADES;

  const generateComicMutation = useMutation({
    mutationFn: async () => {
      const chapter = chapters.find(c => c.id === selectedChapter);
      if (!chapter) throw new Error('Chapter not found');

      const prompt = `Create a FUN and ENGAGING comic-style explanation for students learning "${chapter.title}" (${selectedSubjectName}, Grade ${selectedGrade}).

Generate EXACTLY 6 comic panels in JSON format. Each panel should have funny dialogue, visual humor, and make learning FUN!

Characters to use (pick 2-3 for the story):
- Professor Wisdom (wise owl who explains concepts) 🦉
- Curious Cat (asks questions students would ask) 🐱
- Brainy Bot (robot who loves facts and numbers) 🤖
- Wonder Kid (enthusiastic student who gets excited) 👧
- Science Owl (loves experiments and discoveries) 🦉
- Math Monkey (playful and loves solving puzzles) 🐵

Rules:
1. Make it FUNNY with puns, jokes, and silly situations
2. Explain the core concept clearly but entertainingly
3. Use simple language suitable for Grade ${selectedGrade}
4. Include visual gags and actions in the "action" field
5. Mix teaching with humor - learning should be FUN!
6. End with a memorable summary or fun fact

Return ONLY valid JSON array with this structure:
[
  {
    "id": 1,
    "character": "Character Name",
    "characterEmoji": "emoji",
    "dialogue": "Funny dialogue with concept explanation",
    "action": "Visual description of what's happening",
    "mood": "happy|excited|thinking|surprised|teaching",
    "position": "left|right|center"
  }
]

Topic: ${chapter.title}
Description: ${chapter.description}
Subject: ${selectedSubjectName}
Grade: ${selectedGrade}

Make it hilarious and educational! Students should laugh while learning!`;

      const response = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Failed to parse comic panels');
      
      const panels = JSON.parse(jsonMatch[0]) as ComicPanel[];
      return panels;
    },
    onSuccess: (panels) => {
      setComicPanels(panels);
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 400, animated: true });
      }, 300);
    },
  });

  const { mutate: generateComic, isPending, isError } = generateComicMutation;

  const handleGenerateComic = useCallback(() => {
    if (selectedChapter) {
      generateComic();
    }
  }, [selectedChapter, generateComic]);

  const handleBoardSelect = useCallback((boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade(null);
    setSelectedSubject('');
    setSelectedChapter('');
    setComicPanels([]);
    setShowBoardDropdown(false);
  }, []);

  const handleGradeSelect = useCallback((grade: number) => {
    setSelectedGrade(grade);
    setSelectedSubject('');
    setSelectedChapter('');
    setComicPanels([]);
    setShowGradeDropdown(false);
  }, []);

  const handleSubjectSelect = useCallback((subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedChapter('');
    setComicPanels([]);
    setShowSubjectDropdown(false);
  }, []);

  const handleChapterSelect = useCallback((chapterId: string) => {
    setSelectedChapter(chapterId);
    setComicPanels([]);
    setShowChapterDropdown(false);
  }, []);

  const renderComicPanel = (panel: ComicPanel, index: number) => {
    const characterColor = CHARACTER_COLORS[panel.character] || CHARACTER_COLORS.default;
    const moodColors = MOOD_BACKGROUNDS[panel.mood] || MOOD_BACKGROUNDS.happy;
    const isLeft = panel.position === 'left';
    const isCenter = panel.position === 'center';

    return (
      <Animated.View 
        key={panel.id} 
        style={[
          styles.comicPanel,
          { transform: [{ scale: bounceAnim }] }
        ]}
      >
        <LinearGradient
          colors={moodColors as [string, string]}
          style={styles.panelGradient}
        >
          <View style={styles.panelNumber}>
            <Text style={styles.panelNumberText}>{index + 1}</Text>
          </View>

          <View style={[
            styles.panelContent,
            isCenter && styles.panelContentCenter,
            !isCenter && (isLeft ? styles.panelContentLeft : styles.panelContentRight),
          ]}>
            <View style={[
              styles.characterBubble,
              { backgroundColor: characterColor },
              isCenter && styles.characterBubbleCenter,
            ]}>
              <Text style={styles.characterEmoji}>{panel.characterEmoji}</Text>
            </View>
            
            <View style={[
              styles.dialogueContainer,
              isCenter && styles.dialogueContainerCenter,
            ]}>
              <View style={[
                styles.speechBubble,
                isLeft && styles.speechBubbleLeft,
                !isLeft && !isCenter && styles.speechBubbleRight,
              ]}>
                <Text style={styles.characterName}>{panel.character}</Text>
                <Text style={styles.dialogue}>{panel.dialogue}</Text>
              </View>
              
              <View style={[
                styles.speechTail,
                isCenter && styles.speechTailCenter,
                isLeft && styles.speechTailLeft,
                !isLeft && !isCenter && styles.speechTailRight,
              ]} />
            </View>
          </View>

          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>✨ {panel.action}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Comic Learn',
          headerStyle: { backgroundColor: '#1e1e2e' },
          headerTintColor: '#ffffff',
        }} 
      />

      <LinearGradient
        colors={['#1e1e2e', '#2d2d44']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>📚</Text>
            <Sparkles size={20} color="#fbbf24" style={styles.sparkle} />
          </View>
          <Text style={styles.headerTitle}>Comic Learning</Text>
          <Text style={styles.headerSubtitle}>Learn chapters through fun comics!</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionCard}>
          <View style={styles.selectionHeader}>
            <BookOpen size={20} color="#6366f1" />
            <Text style={styles.selectionTitle}>Select Your Chapter</Text>
          </View>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowBoardDropdown(!showBoardDropdown)}
          >
            <Text style={[styles.dropdownText, !selectedBoard && styles.dropdownPlaceholder]}>
              {selectedBoard ? BOARDS.find(b => b.id === selectedBoard)?.name : 'Select Board'}
            </Text>
            <ChevronDown size={20} color="#64748b" />
          </TouchableOpacity>
          {showBoardDropdown && (
            <View style={styles.dropdownMenu}>
              {BOARDS.map(board => (
                <TouchableOpacity
                  key={board.id}
                  style={styles.dropdownItem}
                  onPress={() => handleBoardSelect(board.id)}
                >
                  <Text style={styles.dropdownItemText}>{board.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedBoard && (
            <>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowGradeDropdown(!showGradeDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedGrade && styles.dropdownPlaceholder]}>
                  {selectedGrade ? `Grade ${selectedGrade}` : 'Select Grade'}
                </Text>
                <ChevronDown size={20} color="#64748b" />
              </TouchableOpacity>
              {showGradeDropdown && (
                <View style={styles.dropdownMenu}>
                  {grades.map(grade => (
                    <TouchableOpacity
                      key={grade}
                      style={styles.dropdownItem}
                      onPress={() => handleGradeSelect(grade)}
                    >
                      <Text style={styles.dropdownItemText}>Grade {grade}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {selectedGrade && (
            <>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedSubject && styles.dropdownPlaceholder]}>
                  {selectedSubjectName || 'Select Subject'}
                </Text>
                <ChevronDown size={20} color="#64748b" />
              </TouchableOpacity>
              {showSubjectDropdown && (
                <View style={styles.dropdownMenu}>
                  {subjects.map(subject => (
                    <TouchableOpacity
                      key={subject.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSubjectSelect(subject.id)}
                    >
                      <Text style={styles.dropdownItemText}>{subject.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {selectedSubject && (
            <>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowChapterDropdown(!showChapterDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedChapter && styles.dropdownPlaceholder]} numberOfLines={1}>
                  {selectedChapterTitle || 'Select Chapter'}
                </Text>
                <ChevronDown size={20} color="#64748b" />
              </TouchableOpacity>
              {showChapterDropdown && (
                <ScrollView style={styles.dropdownMenuScroll} nestedScrollEnabled>
                  {chapters.map(chapter => (
                    <TouchableOpacity
                      key={chapter.id}
                      style={styles.dropdownItem}
                      onPress={() => handleChapterSelect(chapter.id)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {chapter.number}. {chapter.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {selectedChapter && (
            <TouchableOpacity
              style={[
                styles.generateButton,
                isPending && styles.generateButtonDisabled
              ]}
              onPress={handleGenerateComic}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f59e0b', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                {isPending ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.generateButtonText}>Creating Magic...</Text>
                  </>
                ) : (
                  <>
                    <Zap size={20} color="#ffffff" />
                    <Text style={styles.generateButtonText}>Generate Comic!</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {isError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Oops! Something went wrong. Please try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleGenerateComic}>
              <RefreshCw size={16} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {comicPanels.length > 0 && (
          <View style={styles.comicContainer}>
            <View style={styles.comicHeader}>
              <Text style={styles.comicTitle}>📖 {selectedChapterTitle}</Text>
              <Text style={styles.comicSubtitle}>A Comic Adventure!</Text>
            </View>
            
            <View style={styles.comicStrip}>
              {comicPanels.map((panel, index) => renderComicPanel(panel, index))}
            </View>

            <View style={styles.endCard}>
              <Text style={styles.endEmoji}>🎉</Text>
              <Text style={styles.endTitle}>The End!</Text>
              <Text style={styles.endSubtitle}>Now you know about {selectedChapterTitle}!</Text>
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={handleGenerateComic}
              >
                <RefreshCw size={16} color="#6366f1" />
                <Text style={styles.regenerateText}>Generate New Comic</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!comicPanels.length && !isPending && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎨</Text>
            <Text style={styles.emptyTitle}>Ready for Comic Learning?</Text>
            <Text style={styles.emptySubtitle}>
              Select a chapter above and watch it come alive as a fun comic strip!
            </Text>
            <View style={styles.characterPreview}>
              <View style={[styles.previewCharacter, { backgroundColor: '#6366f1' }]}>
                <Text style={styles.previewEmoji}>🦉</Text>
              </View>
              <View style={[styles.previewCharacter, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.previewEmoji}>🐱</Text>
              </View>
              <View style={[styles.previewCharacter, { backgroundColor: '#10b981' }]}>
                <Text style={styles.previewEmoji}>🤖</Text>
              </View>
              <View style={[styles.previewCharacter, { backgroundColor: '#ec4899' }]}>
                <Text style={styles.previewEmoji}>👧</Text>
              </View>
            </View>
            <Text style={styles.previewText}>Meet your comic teachers!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    position: 'relative',
    marginBottom: 12,
  },
  headerEmoji: {
    fontSize: 48,
  },
  sparkle: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#a5b4fc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  selectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
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
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500' as const,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#94a3b8',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dropdownMenuScroll: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1e293b',
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  comicContainer: {
    marginTop: 24,
  },
  comicHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
  },
  comicTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  comicSubtitle: {
    fontSize: 14,
    color: '#a5b4fc',
  },
  comicStrip: {
    gap: 16,
  },
  comicPanel: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1e1e2e',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  panelGradient: {
    padding: 20,
    minHeight: 200,
  },
  panelNumber: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelNumberText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#ffffff',
  },
  panelContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  panelContentLeft: {
    flexDirection: 'row',
  },
  panelContentRight: {
    flexDirection: 'row-reverse',
  },
  panelContentCenter: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  characterBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  characterBubbleCenter: {
    marginBottom: 12,
  },
  characterEmoji: {
    fontSize: 32,
  },
  dialogueContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  dialogueContainerCenter: {
    marginHorizontal: 0,
    width: '100%',
  },
  speechBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1e1e2e',
  },
  speechBubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  speechBubbleRight: {
    borderBottomRightRadius: 4,
  },
  speechTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1e1e2e',
    position: 'absolute',
    bottom: -15,
  },
  speechTailLeft: {
    left: 20,
  },
  speechTailRight: {
    right: 20,
  },
  speechTailCenter: {
    alignSelf: 'center',
  },
  characterName: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dialogue: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  actionContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  actionText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  endCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  endEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  endTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  endSubtitle: {
    fontSize: 15,
    color: '#a5b4fc',
    textAlign: 'center',
    marginBottom: 20,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  characterPreview: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  previewCharacter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
});
