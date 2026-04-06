import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, UserPlus, Mail, Lock, User, UserCircle, Key, Copy, X, Sparkles, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type AuthStep = 'form' | 'otp' | 'codeLogin';

export default function AuthScreen() {
  const [step, setStep] = useState<AuthStep>('form');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [showAuthCodeModal, setShowAuthCodeModal] = useState(false);
  const [displayedAuthCode, setDisplayedAuthCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const { initiateSignUp, initiateSignIn, verifyOTP, resendOTP, cancelVerification, signInWithCode, continueAsGuest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const formSlide = useRef(new Animated.Value(60)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const otpFade = useRef(new Animated.Value(0)).current;
  const otpSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, [fadeAnim, slideAnim, logoScale, formSlide, shimmerAnim]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const animateOTPStep = useCallback(() => {
    otpFade.setValue(0);
    otpSlide.setValue(40);
    Animated.parallel([
      Animated.timing(otpFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(otpSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [otpFade, otpSlide]);

  const animatePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [buttonScale]);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    animatePress();

    const result = isSignUp
      ? await initiateSignUp(email, password, name)
      : await initiateSignIn(email, password);

    if (result.success) {
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(120);
      setStep('otp');
      animateOTPStep();

      setTimeout(() => {
        Alert.alert(
          'Verification Code Sent',
          `A 6-digit verification code has been sent to ${email}. Please check your inbox (and spam folder).`,
          [{ text: 'OK' }]
        );
      }, 500);
    } else {
      setError(result.error || 'An error occurred');
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpDigits(newOtp);
      const focusIdx = Math.min(index + digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const newOtp = [...otpDigits];
    newOtp[index] = cleaned;
    setOtpDigits(newOtp);

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newOtp = [...otpDigits];
      newOtp[index - 1] = '';
      setOtpDigits(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    animatePress();
    const result = await verifyOTP(code);
    if (result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.authCode) {
        setDisplayedAuthCode(result.authCode);
        setShowAuthCodeModal(true);
      } else {
        router.replace('/');
      }
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Verification failed');
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0 || isSending) return;
    setIsSending(true);
    try {
      const result = await resendOTP();
      if (result.success) {
        setOtpDigits(['', '', '', '', '', '']);
        setOtpTimer(120);
        setError('');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
          'Code Resent',
          `A new verification code has been sent to ${result.email}. Check your inbox.`,
          [{ text: 'OK' }]
        );
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleBackFromOTP = () => {
    cancelVerification();
    setStep('form');
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
  };

  const handleCodeLogin = async () => {
    setError('');
    if (authCode.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }

    animatePress();
    const result = await signInWithCode(authCode);
    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Invalid code');
    }
  };

  const handleGuestAccess = async () => {
    animatePress();
    const result = await continueAsGuest();
    if (result.success) {
      router.replace('/');
    }
  };

  const handleAuthCodeDismiss = () => {
    setShowAuthCodeModal(false);
    router.replace('/');
  };

  const shimmerColor = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
  });

  const renderOTPStep = () => (
    <Animated.View style={[styles.formContainer, { opacity: otpFade, transform: [{ translateY: otpSlide }] }]}>
      <TouchableOpacity style={styles.otpBackBtn} onPress={handleBackFromOTP}>
        <ArrowLeft size={20} color="#94a3b8" />
        <Text style={styles.otpBackText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.otpHeaderSection}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.otpIconBg}
        >
          <ShieldCheck size={32} color="#fff" />
        </LinearGradient>
        <Text style={styles.otpTitle}>Verify Your Email</Text>
        <Text style={styles.otpSubtitle}>
          We sent a 6-digit code to
        </Text>
        <Text style={styles.otpEmail}>{email}</Text>
      </View>

      <View style={styles.otpInputRow}>
        {otpDigits.map((digit, i) => (
          <TextInput
            key={i}
            ref={ref => { otpRefs.current[i] = ref; }}
            style={[
              styles.otpBox,
              digit ? styles.otpBoxFilled : null,
            ]}
            value={digit}
            onChangeText={(v) => handleOTPChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleOTPKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            autoFocus={i === 0}
          />
        ))}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} activeOpacity={0.9}>
          <LinearGradient
            colors={['#10b981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <ShieldCheck size={20} color="#fff" />
            <Text style={styles.buttonText}>Verify Code</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.resendRow}>
        {otpTimer > 0 ? (
          <Text style={styles.resendTimer}>
            Resend code in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
          </Text>
        ) : (
          <TouchableOpacity style={styles.resendBtn} onPress={handleResendOTP}>
            <RefreshCw size={14} color="#06b6d4" />
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0c4a6e', '#155e75']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.shimmerOverlay, { backgroundColor: shimmerColor }]} />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={step === 'otp' ? ['#10b981', '#059669', '#047857'] : ['#0ea5e9', '#06b6d4', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                {step === 'otp' ? (
                  <ShieldCheck size={40} color="#fff" strokeWidth={2.5} />
                ) : step === 'codeLogin' ? (
                  <Key size={40} color="#fff" strokeWidth={2.5} />
                ) : isSignUp ? (
                  <UserPlus size={40} color="#fff" strokeWidth={2.5} />
                ) : (
                  <LogIn size={40} color="#fff" strokeWidth={2.5} />
                )}
              </LinearGradient>
              <View style={styles.logoPulse} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.titleSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>
              {step === 'otp' ? 'Email Verification' : step === 'codeLogin' ? 'Quick Sign In' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'otp' ? 'Enter the code sent to your email' : step === 'codeLogin' ? 'Enter your 4-digit auth code' : isSignUp ? 'Join the learning revolution' : 'Continue your journey'}
            </Text>
          </Animated.View>

          {step === 'otp' ? renderOTPStep() : (
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: formSlide }] }]}>
              {step === 'codeLogin' ? (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Key size={20} color="#0ea5e9" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="4-digit code"
                      placeholderTextColor="#64748b"
                      value={authCode}
                      onChangeText={(t) => setAuthCode(t.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                      autoFocus
                    />
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity style={styles.button} onPress={handleCodeLogin} activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#0ea5e9', '#0284c7', '#0369a1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Key size={20} color="#fff" />
                        <Text style={styles.buttonText}>Sign In with Code</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity style={styles.toggleButton} onPress={() => { setStep('form'); setError(''); }}>
                    <Text style={styles.toggleText}>
                      Use email instead? <Text style={styles.toggleTextBold}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {isSignUp && (
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <User size={20} color="#0ea5e9" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#64748b"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Mail size={20} color="#0ea5e9" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#64748b"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#0ea5e9" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#64748b"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#0ea5e9', '#0284c7', '#0369a1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Sparkles size={20} color="#fff" />
                        <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={styles.linkRow}>
                    <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(''); }}>
                      <Text style={styles.toggleText}>
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        <Text style={styles.toggleTextBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.codeLoginLink} onPress={() => { setStep('codeLogin'); setError(''); }}>
                    <Key size={16} color="#06b6d4" />
                    <Text style={styles.codeLoginText}>Sign in with Auth Code</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.guestButton} onPress={handleGuestAccess} activeOpacity={0.8}>
                    <UserCircle size={20} color="#0ea5e9" />
                    <Text style={styles.guestButtonText}>Continue as Guest</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showAuthCodeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.authCodeModal]}>
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              style={styles.authCodeModalGradient}
            >
              <TouchableOpacity style={styles.modalClose} onPress={handleAuthCodeDismiss}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.authCodeIconWrap}>
                <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.authCodeIcon}>
                  <Key size={32} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.authCodeModalTitle}>Your Auth Code</Text>
              <Text style={styles.authCodeModalSubtitle}>
                Save this code to sign in quickly next time without email or password
              </Text>

              <View style={styles.authCodeDisplay}>
                {displayedAuthCode.split('').map((digit, i) => (
                  <View key={i} style={styles.authCodeDigit}>
                    <Text style={styles.authCodeDigitText}>{digit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Copied!', `Your auth code is ${displayedAuthCode}. Remember it for quick login.`);
                }}
              >
                <Copy size={18} color="#0ea5e9" />
                <Text style={styles.copyButtonText}>Copy Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueButton} onPress={handleAuthCodeDismiss}>
                <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.continueGradient}>
                  <Text style={styles.continueText}>Continue to App</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shimmerOverlay: { ...StyleSheet.absoluteFillObject },
  decorCircle1: {
    position: 'absolute', top: -80, right: -60, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  decorCircle2: {
    position: 'absolute', bottom: 100, left: -40, width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
  },
  decorCircle3: {
    position: 'absolute', top: '40%', right: -30, width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { position: 'relative' },
  logoGradient: {
    width: 90, height: 90, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
  },
  logoPulse: {
    position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: 34, borderWidth: 2, borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  titleSection: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 30, fontWeight: '800' as const, color: '#f1f5f9', marginBottom: 8,
    textShadowColor: 'rgba(14, 165, 233, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center' as const },
  formContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16, marginBottom: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  inputIconContainer: { marginRight: 12 },
  input: { flex: 1, height: 54, fontSize: 16, color: '#f1f5f9' },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center', fontWeight: '600' as const },
  button: {
    borderRadius: 16, overflow: 'hidden', marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(14, 165, 233, 0.35)' },
    }),
  },
  buttonGradient: {
    paddingVertical: 17, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' as const, letterSpacing: 0.3 },
  linkRow: { alignItems: 'center', marginTop: 20 },
  toggleButton: { marginTop: 20, alignItems: 'center' },
  toggleText: { fontSize: 15, color: '#94a3b8' },
  toggleTextBold: { fontWeight: '700' as const, color: '#0ea5e9' },
  codeLoginLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
    paddingVertical: 10,
  },
  codeLoginText: { fontSize: 14, fontWeight: '600' as const, color: '#06b6d4' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(51, 65, 85, 0.6)' },
  dividerText: { marginHorizontal: 16, fontSize: 13, color: '#64748b', fontWeight: '600' as const },
  guestButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  guestButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#0ea5e9' },
  otpBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 4,
  },
  otpBackText: { fontSize: 15, color: '#94a3b8', fontWeight: '600' as const },
  otpHeaderSection: { alignItems: 'center', marginBottom: 28 },
  otpIconBg: {
    width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  otpTitle: { fontSize: 22, fontWeight: '800' as const, color: '#f1f5f9', marginBottom: 8 },
  otpSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' as const },
  otpEmail: { fontSize: 15, fontWeight: '700' as const, color: '#38bdf8', marginTop: 4 },
  otpInputRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24,
  },
  otpBox: {
    width: 46, height: 58, borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 2, borderColor: 'rgba(51, 65, 85, 0.6)',
    textAlign: 'center' as const, fontSize: 24, fontWeight: '800' as const, color: '#f1f5f9',
  },
  otpBoxFilled: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  resendRow: { alignItems: 'center', marginTop: 20 },
  resendTimer: { fontSize: 14, color: '#64748b', fontWeight: '600' as const },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16,
  },
  resendText: { fontSize: 15, fontWeight: '700' as const, color: '#06b6d4' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  authCodeModal: { width: '100%', maxWidth: 380, borderRadius: 24, overflow: 'hidden' },
  authCodeModalGradient: { padding: 28, alignItems: 'center' },
  modalClose: {
    position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
  },
  authCodeIconWrap: { marginBottom: 20, marginTop: 8 },
  authCodeIcon: {
    width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
  },
  authCodeModalTitle: { fontSize: 24, fontWeight: '800' as const, color: '#f1f5f9', marginBottom: 8 },
  authCodeModalSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  authCodeDisplay: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  authCodeDigit: {
    width: 56, height: 64, borderRadius: 14, backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 2, borderColor: 'rgba(14, 165, 233, 0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  authCodeDigitText: { fontSize: 28, fontWeight: '800' as const, color: '#0ea5e9' },
  copyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: 12, marginBottom: 16,
  },
  copyButtonText: { fontSize: 15, fontWeight: '600' as const, color: '#0ea5e9' },
  continueButton: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  continueGradient: { paddingVertical: 16, alignItems: 'center' },
  continueText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
