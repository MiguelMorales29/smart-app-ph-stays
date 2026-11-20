import { useCallback, useEffect, useRef } from 'react';

/**
 * Sets data-fade-top / data-fade-bottom on a scroll container while there is more to scroll in
 * that direction (Pattern Guide §3.1). Pair with the `scroll-fades` utility.
 */
export function useScrollFades<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.fadeTop = String(el.scrollTop > 2);
    el.dataset.fadeBottom = String(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  return ref;
}
