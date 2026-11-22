'use client';

import type { PropertyContact, WeeklyHours } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { HomeIcon, ImagesIcon, MessageSquareIcon, SparklesIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import { groupDisplayCardsByMode, type UnitDisplayCard } from '../property-rules';
import { PropertyContactSheet } from './PropertyContactSheet';

export interface UnitsSectionProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly contact: PropertyContact;
  readonly replyHours: WeeklyHours | null;
  readonly cards: readonly UnitDisplayCard[];
}

function UnitCardItem({ slug, card }: { readonly slug: string; readonly card: UnitDisplayCard }) {
  const extraPhotos = card.photoCount > 1 ? card.photoCount - 1 : 0;

  return (
    <Link
      href={`/${slug}/units/${card.targetUnitSlug}`}
      data-slot={card.kind === 'room' ? 'room-card' : 'unit-card'}
      className="press group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors duration-fast outline-none focus-visible:ring-3 focus-visible:ring-ring hover-hover:hover:border-primary/40"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {card.coverUrl ? (
          <Image
            src={normalizeMediaSrc(card.coverUrl)}
            alt={card.coverAlt}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <HomeIcon aria-hidden="true" className="size-8 opacity-50" />
          </div>
        )}

        {extraPhotos > 0 ? (
          <span
            aria-label={`${card.photoCount} photos`}
            className="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-scrim px-2.5 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
          >
            <ImagesIcon aria-hidden="true" className="size-3" />+{extraPhotos}
          </span>
        ) : null}

        {card.kind === 'room' && card.badgeLabel ? (
          <Badge
            variant="secondary"
            className="pointer-events-none absolute top-2.5 left-2.5 rounded-full border border-border/60 bg-card/95 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs"
          >
            {card.badgeLabel}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-1.5">
          <h3 className="font-heading text-lg font-semibold leading-snug tracking-tight text-card-foreground">
            {card.title}
          </h3>
          <p className="text-sm text-muted-foreground">{card.factsLine}</p>

          {card.highlightChip ? (
            <div className="pt-0.5">
              <Badge
                variant="secondary"
                className="gap-1 rounded-full bg-property-10-soft px-2.5 py-0.5 text-xs font-medium text-property-10-soft-foreground"
              >
                <SparklesIcon aria-hidden="true" className="size-3" />
                {card.highlightChip}
              </Badge>
            </div>
          ) : null}
        </div>

        {card.priceText ? (
          <p className="font-heading text-base font-semibold text-[var(--card-link,var(--property-10-text))] tabular">
            {card.priceText}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function UnitCardGrid({
  slug,
  cards,
}: {
  readonly slug: string;
  readonly cards: readonly UnitDisplayCard[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <UnitCardItem key={card.id} slug={slug} card={card} />
      ))}
    </div>
  );
}

/**
 * Units section (part 8, D81):
 * - Bed spaces sharing `group_label` render as one room card linking to the room's first bed.
 * - When both Stays and Monthly rentals exist, switches between them with `SegmentedControl`.
 * - Phone 1 column, tablet 2 columns, desktop left column 2 columns.
 * - Empty state opens the contact sheet (never `/inquire`).
 */
export function UnitsSection({
  slug,
  propertyName,
  contact,
  replyHours,
  cards,
}: UnitsSectionProps) {
  const [activeTab, setActiveTab] = useState<'stays' | 'rentals'>('stays');
  const [contactOpen, setContactOpen] = useState(false);

  if (cards.length === 0) {
    return (
      <section
        id="units"
        aria-labelledby="units-heading"
        data-slot="units-section"
        className="scroll-mt-32 space-y-4 lg:scroll-mt-24"
      >
        <h2 id="units-heading" className="font-heading text-xl font-semibold tracking-tight">
          Units
        </h2>
        <EmptyState
          icon={<HomeIcon aria-hidden="true" />}
          title="No units listed yet"
          description="Send the host a message if you want to ask about availability."
          action={
            <Button
              type="button"
              onClick={() => setContactOpen(true)}
              className="min-h-12 gap-2 px-5"
            >
              <MessageSquareIcon aria-hidden="true" className="size-4" />
              Message
            </Button>
          }
        />
        <PropertyContactSheet
          open={contactOpen}
          onOpenChange={setContactOpen}
          propertyName={propertyName}
          contact={contact}
          replyHours={replyHours}
        />
      </section>
    );
  }

  const grouped = groupDisplayCardsByMode(cards);
  const headingLabel = cards.every((card) => card.kind === 'room') ? 'Rooms' : 'Units';

  return (
    <section
      id="units"
      aria-labelledby="units-heading"
      data-slot="units-section"
      className="scroll-mt-32 space-y-5 lg:scroll-mt-24"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="units-heading" className="font-heading text-xl font-semibold tracking-tight">
          {headingLabel}
        </h2>

        {grouped.grouped ? (
          <SegmentedControl
            aria-label="Filter units by stay type"
            value={activeTab}
            onValueChange={setActiveTab}
            size="sm"
            className="w-full sm:w-auto sm:min-w-64"
            options={[
              { value: 'stays', label: `Stays (${grouped.stays.length})` },
              { value: 'rentals', label: `Monthly rentals (${grouped.rentals.length})` },
            ]}
          />
        ) : null}
      </div>

      {grouped.grouped ? (
        <UnitCardGrid slug={slug} cards={activeTab === 'stays' ? grouped.stays : grouped.rentals} />
      ) : (
        <UnitCardGrid slug={slug} cards={grouped.cards} />
      )}
    </section>
  );
}
