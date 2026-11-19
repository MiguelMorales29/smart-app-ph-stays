import { useEffect } from 'react';

/**
 * Asks the browser to confirm before the tab closes or reloads while there are unsaved changes.
 * Route changes inside the app are guarded by the app's router (see `useLeaveGuard` in the
 * dashboard), which shows `LeaveGuardDialog`.
 */
export function useBeforeUnloadGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
