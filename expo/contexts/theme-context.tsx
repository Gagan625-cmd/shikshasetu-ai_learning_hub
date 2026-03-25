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
  background: '#f0f7ff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#0a1628',
  textSecondary: '#3d5a80',
  textTertiary: '#7a8faa',
  border: '#d6e4f0',
  cardBg: '#ffffff',
  headerGradientStudent: ['#0a1628', '#0d2847', '#0e3460'],
  headerGradientTeacher: ['#7c2d12', '#c2410c'],
  inputBg: '#edf4ff',
  inputBorder: '#c8daf0',
  infoBg: '#e8f4fe',
  infoBorder: '#0096c7',
  infoText: '#005f8a',
  infoTitle: '#006da3',
  shadow: 'rgba(10, 22, 40, 0.1)',
  accent: '#0077b6',
  accentSoft: 'rgba(0, 119, 182, 0.1)',
  cardGlow: 'rgba(0, 180, 216, 0.15)',
  featureCardBorder: 'rgba(0,40,71,0.06)',
  scrollBg: '#f0f7ff',
};

export const darkTheme: ThemeColors = {
  background: '#060d18',
  surface: '#0d1a2d',
  surfaceElevated: '#132640',
  text: '#f1f5f9',
  textSecondary: '#b8d0e8',
  textTertiary: '#7ea3c4',
  border: '#152a45',
  cardBg: '#0d1a2d',
  headerGradientStudent: ['#040a14', '#091828', '#0d2440'],
  headerGradientTeacher: ['#3b1106', '#6c2c0c'],
  inputBg: '#0d1a2d',
  inputBorder: '#152a45',
  infoBg: '#0a1525',
  infoBorder: '#00b4d8',
  infoText: '#7dd3fc',
  infoTitle: '#38bdf8',
  shadow: 'rgba(0, 0, 0, 0.6)',
  accent: '#00b4d8',
  accentSoft: 'rgba(0, 180, 216, 0.15)',
  cardGlow: 'rgba(0, 180, 216, 0.18)',
  featureCardBorder: 'rgba(125,211,252,0.08)',
  scrollBg: '#060d18',
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
