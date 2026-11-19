import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';
import { Spinner } from '@smartapp/ui/components/spinner';

export type AsyncButtonState = 'idle' | 'busy' | 'done';

export interface AsyncButtonProps extends Omit<ComponentProps<typeof Button>, 'children'> {
  readonly state: AsyncButtonState;
  readonly children: ReactNode;
  /** Shown while working ("Saving…"). */
  readonly busyLabel?: string | undefined;
  /** Shown briefly after success ("Saved"). */
  readonly doneLabel?: string | undefined;
}

/**
 * Save → Saving → ✓ Saved, keeping the same width the whole time so nothing jumps. The result
 * is announced to screen readers through a polite live region.
 */
export function AsyncButton({
  state,
  children,
  busyLabel = 'Saving…',
  doneLabel = 'Saved',
  className,
  disabled,
  ...props
}: AsyncButtonProps) {
  const [announce, setAnnounce] = useState('');
  const previous = useRef<AsyncButtonState>(state);

  useEffect(() => {
    if (previous.current !== state) {
      previous.current = state;
      const message = state === 'done' ? doneLabel : state === 'busy' ? busyLabel : '';
      const timer = window.setTimeout(() => setAnnounce(message), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state, busyLabel, doneLabel]);

  return (
    <>
      <Button
        data-slot="async-button"
        data-state={state}
        aria-busy={state === 'busy'}
        disabled={disabled === true || state === 'busy'}
        className={cn('relative inline-grid place-items-center', className)}
        {...props}
      >
        {/* Every label sits in the same grid cell, so the button is as wide as the widest one. */}
        <span className={cn('col-start-1 row-start-1', state !== 'idle' && 'invisible')}>
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'col-start-1 row-start-1 inline-flex items-center gap-1.5',
            state !== 'busy' && 'invisible',
          )}
        >
          <Spinner />
          {busyLabel}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'col-start-1 row-start-1 inline-flex items-center gap-1.5',
            state !== 'done' && 'invisible',
          )}
        >
          <CheckIcon className="motion-safe:animate-in motion-safe:zoom-in-50 duration-fast ease-spring" />
          {doneLabel}
        </span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </>
  );
}
