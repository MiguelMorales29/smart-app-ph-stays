import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

const EDGE = 24;
const DECIDE = 10;
const COMMIT = 0.35;

/** On only in the installed iPhone app: iOS in standalone display mode (D52). */
function isInstalledIphoneApp(): boolean {
  if (typeof window === 'undefined') return false;
  const ios = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && window.navigator.standalone === true);
  return ios && standalone;
}

/** A sheet, dialog or menu is open, or the page has nowhere to go back to. */
function blocked(): boolean {
  if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return true;
  const url = new URL(window.location.href);
  if (url.pathname === '/onboarding' && (url.searchParams.get('step') ?? '1') === '1') return true;
  return window.history.length <= 1;
}

/**
 * Swipe from the left edge to go back, like Safari (D52). A 24 px zone at the left edge; the page
 * follows the finger; letting go past 35% of the width goes back. It never swipes forward, and a
 * mostly vertical move is left to scrolling. Off while a sheet or dialog is open and on onboarding
 * step 1.
 */
export function useSwipeBack(): void {
  const router = useRouter();

  useEffect(() => {
    if (!isInstalledIphoneApp()) return;
    let startX = 0;
    let startY = 0;
    let mode: 'idle' | 'deciding' | 'swiping' = 'idle';
    let page: HTMLElement | null = null;

    const setOffset = (x: number, animate: boolean) => {
      if (!page) return;
      page.style.transition = animate ? 'transform var(--dur-slow) var(--ease-enter)' : 'none';
      page.style.transform = x === 0 ? '' : `translateX(${x}px)`;
    };

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1 || touch.clientX > EDGE || blocked()) return;
      startX = touch.clientX;
      startY = touch.clientY;
      mode = 'deciding';
      page = document.querySelector('main');
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (mode === 'idle' || !touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (mode === 'deciding') {
        if (Math.abs(dx) < DECIDE && Math.abs(dy) < DECIDE) return;
        // A sideways swipe never turns into a vertical one, and the other way round.
        mode = dx > Math.abs(dy) ? 'swiping' : 'idle';
        if (mode === 'idle') return;
      }
      event.preventDefault();
      setOffset(Math.max(0, dx), false);
    };

    const onEnd = (event: TouchEvent) => {
      if (mode !== 'swiping') {
        mode = 'idle';
        return;
      }
      mode = 'idle';
      const touch = event.changedTouches[0];
      const dx = touch ? touch.clientX - startX : 0;
      if (dx > window.innerWidth * COMMIT) {
        setOffset(window.innerWidth, true);
        window.setTimeout(() => {
          router.history.back();
          window.setTimeout(() => setOffset(0, false), 50);
        }, 180);
      } else {
        setOffset(0, true);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [router]);
}
