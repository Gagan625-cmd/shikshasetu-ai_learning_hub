/**
 * Daily dashboard content engine.
 *
 * - The revision plan rotates through the student's REAL syllabus chapters
 *   (board + class), so "What to Study Today" and "Daily Updates" genuinely
 *   change every day and walk the curriculum across the term.
 * - An AI "daily digest" (updates + tips + a focus question) is generated once
 *   per day, cached in AsyncStorage keyed by date, and refreshed at local
 *   midnight. It never burns the user's interactive AI quota.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateWithModel, extractJson } from './ai-model';
import { EDUCATION_SYSTEM_PROMPT, JSON_OUTPUT_RULE, buildSyllabusScope, subjectsForBoard } from './prompts';

export interface DailyPlanItem {
  subject: string;
  topic: string;
  duration: string;
  color: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DailyUpdateItem {
  title: string;
  message: string;
  type: 'tip' | 'motivation' | 'reminder' | 'fact';
  color: string;
}

export interface DailyTipItem {
  title: string;
  tip: string;
  color: string;
}

export interface DailyDigest {
  updates: Array<{ title: string; message: string; type: 'tip' | 'motivation' | 'reminder' | 'fact' }>;
  tips: Array<{ title: string; tip: string }>;
  focusQuestion: { question: string; options: string[]; correctAnswer: number; explanation: string };
  generatedAt: string;
}

/** Days since local epoch — rolls over at the device's own midnight. */
export function localDayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000) + (now.getFullYear() * 366);
}

export function todayKey(): string {
  const now = new Date();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

const SUBJECT_STYLE: Record<string, { color: string; icon: string }> = {
  Mathematics: { color: '#3b82f6', icon: '📐' },
  Science: { color: '#10b981', icon: '🧪' },
  Physics: { color: '#3b82f6', icon: '⚡' },
  Chemistry: { color: '#10b981', icon: '⚗️' },
  Biology: { color: '#ef4444', icon: '🧬' },
  English: { color: '#8b5cf6', icon: '✍️' },
  'English Language': { color: '#8b5cf6', icon: '✍️' },
  'English Literature': { color: '#a855f7', icon: '📚' },
  'Social Science': { color: '#f59e0b', icon: '🌍' },
  History: { color: '#f97316', icon: '🏛️' },
  'History & Civics': { color: '#f97316', icon: '🏛️' },
  Geography: { color: '#06b6d4', icon: '🗺️' },
  Hindi: { color: '#ef4444', icon: '📖' },
  'Computer Applications': { color: '#14b8a6', icon: '💻' },
  'Economic Applications': { color: '#f59e0b', icon: '💹' },
};

const FOCUS_MODES = [
  'Read & revise the concepts',
  'Solve practice problems',
  'Make one-page revision notes',
  'Attempt previous-year questions',
  'Self-test with flashcards',
  'Explain the chapter aloud',
];

/**
 * Revision plan that walks the syllabus: 3 chapters per day, picked from the
 * student's board+class curriculum, rotating so the full scope is covered.
 */
export function buildSyllabusPlan(board?: string, classId?: string | number, grade?: number): DailyPlanItem[] {
  const cls = grade ?? (classId != null ? parseInt(String(classId), 10) : NaN);
  if (!board || Number.isNaN(cls)) return [];
  const subjects = subjectsForBoard(board, cls);
  if (subjects.length === 0) return [];

  const chapters = subjects.flatMap((s) => s.chapters.map((c) => ({ subject: s.name, ...c })));
  if (chapters.length === 0) return [];

  const day = localDayIndex();
  const items: DailyPlanItem[] = [];
  for (let i = 0; i < 3; i++) {
    const chapter = chapters[(day * 3 + i * 7) % chapters.length];
    const mode = FOCUS_MODES[(day + i * 2) % FOCUS_MODES.length];
    const style = SUBJECT_STYLE[chapter.subject] ?? { color: '#0ea5e9', icon: '📘' };
    const priority: DailyPlanItem['priority'] = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
    items.push({
      subject: chapter.subject,
      topic: `Ch ${chapter.number}: ${chapter.title} — ${mode.toLowerCase()}`,
      duration: priority === 'high' ? '30 min' : priority === 'medium' ? '25 min' : '20 min',
      color: style.color,
      icon: style.icon,
      priority,
    });
  }
  return items;
}

/** Today's revision focus line for updates, e.g. "Mathematics · Ch 3: Fractions". */
export function revisionFocusLine(plans: Array<{ subject: string; topic: string }>): string {
  if (plans.length === 0) return 'Plan your day: pick one chapter to revise and one to learn fresh.';
  return plans.map((p) => `${p.subject}: ${p.topic}`).join(' · ');
}

function digestCacheKey(board?: string, classId?: string | number): string {
  return `shikshasetu_daily_digest_${board ?? 'any'}_${classId ?? 'any'}_${todayKey()}`;
}

/**
 * Get today's AI digest — generated at most once per day per board+class,
 * cached in AsyncStorage. Returns null on any failure (callers keep static
 * content). Does NOT consume the interactive AI quota.
 */
export async function getOrGenerateDailyDigest(
  board?: string,
  classId?: string | number,
  language: string = 'English'
): Promise<DailyDigest | null> {
  const cacheKey = digestCacheKey(board, classId);
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as DailyDigest;
  } catch {
    // Cache miss — regenerate below.
  }

  try {
    const cls = classId != null ? parseInt(String(classId), 10) : undefined;
    const scope = board && cls ? buildSyllabusScope(board, cls) : undefined;
    const focusSubjects = board && cls ? subjectsForBoard(board, cls).map((s) => s.name).join(', ') : 'core subjects';

    const prompt = `Create today's daily learning digest for an Indian school student${cls ? ` in Class ${cls}` : ''}${board ? ` (${board} board)` : ''}.

${scope ? `Stay strictly inside this syllabus scope:\n${scope}\n` : `Likely subjects: ${focusSubjects}.`}
Write everything in ${language}.

Return JSON exactly in this shape:
{
  "updates": [
    { "title": "short punchy title (max 4 words)", "message": "1-2 sentence study update or fact tied to a specific topic in today's revision plan", "type": "tip" | "motivation" | "reminder" | "fact" },
    { "title": "...", "message": "...", "type": "..." }
  ],
  "tips": [
    { "title": "short tip name (max 3 words)", "tip": "1-2 sentence actionable study technique, can reference a syllabus topic" },
    { "title": "...", "tip": "..." },
    { "title": "...", "tip": "..." }
  ],
  "focusQuestion": {
    "question": "ONE challenging board-level question from a chapter in the syllabus scope (competency/application style)",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "teaching explanation: the concept, the reasoning, the common mistake"
  }
}

Rules:
- Updates must reference real syllabus topics by name, not generic advice. Each one should feel fresh and specific — name the exact chapter or concept, and include one concrete fact, method or exam cue.
- Tips must name an actual study technique applied to a real topic (e.g. "Feynman the nervous system", not "study regularly").
- The focus question must be answerable from the scope above, board-exam level, with 4 options and a verified correct answer.
- Vary the update types (tip, motivation, reminder, fact). Never repeat yesterday's phrasing style — make today's digest feel personally written.
${JSON_OUTPUT_RULE}`;

    const raw = await generateWithModel({
      system: EDUCATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
      temperature: 0.8,
    });

    const parsed = extractJson(raw) as Partial<DailyDigest>;
    const digest: DailyDigest = {
      updates: Array.isArray(parsed.updates)
        ? parsed.updates.slice(0, 2).filter((u) => u && typeof u.title === 'string' && typeof u.message === 'string')
        : [],
      tips: Array.isArray(parsed.tips)
        ? parsed.tips.slice(0, 3).filter((t) => t && typeof t.title === 'string' && typeof t.tip === 'string')
        : [],
      focusQuestion: parsed.focusQuestion ?? { question: '', options: [], correctAnswer: 0, explanation: '' },
      generatedAt: new Date().toISOString(),
    };
    if (digest.updates.length === 0 && digest.tips.length === 0) return null;

    await AsyncStorage.setItem(cacheKey, JSON.stringify(digest)).catch(() => {});
    // Prune digests older than today so storage stays small.
    AsyncStorage.getAllKeys().then((keys) => {
      const stale = keys.filter((k) => k.startsWith('shikshasetu_daily_digest_') && !k.includes(todayKey()));
      if (stale.length > 0) AsyncStorage.multiRemove(stale).catch(() => {});
    }).catch(() => {});

    return digest;
  } catch (error) {
    console.warn('[DailyContent] Digest generation failed, keeping static content:', error);
    return null;
  }
}
