import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  cardBg: string;
  headerGradientStudent: [string, string];
  headerGradientTeacher: [string, string];
  inputBg: string;
  inputBorder: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  infoTitle: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  cardBg: '#ffffff',
  headerGradientStudent: ['#0f172a', '#1e3a5f'],
  headerGradientTeacher: ['#92400e', '#b45309'],
  inputBg: '#f8fafc',
  inputBorder: '#e2e8f0',
  infoBg: '#eff6ff',
  infoBorder: '#3b82f6',
  infoText: '#1e40af',
  infoTitle: '#1e40af',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#334155',
  cardBg: '#1e293b',
  headerGradientStudent: ['#020617', '#0f172a'],
  headerGradientTeacher: ['#451a03', '#78350f'],
  inputBg: '#1e293b',
  inputBorder: '#334155',
  infoBg: '#1e293b',
  infoBorder: '#3b82f6',
  infoText: '#93c5fd',
  infoTitle: '#60a5fa',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      if (val === 'true') setIsDark(true);
    }).catch(() => {});
  }, []);

  const toggleDarkMode = useCallback(async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('darkMode', String(newVal));
  }, [isDark]);

  const colors = useMemo(() => isDark ? darkTheme : lightTheme, [isDark]);

  return useMemo(() => ({
    isDark,
    colors,
    toggleDarkMode,
  }), [isDark, colors, toggleDarkMode]);
});
