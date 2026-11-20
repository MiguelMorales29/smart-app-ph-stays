import { useEffect, useState } from 'react';
import type { AsyncButtonState } from '@smartapp/ui/compositions/async-button';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { Skeleton } from '@smartapp/ui/components/skeleton';
import { useDashboard } from '@/app/dashboard-context';
import { extractAppError } from '@/data/shared';

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

export function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

export function SettingsError({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}) {
  return (
    <ErrorState
      title="We couldn't load this page"
      message={extractAppError(error).message}
      onRetry={onRetry}
    />
  );
}

/** Same value, compared as JSON (drafts are plain objects). */
export function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
