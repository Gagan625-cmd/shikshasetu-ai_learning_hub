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
  headerGradientStudent: [string, string, string];
  headerGradientTeacher: [string, string];
  inputBg: string;
  inputBorder: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  infoTitle: string;
  shadow: string;
  accent: string;
  accentSoft: string;
  cardGlow: string;
  featureCardBorder: string;
  scrollBg: string;
}

export const lightTheme: ThemeColors = {
  background: '#e9f2ff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#0a1628',
  textSecondary: '#3d5a80',
  textTertiary: '#7a8faa',
  border: '#cfe0f5',
  cardBg: '#ffffff',
  headerGradientStudent: ['#1e1b4b', '#1d4ed8', '#0ea5e9'],
  headerGradientTeacher: ['#c2410c', '#f97316'],
  inputBg: '#eaf3ff',
  inputBorder: '#bcd6f5',
  infoBg: '#e3efff',
  infoBorder: '#3b82f6',
  infoText: '#1d4ed8',
  infoTitle: '#1e40af',
  shadow: 'rgba(29, 78, 216, 0.12)',
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.12)',
  cardGlow: 'rgba(37, 99, 235, 0.22)',
  featureCardBorder: 'rgba(37,99,235,0.10)',
  scrollBg: '#e9f2ff',
};

export const darkTheme: ThemeColors = {
  background: '#070f1f',
  surface: '#0f1d33',
  surfaceElevated: '#152a4a',
  text: '#f1f5f9',
  textSecondary: '#b8d0e8',
  textTertiary: '#7ea3c4',
  border: '#1a3255',
  cardBg: '#0f1d33',
  headerGradientStudent: ['#1e1b4b', '#312e81', '#0c4a6e'],
  headerGradientTeacher: ['#7c2d12', '#ea580c'],
  inputBg: '#0f1d33',
  inputBorder: '#1a3255',
  infoBg: '#0c1a30',
  infoBorder: '#38bdf8',
  infoText: '#7dd3fc',
  infoTitle: '#38bdf8',
  shadow: 'rgba(0, 0, 0, 0.6)',
  accent: '#38bdf8',
  accentSoft: 'rgba(56, 189, 248, 0.16)',
  cardGlow: 'rgba(56, 189, 248, 0.22)',
  featureCardBorder: 'rgba(56,189,248,0.12)',
  scrollBg: '#070f1f',
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
