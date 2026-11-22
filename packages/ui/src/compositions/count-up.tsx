'use client';

import { cn } from 'cn';
import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '../hooks/use-reduced-motion';

export interface CountUpProps {
  readonly value: number;
  readonly decimalPlaces?: number | undefined;
  readonly durationMs?: number | undefined;
  readonly prefix?: string | undefined;
  readonly suffix?: string | undefined;
  readonly className?: string | undefined;
}

function formatCount(value: number, decimalPlaces: number): string {
  return Intl.NumberFormat('en-PH', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

/**
 * Animated number counter (zero `motion` dependency; adapted from food app `CountUp` while O15 is
 * open). Shows the final number immediately under `prefers-reduced-motion` and on SSR.
 */
export function CountUp({
  value,
  decimalPlaces = 0,
  durationMs = 600,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      previousRef.current = value;
      return;
    }

    const from = previousRef.current;
    const to = value;
    previousRef.current = to;
    if (from === to) return;

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / Math.max(100, durationMs));
      const eased = 1 - (1 - progress) ** 3;
      setShown(from + (to - from) * eased);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        setShown(to);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, reducedMotion, value]);

  const renderedValue = reducedMotion ? value : shown;

  return (
    <span data-slot="count-up" className={cn('tabular', className)}>
      {prefix}
      {formatCount(renderedValue, decimalPlaces)}
      {suffix}
    </span>
  );
}
