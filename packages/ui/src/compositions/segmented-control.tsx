'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cn } from '@smartapp/ui/lib/utils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: ReactNode;
  readonly icon?: ReactNode | undefined;
}

/**
 * Two to four choices with a raised thumb that slides to the picked one (Pattern Guide §3.3).
 * Built on the Base UI toggle group (single choice, arrow keys move between options).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = 'md',
  ...aria
}: {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly className?: string | undefined;
  readonly size?: 'sm' | 'md' | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  const place = useCallback(() => {
    const root = rootRef.current;
    const active = root?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
    if (!root || !active) return;
    setThumb({ x: active.offsetLeft, w: active.offsetWidth });
  }, [value]);

  useIsomorphicLayoutEffect(() => {
    place();
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => observer.disconnect();
  }, [place]);

  return (
    <ToggleGroupPrimitive
      ref={rootRef}
      data-slot="segmented-control"
      value={[value]}
      onValueChange={(next) => {
        const picked = options.find((option) => option.value === next[0]);
        if (picked) onValueChange(picked.value);
      }}
      className={cn(
        'relative grid auto-cols-fr grid-flow-col rounded-full bg-muted p-[3px]',
        size === 'sm' ? 'min-h-10' : 'min-h-12',
        className,
      )}
      {...aria}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[3px] bottom-[3px] left-0 rounded-full bg-card shadow-sm ring-1 ring-border transition-[transform,width] duration-slow ease-spring dark:bg-raised"
        style={thumb ? { width: thumb.w, transform: `translateX(${thumb.x}px)` } : { opacity: 0 }}
      />
      {options.map((option) => (
        <TogglePrimitive
          key={option.value}
          value={option.value}
          data-value={option.value}
          className={cn(
            'press relative z-10 inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-fast',
            'focus-visible:ring-3 focus-visible:ring-ring/50 data-pressed:font-semibold data-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0',
          )}
        >
          {option.icon ? (
            <span aria-hidden="true" className="contents">
              {option.icon}
            </span>
          ) : null}
          <span className="truncate">{option.label}</span>
        </TogglePrimitive>
      ))}
    </ToggleGroupPrimitive>
  );
}
