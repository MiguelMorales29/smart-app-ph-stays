'use client';

import * as React from 'react';

/**
 * Counts how many children of a scrolling container sit below its visible bottom edge,
 * so a kanban board or calendar column can show a "+N more" pill.
 * Re-counts on scroll, resize, and when children are added or removed.
 */
export function useHiddenBelow<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T>(null);
  const [hidden, setHidden] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const count = () => {
      const bottom = el.getBoundingClientRect().bottom;
      let n = 0;
      for (const child of Array.from(el.children)) {
        // Mostly out of sight: its top is within 24 px of the bottom edge or below it.
        if (child.getBoundingClientRect().top > bottom - 24) n += 1;
      }
      setHidden(n);
    };
    count();
    el.addEventListener('scroll', count, { passive: true });
    const resize = new ResizeObserver(count);
    resize.observe(el);
    const mutation = new MutationObserver(count);
    mutation.observe(el, { childList: true });
    return () => {
      el.removeEventListener('scroll', count);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return [ref, hidden];
}
