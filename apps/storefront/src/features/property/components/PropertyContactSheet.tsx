'use client';

import type { PropertyContact, WeeklyHours } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import {
  Clock3Icon,
  ExternalLinkIcon,
  GlobeIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  PhoneIcon,
  ShieldAlertIcon,
} from 'lucide-react';

import {
  formatWeeklyHoursSummary,
  resolveContactLinks,
  type PropertyContactLink,
} from '../property-rules';

function channelIcon(kind: PropertyContactLink['kind']) {
  if (kind === 'phone') return PhoneIcon;
  if (kind === 'sms') return MessageSquareTextIcon;
  if (kind === 'messenger' || kind === 'viber' || kind === 'whatsapp') return MessageCircleIcon;
  return GlobeIcon;
}

export interface PropertyContactSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly propertyName: string;
  readonly contact: PropertyContact;
  readonly replyHours: WeeklyHours | null;
}

/**
 * Wave 1 contact sheet (D76): opens whenever a guest taps "Message" or "Ask a question",
 * listing only the channels the owner configured (Messenger, Call, Text, Facebook, etc.).
 */
export function PropertyContactSheet({
  open,
  onOpenChange,
  propertyName,
  contact,
  replyHours,
}: PropertyContactSheetProps) {
  const links = resolveContactLinks(contact, { includeSms: true });
  const replySummary = formatWeeklyHoursSummary(replyHours, 'reply');

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Message ${propertyName}`}
      description="Choose how you want to reach the host."
      height="half"
      size="sm"
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="min-h-12"
        >
          Close
        </Button>
      }
    >
      <div className="space-y-4 py-1">
        {replySummary ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{replySummary}</span>
          </p>
        ) : null}

        {links.length > 0 ? (
          <div className="flex flex-col gap-2">
            {links.map((item) => {
              const Icon = channelIcon(item.kind);
              return (
                <a
                  key={item.kind}
                  href={item.href}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="press flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground outline-none transition-colors duration-fast hover-hover:hover:border-primary/40 hover-hover:hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-property-10-soft text-property-10-soft-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      {item.detail ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {item.external ? (
                    <ExternalLinkIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  ) : null}
                </a>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            This host hasn&apos;t added direct chat channels yet. Choose a unit to start a booking
            conversation.
          </p>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            Pay only to the accounts shown inside your Smart App PH booking conversation — never to
            a personal GCash or bank account sent in chat or by text.
          </p>
        </div>
      </div>
    </AppSheet>
  );
}
