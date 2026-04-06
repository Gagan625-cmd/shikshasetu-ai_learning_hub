import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface User {
  email: string;
  name: string;
  isGuest?: boolean;
  authCode?: string;
}

interface PendingAuth {
  email: string;
  password: string;
  name: string;
  otp: string;
  isSignUp: boolean;
  expiresAt: number;
}

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
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
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

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

  const initiateSignUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[email]) {
        throw new Error('Email already registered');
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      setPendingAuth({ email, password, name, otp, isSignUp: true, expiresAt });
      console.log('OTP generated for sign up:', otp, 'email:', email);
      return { success: true, otp, email };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const initiateSignIn = useCallback(async (email: string, password: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[email] && users[email].password !== password) {
        throw new Error('Incorrect password');
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const name = users[email]?.name || email.split('@')[0];
      setPendingAuth({ email, password, name, otp, isSignUp: !users[email], expiresAt });
      console.log('OTP generated for sign in:', otp, 'email:', email);
      return { success: true, otp, email };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const verifyOTP = useCallback(async (enteredOTP: string) => {
    try {
      if (!pendingAuth) {
        throw new Error('No pending verification. Please try again.');
      }

      if (Date.now() > pendingAuth.expiresAt) {
        setPendingAuth(null);
        throw new Error('Verification code expired. Please try again.');
      }

      if (enteredOTP !== pendingAuth.otp) {
        throw new Error('Invalid verification code. Please check and try again.');
      }

      const { email, password, name, isSignUp } = pendingAuth;
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      const authCode = users[email]?.authCode || await generateUniqueAuthCode();

      if (isSignUp || !users[email]) {
        users[email] = { password, name, authCode };
        await AsyncStorage.setItem('users', JSON.stringify(users));

        const authCodes = JSON.parse((await AsyncStorage.getItem('authCodes')) || '{}');
        authCodes[authCode] = email;
        await AsyncStorage.setItem('authCodes', JSON.stringify(authCodes));
      }

      const loggedInUser: User = { email, name: users[email].name, authCode };
      setUser(loggedInUser);
      setLastAuthCode(authCode);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      setPendingAuth(null);

      console.log('OTP verified, sign in complete. Auth code:', authCode);
      return { success: true, authCode, isNewUser: isSignUp };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [pendingAuth]);

  const resendOTP = useCallback(() => {
    if (!pendingAuth) return { success: false, error: 'No pending verification' };
    const newOTP = generateOTP();
    const newExpiresAt = Date.now() + 5 * 60 * 1000;
    setPendingAuth({ ...pendingAuth, otp: newOTP, expiresAt: newExpiresAt });
    console.log('New OTP generated:', newOTP, 'for email:', pendingAuth.email);
    return { success: true, otp: newOTP, email: pendingAuth.email };
  }, [pendingAuth]);

  const cancelVerification = useCallback(() => {
    setPendingAuth(null);
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
    setPendingAuth(null);
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
    pendingAuth: pendingAuth ? { email: pendingAuth.email, expiresAt: pendingAuth.expiresAt } : null,
    initiateSignUp,
    initiateSignIn,
    verifyOTP,
    resendOTP,
    cancelVerification,
    signInWithCode,
    signOut,
    continueAsGuest,
  }), [user, isLoading, lastAuthCode, pendingAuth, initiateSignUp, initiateSignIn, verifyOTP, resendOTP, cancelVerification, signInWithCode, signOut, continueAsGuest]);
});
