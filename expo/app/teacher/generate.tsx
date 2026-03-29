import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, FileText, BookText, ScrollText, Loader2, Network, Download, Share2, Volume2, VolumeX } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { generatePdfHtml } from '@/lib/pdf-formatter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateText } from '@/lib/ai-generate';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

const CONTENT_TYPES = [
  { id: 'lesson' as const, label: 'Lesson Plan', icon: BookText, color: '#3b82f6' },
  { id: 'notes' as const, label: 'Teaching Notes', icon: FileText, color: '#8b5cf6' },
  { id: 'explanation' as const, label: 'Explanation', icon: BookText, color: '#10b981' },
  { id: 'summary' as const, label: 'Summary', icon: ScrollText, color: '#f59e0b' },
  { id: 'worksheet' as const, label: 'Worksheet', icon: FileText, color: '#06b6d4' },
  { id: 'mcqs' as const, label: 'MCQs', icon: FileText, color: '#0ea5e9' },
  { id: 'assertion' as const, label: 'Assert-Reason', icon: FileText, color: '#d946ef' },
  { id: 'casebased' as const, label: 'Case-Based', icon: FileText, color: '#14b8a6' },
  { id: 'competency' as const, label: 'Competency', icon: FileText, color: '#f97316' },
  { id: 'numerical' as const, label: 'Numericals', icon: FileText, color: '#6366f1' },
  { id: 'mindmap' as const, label: 'Mind Map', icon: Network, color: '#8b5cf6' },
  { id: 'questionpaper' as const, label: 'Question Paper', icon: FileText, color: '#ef4444' },
];

export default function TeacherContentGenerator() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addTeacherActivity } = useApp();
  const { colors } = useTheme();
  
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'notes' | 'explanation' | 'summary' | 'worksheet' | 'lesson' | 'mindmap' | 'questionpaper' | 'mcqs' | 'assertion' | 'casebased' | 'competency' | 'numerical'>('lesson');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const allSubjects = useMemo(
    () => selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS,
    [selectedBoard]
  );
  
  const subjects = useMemo(
    () => allSubjects.filter((s) => s.grade === selectedGrade),
    [allSubjects, selectedGrade]
  );
  
  const chapters = useMemo(
    () => subjects.find((s) => s.id === selectedSubject)?.chapters || [],
    [subjects, selectedSubject]
  );
  
  const selectedChapterData = useMemo(
    () => chapters.find((c) => c.id === selectedChapter),
    [chapters, selectedChapter]
  );

  const selectedChaptersData = useMemo(
    () => chapters.filter((c) => selectedChapters.includes(c.id)),
    [chapters, selectedChapters]
  );

  const toggleChapterSelection = useCallback((chapterId: string) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterId)) {
        return prev.filter(id => id !== chapterId);
      }
      return [...prev, chapterId];
    });
    setSelectedChapter('');
    setCustomTopic('');
  }, []);

  const isMultiChapterMode = useMemo(
    () => contentType === 'questionpaper',
    [contentType]
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      let chapterInfo = '';
      
      if (isMultiChapterMode && selectedChaptersData.length > 0) {
        chapterInfo = selectedChaptersData.map(c => 
          `Chapter ${c.number}: ${c.title} - ${c.description}`
        ).join('\n');
      } else if (selectedChapterData) {
        chapterInfo = `Chapter ${selectedChapterData.number}: ${selectedChapterData.title} - ${selectedChapterData.description}`;
      } else {
        chapterInfo = customTopic;
      }
      
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || 'General Topic';
      
      const isHigherGrade = selectedGrade >= 11;
      const GRADE_11_12_DISTRIBUTION = isHigherGrade ? `

═══════════════════════════════════════════════════════════════
              STRICT QUESTION DISTRIBUTION (CLASS 11-12)
═══════════════════════════════════════════════════════════════

QUESTION TYPE DISTRIBUTION (MANDATORY):
• 50% COMPETENCY-BASED: Application-based, case-study, real-life scenarios, analytical & reasoning
• 30% NUMERICAL: Formula-based calculations, multi-step problem solving, data-based numericals
• 20% CONCEPTUAL: Definitions, theory-based understanding, direct & indirect conceptual clarity

DIFFICULTY LEVEL DISTRIBUTION (MANDATORY):
• 30% EASY: Direct recall, basic formula application, straightforward concepts
• 40% MEDIUM: Multi-step problems, application of 2+ concepts, moderate analysis
• 30% HARD: Complex multi-concept problems, advanced derivations, critical evaluation

Mark each question with tags: [COMPETENCY-BASED], [NUMERICAL], or [CONCEPTUAL]
Mark difficulty: [EASY], [MEDIUM], or [HARD]` : '';

      const hasNumericals = ['Physics', 'Chemistry', 'Mathematics'].includes(subjectName) || 
        (subjectName === 'Geography' && isHigherGrade);

      let prompt = '';
      switch (contentType) {
        case 'lesson':
          prompt = `Generate a comprehensive lesson plan for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For all mathematical formulas:\n- Use plain text with Unicode symbols (×, ÷, ², ³, √, π, Δ, etc.)\n- NO LaTeX syntax like \\[ \\] or $ $\n- Example: Area = πr², Force = m × a\n\nCreate a structured lesson plan in ${selectedLanguage} language with: learning objectives, teaching methodology, key concepts, examples, activities, and assessment methods.${isHigherGrade ? '\n\nFor Class 11-12, include NCERT exercise coverage, competency-based activities, and numerical problem-solving strategies.' : ''}`;
          break;
        case 'notes':
          prompt = `Generate comprehensive teaching notes for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX\n- Example: SI = (P × R × T)/100\n\nProvide detailed notes in ${selectedLanguage} language with key concepts, definitions, formulas, examples, and teaching tips.${isHigherGrade ? '\n\nFor Class 11-12, include:\n- Detailed + Revision notes format\n- All NCERT exercise concepts covered\n- Key derivations and proofs\n- Important numerical examples with step-by-step solutions\n- Inter-chapter connections\n- Board exam important questions highlights' : ''}`;
          break;
        case 'explanation':
          prompt = `Create a detailed teaching explanation for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nExplain in ${selectedLanguage} language with simple examples, analogies, and step-by-step breakdown suitable for teaching.${isHigherGrade ? '\n\nFor Class 11-12, provide:\n- Basic → Advanced concept progression\n- Real-world applications and case studies\n- Common misconceptions and how to address them\n- Numerical problem-solving techniques\n- NCERT exercise question explanations' : ''}`;
          break;
        case 'summary':
          prompt = `Create a concise teaching summary for Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nSummarize in ${selectedLanguage} language covering all important points in bullet format with teaching notes.${isHigherGrade ? '\n\nFor Class 11-12, include:\n- Chapter-wise key formulas and derivations\n- Important definitions for board exams\n- Quick revision points\n- NCERT exercise important questions summary' : ''}`;
          break;
        case 'worksheet': {
          prompt = `Generate practice worksheet for students studying ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n- Example: Calculate using A = πr²${GRADE_11_12_DISTRIBUTION}\n\nCreate ${isHigherGrade ? '15' : '10'} practice questions in ${selectedLanguage} language with varying difficulty levels. Include MCQs${isHigherGrade ? ' (at least 30% numerical-based)' : ''}, short answers, and ${isHigherGrade ? 'numerical/derivation problems' : 'word problems'}.${isHigherGrade ? ' Follow the strict question distribution above.' : ''}

CRITICAL RULE: DO NOT include answers, solutions, or correct options alongside or below any question. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end of the worksheet.

ANSWER KEY

Provide all answers here at the end.`;
          break;
        }
        case 'mcqs': {
          prompt = `Generate a comprehensive MCQ set for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas: Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX${GRADE_11_12_DISTRIBUTION}\n\nGenerate ${isHigherGrade ? '20' : '15'} MCQs in ${selectedLanguage} language.\n\n${isHigherGrade ? `Follow STRICT distribution:
• 10 Competency-Based MCQs (application, real-world, analytical)
• 6 Numerical MCQs (calculation-based, formula application)${hasNumericals ? '' : ' - Use data interpretation questions'}
• 4 Conceptual MCQs (definitions, theory, direct understanding)

Difficulty: 6 Easy, 8 Medium, 6 Hard` : `Include:
• 8 Conceptual MCQs
• 4 Application-based MCQs
• 3 ${hasNumericals ? 'Numerical' : 'Analytical'} MCQs

Difficulty: 5 Easy, 6 Medium, 4 Hard`}\n\nEach MCQ must have 4 options (a, b, c, d).\n\nCRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end with explanations.\n\nANSWER KEY\n\nProvide all answers with detailed explanations here.`;
          break;
        }
        case 'assertion': {
          prompt = `Generate Assertion-Reason questions for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas: Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX${GRADE_11_12_DISTRIBUTION}\n\nGenerate ${isHigherGrade ? '15' : '10'} Assertion-Reason questions in ${selectedLanguage} language.\n\nFormat for EACH question:\nAssertion (A): [Clear statement]\nReason (R): [Supporting/contradicting reason]\n\nOptions:\n(a) Both A and R are true and R is the correct explanation of A.\n(b) Both A and R are true but R is NOT the correct explanation of A.\n(c) A is true but R is false.\n(d) A is false but R is true.\n\n${isHigherGrade ? `Follow STRICT distribution:
• 8 Competency-Based (real-world application assertions)
• 4 Numerical-concept based (formula/calculation related assertions)
• 3 Conceptual (direct theory-based)

Difficulty: 5 Easy, 6 Medium, 4 Hard` : `Include mix of conceptual and application-based assertions.
Difficulty: 3 Easy, 4 Medium, 3 Hard`}\n\nCRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end.\n\nANSWER KEY\n\nProvide all answers with detailed explanations.`;
          break;
        }
        case 'casebased': {
          prompt = `Generate Case-Based / Passage-Based questions for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas: Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX${GRADE_11_12_DISTRIBUTION}\n\nGenerate ${isHigherGrade ? '5' : '3'} Case Studies in ${selectedLanguage} language.\n\nEach case study must include:\n1. A real-world scenario/passage (5-8 lines) related to the topic\n2. 4-5 sub-questions based on the case\n   - Mix of MCQs and short answer questions\n   - Include analytical and reasoning questions\n   ${hasNumericals ? '- Include at least 1 numerical sub-question per case' : '- Include data interpretation questions'}\n\n${isHigherGrade ? `Follow STRICT distribution across all cases:
• 50% Competency-focused sub-questions (application, analysis)
• 30% Numerical sub-questions (calculations, data-based)
• 20% Conceptual sub-questions (identification, definition)

Difficulty: 30% Easy, 40% Medium, 30% Hard` : `Include mix of recall and application questions.
Difficulty: 30% Easy, 50% Medium, 20% Hard`}\n\nCRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end.\n\nANSWER KEY\n\nProvide all answers with detailed solutions.`;
          break;
        }
        case 'competency': {
          prompt = `Generate Competency-Based Questions for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas: Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX${GRADE_11_12_DISTRIBUTION}\n\nGenerate ${isHigherGrade ? '15' : '10'} Competency-Based questions in ${selectedLanguage} language.\n\nThese questions MUST test:\n- Application of concepts to real-world situations\n- Critical thinking and analytical reasoning\n- Problem-solving using learned principles\n- Inter-disciplinary connections\n- Evaluation and judgment skills\n\nQuestion types to include:\n• Scenario-based questions with real-life contexts\n• Data interpretation and analysis questions\n• Multi-step reasoning problems\n• Questions connecting classroom learning to everyday life\n${hasNumericals ? '• Numerical problems set in real-world contexts' : '• Source-based analytical questions'}\n\n${isHigherGrade ? `Difficulty Distribution:
• 5 Easy (single-concept application)
• 6 Medium (multi-concept, moderate analysis)
• 4 Hard (complex real-world, multi-step reasoning)` : `Difficulty Distribution:
• 3 Easy, 4 Medium, 3 Hard`}\n\nCRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end.\n\nANSWER KEY\n\nProvide all answers with detailed explanations.`;
          break;
        }
        case 'numerical': {
          const numericalNote = hasNumericals 
            ? `Generate numerical/problem-solving questions for ${subjectName}.`
            : `Generate data-based and analytical problems for ${subjectName}. Since this is not a pure science/math subject, focus on data interpretation, statistical analysis, and quantitative reasoning questions.`;
          prompt = `${numericalNote}\n\n${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT - For formulas: Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX${GRADE_11_12_DISTRIBUTION}\n\nGenerate ${isHigherGrade ? '15' : '10'} ${hasNumericals ? 'numerical problems' : 'data-based problems'} in ${selectedLanguage} language.\n\n${hasNumericals ? `Include:
• Problems requiring formula application
• Multi-step calculation problems
• Derivation-based numerical questions
• Word problems with real-world context
• Problems testing conceptual understanding through calculations` : `Include:
• Data interpretation questions with tables/statistics
• Analytical reasoning with quantitative data
• Map-based calculations (for Geography)
• Timeline and chronological analysis questions`}\n\n${isHigherGrade ? `Difficulty Distribution:
• 5 Easy (direct formula application, single-step)
• 6 Medium (multi-step, 2-3 concepts combined)
• 4 Hard (complex derivation, advanced problem solving)` : `Difficulty Distribution:
• 3 Easy, 4 Medium, 3 Hard`}\n\nFor each problem, clearly state given data and what needs to be found.\n\nCRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end.\n\nANSWER KEY\n\nProvide step-by-step solutions for all problems.`;
          break;
        }
        case 'mindmap':
          prompt = `Generate a colorful and comprehensive mind map for teaching ${selectedBoard} Grade ${selectedGrade} ${subjectName}.\nTopic: ${chapterInfo}\n\nIMPORTANT MIND MAP FORMAT:\nCreate a hierarchical, structured mind map in ${selectedLanguage} language.\n\nCRITICAL - For formulas:\n- Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX\n\nUse this format:\n🎯 **CENTRAL TOPIC: ${chapterInfo}**\n\n📌 **Branch 1: [Main Concept Name]**\n  ├─ Key Point 1\n  ├─ Key Point 2\n  └─ Key Point 3\n\n📌 **Branch 2: [Main Concept Name]**\n  ├─ Key Point 1\n  ├─ Key Point 2\n  └─ Key Point 3\n\nIMPORTANT REQUIREMENTS:\n- Use colorful emojis (🔴🔵🟢🟡🟣🔶💡⭐✨📚🎓💎) to make it vibrant\n- Create 5-7 main branches\n- Each branch should have 3-5 sub-points\n- Keep points concise and clear\n- Use **bold** for main concepts\n- Make it visually organized and easy to follow\n- Include teaching tips, key formulas, and examples where relevant`;
          break;
        case 'questionpaper': {
          const chaptersForPaper = isMultiChapterMode && selectedChaptersData.length > 0 
            ? selectedChaptersData.map(c => `${c.number}. ${c.title}`).join(', ')
            : chapterInfo;
          
          if (selectedBoard === 'ICSE') {
            
            prompt = `Generate a comprehensive ICSE Board format question paper for Class ${selectedGrade} ${subjectName}.

Chapters Covered: ${chaptersForPaper}

Detailed Syllabus Coverage:
${chapterInfo}

IMPORTANT - Generate in ${selectedLanguage} language following OFFICIAL ICSE BOARD EXAM PATTERN.

CRITICAL - For all formulas:
- Use plain text with Unicode (×, ÷, ², ³, √, π, Δ, θ) - NO LaTeX syntax
${GRADE_11_12_DISTRIBUTION}

══════════════════════════════════════════════════════════════
                    SPECIAL REQUIREMENTS
══════════════════════════════════════════════════════════════

📊 DIAGRAM-BASED QUESTIONS (Include in question paper):
- Include diagram-based questions where students must interpret, label, or draw diagrams
- For diagram questions, provide detailed text descriptions in [DIAGRAM: ...] format

🖼️ PICTURE/FIGURE-BASED QUESTIONS:
- Include questions based on pictures, graphs, charts, or experimental setups
- Describe the picture/figure in detail within [FIGURE: ...] format

🎯 COMPETENCY-BASED QUESTIONS (${isHigherGrade ? '50% of total marks = 40 marks' : '20% of total marks = 16 marks'}):
- Application-based, case study, real-world problem solving
- Mark with [COMPETENCY-BASED] tag

${isHigherGrade && hasNumericals ? `🔢 NUMERICAL QUESTIONS (30% of total marks = 24 marks):
- Include calculation-based problems requiring formula application
- Multi-step numerical problems
- Mark with [NUMERICAL] tag
- ⚠️ MANDATORY: Include AT LEAST 15 numerical questions spread across ALL sections
- 40% of numericals (at least 6) MUST be COMPETENCY-BASED numericals (real-world application numericals)
- Numericals must include: direct formula-based (Easy), multi-step problems (Medium), complex derivation-based (Hard)
` : ''}
══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${selectedGrade}
                    SUBJECT: ${subjectName.toUpperCase()}
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers from the given options.

[Generate 15 MCQs including:
- Direct conceptual MCQs (${isHigherGrade ? '3' : '6'} questions)
- Assertion-Reason questions (3 questions)
- DIAGRAM-BASED MCQs (3 questions) with [DIAGRAM: description]
- COMPETENCY-BASED MCQs (${isHigherGrade ? '4' : '3'} questions)
${isHigherGrade && hasNumericals ? '- NUMERICAL MCQs (2 questions)' : ''}]

**Question 2** [25 marks]

(i) Name the following: [5 marks]
(ii) [DIAGRAM-BASED] Study the diagram and answer: [5 marks]
(iii) Give reasons/Differentiate: [5 marks]
(iv) [COMPETENCY-BASED] Case Study: [5 marks]
(v) ${hasNumericals ? '[NUMERICAL] Problems with steps: [5 marks]' : 'Match the following OR Fill in blanks: [5 marks]'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Generate Questions 3-7, each 10 marks, with mix of:
- Conceptual questions
- Diagram-based questions
- ${hasNumericals ? 'Numerical problems' : 'Analytical questions'}
- Competency-based questions
- At least one full competency-based case study question]

Difficulty: Easy (30%), Medium (40%), Hard (30%)

CRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in a separate "ANSWER KEY" section at the very end.

ANSWER KEY

Provide complete detailed solutions here at the end.`;
          } else {
            prompt = `Generate a comprehensive NCERT/CBSE board format question paper for Grade ${selectedGrade} ${subjectName}.

Chapters Covered: ${chaptersForPaper}

Detailed Syllabus Coverage:
${chapterInfo}

IMPORTANT FORMAT REQUIREMENTS:
Generate in ${selectedLanguage} language following official CBSE board exam format.

CRITICAL - For all formulas:
- Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX
${GRADE_11_12_DISTRIBUTION}

══════════════════════════════════════════════════════════════
                    SPECIAL REQUIREMENTS
══════════════════════════════════════════════════════════════

${isHigherGrade ? `🎯 COMPETENCY-BASED QUESTIONS (50% of total marks = 40 marks):
- Application-based, case study, real-world problem solving
- Inter-chapter concept linking, HOTs
- Mark with [COMPETENCY-BASED] tag

🔢 NUMERICAL QUESTIONS (30% of total marks = 24 marks):
- ${hasNumericals ? 'Calculation-based, formula application, multi-step solving' : 'Data interpretation, statistical analysis, quantitative reasoning'}
- Mark with [NUMERICAL] tag
- ⚠️ MANDATORY: Include AT LEAST 15 numerical questions spread across ALL sections
- 40% of numericals (i.e. at least 6) MUST be COMPETENCY-BASED numericals (real-world application numericals)
- Numericals must include: direct formula-based (Easy), multi-step problems (Medium), complex derivation-based (Hard)
- Section A: At least 3 numerical MCQs
- Section B: At least 2 numerical short questions
- Section C: At least 4 numerical questions (with step-by-step solving required)
- Section D: At least 2 numerical sub-questions within case studies
- Section E: At least 4 numerical long-answer questions (with derivations and multi-step solving)

💡 CONCEPTUAL QUESTIONS (20% of total marks = 16 marks):
- Definitions, theory, derivations, proofs
- Mark with [CONCEPTUAL] tag` : `🎯 COMPETENCY-BASED QUESTIONS (20% = 16 marks):
- Application-based real-world problem solving
- Mark with [COMPETENCY-BASED] tag`}

Difficulty: Easy (30%), Medium (40%), Hard (30%)

══════════════════════════════════════════════════════════════
                    CBSE BOARD EXAMINATION
                        CLASS ${selectedGrade}
                    ${subjectName.toUpperCase()}
══════════════════════════════════════════════════════════════

Time: 3 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Section A: 16 MCQs (1 mark each)
• Section B: 5 Very Short Answer (2 marks each)
• Section C: 7 Short Answer (3 marks each)
• Section D: 2 Case-Based (4 marks each)
• Section E: 3 Long Answer (5 marks each)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION A (16 Marks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[16 MCQs including:
${isHigherGrade ? `- Competency-Based MCQs (7) [COMPETENCY-BASED]
- ${hasNumericals ? 'Numerical MCQs (3) [NUMERICAL] - At least 1 must be competency-based numerical' : 'Analytical MCQs (3)'}
- Assertion-Reason (3) - Include numerical assertion-reason questions
- Conceptual MCQs (3) [CONCEPTUAL]` : `- Conceptual (8)
- Assertion-Reason (2)
- DIAGRAM-BASED (3)
- COMPETENCY-BASED (3)`}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION B (10 Marks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5 questions - 2 marks each${isHigherGrade ? `:
- 2 Numerical problems [NUMERICAL] (1 must be competency-based numerical)
- 2 Competency-based questions [COMPETENCY-BASED]
- 1 Conceptual question [CONCEPTUAL]` : `, include COMPETENCY-BASED and ${hasNumericals ? 'NUMERICAL' : 'ANALYTICAL'} questions`}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION C (21 Marks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[7 questions - 3 marks each${isHigherGrade ? `:
- 3 Numerical problems [NUMERICAL] with step-by-step solving (at least 1 competency-based numerical)
- 2 Competency-based questions [COMPETENCY-BASED]
- 1 Conceptual/derivation question [CONCEPTUAL]
- 1 Numerical + Conceptual mixed question` : `, mix of competency, ${hasNumericals ? 'numerical' : 'analytical'}, and conceptual`}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION D (8 Marks)
              COMPETENCY-BASED CASE STUDIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2 Case Studies - 4 marks each]
[COMPETENCY-BASED] Real-world scenarios with sub-questions${isHigherGrade ? `
- Each case study MUST include at least 1 numerical sub-question requiring calculation
- Sub-questions should mix: identification (1 mark), numerical calculation (2 marks), analysis (1 mark)` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION E (15 Marks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3 Long Answer - 5 marks each with OR options]
${isHigherGrade ? `- Question 1: Numerical problem (5 marks) [NUMERICAL] - Multi-step calculation with derivation. OR option also numerical.
- Question 2: Competency-based numerical (5 marks) [COMPETENCY-BASED] [NUMERICAL] - Real-world scenario requiring calculations. OR option also competency-numerical.
- Question 3: Conceptual + Numerical mixed (5 marks) - Theory (2 marks) + Numerical (3 marks). OR option similar mix.` : `[Mix of competency-based, ${hasNumericals ? 'numerical/derivation' : 'analytical'}, and conceptual]`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL RULE: DO NOT include answers alongside questions. ALL answers must ONLY appear in "ANSWER KEY" at the very end.

ANSWER KEY

Provide complete detailed solutions here.`;
          }
          break;
      }
      }
      
      try {
        const result = await robustGenerateText({ messages: [{ role: 'user', content: prompt }] });
        if (!result || result.trim().length === 0) {
          throw new Error('Empty response from AI');
        }
        return result;
      } catch (error) {
        console.error('Content generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      if (selectedChapterData) {
        const activity = {
          type: 'quiz' as const,
          title: `Generated ${contentType} for ${selectedChapterData.title}`,
          subject: subjects.find((s) => s.id === selectedSubject)?.name || '',
          timestamp: Date.now(),
        };
        addTeacherActivity(activity);
      }
    },
    onError: (error) => {
      console.error('Generation mutation error:', error);
      Alert.alert('Error', 'Failed to generate content. Please check your internet connection and try again.');
    },
  });



  const canGenerate = useMemo(
    () => {
      if (isMultiChapterMode) {
        return selectedChapters.length > 0 && selectedSubject;
      }
      return (selectedChapter || customTopic.trim().length > 0) && selectedSubject;
    },
    [selectedChapter, selectedChapters, customTopic, selectedSubject, isMultiChapterMode]
  );

  const cleanMarkdown = useCallback((text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/###? (.+)/g, '$1')
      .replace(/^- /gm, '• ')
      .replace(/^\|(.*)$/gm, '$1')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\pi/g, 'π')
      .replace(/\\theta/g, 'θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .split('\n')
      .filter(line => line.trim().length > 0 || line.includes(' '))
      .join('\n');
  }, []);

  const speakChunks = useCallback((text: string, language: string) => {
    const MAX_CHUNK_SIZE = 3500;
    const chunks: string[] = [];
    
    const sentences = text.split(/(?<=[.!?।]\s+)|(?<=[.!?।]$)/g).filter(s => s.trim());
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        if (sentence.length > MAX_CHUNK_SIZE) {
          const words = sentence.split(' ');
          currentChunk = '';
          for (const word of words) {
            if ((currentChunk + ' ' + word).length > MAX_CHUNK_SIZE) {
              chunks.push(currentChunk.trim());
              currentChunk = word;
            } else {
              currentChunk = currentChunk ? currentChunk + ' ' + word : word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    const speakNextChunk = (index: number) => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }
      Speech.speak(chunks[index], {
        language,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => speakNextChunk(index + 1),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Text-to-speech failed. Please try again.');
        },
      });
    };
    
    speakNextChunk(0);
  }, []);

  const handleTextToSpeech = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak = cleanMarkdown(generatedContent);
      if (!textToSpeak.trim()) {
        Alert.alert('Error', 'No content to read.');
        return;
      }
      setIsSpeaking(true);
      const language = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-US';
      speakChunks(textToSpeak, language);
    }
  }, [isSpeaking, generatedContent, selectedLanguage, cleanMarkdown, speakChunks]);

  const getTeacherPdfHtml = useCallback(() => {
    const contentTypeLabel = CONTENT_TYPES.find(t => t.id === contentType)?.label || 'Content';
    const chapterInfoText = selectedChapterData 
      ? `${selectedChapterData.title}`
      : customTopic || 'Custom Topic';
    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';

    return generatePdfHtml(generatedContent, {
      title: contentTypeLabel,
      subtitle: chapterInfoText,
      board: selectedBoard,
      grade: selectedGrade,
      subject: subjectName,
      contentType,
      accentColor: '#d97706',
    });
  }, [generatedContent, contentType, selectedChapterData, customTopic, subjects, selectedSubject, selectedBoard, selectedGrade]);

  const handleExportPDF = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const htmlContent = getTeacherPdfHtml();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
      await Print.printAsync({ uri });
      Alert.alert('Success', 'PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export content. Please try again.');
    }
  }, [generatedContent, getTeacherPdfHtml]);

  const handleShare = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const htmlContent = getTeacherPdfHtml();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF generated at:', uri);
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
    }
  }, [generatedContent, getTeacherPdfHtml]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Co-Pilot</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Board</Text>
          <View style={styles.boardButtons}>
            <TouchableOpacity
              style={[styles.boardButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
              onPress={() => {
                setSelectedBoard('NCERT');
                setSelectedGrade(6);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, { color: colors.textSecondary }, selectedBoard === 'NCERT' && styles.boardButtonTextActive]}>
                NCERT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boardButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
              onPress={() => {
                setSelectedBoard('ICSE');
                setSelectedGrade(9);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, { color: colors.textSecondary }, selectedBoard === 'ICSE' && styles.boardButtonTextActive]}>
                ICSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Grade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
            {(selectedBoard === 'NCERT' ? [6, 7, 8, 9, 10, 11, 12] : [9, 10]).map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[styles.optionButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedGrade === grade && styles.optionButtonActive]}
                onPress={() => {
                  setSelectedGrade(grade);
                  setSelectedSubject('');
                  setSelectedChapter('');
                }}
              >
                <Text style={[styles.optionText, { color: colors.textSecondary }, selectedGrade === grade && styles.optionTextActive]}>
                  Grade {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subject</Text>
          <View style={styles.optionGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[styles.gridButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedSubject === subject.id && styles.gridButtonActive]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setSelectedChapter('');
                }}
              >
                <Text style={[styles.gridText, { color: colors.textSecondary }, selectedSubject === subject.id && styles.gridTextActive]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedSubject && (
          <View style={styles.section}>
            {isMultiChapterMode ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Chapters for Question Paper</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Select multiple chapters to create a comprehensive {selectedBoard === 'ICSE' ? 'ICSE' : 'CBSE'} board exam paper
                </Text>
                {selectedChapters.length > 0 && (
                  <View style={styles.selectedChaptersInfo}>
                    <Text style={styles.selectedChaptersText}>
                      {selectedChapters.length} chapter{selectedChapters.length > 1 ? 's' : ''} selected
                    </Text>
                  </View>
                )}
                <View style={styles.multiChapterGrid}>
                  {chapters.map((chapter) => {
                    const isSelected = selectedChapters.includes(chapter.id);
                    return (
                      <TouchableOpacity
                        key={chapter.id}
                        style={[styles.multiChapterButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, isSelected && styles.multiChapterButtonActive]}
                        onPress={() => toggleChapterSelection(chapter.id)}
                      >
                        <View style={[styles.checkboxContainer, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.chapterInfo}>
                          <Text style={[styles.chapterNumber, isSelected && styles.chapterNumberActive]}>
                            Ch {chapter.number}
                          </Text>
                          <Text
                            style={[styles.multiChapterTitle, { color: colors.textSecondary }, isSelected && styles.multiChapterTitleActive]}
                            numberOfLines={2}
                          >
                            {chapter.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Chapter (or enter custom topic)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  {chapters.map((chapter) => (
                    <TouchableOpacity
                      key={chapter.id}
                      style={[styles.chapterButton, { backgroundColor: colors.cardBg, borderColor: colors.border }, selectedChapter === chapter.id && styles.chapterButtonActive]}
                      onPress={() => {
                        setSelectedChapter(chapter.id);
                        setCustomTopic('');
                        setSelectedChapters([]);
                      }}
                    >
                      <Text style={[styles.chapterNumber, { color: colors.textTertiary }, selectedChapter === chapter.id && styles.chapterNumberActive]}>
                        {chapter.number}
                      </Text>
                      <Text
                        style={[styles.chapterTitle, { color: colors.textSecondary }, selectedChapter === chapter.id && styles.chapterTitleActive]}
                        numberOfLines={2}
                      >
                        {chapter.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <TextInput
                  style={[styles.customInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="Or enter custom topic..."
                  placeholderTextColor={colors.textTertiary}
                  value={customTopic}
                  onChangeText={(text) => {
                    setCustomTopic(text);
                    setSelectedChapter('');
                    setSelectedChapters([]);
                  }}
                  multiline
                />
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Content Type</Text>
          <View style={styles.contentTypeGrid}>
            {CONTENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.contentTypeButton,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    contentType === type.id && { backgroundColor: type.color + '15', borderColor: type.color },
                  ]}
                  onPress={() => setContentType(type.id)}
                >
                  <Icon size={24} color={contentType === type.id ? type.color : colors.textSecondary} />
                  <Text
                    style={[
                      styles.contentTypeText,
                      { color: colors.textSecondary },
                      contentType === type.id && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
          onPress={() => generateMutation.mutate()}
          disabled={!canGenerate || generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Sparkles size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Content</Text>
            </>
          )}
        </TouchableOpacity>

        {generateMutation.isError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Failed to generate content. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => generateMutation.mutate()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {generatedContent && (
          <View style={[styles.resultCard, { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: '#1e293b' }]}>Generated Content</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]} onPress={handleTextToSpeech}>
                  {isSpeaking ? (
                    <VolumeX size={18} color="#8b5cf6" />
                  ) : (
                    <Volume2 size={18} color="#8b5cf6" />
                  )}
                  <Text style={[styles.actionButtonText, { color: '#64748b' }]}>{isSpeaking ? 'Stop' : 'Listen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]} onPress={handleExportPDF}>
                  <Download size={18} color="#f59e0b" />
                  <Text style={[styles.actionButtonText, { color: '#64748b' }]}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]} onPress={handleShare}>
                  <Share2 size={18} color="#10b981" />
                  <Text style={[styles.actionButtonText, { color: '#64748b' }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.resultContent, { color: '#000000' }]} selectable>{cleanMarkdown(generatedContent)}</Text>
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
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    marginTop: -8,
  },
  selectedChaptersInfo: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  selectedChaptersText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  multiChapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  multiChapterButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  multiChapterButtonActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  chapterInfo: {
    flex: 1,
  },
  multiChapterTitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
    lineHeight: 16,
  },
  multiChapterTitleActive: {
    color: '#047857',
  },
  customInput: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contentTypeButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  contentTypeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  generateButton: {
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
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  generateButtonText: {
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
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  resultCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  resultContent: {
    fontSize: 15,
    lineHeight: 26,
    color: '#1e293b',
    letterSpacing: 0.2,
  },
  boardButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  boardButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  boardButtonActiveNCERT: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  boardButtonActiveICSE: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  boardButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#64748b',
  },
  boardButtonTextActive: {
    color: '#ffffff',
  },
});
