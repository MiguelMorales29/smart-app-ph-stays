import { useEffect, useState } from 'react';
import type { AsyncButtonState } from '@smartapp/ui/compositions/async-button';
import { useDashboard } from '@/app/dashboard-context';

/** Save state for the save pill: busy while saving, "Saved" for 1.5 s, then idle. */
export function useSaveState() {
  const [state, setState] = useState<AsyncButtonState>('idle');
  useEffect(() => {
    if (state !== 'done') return;
    const timer = window.setTimeout(() => setState('idle'), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);
  return [state, setState] as const;
}

/** True when changes can't be saved right now; the save pill says why. */
export function useOfflineSave(): { readonly offline: boolean; readonly message?: string } {
  const { forcedOffline } = useDashboard();
  const offline = forcedOffline || (typeof navigator !== 'undefined' && navigator.onLine === false);
  return offline
    ? { offline, message: "You're offline. Changes save when you're back." }
    : { offline };
}
