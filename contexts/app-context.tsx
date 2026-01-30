import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { UserRole, Language, UserProgress, QuizResult, ContentActivity, TeacherActivity, ExamActivity, TeacherUpload } from '@/types';

const REVIEW_STORAGE_KEY = 'storeReviewData';
const MIN_ACTIONS_FOR_REVIEW = 3;
const MIN_DAYS_BETWEEN_REVIEWS = 30;

export const [AppProvider, useApp] = createContextHook(() => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [isLoading, setIsLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    quizzesCompleted: [],
    contentActivities: [],
    teacherActivities: [],
    examActivities: [],
    teacherUploads: [],
    totalStudyTime: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    currentStreak: 0,
  });

  const saveProgress = useCallback(async (progress: UserProgress) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(progress));
    } catch (error) {
      console.log('Error saving progress:', error);
    }
  }, []);

  const updateStreak = useCallback((lastActive: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    setUserProgress(prev => {
      if (lastActive === today) {
        return prev;
      } else if (lastActive === yesterday) {
        const updated = { ...prev, currentStreak: prev.currentStreak + 1, lastActiveDate: today };
        saveProgress(updated);
        return updated;
      } else {
        const updated = { ...prev, currentStreak: 1, lastActiveDate: today };
        saveProgress(updated);
        return updated;
      }
    });
  }, [saveProgress]);

  const loadSettings = useCallback(async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const language = await AsyncStorage.getItem('language');
      const progress = await AsyncStorage.getItem('userProgress');
      
      if (role) setUserRole(role as UserRole);
      if (language) setSelectedLanguage(language as Language);
      if (progress) {
        const parsed = JSON.parse(progress);
        const normalizedProgress = {
          quizzesCompleted: parsed.quizzesCompleted || [],
          contentActivities: parsed.contentActivities || [],
          teacherActivities: parsed.teacherActivities || [],
          examActivities: parsed.examActivities || [],
          teacherUploads: parsed.teacherUploads || [],
          totalStudyTime: parsed.totalStudyTime || 0,
          lastActiveDate: parsed.lastActiveDate || new Date().toISOString().split('T')[0],
          currentStreak: parsed.currentStreak || 0,
        };
        setUserProgress(normalizedProgress);
        updateStreak(normalizedProgress.lastActiveDate);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateStreak]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const selectRole = useCallback(async (role: UserRole) => {
    setUserRole(role);
    await AsyncStorage.setItem('userRole', role);
  }, []);

  const changeLanguage = useCallback(async (language: Language) => {
    setSelectedLanguage(language);
    await AsyncStorage.setItem('language', language);
  }, []);

  const resetApp = useCallback(async () => {
    setUserRole(null);
    await AsyncStorage.removeItem('userRole');
  }, []);

  const addQuizResult = useCallback((result: QuizResult) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        quizzesCompleted: [...prev.quizzesCompleted, result],
      };
      saveProgress(updated);
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
      saveProgress(updated);
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
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const addTeacherActivity = useCallback((activity: TeacherActivity) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        teacherActivities: [...prev.teacherActivities, activity],
      };
      saveProgress(updated);
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
      saveProgress(updated);
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
      saveProgress(updated);
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
  }), [userRole, selectedLanguage, isLoading, userProgress, selectRole, changeLanguage, resetApp, addQuizResult, addContentActivity, addStudyTime, addTeacherActivity, addExamActivity, addTeacherUpload, maybeRequestReview]);
});
