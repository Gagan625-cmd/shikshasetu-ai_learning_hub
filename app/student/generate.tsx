import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, FileText, BookText, ScrollText, Loader2, Download, Share2, Network, Volume2, VolumeX } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { useMutation } from '@tanstack/react-query';
import { generateText } from '@rork-ai/toolkit-sdk';
import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';

const getICSEQuestionPaperPrompt = (
  subjectName: string,
  grade: number,
  chaptersForPaper: string,
  chapterInfo: string,
  language: string
): string => {
  const baseHeader = `Generate a comprehensive ICSE Board format question paper for Class ${grade} ${subjectName}.

Chapters Covered: ${chaptersForPaper}

Detailed Syllabus Coverage:
${chapterInfo}

IMPORTANT - Generate in ${language} language following the OFFICIAL ICSE BOARD EXAM PATTERN.

CRITICAL - For all formulas:
- Use plain text with Unicode (×, ÷, ², ³, √, π, Δ, θ) - NO LaTeX syntax

`;

  if (subjectName === 'English Language') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
              ENGLISH LANGUAGE (Paper 1)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• The time given at the head of this paper is the time allowed for writing the answers.
• Attempt ALL questions.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1 - COMPOSITION** [20 marks]
Write a composition (350-400 words) on any ONE of the following:

(a) [Narrative essay topic - story-based]
(b) [Descriptive essay topic]
(c) [Argumentative/Discursive essay topic]
(d) [Reflective essay topic]
(e) Study the picture given below. Write a story or a description or an account of what it suggests to you. Your composition may be about the subject of the picture or you may take suggestions from it.
[Describe an image scenario for picture composition]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 2 - LETTER WRITING** [10 marks]
Write a letter in approximately 150-200 words.

(a) [Formal letter option - to editor/official/complaint]
OR
(b) [Informal letter option - to friend/relative]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3 - FUNCTIONAL WRITING** [10 marks]

(a) **Notice Writing** [5 marks]
[Topic for notice - school event/announcement]
Write a notice in not more than 50 words.

(b) **Email Writing** [5 marks]
[Topic for email - formal/semi-formal communication]
Write an email in about 80-100 words.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 4 - COMPREHENSION** [20 marks]
Read the passage given below and answer the questions that follow:

[Include a 400-500 word passage - can be factual/literary/discursive]

(a) Give the meaning of the following words as used in the passage. One word answers or short phrases will be accepted. [4 marks]
(i) Word 1 (line X)
(ii) Word 2 (line X)
(iii) Word 3 (line X)
(iv) Word 4 (line X)

(b) Answer the following questions briefly in your own words: [12 marks]
(i) [Comprehension question] [3]
(ii) [Comprehension question] [3]
(iii) [Comprehension question] [3]
(iv) [Comprehension question] [3]

(c) In not more than 60 words, summarize [specific aspect from passage]. [4 marks]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 5 - GRAMMAR** [20 marks]

(a) Fill in each of the numbered blanks with the correct form of the word given in brackets. [4 marks]
[Paragraph with 8 blanks - verb forms, tenses, etc.]

(b) Fill in the blanks with appropriate words (prepositions/articles): [4 marks]
(i) to (iv) [4 sentences with blanks]

(c) Join the following sentences to make one complete sentence without using and, but or so: [4 marks]
(i) [Sentence pair 1]
(ii) [Sentence pair 2]
(iii) [Sentence pair 3]
(iv) [Sentence pair 4]

(d) Re-write the following sentences according to the instructions given after each. Make other changes that may be necessary, but do not change the meaning of each sentence: [8 marks]
(i) [Sentence] (Begin: ...)
(ii) [Sentence] (Use: ...)
(iii) [Sentence] (Change voice)
(iv) [Sentence] (Change to indirect speech)
(v) [Sentence] (Begin: ...)
(vi) [Sentence] (Use: ...)
(vii) [Sentence] (End: ...)
(viii) [Sentence] (Transform: ...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with model answers at the end.`;
  }

  if (subjectName === 'English Literature') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
              ENGLISH LITERATURE (Paper 2)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt all questions from Section A (Compulsory).
• Attempt any four questions from Section B, C, D (at least one from each section).
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION A - OBJECTIVE (Compulsory)
                              [16 Marks]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [16 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 16 MCQs numbered (i) to (xvi), 1 mark each, covering:
- Drama (Julius Caesar) - 4-5 questions
- Prose pieces - 4-5 questions  
- Poetry - 4-5 questions
- Literary devices and themes - 2-3 questions]

(i) [MCQ on Drama]
(ii) [MCQ on Drama]
(iii) [MCQ on Prose]
(iv) [MCQ on Prose]
(v) [MCQ on Poetry]
(vi) [MCQ on Poetry]
... continue to (xvi)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION B - DRAMA
              (Attempt at least ONE question)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 2** [16 marks]
Read the extract given below and answer the questions that follow:

[Extract from Julius Caesar - 8-10 lines]

(a) Where does this scene take place? What has happened just before this extract? [3]
(b) Explain the meaning of the lines quoted. [3]
(c) What does this extract reveal about the speaker's character? [3]
(d) What is the significance of this scene in the play? [3]
(e) Give the meaning of: (i) word 1 (ii) word 2 [2]
(f) What happens immediately after this extract? [2]

**Question 3** [16 marks]
Read the extract given below and answer the questions that follow:

[Different extract from Julius Caesar]

(a) to (f) [Similar question pattern as Question 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION C - PROSE
              (Attempt at least ONE question)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 4** [16 marks]
Read the extract given below and answer the questions that follow:

[Extract from prose piece - Treasure Chest]

(a) Who is the speaker? What is the context of the extract? [3]
(b) Explain the meaning of the extract in your own words. [3]
(c) What does this extract tell us about the speaker/character? [3]
(d) What is the theme explored in this extract? [3]
(e) Give the meaning of: (i) word 1 (ii) word 2 [2]
(f) What lesson do we learn from this story? [2]

**Question 5** [16 marks]
[Different prose extract with similar question pattern]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    SECTION D - POETRY
              (Attempt at least ONE question)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 6** [16 marks]
Read the extract given below and answer the questions that follow:

[Extract from poem - 6-8 lines]

(a) Name the poem and the poet. What is the poem about? [3]
(b) Explain the meaning of the lines quoted. [3]
(c) What literary devices are used in this extract? Explain with examples. [3]
(d) What is the central theme/message of the poem? [3]
(e) Give the meaning of: (i) phrase 1 (ii) phrase 2 [2]
(f) What emotions does the poet convey in this extract? [2]

**Question 7** [16 marks]
[Different poetry extract with similar question pattern]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with detailed answers at the end.`;
  }

  if (subjectName === 'Physics') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                    PHYSICS (Science Paper 1)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• The intended marks for questions or parts of questions are given in brackets [ ].
• All working, including rough work, should be done on the same sheet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 15 MCQs numbered (i) to (xv) covering:
- Direct conceptual MCQs
- Numerical-based MCQs
- Assertion-Reason questions:
  Assertion (A): [statement]
  Reason (R): [statement]
  (a) Both A and R are true and R is the correct explanation of A.
  (b) Both A and R are true but R is not the correct explanation of A.
  (c) A is true but R is false.
  (d) A is false but R is true.
- Diagram-based identification questions]

(i) [MCQ - conceptual]
(ii) [MCQ - numerical]
(iii) [Assertion-Reason]
... continue to (xv)

**Question 2** [25 marks]

(i) Define the following: [5 marks]
(a) [Physics term 1]
(b) [Physics term 2]
(c) [Physics term 3]
(d) [Physics term 4]
(e) [Physics term 5]

(ii) State and explain: [5 marks]
(a) [Law/Principle 1]
(b) [Law/Principle 2]
(c) [Law/Principle 3]
(d) [Law/Principle 4]
(e) [Law/Principle 5]

(iii) Numerical Problems (Show all steps): [5 marks]
(a) [Numerical problem with formula application]
(b) [Numerical problem]

(iv) Draw a neat labelled diagram of: [5 marks]
(a) [Diagram 1 - apparatus/concept]
(b) [Diagram 2 - apparatus/concept]

(v) Differentiate between: [5 marks]
(a) [Concept 1] and [Concept 2]
(b) [Concept 3] and [Concept 4]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

**Question 4** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

**Question 5** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

**Question 6** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

**Question 7** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

**Question 8** [10 marks]
(i) [Conceptual question] [2]
(ii) [Derivation or explanation] [2]
(iii) [Numerical problem - show all steps] [3]
(iv) [Diagram-based question or application] [3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with step-by-step solutions for all numerical problems.`;
  }

  if (subjectName === 'Chemistry') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                  CHEMISTRY (Science Paper 2)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• The intended marks for questions or parts of questions are given in brackets [ ].
• All working, including rough work, should be done on the same sheet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 15 MCQs numbered (i) to (xv) covering:
- Periodic table and properties
- Chemical bonding
- Acids, bases, and salts
- Mole concept calculations
- Electrolysis
- Organic chemistry
- Assertion-Reason questions]

(i) [MCQ - periodic properties]
(ii) [MCQ - chemical bonding]
(iii) [Assertion-Reason]
(iv) [MCQ - numerical/mole concept]
... continue to (xv)

**Question 2** [25 marks]

(i) Name the following: [5 marks]
(a) [Chemical compound/element identification]
(b) [Process/reaction identification]
(c) [Gas/acid/base identification]
(d) [Laboratory test identification]
(e) [Compound based on property]

(ii) Write balanced chemical equations for: [5 marks]
(a) [Reaction 1]
(b) [Reaction 2]
(c) [Reaction 3]
(d) [Reaction 4]
(e) [Reaction 5]

(iii) Give reasons for the following: [5 marks]
(a) [Chemical reasoning 1]
(b) [Chemical reasoning 2]
(c) [Chemical reasoning 3]
(d) [Chemical reasoning 4]
(e) [Chemical reasoning 5]

(iv) Match the following: [5 marks]
Column A                    Column B
[5 items to match]

(v) Numerical Problems (Mole Concept/Stoichiometry): [5 marks]
(a) [Numerical problem - show steps]
(b) [Numerical problem - show steps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem - mole concept/stoichiometry] [3]
(iv) [Laboratory preparation/diagram] [3]

**Question 4** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem] [3]
(iv) [Compare/differentiate/diagram] [3]

**Question 5** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem] [3]
(iv) [Laboratory test/diagram] [3]

**Question 6** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem] [3]
(iv) [Application-based/diagram] [3]

**Question 7** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem] [3]
(iv) [Organic chemistry/IUPAC naming] [3]

**Question 8** [10 marks]
(i) [Conceptual/definition] [2]
(ii) [Write equations/explain process] [2]
(iii) [Numerical problem] [3]
(iv) [Electrolysis/diagram] [3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with balanced equations and step-by-step numerical solutions.`;
  }

  if (subjectName === 'Biology') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                   BIOLOGY (Science Paper 3)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 15 MCQs numbered (i) to (xv) with 4 options each. Include:
- Direct MCQs on biological concepts
- Assertion-Reason questions:
  Assertion (A): [statement]
  Reason (R): [statement]
  (a) (A) is true and (R) is false.
  (b) (A) is false and (R) is true.
  (c) Both (A) and (R) are true.
  (d) Both (A) and (R) are false.
- Diagram/image-based identification questions
- Match the following type questions]

(i) [MCQ - direct]
(ii) [Assertion-Reason]
(iii) [MCQ - diagram based]
... continue to (xv)

**Question 2** [25 marks]

(i) Name the following: [5 marks]
(a) [Biological structure/process]
(b) [Organ/tissue identification]
(c) [Hormone/enzyme]
(d) [Disease/disorder]
(e) [Scientific term]

(ii) Given below is a diagram. Study it and fill in the blanks: [5 marks]
[Describe a diagram - human organ/plant structure/cell]
The diagram shows __________.
(a) Label part A: __________
(b) Label part B: __________
(c) Label part C: __________
(d) Function of part A: __________
(e) Function of part B: __________

(iii) Arrange the terms in each group in the correct order. Write them in a logical sequence beginning with the term that is underlined: [5 marks]
(a) [Biological sequence - e.g., digestion pathway]
(b) [Biological sequence - e.g., blood flow]
(c) [Biological sequence - e.g., nerve impulse]
(d) [Biological sequence - e.g., evolution]
(e) [Biological sequence - e.g., cell division]

(iv) Read the explanations given below and name the structures: [5 marks]
(a) [Description of biological structure]
(b) [Description of biological process]
(c) [Description of organ function]
(d) [Description of disease symptom]
(e) [Description of cellular component]

(v) Match the items in Column A with Column B: [5 marks]
Column A                    Column B
[5 biological terms]        [5 corresponding functions/locations]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3** [10 marks]
(i) [Definition - 1 mark]
(ii) [Brief explanation with parts (a) and (b)] [2 marks]
(iii) [Differentiate/Compare OR Give reasons] [2 marks]
(iv) [Application-based with parts (a) and (b)] [2 marks]
(v) [Draw a neat, labelled diagram OR detailed explanation] [3 marks]

**Question 4** [10 marks]
(i) [Definition] [1]
(ii) [Explanation with two parts] [2]
(iii) [Differentiate/Reasons] [2]
(iv) [Application-based] [2]
(v) [Diagram/Detailed explanation] [3]

**Question 5** [10 marks]
(i) [Definition] [1]
(ii) [Explanation with two parts] [2]
(iii) [Differentiate/Reasons] [2]
(iv) [Application-based] [2]
(v) [Diagram/Detailed explanation] [3]

**Question 6** [10 marks]
(i) [Definition] [1]
(ii) [Explanation with two parts] [2]
(iii) [Differentiate/Reasons] [2]
(iv) [Application-based] [2]
(v) [Diagram/Detailed explanation] [3]

**Question 7** [10 marks]
(i) [Definition] [1]
(ii) [Explanation with two parts] [2]
(iii) [Differentiate/Reasons] [2]
(iv) [Application-based] [2]
(v) [Diagram/Detailed explanation] [3]

**Question 8** [10 marks]
(i) [Definition] [1]
(ii) [Explanation with two parts] [2]
(iii) [Differentiate/Reasons] [2]
(iv) [Application-based] [2]
(v) [Diagram/Detailed explanation] [3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with detailed solutions at the end.`;
  }

  if (subjectName === 'Geography') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                 GEOGRAPHY (HCG Paper 2)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Part I (Compulsory).
• Attempt any FIVE questions from Part II.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PART I (30 Marks)
                    (Attempt ALL questions - Compulsory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]

(a) Study the extract of the Survey of India Map Sheet No. [XX/X] and answer the following: [10 marks]

[Include map-based questions on:
- Four-figure and six-figure grid references
- Conventional signs and symbols
- Direction and distance calculations
- Contour interpretation
- Settlement patterns
- Drainage patterns
- Land use]

(i) Give the four-figure grid reference of [location/feature]. [1]
(ii) What is the six-figure grid reference of [specific point]? [1]
(iii) Calculate the distance in km between [point A] and [point B]. [1]
(iv) What is the direction of [place B] from [place A]? [1]
(v) Identify the drainage pattern in grid square [XXXX]. [1]
(vi) Name the type of settlement seen in the map extract. [1]
(vii) What does the symbol [describe symbol] represent? [1]
(viii) Calculate the area of the region enclosed by [boundaries] in km². [1]
(ix) What is the contour interval used in this map? [1]
(x) Identify the main occupation of the people in this area. [1]

(b) Select the correct answers to the questions from the given options: [5 marks]

(i) [MCQ on map reading]
(ii) [MCQ on India's geography]
(iii) [MCQ on climate/monsoons]
(iv) [MCQ on resources]
(v) [MCQ on agriculture/industries]

**Question 2** [15 marks]

On the outline map of India provided:

(a) Mark and name the following: [5 marks]
(i) [Mountain range/peak]
(ii) [River/water body]
(iii) [City/state]
(iv) [Soil region/agricultural area]
(v) [Industrial center/port]

(b) Identify and name the following marked on the map: [5 marks]
(i) [Feature marked as A]
(ii) [Feature marked as B]
(iii) [Feature marked as C]
(iv) [Feature marked as D]
(v) [Feature marked as E]

(c) Answer the following questions briefly: [5 marks]
(i) [Short answer on Indian geography] [1]
(ii) [Short answer on climate] [1]
(iii) [Short answer on resources] [1]
(iv) [Short answer on agriculture] [1]
(v) [Short answer on industries] [1]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PART II (50 Marks)
              (Attempt any FIVE questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3** [10 marks]
(a) [Conceptual question on physical geography] [2]
(b) [Explanation with map reference] [2]
(c) [Comparison/Differentiation] [3]
(d) [Application-based/Regional study] [3]

**Question 4** [10 marks]
(a) [Climate-related question] [2]
(b) [Monsoon/rainfall explanation] [2]
(c) [Factors affecting climate] [3]
(d) [Regional climate patterns] [3]

**Question 5** [10 marks]
(a) [Soil types/conservation] [2]
(b) [Natural vegetation] [2]
(c) [Distribution and characteristics] [3]
(d) [Environmental concerns] [3]

**Question 6** [10 marks]
(a) [Water resources] [2]
(b) [Irrigation methods] [2]
(c) [River systems/dams] [3]
(d) [Water management] [3]

**Question 7** [10 marks]
(a) [Mineral resources] [2]
(b) [Energy resources] [2]
(c) [Distribution and importance] [3]
(d) [Conservation measures] [3]

**Question 8** [10 marks]
(a) [Agriculture - crops] [2]
(b) [Conditions for growth] [2]
(c) [Major producing regions] [3]
(d) [Agricultural problems/solutions] [3]

**Question 9** [10 marks]
(a) [Industries - types] [2]
(b) [Location factors] [2]
(c) [Industrial regions] [3]
(d) [Recent developments] [3]

**Question 10** [10 marks]
(a) [Transport - types] [2]
(b) [Importance of transport] [2]
(c) [Major routes/networks] [3]
(d) [Waste management/pollution] [3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with detailed solutions at the end.`;
  }

  if (subjectName === 'Mathematics') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                        MATHEMATICS
══════════════════════════════════════════════════════════════

Time: 2 Hours 30 Minutes                     Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• All working, including rough work, must be clearly shown.
• Mathematical tables are provided.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 15 MCQs numbered (i) to (xv) covering:
- Algebraic concepts
- Geometry theorems
- Mensuration formulas
- Trigonometry
- Statistics/Probability
- Commercial mathematics
- Coordinate geometry]

(i) [MCQ - algebra]
(ii) [MCQ - geometry]
(iii) [MCQ - trigonometry]
(iv) [MCQ - statistics]
(v) [MCQ - commercial maths]
... continue to (xv)

**Question 2** [10 marks]

(i) [Short numerical - algebra/equations] [2]
(ii) [Short numerical - geometry/mensuration] [2]
(iii) [Short numerical - trigonometry] [2]
(iv) [Short numerical - statistics] [2]
(v) [Short numerical - coordinate geometry] [2]

**Question 3** [15 marks]

(i) Solve: [Equation/Problem] [3]
(ii) Prove/Find: [Geometry problem] [3]
(iii) Calculate: [Mensuration problem] [3]
(iv) [Commercial mathematics - GST/Banking/Shares] [3]
(v) [Statistics/Probability problem] [3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 4** [10 marks]
(a) [Algebra problem - equations/matrices/AP-GP] [5]
(b) [Related problem with step-by-step solution] [5]

**Question 5** [10 marks]
(a) [Geometry theorem/proof - circles/triangles] [5]
(b) [Construction/application problem] [5]

**Question 6** [10 marks]
(a) [Mensuration - surface area/volume] [5]
(b) [Related mensuration problem] [5]

**Question 7** [10 marks]
(a) [Trigonometry - heights and distances] [5]
(b) [Trigonometric identities/equations] [5]

**Question 8** [10 marks]
(a) [Statistics - mean/median/mode/histogram/ogive] [5]
(b) [Probability problem] [5]

**Question 9** [10 marks]
(a) [Coordinate geometry - equation of line/section formula] [5]
(b) [Reflection/graphical representation] [5]

**Question 10** [10 marks]
(a) [Commercial mathematics - compound interest/shares] [5]
(b) [GST/Banking calculations] [5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT:
- Show all steps clearly for full marks
- Draw diagrams wherever required
- Use proper units in answers

Provide complete ANSWER KEY with step-by-step solutions for all problems.`;
  }

  if (subjectName === 'Computer Applications') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
                   COMPUTER APPLICATIONS
══════════════════════════════════════════════════════════════

Time: 2 Hours                               Maximum Marks: 100

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Section A and any FOUR questions from Section B.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION A (40 Marks)
                    (Attempt ALL questions - Compulsory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [40 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

[Generate 20 MCQs numbered (i) to (xx), 2 marks each, covering:
- OOP concepts (classes, objects, encapsulation, inheritance)
- Java fundamentals (data types, operators, expressions)
- Control structures (if-else, switch, loops)
- Arrays and strings
- Methods and constructors
- Library classes (String, Math, wrapper classes)
- Output prediction questions
- Error identification questions]

(i) [MCQ - OOP concept] [2]
(ii) [MCQ - data types/operators] [2]
(iii) [MCQ - control structures] [2]
(iv) [MCQ - output prediction] [2]
(v) [MCQ - arrays] [2]
(vi) [MCQ - strings] [2]
(vii) [MCQ - methods/constructors] [2]
(viii) [MCQ - library classes] [2]
(ix) [MCQ - inheritance] [2]
(x) [MCQ - error identification] [2]
(xi) [MCQ - Boolean algebra] [2]
(xii) [MCQ - number system] [2]
(xiii) [MCQ - output prediction] [2]
(xiv) [MCQ - recursion] [2]
(xv) [MCQ - encapsulation] [2]
(xvi) [MCQ - string functions] [2]
(xvii) [MCQ - Math class] [2]
(xviii) [MCQ - wrapper classes] [2]
(xix) [MCQ - array operations] [2]
(xx) [MCQ - Java syntax] [2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (60 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 2** [15 marks]
[Programming problem - String manipulation]

Write a program in Java to:
[Detailed problem statement involving:
- Input handling
- String operations
- Output formatting]

Example:
Input: [sample input]
Output: [expected output]

**Question 3** [15 marks]
[Programming problem - Arrays]

Design a class with the following specifications:
Class name: [ClassName]
Data members:
- [member 1]
- [member 2]
Member methods:
- [method 1 with description]
- [method 2 with description]
- void main() - to create object and call methods

**Question 4** [15 marks]
[Programming problem - Number/Pattern]

Write a program to:
[Problem involving:
- Number series/patterns
- Mathematical operations
- Loop structures]

Example:
Input: [sample]
Output: [expected output]

**Question 5** [15 marks]
[Programming problem - Searching/Sorting]

Write a program using a class with the following:
Class name: [ClassName]
Data members:
- Array declaration
- Size variable
Member methods:
- void input() - input array elements
- void sort() - sort using [specific algorithm]
- int search(int) - search using [binary/linear]
- void display() - display array

**Question 6** [15 marks]
[Programming problem - Menu-driven program]

Write a menu-driven program to:
[Problem with multiple options:
1. Option 1 - [operation]
2. Option 2 - [operation]
3. Option 3 - [operation]]

Use switch-case to implement the menu.

**Question 7** [15 marks]
[Programming problem - Recursion/Advanced]

Write a recursive function to:
[Problem involving:
- Recursive algorithm
- Base case and recursive case
- Main method to demonstrate]

**Question 8** [15 marks]
[Programming problem - Class design/Inheritance]

Design a class [ClassName] with:
- Constructor overloading OR
- Method overloading OR
- Inheritance concept

[Detailed specifications with:
- Data members
- Methods with specific functionalities
- Main method for demonstration]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with:
- MCQ answers
- Complete Java programs with proper comments
- Sample outputs for each program`;
  }

  if (subjectName === 'History and Civics') {
    return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
              HISTORY AND CIVICS (HCG Paper 1)
══════════════════════════════════════════════════════════════

Time: 2 Hours                                Maximum Marks: 80

GENERAL INSTRUCTIONS:
• Answers to this paper must be written on the paper provided separately.
• You will NOT be allowed to write during the first 15 minutes.
• Attempt ALL questions from Part I (Compulsory).
• Attempt any TWO questions from Section A and any THREE questions from Section B of Part II.
• The intended marks for questions or parts of questions are given in brackets [ ].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PART I (30 Marks)
                    (Attempt ALL questions - Compulsory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
(Do not copy the questions, write the correct answer only).

(i) [MCQ - Indian Constitution/Civics]
(ii) [MCQ - Indian National Movement]
(iii) [MCQ - World History]
(iv) [MCQ - Indian Government]
(v) [MCQ - First War of Independence]
(vi) [MCQ - Rise of Nationalism]
(vii) [MCQ - World Wars]
(viii) [MCQ - UN and International Relations]
(ix) [MCQ - Judiciary/Legislature]
(x) [MCQ - Freedom Struggle]
(xi) [MCQ - Dictatorships]
(xii) [MCQ - Civics concepts]
(xiii) [MCQ - Historical events]
(xiv) [MCQ - Constitutional provisions]
(xv) [MCQ - World organizations]

**Question 2** [15 marks]

(i) Name the following: [5 marks]
(a) [Historical figure/event identification]
(b) [Constitutional body/provision]
(c) [Treaty/agreement]
(d) [Movement/organization]
(e) [Historical concept/term]

(ii) Match the following: [5 marks]
Column A                    Column B
[5 historical items]        [5 corresponding facts]

(iii) Fill in the blanks: [5 marks]
(a) The __________ was established in the year __________.
(b) __________ is known as the Father of __________.
(c) The __________ movement was launched in __________.
(d) Article __________ deals with __________.
(e) The __________ war took place between __________ and __________.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         PART II (50 Marks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    SECTION A - CIVICS
              (Attempt any TWO questions from this Section)

**Question 3** [10 marks]
With reference to the Union Legislature:
(a) [Question about composition/powers] [2]
(b) [Question about functions/procedures] [4]
(c) [Question about comparison/significance] [4]

**Question 4** [10 marks]
With reference to the Union Executive:
(a) [Question about President/Prime Minister] [2]
(b) [Question about powers/functions] [4]
(c) [Question about Council of Ministers] [4]

**Question 5** [10 marks]
With reference to the Judiciary:
(a) [Question about Supreme Court] [2]
(b) [Question about jurisdiction/powers] [4]
(c) [Question about judicial review/independence] [4]

                    SECTION B - HISTORY
              (Attempt any THREE questions from this Section)

**Question 6** [10 marks]
With reference to the First War of Independence 1857:
(a) [Causes/Events question] [2]
(b) [Course of events/Leaders] [4]
(c) [Results/Significance] [4]

**Question 7** [10 marks]
With reference to the Rise of Indian Nationalism:
(a) [Question about early nationalism] [2]
(b) [Question about moderate/extremist phase] [4]
(c) [Question about specific movement/leader] [4]

**Question 8** [10 marks]
With reference to the World Wars:
(a) [Causes/Events question] [2]
(b) [Course of war/Major events] [4]
(c) [Results/Impact] [4]

**Question 9** [10 marks]
With reference to the Rise of Dictatorships:
(a) [Question about Fascism/Nazism] [2]
(b) [Question about policies/impact] [4]
(c) [Question about consequences] [4]

**Question 10** [10 marks]
With reference to the United Nations:
(a) [Question about formation/objectives] [2]
(b) [Question about organs/functions] [4]
(c) [Question about achievements/challenges] [4]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with detailed answers at the end.`;
  }

  return baseHeader + `══════════════════════════════════════════════════════════════
                    ICSE BOARD EXAMINATION
                        CLASS ${grade}
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
                    (Attempt ALL questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 1** [15 marks]
Select the correct answers to the questions from the given options.
[Generate 15 MCQs numbered (i) to (xv)]

**Question 2** [25 marks]

(i) Name the following: [5 marks]
(ii) Explain briefly: [5 marks]
(iii) Differentiate between: [5 marks]
(iv) Match the following: [5 marks]
(v) Fill in the blanks: [5 marks]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         SECTION B (40 Marks)
              (Attempt any FOUR questions from this Section)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question 3** [10 marks]
(i) [1 mark]
(ii) [2 marks]
(iii) [2 marks]
(iv) [2 marks]
(v) [3 marks]

**Question 4** [10 marks]
[Same structure as Question 3]

**Question 5** [10 marks]
[Same structure as Question 3]

**Question 6** [10 marks]
[Same structure as Question 3]

**Question 7** [10 marks]
[Same structure as Question 3]

**Question 8** [10 marks]
[Same structure as Question 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide complete ANSWER KEY with detailed solutions at the end.`;
};

export default function ContentGenerator() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedLanguage, addContentActivity } = useApp();
  
  const [selectedBoard, setSelectedBoard] = useState<'NCERT' | 'ICSE'>('NCERT');
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'notes' | 'summary' | 'worksheet' | 'mindmap' | 'questionpaper'>('notes');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const allSubjects = selectedBoard === 'NCERT' ? NCERT_SUBJECTS : ICSE_SUBJECTS;
  const subjects = allSubjects.filter((s) => s.grade === selectedGrade);
  const chapters = subjects.find((s) => s.id === selectedSubject)?.chapters || [];
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);
  const selectedChaptersData = chapters.filter((c) => selectedChapters.includes(c.id));

  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterId)) {
        return prev.filter(id => id !== chapterId);
      }
      return [...prev, chapterId];
    });
    setSelectedChapter('');
    setCustomTopic('');
  };

  const isMultiChapterMode = selectedBoard === 'ICSE' && contentType === 'questionpaper';

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
      
      let prompt = '';
      if (contentType === 'notes') {
        prompt = `Generate comprehensive study notes for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING RULES:
1. Use **text** for bold/highlighting important terms and key concepts
2. Use proper heading hierarchy with clear sections
3. For tables, use this format:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
4. Use bullet points with - for lists
5. Add blank lines between sections
6. CRITICAL - For mathematical formulas and equations:
   - DO NOT use LaTeX syntax like \\[ \\] or $ $
   - Use plain text with proper spacing
   - Use Unicode symbols: × (multiplication), ÷ (division), ² ³ (superscripts), ½ ¼ ¾ (fractions)
   - For fractions, write as: numerator/denominator or use ÷
   - Example: SI = (P × R × T) ÷ 100 or SI = (P × R × T)/100
   - Example: Area = πr² where r is radius
   - Example: Quadratic formula: x = (-b ± √(b² - 4ac)) ÷ 2a
   - For chemical formulas: H₂O, CO₂, etc.

Provide detailed notes in ${selectedLanguage} language with:
- Key Concepts and Definitions (with **bold** for important terms)
- Important Formulas and Principles (write clearly without LaTeX)
- Examples and Applications
- Study Tips
- Common Mistakes to Avoid`;
      } else if (contentType === 'summary') {
        prompt = `Create a comprehensive summary for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING:
- Use **bold** for key terms and concepts
- Use bullet points for main ideas
- Create comparison tables where applicable
- Organize in clear sections
- For formulas: Use plain text with Unicode symbols (×, ÷, ², ³, √, etc.) - NO LaTeX syntax
- Example: Force = mass × acceleration (F = m × a)

Provide in ${selectedLanguage} language with all essential information in concise bullet format.`;
      } else if (contentType === 'worksheet') {
        prompt = `Generate a practice worksheet for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMATTING:
- Number all questions clearly
- Use **bold** for question numbers
- For MCQs, format as: **Q1.** Question text
  a) Option 1
  b) Option 2
  c) Option 3
  d) Option 4
- For mathematical expressions: Use plain text with Unicode (×, ÷, ², ³, √) - NO LaTeX
- Example: Calculate area using A = πr² where r = 5 cm

Create 15 questions in ${selectedLanguage} language:
- 5 MCQs
- 5 Short Answer Questions
- 5 Long Answer/Problem Solving Questions
Vary difficulty levels and include application-based questions.`;
      } else if (contentType === 'questionpaper') {
        if (selectedBoard === 'ICSE') {
          const chaptersForPaper = isMultiChapterMode && selectedChaptersData.length > 0 
            ? selectedChaptersData.map(c => `${c.number}. ${c.title}`).join(', ')
            : (selectedChapterData ? `${selectedChapterData.number}. ${selectedChapterData.title}` : chapterInfo);
          
          prompt = getICSEQuestionPaperPrompt(subjectName, selectedGrade, chaptersForPaper, chapterInfo, selectedLanguage);
        } else {
          prompt = `Generate a comprehensive NCERT/CBSE board format question paper for Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT FORMAT REQUIREMENTS:
Generate in ${selectedLanguage} language following official CBSE board exam format.

CRITICAL - For all formulas:
- Use plain text with Unicode (×, ÷, ², ³, √, π) - NO LaTeX

Question Paper Structure:

**SECTION A - Multiple Choice Questions (1 mark each)**
[10 MCQs]

**SECTION B - Very Short Answer Questions (2 marks each)**
[5-6 questions requiring 2-3 sentence answers]

**SECTION C - Short Answer Questions (3 marks each)**
[4-5 questions requiring detailed explanations]

**SECTION D - Long Answer Questions (5 marks each)**
[3-4 questions requiring comprehensive answers with diagrams/derivations]

IMPORTANT:
- Total marks: 80
- Time: 3 hours
- Follow official CBSE marking scheme
- Include questions of varying difficulty
- Cover all key concepts from the topic
- Add instruction note at the beginning
- Provide answer key at the end with detailed solutions`;
        }
      } else {
        prompt = `Generate a colorful and comprehensive mind map for ${selectedBoard} Grade ${selectedGrade} ${subjectName}.
Topic: ${chapterInfo}

IMPORTANT MIND MAP FORMAT:
Create a hierarchical, structured mind map in ${selectedLanguage} language.

CRITICAL - For formulas:
- Use plain text with Unicode symbols (×, ÷, ², ³, √) - NO LaTeX

Use this format:
🎯 **CENTRAL TOPIC: ${chapterInfo}**

📌 **Branch 1: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

📌 **Branch 2: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

📌 **Branch 3: [Main Concept Name]**
  ├─ Key Point 1
  ├─ Key Point 2
  └─ Key Point 3

IMPORTANT REQUIREMENTS:
- Use colorful emojis (🔴🔵🟢🟡🟣🔶💡⭐✨📚🎓💎) to make it vibrant
- Create 5-7 main branches
- Each branch should have 3-5 sub-points
- Keep points concise and clear
- Use **bold** for main concepts
- Make it visually organized and easy to follow
- Include key formulas, definitions, and examples where relevant`;
      }
      
      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      if (selectedChapterData) {
        const activity = {
          id: Date.now().toString(),
          board: selectedBoard,
          type: contentType as 'notes' | 'summary' | 'worksheet',
          subject: subjects.find((s) => s.id === selectedSubject)?.name || '',
          chapter: selectedChapterData.title,
          grade: selectedGrade,
          completedAt: new Date(),
        };
        addContentActivity(activity);
      }
    },
  });

  const exportToPDF = async () => {
    try {
      if (!generatedContent || generatedContent.trim().length === 0) {
        Alert.alert('Error', 'No content to export. Please generate content first.');
        return;
      }

      const chapterTitle = selectedChapterData?.title || customTopic || 'Content';
      const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || '';
      
      const formattedContent = generatedContent
        .replace(/\\\[(.+?)\\\]/gs, '<div class="math">$1</div>')
        .replace(/\$\$(.+?)\$\$/gs, '<div class="math">$1</div>')
        .replace(/\$(.+?)\$/g, '<span class="math-inline">$1</span>')
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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/\n- (.*?)\n/g, '<li>$1</li>\n')
        .replace(/\n• (.*?)\n/g, '<li>$1</li>\n')
        .replace(/\n\n/g, '<br/><br/>');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${chapterTitle}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 30px; line-height: 1.8; background: white; }
              h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-size: 28px; }
              h2 { color: #2563eb; margin-top: 25px; margin-bottom: 15px; font-size: 20px; }
              h3 { color: #3b82f6; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
              strong { color: #1e293b; background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
              th { background-color: #eff6ff; font-weight: bold; color: #1e40af; }
              li { margin: 8px 0 8px 20px; }
              ul { margin: 10px 0; }
              p { margin: 10px 0; }
              .header { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; }
              .meta { color: #64748b; margin-top: 10px; font-size: 14px; }
              .math { background: #f1f5f9; padding: 12px 16px; margin: 12px 0; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 15px; overflow-x: auto; border-left: 3px solid #3b82f6; display: block; }
              .math-inline { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${chapterTitle}</h1>
              <div class="meta">
                <p><strong>Subject:</strong> ${subjectName} | <strong>Grade:</strong> ${selectedGrade} | <strong>Board:</strong> ${selectedBoard}</p>
                <p><strong>Generated by:</strong> ShikshaSetu AI | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div class="content">${formattedContent}</div>
          </body>
        </html>
      `;

      console.log('Generating PDF...');
      const result = await Print.printToFileAsync({ 
        html,
        base64: false,
      });
      
      console.log('PDF result:', result);
      
      if (!result?.uri) {
        throw new Error('PDF generation returned no URI');
      }
      
      const { uri } = result;
      
      if (Platform.OS === 'web') {
        const filename = `${contentType}_${chapterTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = uri;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Success', 'PDF downloaded successfully!');
        } else {
          Alert.alert('Success', 'PDF generated successfully!');
        }
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export PDF',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', `PDF saved at: ${uri}`);
        }
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      Alert.alert('Error', `Failed to export PDF: ${errorMessage}`);
    }
  };

  const contentTypes = [
    { id: 'notes' as const, label: 'Notes', icon: FileText, color: '#3b82f6' },
    { id: 'summary' as const, label: 'Summary', icon: ScrollText, color: '#10b981' },
    { id: 'worksheet' as const, label: 'Worksheet', icon: BookText, color: '#f59e0b' },
    { id: 'mindmap' as const, label: 'Mind Map', icon: Network, color: '#8b5cf6' },
    { id: 'questionpaper' as const, label: 'Question Paper', icon: FileText, color: '#ef4444' },
  ];

  const canGenerate = isMultiChapterMode 
    ? selectedChapters.length > 0 && selectedSubject
    : (selectedChapter || customTopic.trim().length > 0) && selectedSubject;

  const speakChunks = async (text: string, language: string) => {
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
  };

  const handleTextToSpeech = async () => {
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
  };

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/###? (.+)/g, '$1')
      .replace(/^- /gm, '• ')
      .replace(/^\|(.*)$/gm, '$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\mathrm\{([^}]+)\}/g, '$1')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\textit\{([^}]+)\}/g, '$1')
      .replace(/\\textbf\{([^}]+)\}/g, '$1')
      .replace(/\\mathit\{([^}]+)\}/g, '$1')
      .replace(/\\mathbb\{([^}]+)\}/g, '$1')
      .replace(/\\mathcal\{([^}]+)\}/g, '$1')
      .replace(/\\operatorname\{([^}]+)\}/g, '$1')
      .replace(/\\overline\{([^}]+)\}/g, '$1̄')
      .replace(/\\underline\{([^}]+)\}/g, '$1̲')
      .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
      .replace(/\\hat\{([^}]+)\}/g, '$1̂')
      .replace(/\\bar\{([^}]+)\}/g, '$1̄')
      .replace(/\\tilde\{([^}]+)\}/g, '$1̃')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\left\\{/g, '{')
      .replace(/\\right\\}/g, '}')
      .replace(/\\left\|/g, '|')
      .replace(/\\right\|/g, '|')
      .replace(/\\begin\{([^}]+)\}/g, '')
      .replace(/\\end\{([^}]+)\}/g, '')
      .replace(/\\displaystyle/g, '')
      .replace(/\\limits/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\$\$/g, '')
      .replace(/\$/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\tfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\mp/g, '∓')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
      .replace(/\\sqrt\[4\]\{([^}]+)\}/g, '∜($1)')
      .replace(/\\pi/g, 'π')
      .replace(/\\theta/g, 'θ')
      .replace(/\\Theta/g, 'Θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\Gamma/g, 'Γ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\varepsilon/g, 'ε')
      .replace(/\\zeta/g, 'ζ')
      .replace(/\\eta/g, 'η')
      .replace(/\\phi/g, 'φ')
      .replace(/\\Phi/g, 'Φ')
      .replace(/\\varphi/g, 'φ')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\Lambda/g, 'Λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\nu/g, 'ν')
      .replace(/\\xi/g, 'ξ')
      .replace(/\\Xi/g, 'Ξ')
      .replace(/\\rho/g, 'ρ')
      .replace(/\\tau/g, 'τ')
      .replace(/\\omega/g, 'ω')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\psi/g, 'ψ')
      .replace(/\\Psi/g, 'Ψ')
      .replace(/\\chi/g, 'χ')
      .replace(/\\kappa/g, 'κ')
      .replace(/\\iota/g, 'ι')
      .replace(/\\upsilon/g, 'υ')
      .replace(/\\Upsilon/g, 'Υ')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^1/g, '¹')
      .replace(/\^0/g, '⁰')
      .replace(/\^\{([^}]+)\}/g, '^($1)')
      .replace(/\_\{([^}]+)\}/g, '_($1)')
      .replace(/\_([0-9a-zA-Z])/g, '₍$1₎')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\ne/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\sim/g, '∼')
      .replace(/\\equiv/g, '≡')
      .replace(/\\cong/g, '≅')
      .replace(/\\propto/g, '∝')
      .replace(/\\infty/g, '∞')
      .replace(/\\rightarrow/g, '→')
      .replace(/\\leftarrow/g, '←')
      .replace(/\\Rightarrow/g, '⇒')
      .replace(/\\Leftarrow/g, '⇐')
      .replace(/\\leftrightarrow/g, '↔')
      .replace(/\\Leftrightarrow/g, '⇔')
      .replace(/\\to/g, '→')
      .replace(/\\in/g, '∈')
      .replace(/\\notin/g, '∉')
      .replace(/\\subset/g, '⊂')
      .replace(/\\subseteq/g, '⊆')
      .replace(/\\supset/g, '⊃')
      .replace(/\\supseteq/g, '⊇')
      .replace(/\\cup/g, '∪')
      .replace(/\\cap/g, '∩')
      .replace(/\\emptyset/g, '∅')
      .replace(/\\forall/g, '∀')
      .replace(/\\exists/g, '∃')
      .replace(/\\neg/g, '¬')
      .replace(/\\land/g, '∧')
      .replace(/\\lor/g, '∨')
      .replace(/\\parallel/g, '∥')
      .replace(/\\perp/g, '⊥')
      .replace(/\\angle/g, '∠')
      .replace(/\\degree/g, '°')
      .replace(/\\circ/g, '°')
      .replace(/\\partial/g, '∂')
      .replace(/\\nabla/g, '∇')
      .replace(/\\int/g, '∫')
      .replace(/\\sum/g, '∑')
      .replace(/\\prod/g, '∏')
      .replace(/\\%/g, '%')
      .replace(/\\&/g, '&')
      .replace(/\\\\/g, '\\')
      .split('\n')
      .filter(line => line.trim().length > 0 || line.includes(' '))
      .join('\n');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Content Generator</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Board</Text>
          <View style={styles.boardButtons}>
            <TouchableOpacity
              style={[styles.boardButton, selectedBoard === 'NCERT' && styles.boardButtonActiveNCERT]}
              onPress={() => {
                setSelectedBoard('NCERT');
                setSelectedGrade(6);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, selectedBoard === 'NCERT' && styles.boardButtonTextActive]}>
                NCERT
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boardButton, selectedBoard === 'ICSE' && styles.boardButtonActiveICSE]}
              onPress={() => {
                setSelectedBoard('ICSE');
                setSelectedGrade(9);
                setSelectedSubject('');
                setSelectedChapter('');
              }}
            >
              <Text style={[styles.boardButtonText, selectedBoard === 'ICSE' && styles.boardButtonTextActive]}>
                ICSE
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
            {isMultiChapterMode ? (
              <>
                <Text style={styles.sectionTitle}>Select Chapters for Question Paper</Text>
                <Text style={styles.sectionSubtitle}>
                  Select multiple chapters to create a comprehensive ICSE board exam paper
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
                        style={[styles.multiChapterButton, isSelected && styles.multiChapterButtonActive]}
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
                            style={[styles.multiChapterTitle, isSelected && styles.multiChapterTitleActive]}
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
                <Text style={styles.sectionTitle}>Select Chapter (or enter custom topic)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  {chapters.map((chapter) => (
                    <TouchableOpacity
                      key={chapter.id}
                      style={[styles.chapterButton, selectedChapter === chapter.id && styles.chapterButtonActive]}
                      onPress={() => {
                        setSelectedChapter(chapter.id);
                        setCustomTopic('');
                        setSelectedChapters([]);
                      }}
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
                
                <TextInput
                  style={styles.customInput}
                  placeholder="Or enter custom topic..."
                  placeholderTextColor="#94a3b8"
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
          <Text style={styles.sectionTitle}>Content Type</Text>
          <View style={styles.contentTypeGrid}>
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.contentTypeButton,
                    contentType === type.id && { backgroundColor: type.color + '15', borderColor: type.color },
                  ]}
                  onPress={() => setContentType(type.id)}
                >
                  <Icon size={24} color={contentType === type.id ? type.color : '#64748b'} />
                  <Text
                    style={[
                      styles.contentTypeText,
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
            <Text style={styles.errorText}>Failed to generate content. Please try again.</Text>
          </View>
        )}

        {generatedContent && (
          <>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleTextToSpeech}>
                {isSpeaking ? (
                  <VolumeX size={18} color="#8b5cf6" />
                ) : (
                  <Volume2 size={18} color="#8b5cf6" />
                )}
                <Text style={styles.actionButtonText}>{isSpeaking ? 'Stop' : 'Listen'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={exportToPDF}>
                <Download size={18} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={async () => {
                  try {
                    if (Platform.OS === 'web') {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(generatedContent);
                        Alert.alert('Success', 'Content copied to clipboard!');
                      } else {
                        Alert.alert('Info', 'Please manually copy the content');
                      }
                    } else {
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) {
                        await Sharing.shareAsync(`data:text/plain;base64,${btoa(generatedContent)}`, {
                          dialogTitle: 'Share Content',
                        });
                      } else {
                        Alert.alert('Error', 'Sharing is not available on this device');
                      }
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                    Alert.alert('Info', 'Content ready to copy manually');
                  }
                }}
              >
                <Share2 size={18} color="#10b981" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Generated Content</Text>
              <Text style={styles.resultContent}>{cleanMarkdown(generatedContent)}</Text>
            </View>
          </>
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
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
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
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#94a3b8',
    marginBottom: 4,
  },
  chapterNumberActive: {
    color: '#3b82f6',
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#64748b',
    lineHeight: 18,
  },
  chapterTitleActive: {
    color: '#1e40af',
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  contentTypeText: {
    fontSize: 15,
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
    backgroundColor: '#8b5cf6',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  resultCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  resultContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
});
