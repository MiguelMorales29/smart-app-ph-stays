import { createElement } from 'react';
import type { BookingStatus, PaymentStatus, UnitStatus } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { cn } from 'cn';
import {
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  HourglassIcon,
  KeyRoundIcon,
  PencilIcon,
  RotateCcwIcon,
  SparklesIcon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react';

export type StatusTone = 'done' | 'waiting' | 'in_progress' | 'problem' | 'finished';

export interface StatusAppearance {
  readonly label: string;
  readonly tone: StatusTone;
  readonly icon: LucideIcon;
}

const TONE_CLASSES: Readonly<Record<StatusTone, string>> = {
  done: 'bg-success-tint text-success border-success/25',
  waiting: 'bg-warning-tint text-warning border-warning/25',
  in_progress: 'bg-info-tint text-info border-info/25',
  problem: 'bg-danger-tint text-destructive border-destructive/25',
  finished: 'bg-muted text-muted-foreground border-border',
};

export const BOOKING_STATUS_MAP: Readonly<Record<BookingStatus, StatusAppearance>> = {
  held: { label: 'Held', tone: 'waiting', icon: HourglassIcon },
  in_review: { label: 'In review', tone: 'waiting', icon: ClockIcon },
  confirmed: { label: 'Confirmed', tone: 'done', icon: CheckCircle2Icon },
  checked_in: { label: 'Checked in', tone: 'in_progress', icon: KeyRoundIcon },
  completed: { label: 'Completed', tone: 'done', icon: SparklesIcon },
  cancelled: { label: 'Cancelled', tone: 'problem', icon: XCircleIcon },
  expired: { label: 'Expired', tone: 'finished', icon: ClockIcon },
};

export const PAYMENT_STATUS_MAP: Readonly<Record<PaymentStatus, StatusAppearance>> = {
  submitted: { label: 'Submitted', tone: 'waiting', icon: ClockIcon },
  approved: { label: 'Approved', tone: 'done', icon: CheckCircle2Icon },
  rejected: { label: 'Rejected', tone: 'problem', icon: XCircleIcon },
  reversed: { label: 'Reversed', tone: 'problem', icon: RotateCcwIcon },
};

export function BookingStatusBadge({
  status,
  className,
}: {
  readonly status: BookingStatus;
  readonly className?: string | undefined;
}) {
  const meta = BOOKING_STATUS_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[meta.tone], className)}
      data-status={status}
      data-tone={meta.tone}
    >
      {createElement(meta.icon, { 'aria-hidden': true })}
      <span>{meta.label}</span>
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  readonly status: PaymentStatus;
  readonly className?: string | undefined;
}) {
  const meta = PAYMENT_STATUS_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[meta.tone], className)}
      data-status={status}
      data-tone={meta.tone}
    >
      {createElement(meta.icon, { 'aria-hidden': true })}
      <span>{meta.label}</span>
    </Badge>
  );
}

export const UNIT_STATUS_META: Readonly<
  Record<
    UnitStatus,
    {
      readonly label: string;
      readonly icon: LucideIcon;
      readonly tone: string;
      readonly iconTone: string;
    }
  >
> = {
  listed: {
    label: 'Listed',
    icon: EyeIcon,
    tone: 'bg-success-tint text-foreground [&>svg]:text-success',
    iconTone: 'text-success',
  },
  unlisted: {
    label: 'Hidden',
    icon: EyeOffIcon,
    tone: 'bg-muted text-foreground [&>svg]:text-muted-foreground',
    iconTone: 'text-muted-foreground',
  },
  draft: {
    label: 'Draft',
    icon: PencilIcon,
    tone: 'bg-warning-tint text-foreground [&>svg]:text-warning',
    iconTone: 'text-warning',
  },
};

/** Draft, Listed or Hidden: an icon, a word and a colour. Use `overlay` when placed over a photo. */
export function UnitStatusBadge({
  status,
  overlay = false,
  className,
}: {
  readonly status: UnitStatus;
  readonly overlay?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const item = UNIT_STATUS_META[status];
  const Icon = item.icon;
  return (
    <span
      data-slot="unit-status-badge"
      data-status={status}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium',
        overlay
          ? 'border border-border/70 bg-card/90 text-foreground shadow-xs backdrop-blur-xs'
          : item.tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('size-3.5', overlay && item.iconTone)} />
      {item.label}
    </span>
  );
}
