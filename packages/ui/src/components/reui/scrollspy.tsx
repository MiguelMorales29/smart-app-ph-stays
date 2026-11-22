'use client';

import type { ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

type ScrollspyProps = {
  children: ReactNode;
  targetRef?: RefObject<HTMLElement | HTMLDivElement | Document | null | undefined> | undefined;
  onUpdate?: ((id: string) => void) | undefined;
  offset?: number | undefined;
  smooth?: boolean | undefined;
  className?: string | undefined;
  dataAttribute?: string | undefined;
  history?: boolean | undefined;
  throttleTime?: number | undefined;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getSectionTop(sectionElement: HTMLElement, scrollElement: HTMLElement): number {
  if (scrollElement === document.documentElement) {
    return sectionElement.getBoundingClientRect().top + window.scrollY;
  }
  return (
    sectionElement.getBoundingClientRect().top -
    scrollElement.getBoundingClientRect().top +
    scrollElement.scrollTop
  );
}

export function Scrollspy({
  children,
  targetRef,
  onUpdate,
  className,
  offset = 0,
  smooth = true,
  dataAttribute = 'scrollspy',
  history = true,
}: ScrollspyProps) {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const anchorElementsRef = useRef<Element[] | null>(null);
  const prevIdTracker = useRef<string | null>(null);

  // Sets active nav, hash, prevIdTracker, and calls onUpdate
  const setActiveSection = useCallback(
    (sectionId: string | null, force = false) => {
      if (!sectionId) return;
      anchorElementsRef.current?.forEach((item) => {
        const id = item.getAttribute(`data-${dataAttribute}-anchor`);
        if (id === sectionId) {
          item.setAttribute('data-active', 'true');
        } else {
          item.removeAttribute('data-active');
        }
      });
      if (onUpdate) onUpdate(sectionId);
      if (history && (force || prevIdTracker.current !== sectionId)) {
        window.history.replaceState({}, '', `#${sectionId}`);
      }
      prevIdTracker.current = sectionId;
    },
    [anchorElementsRef, dataAttribute, history, onUpdate],
  );

  const handleScroll = useCallback(() => {
    if (!anchorElementsRef.current || anchorElementsRef.current.length === 0) return;

    const rawTarget = targetRef ? targetRef.current : document;
    let scrollElement =
      rawTarget === document ? document.documentElement : (rawTarget as HTMLElement | null);

    if (!scrollElement) return;

    // If the scrollElement has a data-slot="scroll-area-viewport" inside, use that
    const viewport = scrollElement.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport instanceof HTMLElement) {
      scrollElement = viewport;
    }

    const scrollTop =
      scrollElement === document.documentElement
        ? window.scrollY || document.documentElement.scrollTop
        : scrollElement.scrollTop;

    // Find the anchor whose section is closest to but not past the top
    let activeIdx = 0;
    let minDelta = Infinity;

    anchorElementsRef.current.forEach((anchor, idx) => {
      const sectionId = anchor.getAttribute(`data-${dataAttribute}-anchor`);
      if (!sectionId) return;
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      let customOffset = offset;
      const dataOffset = anchor.getAttribute(`data-${dataAttribute}-offset`);
      if (dataOffset) customOffset = parseInt(dataOffset, 10);

      const sectionTop = getSectionTop(sectionElement, scrollElement);
      const delta = Math.abs(sectionTop - customOffset - scrollTop);

      if (sectionTop - customOffset <= scrollTop + 2 && delta < minDelta) {
        minDelta = delta;
        activeIdx = idx;
      }
    });

    // If at bottom, force last anchor
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;

    if (scrollTop > 0 && scrollTop + clientHeight >= scrollHeight - 2) {
      activeIdx = anchorElementsRef.current.length - 1;
    }

    // Set only one anchor active and sync the URL hash
    const activeAnchor = anchorElementsRef.current[activeIdx];
    const sectionId = activeAnchor?.getAttribute(`data-${dataAttribute}-anchor`) || null;

    setActiveSection(sectionId);
  }, [anchorElementsRef, targetRef, dataAttribute, offset, setActiveSection]);

  const scrollTo = useCallback(
    (anchorElement: HTMLElement) => (event?: Event) => {
      if (event) event.preventDefault();
      const sectionId =
        anchorElement.getAttribute(`data-${dataAttribute}-anchor`)?.replace('#', '') || null;
      if (!sectionId) return;
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      const rawTarget = targetRef ? targetRef.current : document;
      let scrollToElement: HTMLElement | Window | null =
        rawTarget === document ? window : (rawTarget as HTMLElement | null);

      if (scrollToElement instanceof HTMLElement) {
        const viewport = scrollToElement.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport instanceof HTMLElement) {
          scrollToElement = viewport;
        }
      }

      let customOffset = offset;
      const dataOffset = anchorElement.getAttribute(`data-${dataAttribute}-offset`);
      if (dataOffset) {
        customOffset = parseInt(dataOffset, 10);
      }

      const measureTarget =
        scrollToElement instanceof HTMLElement ? scrollToElement : document.documentElement;
      const scrollTop = Math.max(0, getSectionTop(sectionElement, measureTarget) - customOffset);

      if (scrollToElement && 'scrollTo' in scrollToElement) {
        scrollToElement.scrollTo({
          top: scrollTop,
          left: 0,
          behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
        });
      }
      setActiveSection(sectionId, true);
    },
    [dataAttribute, offset, smooth, targetRef, setActiveSection],
  );

  // Scroll to the section if the ID is present in the URL hash
  const scrollToHashSection = useCallback(() => {
    const hash = CSS.escape(window.location.hash.replace('#', ''));

    if (hash) {
      const targetElement = document.querySelector(
        `[data-${dataAttribute}-anchor="${hash}"]`,
      ) as HTMLElement | null;
      if (targetElement) {
        scrollTo(targetElement)();
      }
    }
  }, [dataAttribute, scrollTo]);

  useEffect(() => {
    // Query elements and store them in the ref, avoiding unnecessary re-renders
    if (selfRef.current) {
      anchorElementsRef.current = Array.from(
        selfRef.current.querySelectorAll(`[data-${dataAttribute}-anchor]`),
      );
    }

    const currentAnchors = anchorElementsRef.current ?? [];
    const handlers = new Map<Element, (event: Event) => void>();
    currentAnchors.forEach((item) => {
      const handler = scrollTo(item as HTMLElement);
      handlers.set(item, handler);
      item.addEventListener('click', handler);
    });

    const onScroll = (event: Event) => {
      const rawTarget = targetRef ? targetRef.current : document;
      const scrollElement = rawTarget === document ? window : (rawTarget as HTMLElement | null);
      if (!scrollElement) return;

      if (
        scrollElement === window ||
        (scrollElement instanceof HTMLElement && scrollElement.contains(event.target as Node))
      ) {
        handleScroll();
      }
    };

    // Use window listener with capture to catch scroll events from targetRef even if set later
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });

    // Check if there's a hash in the URL and scroll to the corresponding section
    const initialTimeout = setTimeout(() => {
      scrollToHashSection();
      handleScroll();
    }, 100);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      handlers.forEach((handler, item) => {
        item.removeEventListener('click', handler);
      });
      clearTimeout(initialTimeout);
    };
  }, [targetRef, selfRef, handleScroll, dataAttribute, scrollTo, scrollToHashSection]);

  return (
    <div data-slot="scrollspy" className={className} ref={selfRef}>
      {children}
    </div>
  );
}
