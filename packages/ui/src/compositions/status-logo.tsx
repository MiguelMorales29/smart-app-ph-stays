import { cn } from 'cn';

export type PropertyAvailabilityRing = 'open' | 'busy' | 'paused';

export interface StatusLogoProps {
  readonly name: string;
  readonly src?: string | null | undefined;
  /** Availability state for the ring; null renders a plain border ring. */
  readonly state?: PropertyAvailabilityRing | null | undefined;
  /** Text badge under the ring for non-open states (e.g. "Busy", "Paused"). */
  readonly stateLabel?: string | undefined;
  readonly size?: 'md' | 'lg' | undefined;
  readonly logoShape?: 'circle' | 'rounded' | undefined;
  readonly className?: string | undefined;
}

const SIZE_CLASS = {
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const;

const RING_CLASS: Record<PropertyAvailabilityRing, string> = {
  open: '-inset-1 animate-spin-slow bg-linear-to-tr from-success via-success-tint to-success opacity-80 blur-xs',
  busy: '-inset-0.5 bg-warning',
  paused: '-inset-0.5 bg-muted-foreground/30',
};

const WORD_CLASS: Record<PropertyAvailabilityRing, string> = {
  open: 'bg-success text-primary-foreground',
  busy: 'bg-warning-tint text-foreground border border-warning/40',
  paused: 'bg-muted text-muted-foreground border border-border',
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return (parts[0] ?? 'SA').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * Property logo wrapped in an availability ring (open / busy / paused), with a status chip for
 * non-open states (ported and adapted from food app `StatusLogo`).
 */
export function StatusLogo({
  name,
  src,
  state = null,
  stateLabel,
  size = 'md',
  logoShape = 'circle',
  className,
}: StatusLogoProps) {
  const radius = logoShape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <span
      data-slot="status-logo"
      data-state={state ?? undefined}
      className={cn('relative inline-flex shrink-0', radius, className)}
    >
      <span
        aria-hidden="true"
        className={cn('absolute', radius, state ? RING_CLASS[state] : '-inset-0.5 bg-border')}
      />
      <span
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-card font-heading font-semibold text-foreground ring-2 ring-background',
          radius,
          SIZE_CLASS[size],
        )}
      >
        {src ? (
          <img src={src} alt={name} className="size-full object-contain p-0.5" decoding="async" />
        ) : (
          <span aria-hidden="true">{initialsFrom(name)}</span>
        )}
      </span>
      {state && state !== 'open' && stateLabel ? (
        <span
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-xs leading-4 font-semibold whitespace-nowrap ring-2 ring-background',
            WORD_CLASS[state],
          )}
        >
          {stateLabel}
        </span>
      ) : null}
    </span>
  );
}
