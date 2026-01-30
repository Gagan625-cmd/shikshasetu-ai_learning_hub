import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface User {
  email: string;
  name: string;
  isGuest?: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    loadUser();
  }, [loadUser]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      
      if (users[email]) {
        throw new Error('Email already registered');
      }
      
      users[email] = { password, name };
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      const newUser = { email, name };
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      
      if (!users[email]) {
        throw new Error('Email not registered');
      }
      
      if (users[email].password !== password) {
        throw new Error('Incorrect password');
      }
      
      const loggedInUser = { email, name: users[email].name };
      setUser(loggedInUser);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  }, []);

  const continueAsGuest = useCallback(async () => {
    const guestUser = { email: 'guest@app.com', name: 'Guest', isGuest: true };
    setUser(guestUser);
    await AsyncStorage.setItem('user', JSON.stringify(guestUser));
    return { success: true };
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
  }), [user, isLoading, signUp, signIn, signOut, continueAsGuest]);
});
