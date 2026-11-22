'use client';

import type { PropertyPageDraft } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { cn } from '@smartapp/ui/lib/utils';
import { AlertTriangleIcon, CheckCircle2Icon, MegaphoneIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

type Announcement = NonNullable<PropertyPageDraft['look']['announcement']>;

const TONE_STYLES = {
  info: {
    container: 'border-info/25 bg-info-tint text-foreground',
    icon: 'text-info',
    Icon: MegaphoneIcon,
  },
  warning: {
    container: 'border-warning/25 bg-warning-tint text-foreground',
    icon: 'text-warning',
    Icon: AlertTriangleIcon,
  },
  success: {
    container: 'border-success/25 bg-success-tint text-foreground',
    icon: 'text-success',
    Icon: CheckCircle2Icon,
  },
} as const;

export interface AnnouncementStripProps {
  readonly announcement: Announcement;
}

/**
 * Property announcement strip (part 6): one strip with its tone icon, dismissible for this visit
 * only. Expiry (Manila midnight) is checked by `resolvePropertySections`.
 */
export function AnnouncementStrip({ announcement }: AnnouncementStripProps) {
  const [dismissed, setDismissed] = useState(false);
  const text = announcement.text.trim();

  if (dismissed || !text) {
    return null;
  }

  const tone = TONE_STYLES[announcement.tone];
  const Icon = tone.Icon;

  return (
    <section
      aria-label="Property announcement"
      data-slot="property-announcement"
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-sm',
        tone.container,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 py-1">
        <Icon aria-hidden="true" className={cn('size-4 shrink-0', tone.icon)} />
        <p className="min-w-0 leading-snug font-medium">{text}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="size-11 shrink-0 rounded-full text-foreground/80 hover:text-foreground"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </Button>
    </section>
  );
}
