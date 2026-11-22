'use client';

import type { PropertyContact, WeeklyHours } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import {
  CalendarIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  StarIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { StartingPrice, UnitDisplayCard } from '../property-rules';
import { PropertyContactSheet } from './PropertyContactSheet';
import { UnitChooserSheet } from './UnitChooserSheet';

export interface PropertyBookingCardProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly startingPrice: StartingPrice | null;
  readonly cards: readonly UnitDisplayCard[];
  readonly contact: PropertyContact;
  readonly replyHours: WeeklyHours | null;
  readonly googleReviewUrl: string | null;
}

/**
 * Sticky right-column booking card on desktop (≥1024 px, D80):
 * Starting price, Check dates (single unit → unit page; multiple → unit chooser sheet),
 * Message (contact sheet), Google reviews link when set, and one trust line.
 */
export function PropertyBookingCard({
  slug,
  propertyName,
  startingPrice,
  cards,
  contact,
  replyHours,
  googleReviewUrl,
}: PropertyBookingCardProps) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const singleCard = cards.length === 1 ? cards[0] : null;
  const hasMultipleCards = cards.length > 1;

  return (
    <aside
      aria-label="Booking actions"
      data-slot="property-booking-card"
      className="hidden lg:block"
    >
      <div className="sticky top-22 space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="space-y-1">
          {startingPrice ? (
            <p className="font-heading text-2xl font-semibold tracking-tight text-[var(--card-link,var(--property-10-text))] tabular">
              {startingPrice.formatted}
            </p>
          ) : (
            <p className="font-heading text-lg font-semibold text-card-foreground">
              Ask about availability
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {cards.length > 1
              ? `${cards.length} options available to view`
              : cards.length === 1
                ? 'Choose your dates on the next screen'
                : 'Send a message to check open dates'}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {singleCard ? (
            <Button
              nativeButton={false}
              render={<Link href={`/${slug}/units/${singleCard.targetUnitSlug}`} />}
              className="min-h-12 w-full gap-2 text-base font-semibold"
            >
              <CalendarIcon aria-hidden="true" className="size-4" />
              Check dates
            </Button>
          ) : hasMultipleCards ? (
            <Button
              type="button"
              onClick={() => setChooserOpen(true)}
              className="min-h-12 w-full gap-2 text-base font-semibold"
            >
              <CalendarIcon aria-hidden="true" className="size-4" />
              Check dates
            </Button>
          ) : null}

          <Button
            type="button"
            variant={cards.length > 0 ? 'outline' : 'default'}
            onClick={() => setContactOpen(true)}
            className="min-h-12 w-full gap-2 text-base font-medium"
          >
            <MessageSquareIcon aria-hidden="true" className="size-4" />
            Message
          </Button>
        </div>

        {googleReviewUrl ? (
          <div className="border-t border-border pt-3">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--card-link,var(--property-10-text))] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StarIcon aria-hidden="true" className="size-4" />
              <span>See reviews on Google</span>
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        ) : null}

        <div className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          <p>Pay only to the accounts in your booking conversation.</p>
        </div>
      </div>

      <UnitChooserSheet
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        slug={slug}
        propertyName={propertyName}
        cards={cards}
      />

      <PropertyContactSheet
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyName={propertyName}
        contact={contact}
        replyHours={replyHours}
      />
    </aside>
  );
}
