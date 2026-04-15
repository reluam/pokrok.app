import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Calibrate } from '@/components/mascot/Calibrate';
import { colors } from '@/lib/constants';

interface CalibrateSplashProps {
  /** How long the splash stays fully visible before fading out, ms */
  duration?: number;
  /** Called once the splash is fully gone (after fade-out) */
  onFinished?: () => void;
}

/**
 * Duolingo-style brand splash screen.
 *
 * Solid primary background, mascot bouncing in from below, brand wordmark
 * pinned to the bottom. Fades out and unmounts after `duration` ms.
 */
export function CalibrateSplash({ duration = 1300, onFinished }: CalibrateSplashProps) {
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);
  const mascotY = useSharedValue(40);
  const mascotScale = useSharedValue(0.8);
  const wordmarkY = useSharedValue(20);
  const wordmarkOpacity = useSharedValue(0);

  useEffect(() => {
    // Mascot intro: bounce in
    mascotY.value = withSequence(
      withTiming(-12, { duration: 360, easing: Easing.out(Easing.back(1.6)) }),
      withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
    mascotScale.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.back(1.4)),
    });

    // Wordmark fades up after mascot
    wordmarkY.value = withDelay(
      300,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
    wordmarkOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
    );

    // Fade out after duration
    const finish = () => setVisible(false);
    opacity.value = withDelay(
      duration,
      withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) {
          runOnJS(finish)();
          if (onFinished) runOnJS(onFinished)();
        }
      }),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: mascotY.value },
      { scale: mascotScale.value },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.View style={[styles.mascotWrap, mascotStyle]}>
        <Calibrate size={180} mood="happy" />
      </Animated.View>

      <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
        <Text style={styles.wordmark}>calibrate</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrap: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
