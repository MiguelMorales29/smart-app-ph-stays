'use client';

import { Button } from '@smartapp/ui/components/button';
import { cn } from 'cn';
import { CopyIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { copyText } from '../lib/copy-text';
import { notify } from '../lib/notify';
import { DrawnCheckIcon } from './drawn-check';

const COPIED_MS = 1500;

export interface CopyButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'children' | 'onClick' | 'value'
> {
  readonly value: string;
  /** Visible label (and aria-label when iconOnly). Defaults to "Copy". */
  readonly label?: string | undefined;
  /** Label shown briefly after copying. Defaults to "Copied". */
  readonly copiedLabel?: string | undefined;
  /** Compact icon-only button; announces "Copied" via toast and live region. */
  readonly iconOnly?: boolean | undefined;
  /** Called if copying fails; otherwise shows an error toast. */
  readonly onCopyFailed?: (() => void) | undefined;
}

/**
 * Shared copy button (ported from the food app): copies via `copyText`, turns to success tint
 * for 1.5 s with an animated `DrawnCheckIcon`, and announces "Copied" to screen readers.
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  onCopyFailed,
  className,
  variant = 'outline',
  size,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const ok = await copyText(value);
    if (!ok) {
      if (onCopyFailed) onCopyFailed();
      else notify.error('Could not copy automatically. Select the text to copy it.');
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    if (iconOnly) notify.success(copiedLabel);
    setCopied((n) => n + 1);
    timer.current = setTimeout(() => setCopied(0), COPIED_MS);
  }

  const isCopied = copied > 0;
  const text = isCopied ? copiedLabel : label;

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (iconOnly ? 'icon' : 'sm')}
      aria-label={iconOnly ? text : undefined}
      onClick={() => void handleCopy()}
      data-copied={isCopied ? '' : undefined}
      className={cn(
        'transition-colors duration-base data-copied:border-success/40 data-copied:bg-success-tint data-copied:text-foreground',
        className,
      )}
      {...props}
    >
      {isCopied ? (
        <span
          key={copied}
          className="flex text-success motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50"
        >
          <DrawnCheckIcon />
        </span>
      ) : (
        <CopyIcon aria-hidden="true" className="size-4" />
      )}
      {iconOnly ? null : <span>{text}</span>}
      <span className="sr-only" aria-live="polite">
        {isCopied ? copiedLabel : ''}
      </span>
    </Button>
  );
}
