import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { UserRole, Language, UserProgress, QuizResult, ContentActivity, TeacherActivity, ExamActivity, TeacherUpload, XPEntry, GamePlayRecord, GKQuizRecord, FunLearningState } from '@/types';
import { useAuth } from '@/contexts/auth-context';

const XP_REWARD_THRESHOLD = 10000;
const XP_REWARD_DURATION_DAYS = 30;
const STREAK_XP_REWARD_DAYS = 7;
const STREAK_XP_REWARD_AMOUNT = 3;

const REVIEW_STORAGE_KEY = 'storeReviewData';
const MIN_ACTIONS_FOR_REVIEW = 3;
const MIN_DAYS_BETWEEN_REVIEWS = 30;

const DEFAULT_PROGRESS: UserProgress = {
  quizzesCompleted: [],
  contentActivities: [],
  teacherActivities: [],
  examActivities: [],
  teacherUploads: [],
  totalStudyTime: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  currentStreak: 0,
  totalXP: 0,
  xpHistory: [],
  xpReward: null,
  streakXPAwarded: [],
  funLearning: {
    gamePlaysToday: [],
    gkQuizzesToday: [],
    lastPlayDate: '',
    pendingXPLoss: false,
  },
};

function getUserStorageKey(userEmail: string | undefined, key: string): string {
  const prefix = userEmail && userEmail !== 'guest@app.com' ? `user_${userEmail}` : 'guest';
  return `${prefix}_${key}`;
}

export const [AppProvider, useApp] = createContextHook(() => {
  const { user } = useAuth();
  const currentUserEmail = user?.email;
  const prevUserRef = useRef<string | undefined>(undefined);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [isLoading, setIsLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress>({ ...DEFAULT_PROGRESS });

  const saveProgress = useCallback(async (progress: UserProgress) => {
    try {
      const key = getUserStorageKey(currentUserEmail, 'userProgress');
      await AsyncStorage.setItem(key, JSON.stringify(progress));
      console.log('Saved progress for key:', key);
    } catch (error) {
      console.log('Error saving progress:', error);
    }
  }, [currentUserEmail]);

  const updateStreak = useCallback((lastActive: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    setUserProgress(prev => {
      let newStreak = prev.currentStreak;
      if (lastActive === today) {
        return prev;
      } else if (lastActive === yesterday) {
        newStreak = prev.currentStreak + 1;
      } else {
        newStreak = 1;
      }

      let updatedXP = prev.totalXP;
      let updatedHistory = prev.xpHistory;
      let updatedStreakXPAwarded = [...prev.streakXPAwarded];

      if (newStreak >= STREAK_XP_REWARD_DAYS && newStreak % STREAK_XP_REWARD_DAYS === 0) {
        const streakKey = `${today}_${newStreak}`;
        if (!updatedStreakXPAwarded.includes(streakKey)) {
          updatedXP += STREAK_XP_REWARD_AMOUNT;
          updatedHistory = [...updatedHistory, {
            id: Date.now().toString(),
            amount: STREAK_XP_REWARD_AMOUNT,
            reason: `${STREAK_XP_REWARD_DAYS}-day streak bonus!`,
            earnedAt: new Date(),
          }];
          updatedStreakXPAwarded = [...updatedStreakXPAwarded, streakKey];
          console.log(`Streak XP awarded: +${STREAK_XP_REWARD_AMOUNT} XP for ${STREAK_XP_REWARD_DAYS}-day streak`);
        }
      }

      const todayStr = today;
      const funLearning: FunLearningState = prev.funLearning.lastPlayDate === todayStr
        ? prev.funLearning
        : {
            gamePlaysToday: [],
            gkQuizzesToday: [],
            lastPlayDate: todayStr,
            pendingXPLoss: false,
          };

      const updated = {
        ...prev,
        currentStreak: newStreak,
        lastActiveDate: today,
        totalXP: updatedXP,
        xpHistory: updatedHistory,
        streakXPAwarded: updatedStreakXPAwarded,
        funLearning,
      };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const loadSettings = useCallback(async () => {
    try {
      const roleKey = getUserStorageKey(currentUserEmail, 'userRole');
      const langKey = getUserStorageKey(currentUserEmail, 'language');
      const progressKey = getUserStorageKey(currentUserEmail, 'userProgress');
      console.log('Loading settings for user:', currentUserEmail, 'keys:', roleKey, langKey, progressKey);

      const role = await AsyncStorage.getItem(roleKey);
      const language = await AsyncStorage.getItem(langKey);
      const progress = await AsyncStorage.getItem(progressKey);
      
      if (role) setUserRole(role as UserRole);
      else setUserRole(null);
      if (language) setSelectedLanguage(language as Language);
      else setSelectedLanguage('english');
      if (progress) {
        const parsed = JSON.parse(progress);
        const normalizedProgress: UserProgress = {
          quizzesCompleted: parsed.quizzesCompleted || [],
          contentActivities: parsed.contentActivities || [],
          teacherActivities: parsed.teacherActivities || [],
          examActivities: parsed.examActivities || [],
          teacherUploads: parsed.teacherUploads || [],
          totalStudyTime: parsed.totalStudyTime || 0,
          lastActiveDate: parsed.lastActiveDate || new Date().toISOString().split('T')[0],
          currentStreak: parsed.currentStreak || 0,
          totalXP: parsed.totalXP || 0,
          xpHistory: parsed.xpHistory || [],
          xpReward: parsed.xpReward || null,
        streakXPAwarded: parsed.streakXPAwarded || [],
        funLearning: parsed.funLearning || {
          gamePlaysToday: [],
          gkQuizzesToday: [],
          lastPlayDate: '',
          pendingXPLoss: false,
        },
        };
        setUserProgress(normalizedProgress);
        updateStreak(normalizedProgress.lastActiveDate);
      } else {
        setUserProgress({ ...DEFAULT_PROGRESS });
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateStreak, currentUserEmail]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (prevUserRef.current !== currentUserEmail) {
      console.log('User changed from', prevUserRef.current, 'to', currentUserEmail);
      prevUserRef.current = currentUserEmail;
      setIsLoading(true);
      void loadSettings();
    }
  }, [currentUserEmail, loadSettings]);

  const selectRole = useCallback(async (role: UserRole) => {
    setUserRole(role);
    const key = getUserStorageKey(currentUserEmail, 'userRole');
    await AsyncStorage.setItem(key, role);
  }, [currentUserEmail]);

  const changeLanguage = useCallback(async (language: Language) => {
    setSelectedLanguage(language);
    const key = getUserStorageKey(currentUserEmail, 'language');
    await AsyncStorage.setItem(key, language);
  }, [currentUserEmail]);

  const resetApp = useCallback(async () => {
    setUserRole(null);
    const key = getUserStorageKey(currentUserEmail, 'userRole');
    await AsyncStorage.removeItem(key);
  }, [currentUserEmail]);

  const addXP = useCallback((amount: number, reason: string) => {
    setUserProgress(prev => {
      const entry: XPEntry = {
        id: Date.now().toString(),
        amount,
        reason,
        earnedAt: new Date(),
      };
      const newTotalXP = prev.totalXP + amount;
      let xpReward = prev.xpReward;

      if (xpReward && new Date(xpReward.expiresAt) < new Date()) {
        xpReward = null;
      }

      if (!xpReward && newTotalXP >= XP_REWARD_THRESHOLD) {
        const now = new Date();
        const expires = new Date(now.getTime() + XP_REWARD_DURATION_DAYS * 24 * 60 * 60 * 1000);
        xpReward = {
          active: true,
          activatedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        };
        console.log('XP Reward activated! Free premium for 30 days.');
      }

      const updated = {
        ...prev,
        totalXP: newTotalXP,
        xpHistory: [...prev.xpHistory, entry],
        xpReward,
      };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const addQuizResult = useCallback((result: QuizResult) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        quizzesCompleted: [...prev.quizzesCompleted, result],
      };
      void saveProgress(updated);
      updateStreak(prev.lastActiveDate);
      return updated;
    });
  }, [saveProgress, updateStreak]);

  const addContentActivity = useCallback((activity: ContentActivity) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        contentActivities: [...prev.contentActivities, activity],
      };
      void saveProgress(updated);
      updateStreak(prev.lastActiveDate);
      return updated;
    });
  }, [saveProgress, updateStreak]);

  const addStudyTime = useCallback((minutes: number) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        totalStudyTime: prev.totalStudyTime + minutes,
      };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const addTeacherActivity = useCallback((activity: TeacherActivity) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        teacherActivities: [...prev.teacherActivities, activity],
      };
      void saveProgress(updated);
      updateStreak(prev.lastActiveDate);
      return updated;
    });
  }, [saveProgress, updateStreak]);

  const addExamActivity = useCallback((activity: ExamActivity) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        examActivities: [...prev.examActivities, activity],
      };
      void saveProgress(updated);
      updateStreak(prev.lastActiveDate);
      return updated;
    });
  }, [saveProgress, updateStreak]);

  const addTeacherUpload = useCallback((upload: TeacherUpload) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        teacherUploads: [...prev.teacherUploads, upload],
      };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const maybeRequestReview = useCallback(async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        console.log('Store review not available on this device');
        return;
      }

      const stored = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      const reviewData = stored ? JSON.parse(stored) : { actionCount: 0, lastRequestDate: null };
      
      reviewData.actionCount = (reviewData.actionCount || 0) + 1;
      
      const now = new Date();
      const lastRequest = reviewData.lastRequestDate ? new Date(reviewData.lastRequestDate) : null;
      const daysSinceLastRequest = lastRequest 
        ? Math.floor((now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60 * 24)) 
        : MIN_DAYS_BETWEEN_REVIEWS + 1;
      
      if (reviewData.actionCount >= MIN_ACTIONS_FOR_REVIEW && daysSinceLastRequest >= MIN_DAYS_BETWEEN_REVIEWS) {
        console.log('Requesting store review...');
        await StoreReview.requestReview();
        reviewData.actionCount = 0;
        reviewData.lastRequestDate = now.toISOString();
      }
      
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewData));
    } catch (error) {
      console.log('Error with store review:', error);
    }
  }, []);

  const recordGamePlay = useCallback((game: 'pacman' | 'flappy' | 'tictactoe', won: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    setUserProgress(prev => {
      const record: GamePlayRecord = { date: today, game, won };
      const funLearning = prev.funLearning.lastPlayDate === today
        ? { ...prev.funLearning }
        : { gamePlaysToday: [], gkQuizzesToday: [], lastPlayDate: today, pendingXPLoss: false };

      funLearning.gamePlaysToday = [...funLearning.gamePlaysToday, record];

      let newXP = prev.totalXP;
      let newHistory = prev.xpHistory;

      if (!won) {
        funLearning.pendingXPLoss = true;
        newXP = Math.max(0, newXP - 1);
        const gameNames: Record<string, string> = { pacman: 'Pacman', flappy: 'Flappy Bird', tictactoe: 'Tic-Tac-Toe' };
        newHistory = [...newHistory, {
          id: Date.now().toString(),
          amount: -1,
          reason: `Lost ${gameNames[game] || game} game`,
          earnedAt: new Date(),
        }];
        console.log('Game lost: -1 XP');
      }

      const updated = { ...prev, totalXP: newXP, xpHistory: newHistory, funLearning };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const recordGKQuiz = useCallback((score: number, totalQuestions: number) => {
    const today = new Date().toISOString().split('T')[0];
    setUserProgress(prev => {
      const record: GKQuizRecord = { date: today, score, totalQuestions };
      const funLearning = prev.funLearning.lastPlayDate === today
        ? { ...prev.funLearning }
        : { gamePlaysToday: [], gkQuizzesToday: [], lastPlayDate: today, pendingXPLoss: false };

      funLearning.gkQuizzesToday = [...funLearning.gkQuizzesToday, record];

      let newXP = prev.totalXP;
      let newHistory = prev.xpHistory;

      if (score >= 3 && funLearning.pendingXPLoss) {
        funLearning.pendingXPLoss = false;
        newXP = newXP + 1;
        newHistory = [...newHistory, {
          id: Date.now().toString(),
          amount: 1,
          reason: 'GK Quiz reimbursement (+1 XP)',
          earnedAt: new Date(),
        }];
        console.log('GK Quiz passed: +1 XP reimbursement');
      }

      const updated = { ...prev, totalXP: newXP, xpHistory: newHistory, funLearning };
      void saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const canPlayGame = useCallback((game: 'pacman' | 'flappy' | 'tictactoe') => {
    const today = new Date().toISOString().split('T')[0];
    const fl = userProgress.funLearning;
    if (fl.lastPlayDate !== today) return true;
    return !fl.gamePlaysToday.some(g => g.game === game);
  }, [userProgress.funLearning]);

  const hasXPReward = useMemo(() => {
    if (!userProgress.xpReward) return false;
    return userProgress.xpReward.active && new Date(userProgress.xpReward.expiresAt) > new Date();
  }, [userProgress.xpReward]);

  return useMemo(() => ({
    userRole,
    selectedLanguage,
    isLoading,
    userProgress,
    selectRole,
    changeLanguage,
    resetApp,
    addQuizResult,
    addContentActivity,
    addStudyTime,
    addTeacherActivity,
    addExamActivity,
    addTeacherUpload,
    maybeRequestReview,
    addXP,
    hasXPReward,
    recordGamePlay,
    recordGKQuiz,
    canPlayGame,
  }), [userRole, selectedLanguage, isLoading, userProgress, selectRole, changeLanguage, resetApp, addQuizResult, addContentActivity, addStudyTime, addTeacherActivity, addExamActivity, addTeacherUpload, maybeRequestReview, addXP, hasXPReward, recordGamePlay, recordGKQuiz, canPlayGame]);
});
