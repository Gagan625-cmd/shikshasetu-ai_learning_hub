import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useApp } from '@/contexts/app-context';

export function useStudyTimeTracker(screenName: string) {
  const { addStudyTime } = useApp();
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(true);

  const flushTime = useCallback(() => {
    if (isActiveRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      accumulatedRef.current += elapsed;
      startTimeRef.current = Date.now();
    }
    const totalMinutes = Math.floor(accumulatedRef.current / 60000);
    if (totalMinutes > 0) {
      console.log(`[StudyTracker] ${screenName}: Adding ${totalMinutes} minutes`);
      addStudyTime(totalMinutes);
      accumulatedRef.current = accumulatedRef.current % 60000;
    }
  }, [addStudyTime, screenName]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;
    isActiveRef.current = true;
    console.log(`[StudyTracker] ${screenName}: Started tracking`);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startTimeRef.current = Date.now();
        isActiveRef.current = true;
        console.log(`[StudyTracker] ${screenName}: App resumed`);
      } else {
        if (isActiveRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          accumulatedRef.current += elapsed;
          isActiveRef.current = false;
          console.log(`[StudyTracker] ${screenName}: App backgrounded, accumulated ${Math.floor(accumulatedRef.current / 1000)}s`);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const intervalId = setInterval(() => {
      if (isActiveRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        accumulatedRef.current += elapsed;
        startTimeRef.current = Date.now();
        const totalMinutes = Math.floor(accumulatedRef.current / 60000);
        if (totalMinutes > 0) {
          console.log(`[StudyTracker] ${screenName}: Periodic save ${totalMinutes} minutes`);
          addStudyTime(totalMinutes);
          accumulatedRef.current = accumulatedRef.current % 60000;
        }
      }
    }, 60000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
      if (isActiveRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        accumulatedRef.current += elapsed;
      }
      const totalMinutes = Math.floor(accumulatedRef.current / 60000);
      if (totalMinutes > 0) {
        console.log(`[StudyTracker] ${screenName}: Unmount save ${totalMinutes} minutes`);
        addStudyTime(totalMinutes);
      }
      console.log(`[StudyTracker] ${screenName}: Stopped tracking (${Math.floor(accumulatedRef.current / 1000)}s total)`);
    };
  }, [addStudyTime, screenName]);

  return { flushTime };
}
