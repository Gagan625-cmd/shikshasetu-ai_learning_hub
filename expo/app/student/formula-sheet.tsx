import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Loader2, Crown, Calculator, FlaskConical, Atom, Share2, Download } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useSubscription } from '@/contexts/subscription-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type SubjectKey = 'Mathematics' | 'Physics' | 'Chemistry';
type BoardKey = 'NCERT' | 'ICSE';

interface SubjectConfig {
  key: SubjectKey;
  label: string;
  icon: typeof Calculator;
  gradient: [string, string];
  accentColor: string;
  grades: number[];
}

const SUBJECT_CONFIGS: Record<BoardKey, SubjectConfig[]> = {
  NCERT: [
    { key: 'Mathematics', label: 'Mathematics', icon: Calculator, gradient: ['#1e3a5f', '#2563eb'], accentColor: '#60a5fa', grades: [6, 7, 8, 9, 10, 11, 12] },
    { key: 'Physics', label: 'Physics', icon: Atom, gradient: ['#3b1f2b', '#be185d'], accentColor: '#f472b6', grades: [11, 12] },
    { key: 'Chemistry', label: 'Chemistry', icon: FlaskConical, gradient: ['#1a2e1a', '#15803d'], accentColor: '#4ade80', grades: [11, 12] },
  ],
  ICSE: [
    { key: 'Mathematics', label: 'Mathematics', icon: Calculator, gradient: ['#1e3a5f', '#2563eb'], accentColor: '#60a5fa', grades: [9, 10] },
    { key: 'Physics', label: 'Physics', icon: Atom, gradient: ['#3b1f2b', '#be185d'], accentColor: '#f472b6', grades: [9, 10] },
    { key: 'Chemistry', label: 'Chemistry', icon: FlaskConical, gradient: ['#1a2e1a', '#15803d'], accentColor: '#4ade80', grades: [9, 10] },
  ],
};

const FormulaSection = ({ title, content, accentColor, isDark, index }: { title: string; content: string; accentColor: string; isDark: boolean; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 500);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={[sectionStyles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[sectionStyles.card, { backgroundColor: isDark ? '#1a1f2e' : '#ffffff', borderColor: isDark ? accentColor + '30' : '#e5e7eb' }]}>
        <View style={[sectionStyles.accentBar, { backgroundColor: accentColor }]} />
        {title ? (
          <View style={sectionStyles.titleRow}>
            <View style={[sectionStyles.titleDot, { backgroundColor: accentColor }]} />
            <Text style={[sectionStyles.title, { color: isDark ? accentColor : '#1e293b' }]}>{title}</Text>
          </View>
        ) : null}
        <Text style={[sectionStyles.content, { color: isDark ? '#cbd5e1' : '#374151' }]}>{content}</Text>
      </View>
    </Animated.View>
  );
};

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.08)' },
    }),
  },
  accentBar: {
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    flex: 1,
  },
  content: {
    fontSize: 14,
    lineHeight: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    fontWeight: '400' as const,
  },
});

function parseFormulaSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const blocks = text.split(/\n(?=(?:#{1,3}\s|[A-Z][A-Z\s&]+:|\*\*[A-Z]))/);

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
        sections.push({ title, content });
      }
    } else {
      const cleaned = trimmed
        .replace(/\*\*/g, '')
        .replace(/#{1,3}\s*/g, '')
        .replace(/```[a-z]*\n?/g, '')
        .replace(/```/g, '')
        .trim();
      if (cleaned.length > 10) {
        sections.push({ title: '', content: cleaned });
      }
    }
  }

  if (sections.length === 0 && text.trim().length > 10) {
    const lines = text.split('\n\n').filter(l => l.trim());
    for (const line of lines) {
      sections.push({ title: '', content: line.replace(/\*\*/g, '').replace(/#/g, '').trim() });
    }
  }

  return sections;
}

export default function FormulaSheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage } = useApp();
  const { colors, isDark } = useTheme();
  const { isPremium } = useSubscription();

  const [selectedBoard, setSelectedBoard] = useState<BoardKey>('NCERT');
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [formulaSections, setFormulaSections] = useState<{ title: string; content: string }[]>([]);
  const [rawText, setRawText] = useState('');
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [headerFade]);

  const subjectConfigs = SUBJECT_CONFIGS[selectedBoard];

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!isPremium) {
        Alert.alert('Premium Feature', 'Formula sheets are a premium feature. Please upgrade to access comprehensive formula sheets.');
        throw new Error('Premium required');
      }
      if (!selectedSubject || !selectedGrade) {
        Alert.alert('Selection Required', 'Please select a subject and grade.');
        throw new Error('Missing selection');
      }

      const prompt = `Generate a COMPLETE and COMPREHENSIVE formula sheet for ${selectedBoard} Class ${selectedGrade} ${selectedSubject.key}.

Language: ${selectedLanguage}

IMPORTANT REQUIREMENTS:
- Include ALL formulas from ALL chapters combined
- Organize by topic/chapter name
- Use Unicode symbols for all formulas (×, ÷, ², ³, √, π, Δ, θ, α, β, γ, ∑, ∫, ∞, ≠, ≤, ≥, →, ⇒, ∝, ∈, ∅, ∩, ∪) - NO LaTeX
- Each formula should have the formula name and the formula itself
- Include units where applicable
- Include important constants and their values
- For Physics: include all equations, laws, constants, and unit conversions
- For Chemistry: include all reaction formulas, equations, constants, periodic trends formulas
- For Mathematics: include all theorems, identities, area/volume formulas, trigonometric identities, algebraic identities
- Group formulas by chapter/topic with clear headers
- Make it exam-ready - include everything a student needs for quick revision
- Format each section clearly with section headers

This should be a COMPLETE formula reference covering the ENTIRE syllabus for the year.`;

      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setRawText(data);
      const parsed = parseFormulaSections(data);
      setFormulaSections(parsed);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const handleExportPdf = useCallback(async () => {
    if (!rawText) return;
    try {
      const html = `
        <html><head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; padding: 32px; line-height: 1.7; color: #1e293b; }
          h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 8px; font-size: 22px; }
          h2 { color: #0f766e; margin-top: 24px; font-size: 17px; }
          h3 { color: #7c3aed; font-size: 15px; }
          p { margin: 6px 0; font-size: 13px; }
          .formula { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 8px 14px; margin: 8px 0; border-radius: 6px; font-size: 13px; }
        </style></head><body>
          <h1>${selectedBoard} Class ${selectedGrade} - ${selectedSubject?.key} Formula Sheet</h1>
          ${rawText.split('\n').map(line => {
            if (line.startsWith('###')) return `<h3>${line.replace(/###\s*/, '').replace(/\*\*/g, '')}</h3>`;
            if (line.startsWith('##')) return `<h2>${line.replace(/##\s*/, '').replace(/\*\*/g, '')}</h2>`;
            if (line.startsWith('#')) return `<h1>${line.replace(/#\s*/, '').replace(/\*\*/g, '')}</h1>`;
            if (line.includes('=') || line.includes('→')) return `<div class="formula">${line.replace(/\*\*/g, '')}</div>`;
            return `<p>${line.replace(/\*\*/g, '<b>').replace(/\*\*/g, '</b>')}</p>`;
          }).join('')}
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
  }, [rawText, selectedBoard, selectedGrade, selectedSubject]);

  const handleSelectSubject = useCallback((subject: SubjectConfig) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSubject(subject);
    setSelectedGrade(null);
    setFormulaSections([]);
    setRawText('');
  }, []);

  const handleSelectGrade = useCallback((grade: number) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedGrade(grade);
    setFormulaSections([]);
    setRawText('');
  }, []);

  const currentAccent = selectedSubject?.accentColor || '#3b82f6';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Formula Sheet</Text>
          <View style={styles.premiumTag}>
            <Crown size={10} color="#fbbf24" />
            <Text style={styles.premiumTagText}>PREMIUM</Text>
          </View>
        </View>
        {formulaSections.length > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleExportPdf}>
            <Share2 size={20} color={currentAccent} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {formulaSections.length === 0 && (
          <>
            <Animated.View style={{ opacity: headerFade }}>
              <LinearGradient
                colors={selectedSubject ? selectedSubject.gradient : (isDark ? ['#0c1222', '#162032'] : ['#0f172a', '#1e293b'])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}
              >
                <View style={styles.heroDecor1} />
                <View style={styles.heroDecor2} />
                <View style={styles.heroIconWrap}>
                  <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.heroIconBg}>
                    <Calculator size={28} color="#ffffff" />
                  </LinearGradient>
                </View>
                <Text style={styles.heroTitle}>Formula Sheet</Text>
                <Text style={styles.heroSubtitle}>
                  Complete formula reference for Maths, Physics & Chemistry. All chapters combined in one sheet.
                </Text>
                <View style={styles.heroFeatures}>
                  <View style={styles.heroFeature}>
                    <Sparkles size={12} color="#fbbf24" />
                    <Text style={styles.heroFeatureText}>AI Generated</Text>
                  </View>
                  <View style={styles.heroFeature}>
                    <Download size={12} color="#60a5fa" />
                    <Text style={styles.heroFeatureText}>Export PDF</Text>
                  </View>
                  <View style={styles.heroFeature}>
                    <Crown size={12} color="#f97316" />
                    <Text style={styles.heroFeatureText}>Premium</Text>
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
                    onPress={() => { setSelectedBoard(board); setSelectedSubject(null); setSelectedGrade(null); setFormulaSections([]); setRawText(''); }}
                  >
                    <Text style={[styles.boardBtnText, { color: colors.textSecondary }, selectedBoard === board && styles.boardBtnTextActive]}>
                      {board}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subject</Text>
              <View style={styles.subjectCards}>
                {subjectConfigs.map((subject) => {
                  const Icon = subject.icon;
                  const isSelected = selectedSubject?.key === subject.key;
                  return (
                    <TouchableOpacity
                      key={subject.key}
                      style={[styles.subjectCard, { borderColor: isSelected ? subject.accentColor : (isDark ? '#2a2f3e' : '#e5e7eb') }]}
                      onPress={() => handleSelectSubject(subject)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isSelected ? subject.gradient : (isDark ? ['#1a1f2e', '#222736'] : ['#f8fafc', '#f1f5f9'])}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.subjectCardGradient}
                      >
                        <View style={[styles.subjectIconWrap, { backgroundColor: subject.accentColor + '20' }]}>
                          <Icon size={24} color={isSelected ? '#ffffff' : subject.accentColor} />
                        </View>
                        <Text style={[styles.subjectCardLabel, { color: isSelected ? '#ffffff' : colors.text }]}>
                          {subject.label}
                        </Text>
                        <Text style={[styles.subjectCardGrades, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                          Class {subject.grades[0]}-{subject.grades[subject.grades.length - 1]}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {selectedSubject && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedSubject.grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeBtn,
                        { backgroundColor: colors.cardBg, borderColor: colors.border },
                        selectedGrade === grade && { backgroundColor: currentAccent, borderColor: currentAccent },
                      ]}
                      onPress={() => handleSelectGrade(grade)}
                    >
                      <Text style={[styles.gradeBtnText, { color: colors.textSecondary }, selectedGrade === grade && { color: '#ffffff' }]}>
                        Class {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.generateBtn, (!selectedSubject || !selectedGrade) && styles.generateBtnDisabled]}
              onPress={() => generateMutation.mutate()}
              disabled={!selectedSubject || !selectedGrade || generateMutation.isPending}
            >
              <LinearGradient
                colors={selectedSubject && selectedGrade ? ['#f59e0b', '#ef4444'] : ['#94a3b8', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateGradient}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={20} color="#ffffff" />
                    <Text style={styles.generateText}>Generating Formula Sheet...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.generateText}>Generate Formula Sheet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {generateMutation.isError && generateMutation.error?.message !== 'Premium required' && generateMutation.error?.message !== 'Missing selection' && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to generate formula sheet. Please try again.</Text>
              </View>
            )}
          </>
        )}

        {formulaSections.length > 0 && (
          <View style={styles.resultSection}>
            <LinearGradient
              colors={selectedSubject ? selectedSubject.gradient : ['#0f172a', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultHeader}
            >
              <View style={styles.resultHeaderDecor} />
              <View style={styles.resultHeaderContent}>
                <View style={[styles.resultIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  {selectedSubject && <selectedSubject.icon size={22} color="#ffffff" />}
                </View>
                <View style={styles.resultHeaderText}>
                  <Text style={styles.resultTitle}>{selectedSubject?.label} Formulas</Text>
                  <Text style={styles.resultSubtitle}>{selectedBoard} Class {selectedGrade} - All Chapters</Text>
                </View>
              </View>
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{formulaSections.length} sections</Text>
              </View>
            </LinearGradient>

            {formulaSections.map((section, idx) => (
              <FormulaSection
                key={idx}
                title={section.title}
                content={section.content}
                accentColor={currentAccent}
                isDark={isDark}
                index={idx}
              />
            ))}

            <TouchableOpacity
              style={[styles.resetButton, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
              onPress={() => {
                setFormulaSections([]);
                setRawText('');
              }}
            >
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>Generate Another</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  heroDecor2: {
    position: 'absolute' as const,
    bottom: -40,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
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
    color: '#94a3b8',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 18,
    maxWidth: 300,
  },
  heroFeatures: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  heroFeature: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroFeatureText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#cbd5e1',
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
  subjectCards: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  subjectCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  subjectCardGradient: {
    padding: 18,
    alignItems: 'center' as const,
    gap: 10,
  },
  subjectIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  subjectCardLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  subjectCardGrades: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  gradeBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  gradeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)' },
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
  resultSection: {
    gap: 0,
  },
  resultHeader: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  resultHeaderDecor: {
    position: 'absolute' as const,
    top: -20,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resultHeaderContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    marginBottom: 12,
  },
  resultIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  resultSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  resultBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
