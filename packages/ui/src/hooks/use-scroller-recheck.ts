'use client';

import * as React from 'react';

/**
 * Keeps Dice UI Scroller edge fades accurate when inner content loads or resizes after mount.
 */
export function useScrollerRecheck<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const recheck = () => el.dispatchEvent(new Event('scroll'));
    const observer = new ResizeObserver(recheck);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);
  return ref;
}
