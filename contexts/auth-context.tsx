import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

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

  const checkBiometricAvailability = useCallback(async () => {
    if (Platform.OS === 'web') {
      return { available: false, enrolled: false, hasSavedCredentials: false };
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const savedEmail = await SecureStore.getItemAsync('biometric_email');
      return {
        available: hasHardware,
        enrolled: isEnrolled,
        hasSavedCredentials: !!savedEmail,
      };
    } catch (error) {
      console.log('Biometric check error:', error);
      return { available: false, enrolled: false, hasSavedCredentials: false };
    }
  }, []);

  const enableBiometricLogin = useCallback(async (email: string, password: string) => {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometric login not supported on web' };
    }
    try {
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);
      await AsyncStorage.setItem('biometric_enabled', 'true');
      return { success: true };
    } catch (error: any) {
      console.log('Enable biometric error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const signInWithBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometric login not supported on web' };
    }
    try {
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (biometricEnabled !== 'true') {
        return { success: false, error: 'Biometric login not enabled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometrics',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, error: 'Authentication failed' };
      }

      const email = await SecureStore.getItemAsync('biometric_email');
      const password = await SecureStore.getItemAsync('biometric_password');

      if (!email || !password) {
        return { success: false, error: 'No saved credentials found' };
      }

      return await signIn(email, password);
    } catch (error: any) {
      console.log('Biometric sign in error:', error);
      return { success: false, error: error.message };
    }
  }, [signIn]);

  const disableBiometricLogin = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_password');
      await AsyncStorage.removeItem('biometric_enabled');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    checkBiometricAvailability,
    enableBiometricLogin,
    signInWithBiometric,
    disableBiometricLogin,
  }), [user, isLoading, signUp, signIn, signOut, continueAsGuest, checkBiometricAvailability, enableBiometricLogin, signInWithBiometric, disableBiometricLogin]);
});
