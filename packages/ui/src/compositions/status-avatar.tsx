import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@smartapp/ui/components/avatar';
import { cn } from '@smartapp/ui/lib/utils';

/** D85: green open, orange busy, grey paused; always with a word for screen readers. */
export type AvailabilityStatus = 'open' | 'busy' | 'paused';

const DOT: Record<AvailabilityStatus, string> = {
  open: 'bg-success',
  busy: 'bg-warning',
  paused: 'bg-muted-foreground',
};

const WORD: Record<AvailabilityStatus, string> = {
  open: 'Open',
  busy: 'Busy',
  paused: 'Paused',
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return (parts[0] ?? 'SA').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * StatusAvatar (R-4, D94): one avatar primitive for a property or a person, with an optional
 * status dot (open, busy, paused). Replaces StatusLogo and the hand-made dots. The status word is
 * read by screen readers; next to a visible status word, set `statusLabel=""`.
 */
export function StatusAvatar({
  name,
  src,
  status = null,
  statusLabel,
  size = 'default',
  shape = 'circle',
  className,
}: {
  readonly name: string;
  readonly src?: string | null | undefined;
  readonly status?: AvailabilityStatus | null | undefined;
  /** Overrides the word read for the dot ("Paused" by default for `paused`). */
  readonly statusLabel?: string | undefined;
  readonly size?: 'sm' | 'default' | 'lg' | undefined;
  /** `rounded` for property logos on light tiles, `circle` for people. */
  readonly shape?: 'circle' | 'rounded' | undefined;
  readonly className?: string | undefined;
}) {
  const word = statusLabel ?? (status ? WORD[status] : '');
  return (
    <Avatar
      data-slot="status-avatar"
      data-status={status ?? undefined}
      size={size}
      className={cn(shape === 'rounded' && 'rounded-lg after:rounded-lg', className)}
    >
      {src ? (
        <AvatarImage
          src={src}
          alt={name}
          className={cn('object-contain', shape === 'rounded' && 'rounded-lg')}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          'bg-primary font-semibold text-primary-foreground',
          shape === 'rounded' && 'rounded-lg',
        )}
      >
        <span aria-hidden="true">{initialsFrom(name)}</span>
        <span className="sr-only">{name}</span>
      </AvatarFallback>
      {status ? (
        <AvatarBadge className={DOT[status]}>
          {word ? <span className="sr-only">{word}</span> : null}
        </AvatarBadge>
      ) : null}
    </Avatar>
  );
}
