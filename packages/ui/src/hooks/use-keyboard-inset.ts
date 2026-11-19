import { useSyncExternalStore } from 'react';

/**
 * How many pixels of the layout viewport the on-screen keyboard covers (0 when closed).
 * iPhone Safari does not resize the page for the keyboard, so fixed bottom bars use this to
 * lift themselves above it (Phase 4 plan, section 10).
 */
function getSnapshot(): number {
  if (typeof window === 'undefined') return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  const covered = window.innerHeight - vv.height - vv.offsetTop;
  return covered > 120 ? Math.round(covered) : 0;
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener('resize', callback);
  vv.addEventListener('scroll', callback);
  return () => {
    vv.removeEventListener('resize', callback);
    vv.removeEventListener('scroll', callback);
  };
}

export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
