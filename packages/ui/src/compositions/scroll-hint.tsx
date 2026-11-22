'use client';

import { Button } from '@smartapp/ui/components/button';
import { Scroller } from '@smartapp/ui/components/scroller';
import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useScrollerRecheck } from '../hooks/use-scroller-recheck';

export interface ScrollHintProps {
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
  /** Shows the "More below" pill while content extends past the viewport. */
  readonly withButton?: boolean | undefined;
  readonly moreLabel?: string | undefined;
}

/**
 * Scrollable container with Dice UI edge fades and an optional "More below" jump pill
 * (ported from food app).
 */
export function ScrollHint({
  children,
  className,
  withButton = true,
  moreLabel = 'More below',
}: ScrollHintProps) {
  const ref = useScrollerRecheck<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [more, setMore] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollTop + el.clientHeight + 8 < el.scrollHeight);
    check();
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [ref]);

  return (
    <div data-slot="scroll-hint" className="relative flex min-h-0 flex-1 flex-col">
      <Scroller ref={ref} size={32} className={cn('min-h-0 flex-1 overscroll-contain', className)}>
        <div className="min-w-0">{children}</div>
      </Scroller>
      {withButton && more ? (
        <Button
          type="button"
          variant="secondary"
          className="absolute bottom-3 left-1/2 h-11 -translate-x-1/2 gap-1 rounded-full border border-border bg-popover px-4 shadow-md md:h-9"
          onClick={() => {
            const el = ref.current;
            if (!el) return;
            el.scrollBy({ top: el.clientHeight * 0.7, behavior: reduced ? 'auto' : 'smooth' });
          }}
        >
          {moreLabel}
          <ChevronDownIcon aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
