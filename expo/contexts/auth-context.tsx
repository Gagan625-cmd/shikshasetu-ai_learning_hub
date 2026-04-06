import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

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
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [pendingIsSignUp, setPendingIsSignUp] = useState(false);

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

      if (isSupabaseConfigured) {
        console.log('Sending real OTP email to:', email);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          console.log('Supabase OTP error:', error.message);
          throw new Error(error.message);
        }
        console.log('Real OTP email sent successfully to:', email);
      } else {
        console.log('Supabase not configured, using local auth for:', email);
      }

      setPendingEmail(email);
      setPendingPassword(password);
      setPendingName(name);
      setPendingIsSignUp(true);

      return { success: true, email };
    } catch (error: any) {
      console.log('initiateSignUp error:', error.message);
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

      if (isSupabaseConfigured) {
        console.log('Sending real OTP email to:', email);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          console.log('Supabase OTP error:', error.message);
          throw new Error(error.message);
        }
        console.log('Real OTP email sent successfully to:', email);
      } else {
        console.log('Supabase not configured, using local auth for:', email);
      }

      const name = users[email]?.name || email.split('@')[0];
      setPendingEmail(email);
      setPendingPassword(password);
      setPendingName(name);
      setPendingIsSignUp(!users[email]);

      return { success: true, email };
    } catch (error: any) {
      console.log('initiateSignIn error:', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const verifyOTP = useCallback(async (enteredOTP: string) => {
    try {
      if (!pendingEmail) {
        throw new Error('No pending verification. Please try again.');
      }

      if (isSupabaseConfigured) {
        console.log('Verifying real OTP for:', pendingEmail);
        const { error } = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: enteredOTP,
          type: 'email',
        });

        if (error) {
          console.log('Supabase verify OTP error:', error.message);
          if (error.message.includes('expired')) {
            throw new Error('Verification code expired. Please request a new one.');
          }
          throw new Error('Invalid verification code. Please check and try again.');
        }
      } else {
        console.log('Supabase not configured, skipping OTP verification for:', pendingEmail);
      }

      const email = pendingEmail;
      const password = pendingPassword || '';
      const name = pendingName || email.split('@')[0];
      const isSignUp = pendingIsSignUp;

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

      setPendingEmail(null);
      setPendingPassword(null);
      setPendingName(null);
      setPendingIsSignUp(false);

      console.log('OTP verified successfully, sign in complete. Auth code:', authCode);
      return { success: true, authCode, isNewUser: isSignUp };
    } catch (error: any) {
      console.log('verifyOTP error:', error.message);
      return { success: false, error: error.message };
    }
  }, [pendingEmail, pendingPassword, pendingName, pendingIsSignUp]);

  const resendOTP = useCallback(async () => {
    if (!pendingEmail) return { success: false, error: 'No pending verification' };

    try {
      if (isSupabaseConfigured) {
        console.log('Resending real OTP email to:', pendingEmail);
        const { error } = await supabase.auth.signInWithOtp({ email: pendingEmail });
        if (error) {
          console.log('Supabase resend OTP error:', error.message);
          return { success: false, error: error.message };
        }
        console.log('OTP resent successfully to:', pendingEmail);
      } else {
        console.log('Supabase not configured, simulating resend for:', pendingEmail);
      }

      return { success: true, email: pendingEmail };
    } catch (error: any) {
      console.log('resendOTP error:', error.message);
      return { success: false, error: error.message };
    }
  }, [pendingEmail]);

  const cancelVerification = useCallback(() => {
    setPendingEmail(null);
    setPendingPassword(null);
    setPendingName(null);
    setPendingIsSignUp(false);
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
    setPendingEmail(null);
    setPendingPassword(null);
    setPendingName(null);
    setPendingIsSignUp(false);
    await AsyncStorage.removeItem('user');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
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
    pendingEmail,
    initiateSignUp,
    initiateSignIn,
    verifyOTP,
    resendOTP,
    cancelVerification,
    signInWithCode,
    signOut,
    continueAsGuest,
  }), [user, isLoading, lastAuthCode, pendingEmail, initiateSignUp, initiateSignIn, verifyOTP, resendOTP, cancelVerification, signInWithCode, signOut, continueAsGuest]);
});
