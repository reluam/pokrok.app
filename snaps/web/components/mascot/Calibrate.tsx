'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type CalibrateMood = 'idle' | 'happy' | 'thinking' | 'celebrate';

interface CalibrateProps {
  size?: number;
  mood?: CalibrateMood;
  className?: string;
  /** When true, the chameleon's eyes follow the cursor across the window. */
  trackCursor?: boolean;
}

const PUPIL_RANGE = 6; // source-svg coordinate units

/**
 * Web port of the Calibrate mascot.
 *
 * Fetches the artist-supplied chameleon SVG from /mascot.svg and inlines
 * it into the DOM via dangerouslySetInnerHTML so we can address the
 * `.left-pupil` and `.right-pupil` <g> wrappers (added at build time)
 * directly via setAttribute. The whole character bobs / breathes via
 * framer-motion. Eye tracking runs on rAF tied to mousemove.
 */
export function Calibrate({
  size = 140,
  mood = 'happy',
  className,
  trackCursor = false,
}: CalibrateProps) {
  const reduced = useReducedMotion();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch the SVG once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch('/mascot.svg')
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        // silent — character just doesn't render
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cursor tracking — find the pupil groups inside the inlined SVG and
  // update their transform attribute on every animation frame.
  useEffect(() => {
    if (!trackCursor || reduced || !svgMarkup) return;
    const root = containerRef.current;
    if (!root) return;

    const leftPupil = root.querySelector('.left-pupil') as SVGGElement | null;
    const rightPupil = root.querySelector('.right-pupil') as SVGGElement | null;
    if (!leftPupil && !rightPupil) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;
    let running = true;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const radius = 400;
      const nx = Math.max(-1, Math.min(1, dx / radius));
      const ny = Math.max(-1, Math.min(1, dy / radius));
      targetX = nx * PUPIL_RANGE;
      targetY = ny * PUPIL_RANGE;
    };

    const tick = () => {
      if (!running) return;
      // Lerp toward the target for smooth, slightly lagging tracking
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      const t = `translate(${currentX.toFixed(2)} ${currentY.toFixed(2)})`;
      if (leftPupil) leftPupil.setAttribute('transform', t);
      if (rightPupil) rightPupil.setAttribute('transform', t);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [trackCursor, reduced, svgMarkup]);

  const bodyAnim = reduced
    ? {}
    : {
        y: [0, -3, 0],
        scale: [1, 1.025, 1],
      };

  const bobDuration = mood === 'celebrate' ? 0.9 : mood === 'happy' ? 1.6 : 2.4;

  return (
    <motion.div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
      animate={bodyAnim}
      transition={{
        duration: bobDuration,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1],
      }}
    >
      {svgMarkup && (
        <div
          ref={containerRef}
          style={{ width: size, height: size }}
          // Inline the SVG so we can address pupil groups via querySelector.
          // The fetched SVG is sourced from our own /public folder — not
          // user input — so the dangerouslySetInnerHTML use is safe.
          dangerouslySetInnerHTML={{
            __html: svgMarkup.replace(
              /<svg /,
              `<svg width="${size}" height="${size}" `,
            ),
          }}
        />
      )}
    </motion.div>
  );
}
