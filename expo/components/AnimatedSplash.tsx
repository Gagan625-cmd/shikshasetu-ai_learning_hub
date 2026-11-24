import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * Branded in-app splash overlay: vivid gradient, pulsing rings, spring logo
 * and a loading shimmer. Plays once on cold start, then fades out and unmounts.
 */
export default function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const textSlide = useRef(new Animated.Value(24)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rings = [ring1, ring2, ring3].map((ring, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 450),
          Animated.timing(ring, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    rings.forEach((r) => r.start());

    Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(textFade, { toValue: 1, duration: 550, delay: 350, useNativeDriver: true }),
      Animated.spring(textSlide, { toValue: 0, friction: 7, tension: 50, delay: 350, useNativeDriver: true }),
    ]).start();

    const dots = [dot1, dot2, dot3].map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.35, duration: 320, useNativeDriver: true }),
        ])
      )
    );
    dots.forEach((d) => d.start());

    const doneTimer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onDone();
      });
    }, 2100);

    return () => {
      clearTimeout(doneTimer);
      rings.forEach((r) => r.stop());
      dots.forEach((d) => d.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = (ring: Animated.Value) => ({
    opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.55, 0.3, 0] }),
    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <LinearGradient
        colors={['#1e1b4b', '#1d4ed8', '#0ea5e9', '#7c3aed']}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.center}>
        <View style={styles.logoStage}>
          {[ring1, ring2, ring3].map((ring, i) => (
            <Animated.View key={i} style={[styles.ring, ringStyle(ring)]} />
          ))}
          <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={['#ff9f1c', '#ff6b35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <GraduationCap size={44} color="#ffffff" strokeWidth={2.2} />
            </LinearGradient>
          </Animated.View>
        </View>
        <Animated.View style={[styles.titleBlock, { opacity: textFade, transform: [{ translateY: textSlide }] }]}>
          <Text style={styles.title}>ShikshaSetu</Text>
          <Text style={styles.tagline}>Your Bridge to Better Learning</Text>
        </Animated.View>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot, transform: [{ scale: dot.interpolate({ inputRange: [0.35, 1], outputRange: [0.8, 1.25] }) }] }]} />
          ))}
        </View>
      </View>
      <Text style={styles.footer}>Made for India</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStage: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  ring: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  logoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 30,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
