'use client';

import { useEffect, useRef } from 'react';
import { useWebUserStore, useStoreHydrated } from './user-store';
import { useWebLessonStore } from './lesson-store';

/**
 * Server = source of truth.
 * - Mount / refresh / tab focus → PULL (server overwrites local)
 * - Any local change (progress, checkpoints) → PUSH (local overwrites server)
 */
export function useAutoSync() {
  const hydrated = useStoreHydrated();
  const pull = useWebLessonStore((s) => s.pull);
  const push = useWebLessonStore((s) => s.push);
  const setStats = useWebUserStore((s) => s.setStats);
  const progress = useWebLessonStore((s) => s.progress);
  const checkpoints = useWebLessonStore((s) => s.checkpoints);

  const hasPulledOnMount = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fingerprint: changes whenever progress or checkpoints change
  const prevFingerprint = useRef<string | null>(null);

  const doPull = () => {
    const uid = useWebUserStore.getState().userId;
    if (!uid || uid === 'demo-user') return;
    pull(uid).then((serverStats) => {
      if (serverStats) setStats(serverStats);
    });
  };

  const doPush = () => {
    const uid = useWebUserStore.getState().userId;
    if (!uid || uid === 'demo-user') return;
    const stats = useWebUserStore.getState().stats;
    push(uid, stats);
  };

  // PULL on mount
  useEffect(() => {
    if (!hydrated || hasPulledOnMount.current) return;
    hasPulledOnMount.current = true;
    doPull();
  }, [hydrated]);

  // PUSH when progress OR checkpoints change
  const fingerprint = JSON.stringify({
    p: Object.keys(progress).sort(),
    c: Object.entries(checkpoints).map(([k, v]) => `${k}:${(v as any)?.currentStep ?? 0}`).sort(),
  });

  useEffect(() => {
    if (!hydrated) return;
    if (prevFingerprint.current === null) {
      prevFingerprint.current = fingerprint;
      return;
    }
    if (fingerprint === prevFingerprint.current) return;
    prevFingerprint.current = fingerprint;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(doPush, 500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [fingerprint, hydrated]);

  // PULL when tab regains focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') doPull();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
}
