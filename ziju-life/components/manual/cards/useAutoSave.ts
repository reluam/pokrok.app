import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Debounced auto-save hook.
 * Calls `saveFn` after `delay`ms of inactivity whenever `deps` change.
 * Returns `{ saving, saved, flush }`:
 *  - saving: true while save is in progress
 *  - saved: briefly true after a successful save
 *  - flush: manually trigger an immediate save (e.g. before closing)
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  { delay = 1500, enabled = true }: { delay?: number; enabled?: boolean } = {}
) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  const mountedRef = useRef(false);
  saveFnRef.current = saveFn;

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSaving(true);
    try {
      await saveFnRef.current();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
    setSaving(false);
  }, []);

  useEffect(() => {
    // Skip first render
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      setSaving(true);
      try {
        await saveFnRef.current();
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {}
      setSaving(false);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { saving, saved, flush };
}
