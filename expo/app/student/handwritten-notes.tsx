import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Loader2, Crown, Share2, PenTool, BookOpen, Highlighter, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useSubscription } from '@/contexts/subscription-context';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateText } from '@/lib/ai-generate';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type BoardKey = 'NCERT' | 'ICSE';

const NOTE_COLORS = [
  { bg: '#fff3e0', accent: '#e65100', border: '#ffcc80', title: '#bf360c', text: '#4e342e', highlight: '#ffe0b2' },
  { bg: '#e8f5e9', accent: '#1b5e20', border: '#a5d6a7', title: '#2e7d32', text: '#1b5e20', highlight: '#c8e6c9' },
  { bg: '#e3f2fd', accent: '#0d47a1', border: '#90caf9', title: '#1565c0', text: '#0d47a1', highlight: '#bbdefb' },
  { bg: '#fce4ec', accent: '#880e4f', border: '#f48fb1', title: '#ad1457', text: '#880e4f', highlight: '#f8bbd0' },
  { bg: '#f3e5f5', accent: '#4a148c', border: '#ce93d8', title: '#6a1b9a', text: '#4a148c', highlight: '#e1bee7' },
  { bg: '#fff8e1', accent: '#f57f17', border: '#ffe082', title: '#e65100', text: '#bf360c', highlight: '#ffecb3' },
  { bg: '#e0f7fa', accent: '#006064', border: '#80deea', title: '#00838f', text: '#004d40', highlight: '#b2ebf2' },
  { bg: '#fbe9e7', accent: '#bf360c', border: '#ffab91', title: '#d84315', text: '#3e2723', highlight: '#ffccbc' },
];

interface NoteSection {
  title: string;
  content: string;
  colorIndex: number;
}

const BookPageContent = ({ section, pageNum, totalPages }: { section: NoteSection; pageNum: number; totalPages: number }) => {
  const colorScheme = NOTE_COLORS[section.colorIndex % NOTE_COLORS.length];

  return (
    <View style={[bookStyles.page, { backgroundColor: colorScheme.bg, borderColor: colorScheme.border }]}>
      <View style={[bookStyles.pageSpine, { backgroundColor: colorScheme.accent + '15' }]} />
      <View style={[bookStyles.marginLine, { borderLeftColor: colorScheme.accent + '30' }]} />

      <View style={bookStyles.ruledLines}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[bookStyles.ruledLine, { borderBottomColor: colorScheme.accent + '10' }]} />
        ))}
      </View>

      <View style={bookStyles.pageInner}>
        {section.title ? (
          <View style={bookStyles.pageTitleArea}>
            <View style={[bookStyles.pageTitleBg, { backgroundColor: colorScheme.accent + '18' }]}>
              <Text style={[bookStyles.pageTitle, { color: colorScheme.title }]}>{section.title}</Text>
            </View>
            <View style={[bookStyles.pageTitleLine, { backgroundColor: colorScheme.accent + '40' }]} />
          </View>
        ) : null}

        <ScrollView
          style={bookStyles.pageContentScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {section.content.split('\n').map((line, lineIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <View key={lineIdx} style={bookStyles.emptyLine} />;

            const isImportant = trimmed.startsWith('*') || trimmed.startsWith('!') || trimmed.includes('IMPORTANT') || trimmed.includes('Remember');
            const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('→');
            const isFormula = trimmed.includes('=') || trimmed.includes('→') || /[²³√π∑∫]/.test(trimmed);

            if (isImportant) {
              return (
                <View key={lineIdx} style={[bookStyles.importantLine, { backgroundColor: colorScheme.highlight, borderLeftColor: colorScheme.accent }]}>
                  <Highlighter size={11} color={colorScheme.accent} />
                  <Text style={[bookStyles.importantText, { color: colorScheme.accent }]}>
                    {trimmed.replace(/^\*\s*|^!\s*/, '')}
                  </Text>
                </View>
              );
            }

            if (isFormula) {
              return (
                <View key={lineIdx} style={[bookStyles.formulaLine, { backgroundColor: colorScheme.accent + '10', borderColor: colorScheme.accent + '25' }]}>
                  <Text style={[bookStyles.formulaText, { color: colorScheme.accent }]}>{trimmed}</Text>
                </View>
              );
            }

            if (isBullet) {
              return (
                <View key={lineIdx} style={bookStyles.bulletLine}>
                  <View style={[bookStyles.bulletDot, { backgroundColor: colorScheme.accent }]} />
                  <Text style={[bookStyles.bulletText, { color: colorScheme.text }]}>
                    {trimmed.replace(/^[-•→]\s*/, '')}
                  </Text>
                </View>
              );
            }

            return (
              <Text key={lineIdx} style={[bookStyles.contentText, { color: colorScheme.text }]}>
                {trimmed}
              </Text>
            );
          })}
        </ScrollView>
      </View>

      <View style={bookStyles.pageFooter}>
        <View style={[bookStyles.pageNumCircle, { backgroundColor: colorScheme.accent + '15', borderColor: colorScheme.accent + '30' }]}>
          <Text style={[bookStyles.pageNum, { color: colorScheme.accent }]}>{pageNum}</Text>
        </View>
        <Text style={[bookStyles.pageTotal, { color: colorScheme.accent + '60' }]}>of {totalPages}</Text>
      </View>

      <View style={[bookStyles.cornerFold, { borderTopColor: colorScheme.border, borderRightColor: colorScheme.bg }]} />
    </View>
  );
};

const BookViewer = ({ sections, subjectName, board, grade, isDark, colors, onReset, onExport }: {
  sections: NoteSection[];
  subjectName: string;
  board: string;
  grade: number;
  isDark: boolean;
  colors: any;
  onReset: () => void;
  onExport: () => void;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    Animated.timing(fadeInAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeInAnim]);

  const flipToPage = useCallback((nextPage: number) => {
    if (isFlipping || nextPage < 0 || nextPage >= sections.length) return;
    setIsFlipping(true);

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: nextPage > currentPage ? 1 : -1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsFlipping(false);
    });

    setTimeout(() => {
      setCurrentPage(nextPage);
    }, 200);
  }, [currentPage, sections.length, isFlipping, flipAnim, scaleAnim]);

  const goNext = useCallback(() => {
    flipToPage(currentPage + 1);
  }, [currentPage, flipToPage]);

  const goPrev = useCallback(() => {
    flipToPage(currentPage - 1);
  }, [currentPage, flipToPage]);

  const translateX = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [40, 0, -40],
  });

  const currentSection = sections[currentPage];
  const colorScheme = NOTE_COLORS[currentSection.colorIndex % NOTE_COLORS.length];
  const progress = ((currentPage + 1) / sections.length) * 100;

  return (
    <Animated.View style={[bookStyles.bookContainer, { opacity: fadeInAnim }]}>
      <LinearGradient
        colors={['#4a0e2b', '#7b1141', '#a01751']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={bookStyles.bookHeader}
      >
        <View style={bookStyles.bookHeaderDecor} />
        <View style={bookStyles.bookHeaderRow}>
          <View style={bookStyles.bookIconBg}>
            <BookOpen size={20} color="#ffffff" />
          </View>
          <View style={bookStyles.bookHeaderTextArea}>
            <Text style={bookStyles.bookTitle}>{subjectName} Notes</Text>
            <Text style={bookStyles.bookSubtitle}>{board} Class {grade} - All Chapters</Text>
          </View>
          <TouchableOpacity onPress={onExport} style={bookStyles.exportBtn}>
            <Share2 size={18} color="#fda4af" />
          </TouchableOpacity>
        </View>

        <View style={bookStyles.progressArea}>
          <View style={bookStyles.progressBarBg}>
            <View style={[bookStyles.progressBarFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={bookStyles.progressText}>Page {currentPage + 1} of {sections.length}</Text>
        </View>
      </LinearGradient>

      <View style={bookStyles.bookBody}>
        <View style={[bookStyles.bookShadowLeft, { backgroundColor: colorScheme.accent + '08' }]} />
        <View style={[bookStyles.bookShadowRight, { backgroundColor: colorScheme.accent + '08' }]} />

        <Animated.View
          style={[
            bookStyles.pageWrapper,
            {
              transform: [
                { translateX },
                { scale: scaleAnim },
                { perspective: 1000 },
              ],
            },
          ]}
        >
          <BookPageContent
            section={currentSection}
            pageNum={currentPage + 1}
            totalPages={sections.length}
          />
        </Animated.View>

        <View style={bookStyles.tapZones}>
          <TouchableOpacity
            style={bookStyles.tapZoneLeft}
            onPress={goPrev}
            disabled={currentPage === 0 || isFlipping}
            activeOpacity={0.6}
          >
            {currentPage > 0 && (
              <View style={[bookStyles.tapHint, bookStyles.tapHintLeft, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <ArrowLeft size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={bookStyles.tapZoneRight}
            onPress={goNext}
            disabled={currentPage === sections.length - 1 || isFlipping}
            activeOpacity={0.6}
          >
            {currentPage < sections.length - 1 && (
              <View style={[bookStyles.tapHint, bookStyles.tapHintRight, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <ArrowRight size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={bookStyles.navBar}>
        <TouchableOpacity
          style={[
            bookStyles.navBtn,
            { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' },
            currentPage === 0 && bookStyles.navBtnDisabled,
          ]}
          onPress={goPrev}
          disabled={currentPage === 0 || isFlipping}
        >
          <ArrowLeft size={18} color={currentPage === 0 ? '#94a3b8' : colorScheme.accent} />
          <Text style={[bookStyles.navBtnText, { color: currentPage === 0 ? '#94a3b8' : colorScheme.accent }]}>Prev</Text>
        </TouchableOpacity>

        <View style={bookStyles.pageIndicators}>
          {sections.length <= 12 ? sections.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => flipToPage(idx)}
              style={[
                bookStyles.pageDot,
                { backgroundColor: idx === currentPage ? colorScheme.accent : (isDark ? '#334155' : '#cbd5e1') },
                idx === currentPage && bookStyles.pageDotActive,
              ]}
            />
          )) : (
            <Text style={[bookStyles.pageIndicatorText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {currentPage + 1} / {sections.length}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            bookStyles.navBtn,
            { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' },
            currentPage === sections.length - 1 && bookStyles.navBtnDisabled,
          ]}
          onPress={goNext}
          disabled={currentPage === sections.length - 1 || isFlipping}
        >
          <Text style={[bookStyles.navBtnText, { color: currentPage === sections.length - 1 ? '#94a3b8' : colorScheme.accent }]}>Next</Text>
          <ArrowRight size={18} color={currentPage === sections.length - 1 ? '#94a3b8' : colorScheme.accent} />
        </TouchableOpacity>
      </View>

      <View style={bookStyles.flipHint}>
        <Text style={[bookStyles.flipHintText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          Tap left/right side of page or use arrows to flip
        </Text>
      </View>

      <TouchableOpacity
        style={[bookStyles.resetButton, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
        onPress={onReset}
      >
        <Text style={[bookStyles.resetText, { color: colors.textSecondary }]}>Generate Another</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const bookStyles = StyleSheet.create({
  bookContainer: {
    flex: 1,
  },
  bookHeader: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  bookHeaderDecor: {
    position: 'absolute' as const,
    top: -20,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bookHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 14,
  },
  bookIconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  bookHeaderTextArea: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  bookSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  exportBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  progressArea: {
    gap: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%' as const,
    backgroundColor: '#fda4af',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600' as const,
  },
  bookBody: {
    position: 'relative' as const,
    minHeight: 420,
  },
  bookShadowLeft: {
    position: 'absolute' as const,
    left: 0,
    top: 10,
    bottom: 10,
    width: 6,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  bookShadowRight: {
    position: 'absolute' as const,
    right: 0,
    top: 10,
    bottom: 10,
    width: 6,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  pageWrapper: {
    minHeight: 420,
  },
  page: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 420,
    position: 'relative' as const,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 3, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 },
      web: { boxShadow: '3px 6px 20px rgba(0,0,0,0.15)' },
    }),
  },
  pageSpine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  marginLine: {
    position: 'absolute' as const,
    left: 24,
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed' as const,
  },
  ruledLines: {
    position: 'absolute' as const,
    left: 30,
    right: 10,
    top: 60,
    bottom: 50,
  },
  ruledLine: {
    height: 28,
    borderBottomWidth: 1,
  },
  pageInner: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 50,
    paddingLeft: 34,
    paddingRight: 16,
    minHeight: 360,
  },
  pageTitleArea: {
    marginBottom: 14,
  },
  pageTitleBg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
  },
  pageTitleLine: {
    height: 2,
    marginTop: 6,
    borderRadius: 1,
  },
  pageContentScroll: {
    flex: 1,
    maxHeight: 320,
  },
  emptyLine: {
    height: 6,
  },
  contentText: {
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: '400' as const,
    marginBottom: 2,
  },
  importantLine: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 7,
    padding: 9,
    borderRadius: 6,
    borderLeftWidth: 3,
    marginVertical: 4,
  },
  importantText: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    lineHeight: 20,
    flex: 1,
  },
  formulaLine: {
    padding: 9,
    borderRadius: 6,
    borderWidth: 1,
    marginVertical: 4,
    alignItems: 'center' as const,
  },
  formulaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    fontStyle: 'italic' as const,
    lineHeight: 20,
  },
  bulletLine: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    paddingVertical: 1,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    fontSize: 13.5,
    lineHeight: 22,
    flex: 1,
    fontWeight: '400' as const,
  },
  pageFooter: {
    position: 'absolute' as const,
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  pageNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pageNum: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  pageTotal: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  cornerFold: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 24,
    borderRightWidth: 24,
    borderRightColor: 'transparent',
  },
  tapZones: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row' as const,
  },
  tapZoneLeft: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
  },
  tapZoneRight: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'flex-end' as const,
  },
  tapHint: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tapHintLeft: {
    marginLeft: 4,
  },
  tapHintRight: {
    marginRight: 4,
  },
  navBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 16,
    gap: 10,
  },
  navBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  pageIndicators: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    flex: 1,
    justifyContent: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  pageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pageDotActive: {
    width: 18,
    height: 7,
    borderRadius: 4,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  flipHint: {
    alignItems: 'center' as const,
    marginTop: 10,
  },
  flipHintText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

function parseNoteSections(text: string): NoteSection[] {
  const sections: NoteSection[] = [];
  const blocks = text.split(/\n(?=(?:#{1,3}\s|[A-Z][A-Z\s&]+:|\*\*[A-Z]))/);
  let colorIdx = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^(?:#{1,3}\s*|\*\*)(.*?)(?:\*\*)?$/m);
    if (headerMatch) {
      const title = headerMatch[1].replace(/\*\*/g, '').replace(/#/g, '').trim();
      const content = trimmed.substring(headerMatch[0].length).trim()
        .replace(/\*\*/g, '')
        .replace(/#{1,3}\s*/g, '')
        .replace(/```[a-z]*\n?/g, '')
        .replace(/```/g, '')
        .trim();
      if (content) {
        sections.push({ title, content, colorIndex: colorIdx });
        colorIdx++;
      }
    } else {
      const cleaned = trimmed
        .replace(/\*\*/g, '')
        .replace(/#{1,3}\s*/g, '')
        .replace(/```[a-z]*\n?/g, '')
        .replace(/```/g, '')
        .trim();
      if (cleaned.length > 10) {
        sections.push({ title: '', content: cleaned, colorIndex: colorIdx });
        colorIdx++;
      }
    }
  }

  if (sections.length === 0 && text.trim().length > 10) {
    const lines = text.split('\n\n').filter(l => l.trim());
    for (const line of lines) {
      sections.push({ title: '', content: line.replace(/\*\*/g, '').replace(/#/g, '').trim(), colorIndex: colorIdx });
      colorIdx++;
    }
  }

  return sections;
}

export default function HandwrittenNotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const { colors, isDark } = useTheme();
  const { isPremium } = useSubscription();

  const [selectedBoard, setSelectedBoard] = useState<BoardKey>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [noteSections, setNoteSections] = useState<NoteSection[]>([]);
  const [rawText, setRawText] = useState('');
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [headerFade]);

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);

  const grades = useMemo(() => selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10, 11, 12] : [9, 10], [selectedBoard]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!isPremium) {
        Alert.alert('Premium Feature', 'Handwritten notes are a premium feature. Please upgrade to access colourful last-minute revision notes.');
        throw new Error('Premium required');
      }
      if (!selectedSubject) {
        Alert.alert('Selection Required', 'Please select a subject.');
        throw new Error('Missing selection');
      }

      const subjectName = selectedSubjectData?.name || '';
      const chaptersList = selectedSubjectData?.chapters.map(c => `Chapter ${c.number}: ${c.title}`).join(', ') || '';

      const prompt = `Generate COMPREHENSIVE colourful handwritten-style LAST MINUTE REVISION NOTES for ${selectedBoard} Class ${selectedGrade} ${subjectName}.

Language: ${selectedLanguage}

This covers ALL chapters combined: ${chaptersList}

IMPORTANT REQUIREMENTS:
- These are LAST MINUTE revision notes - concise, exam-focused, high-yield content only
- Cover ALL chapters of the entire syllabus in ONE combined document
- Organize by chapter/topic with clear section headers
- Use bullet points (- or •) for key points
- Mark important points with * at the start (these will be highlighted)
- Include key formulas marked with = or → symbols
- Include mnemonics and memory tricks where helpful
- Include diagrams described in text (e.g., "Diagram: Force diagram showing...")
- Use arrows → for cause-effect relationships
- Include important dates, names, events for humanities
- Include key reactions and formulas for science subjects
- Include important theorems and identities for mathematics
- Keep it SHORT and CRISP - only what matters for exams
- Each section should be 5-10 key points maximum
- Include "Remember:" tips for commonly confused concepts
- NO lengthy paragraphs - only bullet points and short notes
- Use Unicode for formulas: ×, ÷, ², ³, √, π, Δ, θ, α, β - NO LaTeX

Make this the ULTIMATE last-minute revision sheet that a student can read 1 hour before the exam.`;

      const result = await robustGenerateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setRawText(data);
      const parsed = parseNoteSections(data);
      setNoteSections(parsed);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const handleExportPdf = useCallback(async () => {
    if (!rawText) return;
    try {
      const colorStyles = NOTE_COLORS.map((c, i) => `
        .section-${i} { background: ${c.bg}; border-left: 5px solid ${c.accent}; padding: 16px 20px; margin: 12px 0; border-radius: 8px; }
        .section-${i} h2 { color: ${c.title}; font-size: 16px; margin-bottom: 8px; text-decoration: underline; }
        .section-${i} p { color: ${c.text}; font-size: 12px; line-height: 1.8; margin: 2px 0; }
        .section-${i} .important { background: ${c.highlight}; border-left: 3px solid ${c.accent}; padding: 6px 12px; color: ${c.accent}; font-weight: bold; margin: 4px 0; border-radius: 4px; }
        .section-${i} .formula { background: ${c.accent}15; border: 1px solid ${c.accent}30; padding: 8px; text-align: center; font-style: italic; color: ${c.accent}; margin: 4px 0; border-radius: 4px; }
      `).join('\n');

      const html = `
        <html><head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; padding: 24px; }
          h1 { color: #e11d48; text-align: center; font-size: 22px; margin-bottom: 6px; }
          .subtitle { color: #64748b; text-align: center; font-size: 13px; margin-bottom: 20px; }
          ${colorStyles}
        </style></head><body>
          <h1>${selectedSubjectData?.name || ''} - Last Minute Revision Notes</h1>
          <p class="subtitle">${selectedBoard} Class ${selectedGrade} - All Chapters Combined</p>
          ${noteSections.map((s, i) => `
            <div class="section-${i % NOTE_COLORS.length}">
              ${s.title ? `<h2>${s.title}</h2>` : ''}
              ${s.content.split('\n').map(line => {
                const t = line.trim();
                if (t.startsWith('*') || t.startsWith('!')) return `<div class="important">${t.replace(/^\*\s*|^!\s*/, '')}</div>`;
                if (t.includes('=') || t.includes('→')) return `<div class="formula">${t}</div>`;
                return `<p>${t}</p>`;
              }).join('')}
            </div>
          `).join('')}
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS !== 'web') {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (e) {
      console.log('PDF export error:', e);
      Alert.alert('Error', 'Failed to export PDF.');
    }
  }, [rawText, selectedBoard, selectedGrade, selectedSubjectData, noteSections]);

  const handleSelectSubject = useCallback((subjectId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSubject(subjectId);
    setNoteSections([]);
    setRawText('');
  }, []);

  const handleReset = useCallback(() => {
    setNoteSections([]);
    setRawText('');
  }, []);

  const canGenerate = !!selectedSubject;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Handwritten Notes</Text>
          <View style={styles.premiumTag}>
            <Crown size={10} color="#fbbf24" />
            <Text style={styles.premiumTagText}>PREMIUM</Text>
          </View>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {noteSections.length === 0 && (
          <>
            <Animated.View style={{ opacity: headerFade }}>
              <LinearGradient
                colors={isDark ? ['#1a0a14', '#2d0f1e', '#3d1028'] : ['#4a0e2b', '#7b1141', '#a01751']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}
              >
                <View style={styles.heroDecor1} />
                <View style={styles.heroDecor2} />
                <View style={styles.heroDecor3} />
                <View style={styles.heroIconWrap}>
                  <LinearGradient colors={['#e11d48', '#f43f5e']} style={styles.heroIconBg}>
                    <PenTool size={28} color="#ffffff" />
                  </LinearGradient>
                </View>
                <Text style={styles.heroTitle}>Handwritten Notes</Text>
                <Text style={styles.heroSubtitle}>
                  Colourful last-minute revision notes covering ALL chapters. Flip through pages like a real book!
                </Text>
                <View style={styles.heroFeatures}>
                  <View style={[styles.heroFeature, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
                    <Sparkles size={12} color="#fbbf24" />
                    <Text style={styles.heroFeatureText}>AI Generated</Text>
                  </View>
                  <View style={[styles.heroFeature, { backgroundColor: 'rgba(52,211,153,0.2)' }]}>
                    <BookOpen size={12} color="#34d399" />
                    <Text style={styles.heroFeatureText}>Book Style</Text>
                  </View>
                  <View style={[styles.heroFeature, { backgroundColor: 'rgba(244,63,94,0.2)' }]}>
                    <Highlighter size={12} color="#fb7185" />
                    <Text style={styles.heroFeatureText}>Colourful</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Board</Text>
              <View style={styles.boardButtons}>
                {(['NCERT', 'ICSE'] as BoardKey[]).map((board) => (
                  <TouchableOpacity
                    key={board}
                    style={[
                      styles.boardBtn,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                      selectedBoard === board && (board === 'NCERT' ? styles.boardBtnActiveNCERT : styles.boardBtnActiveICSE),
                    ]}
                    onPress={() => { setSelectedBoard(board); setSelectedGrade(board === 'NCERT' ? 6 : 9); setSelectedSubject(''); setNoteSections([]); setRawText(''); }}
                  >
                    <Text style={[styles.boardBtnText, { color: colors.textSecondary }, selectedBoard === board && styles.boardBtnTextActive]}>
                      {board}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {grades.map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeBtn,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                      selectedGrade === grade && styles.gradeBtnActive,
                    ]}
                    onPress={() => { setSelectedGrade(grade); setSelectedSubject(''); setNoteSections([]); setRawText(''); }}
                  >
                    <Text style={[styles.gradeBtnText, { color: colors.textSecondary }, selectedGrade === grade && styles.gradeBtnTextActive]}>
                      Class {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subject</Text>
              <View style={styles.subjectGrid}>
                {subjects.map((subject) => {
                  const isSelected = selectedSubject === subject.id;
                  const subjectColor = subject.name === 'Mathematics' ? '#2563eb'
                    : subject.name === 'Physics' ? '#be185d'
                    : subject.name === 'Chemistry' ? '#15803d'
                    : subject.name === 'Biology' ? '#059669'
                    : subject.name === 'Science' ? '#0891b2'
                    : '#6366f1';

                  return (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectChip,
                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                        isSelected && { backgroundColor: subjectColor, borderColor: subjectColor },
                      ]}
                      onPress={() => handleSelectSubject(subject.id)}
                    >
                      <View style={[styles.subjectDot, { backgroundColor: isSelected ? '#ffffff' : subjectColor }]} />
                      <Text style={[styles.subjectChipText, { color: colors.textSecondary }, isSelected && { color: '#ffffff' }]}>
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.helperText, { color: colors.textTertiary }]}>
                Notes will cover ALL chapters combined for the selected subject
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
              onPress={() => generateMutation.mutate()}
              disabled={!canGenerate || generateMutation.isPending}
            >
              <LinearGradient
                colors={canGenerate ? ['#e11d48', '#f43f5e'] : ['#94a3b8', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateGradient}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={20} color="#ffffff" />
                    <Text style={styles.generateText}>Creating Colourful Notes...</Text>
                  </>
                ) : (
                  <>
                    <PenTool size={20} color="#ffffff" />
                    <Text style={styles.generateText}>Generate Handwritten Notes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {generateMutation.isError && generateMutation.error?.message !== 'Premium required' && generateMutation.error?.message !== 'Missing selection' && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to generate notes. Please try again.</Text>
              </View>
            )}
          </>
        )}

        {noteSections.length > 0 && (
          <BookViewer
            sections={noteSections}
            subjectName={selectedSubjectData?.name || ''}
            board={selectedBoard}
            grade={selectedGrade}
            isDark={isDark}
            colors={colors}
            onReset={handleReset}
            onExport={handleExportPdf}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  premiumTagText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative' as const,
    alignItems: 'center' as const,
  },
  heroDecor1: {
    position: 'absolute' as const,
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  heroDecor2: {
    position: 'absolute' as const,
    bottom: -40,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  heroDecor3: {
    position: 'absolute' as const,
    top: 20,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
  },
  heroIconWrap: {
    marginBottom: 16,
  },
  heroIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fda4af',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 18,
    maxWidth: 300,
  },
  heroFeatures: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  heroFeature: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroFeatureText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fecdd3',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  boardButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  boardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center' as const,
  },
  boardBtnActiveNCERT: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  boardBtnActiveICSE: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  boardBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  boardBtnTextActive: {
    color: '#ffffff',
  },
  gradeBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  gradeBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  gradeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  gradeBtnTextActive: {
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 8,
  },
  subjectChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#e11d48', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(225, 29, 72, 0.3)' },
    }),
  },
  generateBtnDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0.1 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
    }),
  },
  generateGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  errorCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
});
