export type UserRole = 'student' | 'teacher';

export type Language = 'english' | 'hindi' | 'tamil' | 'telugu' | 'bengali' | 'marathi' | 'gujarati' | 'kannada' | 'malayalam' | 'punjabi';

export interface NCERTSubject {
  id: string;
  name: string;
  grade: number;
  chapters: NCERTChapter[];
}

export interface NCERTChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  content?: string;
}

export interface ICESESubject {
  id: string;
  name: string;
  grade: number;
  chapters: ICESEChapter[];
}

export interface ICESEChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  content?: string;
}

export interface ContentGenerationRequest {
  chapterId: string;
  subjectId: string;
  grade: number;
  type: 'notes' | 'explanation' | 'summary' | 'worksheet';
  language: Language;
}

export interface Quiz {
  id: string;
  chapterId: string;
  questions: QuizQuestion[];
  language: Language;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface InterviewSession {
  id: string;
  type: 'student' | 'teacher';
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  startTime: Date;
  endTime?: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  topic: string;
}

export interface InterviewResponse {
  questionId: string;
  answer: string;
  audioUri?: string;
  videoUri?: string;
  timestamp: Date;
  analysis?: {
    confidence?: number;
    expression?: string;
    clarity?: number;
  };
}

export interface QuizResult {
  id: string;
  board: 'NCERT' | 'ICSE';
  subject: string;
  chapter: string;
  grade: number;
  score: number;
  totalQuestions: number;
  completedAt: Date;
}

export interface ContentActivity {
  id: string;
  board: 'NCERT' | 'ICSE';
  type: 'content' | 'summary' | 'notes' | 'worksheet';
  subject: string;
  chapter: string;
  grade: number;
  completedAt: Date;
}

export interface TeacherActivity {
  type: 'upload' | 'quiz' | 'interview' | 'voice-content-creation';
  title: string;
  timestamp: number;
  details?: string;
  subject?: string;
}

export interface TeacherUpload {
  id: string;
  type: 'video' | 'text';
  title: string;
  content: string;
  videoUrl?: string;
  board: 'NCERT' | 'ICSE';
  grade: number;
  subject: string;
  chapter: string;
  uploadedAt: Date;
}

export interface ExamActivity {
  id: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  scannedAt: Date;
}

export interface UserProgress {
  quizzesCompleted: QuizResult[];
  contentActivities: ContentActivity[];
  teacherActivities: TeacherActivity[];
  examActivities: ExamActivity[];
  teacherUploads: TeacherUpload[];
  totalStudyTime: number;
  lastActiveDate: string;
  currentStreak: number;
}
