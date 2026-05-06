import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface User {
  email: string;
  name: string;
  isGuest?: boolean;
  authCode?: string;
}

async function generateUniqueAuthCode(): Promise<string> {
  const existingCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
  let code: string;
  let attempts = 0;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
    attempts++;
    if (attempts > 100) break;
  } while (existingCodes[code]);
  return code;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCode, setLastAuthCode] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[normalizedEmail]) {
        throw new Error('Email already registered. Please sign in instead.');
      }

      const authCode = await generateUniqueAuthCode();
      users[normalizedEmail] = { password, name, authCode };
      await AsyncStorage.setItem('users', JSON.stringify(users));

      const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
      authCodes[authCode] = normalizedEmail;
      await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));

      const loggedInUser: User = { email: normalizedEmail, name, authCode };
      setUser(loggedInUser);
      setLastAuthCode(authCode);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      return { success: true, authCode, isNewUser: true };
    } catch (error: any) {
      console.log('signUp error:', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (!users[normalizedEmail]) {
        throw new Error('No account found with this email. Please sign up.');
      }
      if (users[normalizedEmail].password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      const record = users[normalizedEmail];
      let authCode: string = record.authCode;
      if (!authCode) {
        authCode = await generateUniqueAuthCode();
        users[normalizedEmail].authCode = authCode;
        await AsyncStorage.setItem('users', JSON.stringify(users));
        const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
        authCodes[authCode] = normalizedEmail;
        await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));
      }

      const loggedInUser: User = { email: normalizedEmail, name: record.name, authCode };
      setUser(loggedInUser);
      setLastAuthCode(authCode);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      return { success: true, authCode, isNewUser: false };
    } catch (error: any) {
      console.log('signIn error:', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const signInWithCode = useCallback(async (code: string) => {
    try {
      const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
      const email = authCodes[code];
      if (!email) {
        throw new Error('Invalid auth code');
      }

      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      if (!users[email]) {
        throw new Error('User not found');
      }

      const loggedInUser: User = { email, name: users[email].name, authCode: code };
      setUser(loggedInUser);
      setLastAuthCode(code);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      return { success: true, name: users[email].name };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setLastAuthCode(null);
    await AsyncStorage.removeItem('user');
  }, []);

  const continueAsGuest = useCallback(async () => {
    const guestUser: User = { email: 'guest@app.com', name: 'Guest', isGuest: true };
    setUser(guestUser);
    await AsyncStorage.setItem('user', JSON.stringify(guestUser));
    return { success: true };
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    lastAuthCode,
    signUp,
    signIn,
    signInWithCode,
    signOut,
    continueAsGuest,
  }), [user, isLoading, lastAuthCode, signUp, signIn, signInWithCode, signOut, continueAsGuest]);
});
