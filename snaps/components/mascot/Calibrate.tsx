import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { mascotSvg } from './mascotSvg';

export type CalibrateMood = 'idle' | 'happy' | 'thinking' | 'celebrate' | 'sleepy';

interface CalibrateProps {
  size?: number;
  mood?: CalibrateMood;
  /**
   * Optional reanimated SharedValues that drive eye direction.
   * Range: -1 (left/up) … 1 (right/down).
   */
  lookX?: SharedValue<number>;
  lookY?: SharedValue<number>;
  /** Disable all motion (renders a static character). */
  static?: boolean;
}

// Maximum pupil offset in source-svg units (the dark pupil paths live in the
// scale(1.9375) coord space, so 6 units ≈ 12px in viewBox units).
const PUPIL_RANGE = 6;

/**
 * Inject `transform="translate(x y)"` attributes into the two pupil <g>
 * groups inside the artist-supplied chameleon SVG. The groups are wrapped
 * at build time by the script in mascotSvg.ts so we can address them here.
 */
function applyPupilTransform(svg: string, x: number, y: number): string {
  const tx = x.toFixed(1);
  const ty = y.toFixed(1);
  return svg
    .replace(
      /<g class="left-pupil"[^>]*>/,
      `<g class="left-pupil" transform="translate(${tx} ${ty})">`,
    )
    .replace(
      /<g class="right-pupil"[^>]*>/,
      `<g class="right-pupil" transform="translate(${tx} ${ty})">`,
    );
}

/**
 * Calibrate — the chameleon mascot.
 *
 * Renders the artist-supplied SVG (assets/mascot.svg, exported as a string
 * via mascotSvg.ts) inside an Animated wrapper so we can apply gentle idle
 * motion: vertical bob, breathing scale, and a slight head tilt.
 *
 * Eye tracking: when lookX/lookY shared values are provided, the dark pupil
 * groups inside the SVG get a translate() transform. We listen via
 * useAnimatedReaction and update an integer state, which causes the SVG to
 * re-render with the new transforms. This is JS-thread re-rendering — fine
 * for cursor/scroll events but it would not be smooth for high-frequency
 * gesture-driven animation.
 */
export function Calibrate({
  size = 120,
  mood = 'idle',
  lookX,
  lookY,
  static: isStatic = false,
}: CalibrateProps) {
  const bob = useSharedValue(0);
  const breathe = useSharedValue(1);
  const tilt = useSharedValue(0);

  // Quantized pupil offsets — we round to integers in viewBox units so we
  // don't re-render the SVG string on every sub-pixel change.
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);

  useAnimatedReaction(
    () => {
      const lx = lookX ? lookX.value : 0;
      const ly = lookY ? lookY.value : 0;
      // Clamp to [-1, 1] then map to integer range
      const cx = Math.max(-1, Math.min(1, lx));
      const cy = Math.max(-1, Math.min(1, ly));
      return {
        x: Math.round(cx * PUPIL_RANGE),
        y: Math.round(cy * PUPIL_RANGE),
      };
    },
    (cur, prev) => {
      if (!prev || cur.x !== prev.x || cur.y !== prev.y) {
        runOnJS(setPupilX)(cur.x);
        runOnJS(setPupilY)(cur.y);
      }
    },
    [lookX, lookY],
  );

  useEffect(() => {
    if (isStatic) {
      bob.value = 0;
      breathe.value = 1;
      tilt.value = 0;
      return;
    }

    // No bob — the character stays vertically anchored.
    bob.value = 0;
    tilt.value = 0;

    // Gentle "breathing" scale only — slower for sleepy, slightly faster
    // for celebrate but never bouncy. This is the only ambient motion.
    const breatheDuration =
      mood === 'celebrate' ? 1100 : mood === 'sleepy' ? 2400 : 1800;
    const breatheTo = mood === 'celebrate' ? 1.06 : 1.04;

    breathe.value = withRepeat(
      withSequence(
        withTiming(breatheTo, { duration: breatheDuration, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: breatheDuration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(bob);
      cancelAnimation(breathe);
      cancelAnimation(tilt);
    };
  }, [mood, isStatic]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const xml = applyPupilTransform(mascotSvg, pupilX, pupilY);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[{ width: size, height: size }, characterStyle]}>
        <SvgXml xml={xml} width={size} height={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
