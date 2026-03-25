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
  console.log('Generated unique auth code:', code, 'after', attempts, 'attempts');
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
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[email]) {
        throw new Error('Email already registered');
      }

      const authCode = await generateUniqueAuthCode();
      users[email] = { password, name, authCode };
      await AsyncStorage.setItem('users', JSON.stringify(users));

      const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
      authCodes[authCode] = email;
      await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));

      const newUser: User = { email, name, authCode };
      setUser(newUser);
      setLastAuthCode(authCode);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      console.log('Sign up successful, auth code:', authCode);
      return { success: true, authCode };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (!users[email]) {
        const authCode = await generateUniqueAuthCode();
        users[email] = { password, name: email.split('@')[0], authCode };
        await AsyncStorage.setItem('users', JSON.stringify(users));

        const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
        authCodes[authCode] = email;
        await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));

        const newUser: User = { email, name: users[email].name, authCode };
        setUser(newUser);
        setLastAuthCode(authCode);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));

        console.log('Auto-registered and signed in, auth code:', authCode);
        return { success: true, authCode, isNewUser: true };
      }

      if (users[email].password !== password) {
        throw new Error('Incorrect password');
      }

      const authCode = users[email].authCode || await generateUniqueAuthCode();
      if (!users[email].authCode) {
        users[email].authCode = authCode;
        await AsyncStorage.setItem('users', JSON.stringify(users));
        const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
        authCodes[authCode] = email;
        await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));
      }

      const loggedInUser: User = { email, name: users[email].name, authCode };
      setUser(loggedInUser);
      setLastAuthCode(authCode);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      console.log('Sign in successful, auth code:', authCode);
      return { success: true, authCode };
    } catch (error: any) {
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

      console.log('Code sign in successful for:', email);
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
