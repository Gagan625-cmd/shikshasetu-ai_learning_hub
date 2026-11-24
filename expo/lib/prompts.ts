/**
 * Refined, syllabus-grounded prompt engineering for ShikshaSetu.
 *
 * Every content-generation prompt is anchored to the actual CBSE (NCERT) or
 * ICSE syllabus scope for the student's class, so generated quizzes, notes,
 * worksheets and plans stay inside the board curriculum instead of generic
 * textbook-level output.
 */

import { NCERT_SUBJECTS } from '@/constants/ncert-data';
import { ICSE_SUBJECTS } from '@/constants/icse-data';

type Subject = { name: string; grade: number; chapters: Array<{ number: number; title: string; description: string }> };

/** Board label → subject list. CBSE/NCERT/State Board map to the NCERT syllabus. */
export function subjectsForBoard(board: string, grade: number): Subject[] {
  const isICSE = board.toUpperCase().includes('ICSE');
  const pool = isICSE ? ICSE_SUBJECTS : NCERT_SUBJECTS;
  const exact = pool.filter((s) => s.grade === grade);
  if (exact.length > 0) return exact as Subject[];
  // Nearest grade as a graceful fallback.
  const grades = Array.from(new Set(pool.map((s) => s.grade))).sort((a, b) => Math.abs(a - grade) - Math.abs(b - grade));
  return pool.filter((s) => s.grade === grades[0]) as Subject[];
}

/** Formatted syllabus scope: every chapter of a subject (or all subjects) with its description. */
export function buildSyllabusScope(board: string, grade: number, subjectName?: string): string {
  const subjects = subjectsForBoard(board, grade);
  const chosen = subjectName ? subjects.filter((s) => s.name === subjectName) : subjects;
  const scope = (chosen.length > 0 ? chosen : subjects)
    .map(
      (s) =>
        `${s.name}:\n` +
        s.chapters.map((c) => `  Ch ${c.number}. ${c.title} — ${c.description}`).join('\n')
    )
    .join('\n\n');
  const boardLabel = board.toUpperCase().includes('ICSE') ? 'ICSE' : 'CBSE (NCERT)';
  return `${boardLabel} Class ${grade} official syllabus scope:\n${scope}`;
}

/**
 * Master system prompt: a senior Indian board examiner + master teacher.
 * Every generation shares this persona so output quality is consistent.
 */
export const EDUCATION_SYSTEM_PROMPT = `You are ShikshaSetu's master educator — a senior CBSE/ICSE examiner with 20+ years of classroom experience who writes board-exam-grade study material for Indian school students (Classes 6-12).

Non-negotiable quality rules:
1. SYLLABUS FIDELITY: Only use content within the provided syllabus scope. Never invent topics outside it. Use exact NCERT/ICSE terminology and chapter wording.
2. DEPTH OVER RECALL: Test and teach understanding, application and analysis (Bloom's levels: Understand, Apply, Analyze, Evaluate). Ban trivial one-word recall unless explicitly asked.
3. BOARD-EXAM AUTHENTICITY: Mirror real board-paper language, marks weightage and question styles, including competency-based and assertion-reasoning formats introduced by NEP 2020.
4. AGE-APPROPRIATE LANGUAGE: Match the class level — simple sentences for Class 6, progressively richer vocabulary by Class 10.
5. NUMERIC ACCURACY: For Maths/Science, verify every calculation, unit and formula before writing it. Show the reasoning in explanations.
6. ANSWER KEY INTEGRITY: The correct option must be objectively correct and unambiguous; distractors must be plausible but clearly wrong to an expert.
7. LANGUAGE: Write in the language the request specifies. Keep technical terms in English with a translation in brackets when writing Hindi or regional languages.
8. EXPLANATIONS: Always teach in the explanation — state the concept, the reasoning, and one memorable takeaway or common mistake.

You are writing for an Indian student preparing for school exams. Be encouraging but never sacrifice accuracy for feel-good content.`;

/** Extra instruction appended when structured JSON output is required. */
export const JSON_OUTPUT_RULE = `Output ONLY valid JSON matching the requested shape. No markdown fences, no commentary before or after the JSON.`;
