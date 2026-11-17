import { createElement } from 'react';
import type { BookingStatus, PaymentStatus } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { cn } from 'cn';
import {
  CheckCircle2Icon,
  ClockIcon,
  HourglassIcon,
  KeyRoundIcon,
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
