'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type Preset = 'fadeUp' | 'fadeIn' | 'scaleIn' | 'fadeRight';

interface AnimateOnScrollProps {
  children: ReactNode;
  preset?: Preset;
  delay?: number;
  duration?: number;
  className?: string;
  /** Trigger only once when scrolled into view (default) or every time */
  once?: boolean;
  /** Viewport margin — negative values delay trigger until more of the element is visible */
  amount?: number;
  /** Set to true to stagger children that are themselves <AnimateOnScrollItem> */
  stagger?: boolean;
  staggerDelay?: number;
}

const PRESETS: Record<Preset, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0 },
  },
};

/**
 * Wraps content in a motion.div that fades/slides in when scrolled into view.
 * Respects prefers-reduced-motion — falls back to an instant fade.
 */
export function AnimateOnScroll({
  children,
  preset = 'fadeUp',
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  amount = 0.2,
  stagger = false,
  staggerDelay = 0.08,
}: AnimateOnScrollProps) {
  const shouldReduceMotion = useReducedMotion();

  if (stagger) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
              delayChildren: shouldReduceMotion ? 0 : delay,
            },
          },
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={PRESETS[preset]}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Use inside an <AnimateOnScroll stagger> parent — each item animates in sequence.
 */
export function AnimateOnScrollItem({
  children,
  preset = 'fadeUp',
  className,
}: {
  children: ReactNode;
  preset?: Preset;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={PRESETS[preset]}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
