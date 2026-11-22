'use client';

import type { PropertyContact, UnitCardSeconds, WeeklyHours } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { useReducedMotion } from '@smartapp/ui/hooks/use-reduced-motion';
import { cn } from '@smartapp/ui/lib/utils';
import {
  ChevronDownIcon,
  HomeIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  SparklesIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  groupDisplayCardsByMode,
  pickNextAutoplayCardId,
  type UnitDisplayCard,
} from '../property-rules';
import { LazyPropertyContactSheet, LazyUnitQuickLookSheet } from './LazySheets';
import { UnitPhotoCarousel } from './UnitPhotoCarousel';

const PHONE_INITIAL_VISIBLE_COUNT = 4;

export interface UnitsSectionProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly contact: PropertyContact;
  readonly replyHours: WeeklyHours | null;
  readonly cards: readonly UnitDisplayCard[];
  readonly unitCardAutoplay?: boolean | undefined;
  readonly unitCardSeconds?: UnitCardSeconds | undefined;
}

/**
 * Units section (part 8, D80–D81):
 * - Bed spaces sharing `group_label` render as one room card linking to the room's first bed.
 * - When both Stays and Monthly rentals exist, switches between them with `SegmentedControl`.
 * - Each card's photo area is the installed `Carousel` (first photo eager, rest lazy on swipe,
 *   hover arrows on desktop, dots, `+N` count) with optional owner-controlled staggered autoplay.
 * - Tapping a card opens the lazy-loaded Quick look sheet/dialog.
 * - Grid: 1 column on phones (first 4 cards + "Show all N units" button), 2 on tablet, 3 on desktop.
 * - Empty state opens the lazy-loaded contact sheet (never `/inquire`).
 */
export function UnitsSection({
  slug,
  propertyName,
  contact,
  replyHours,
  cards,
  unitCardAutoplay = false,
  unitCardSeconds = 7,
}: UnitsSectionProps) {
  const [activeTab, setActiveTab] = useState<'stays' | 'rentals'>('stays');
  const [showAllOnPhone, setShowAllOnPhone] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactMounted, setContactMounted] = useState(false);

  const [quickLookCard, setQuickLookCard] = useState<UnitDisplayCard | null>(null);
  const [quickLookOpen, setQuickLookOpen] = useState(false);

  const reducedMotion = useReducedMotion();
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [advanceTokens, setAdvanceTokens] = useState<Readonly<Record<string, number>>>({});
  const [preloadCardId, setPreloadCardId] = useState<string | null>(null);

  const visibleIdsRef = useRef<Set<string>>(new Set());
  const interactedIdsRef = useRef<Set<string>>(new Set());
  const lastAdvancedIdRef = useRef<string | null>(null);

  const grouped = useMemo(() => groupDisplayCardsByMode(cards), [cards]);
  const activeCards = grouped.grouped
    ? activeTab === 'stays'
      ? grouped.stays
      : grouped.rentals
    : grouped.cards;

  const hasMultiPhotoCard = useMemo(
    () => activeCards.some((card) => card.photoCount > 1),
    [activeCards],
  );
  const showAutoplayToggle = unitCardAutoplay && hasMultiPhotoCard && !reducedMotion;

  const handleVisibilityChange = useCallback((cardId: string, visible: boolean) => {
    if (visible) {
      visibleIdsRef.current.add(cardId);
    } else {
      visibleIdsRef.current.delete(cardId);
    }
  }, []);

  const handleInteractionChange = useCallback((cardId: string, paused: boolean) => {
    if (paused) {
      interactedIdsRef.current.add(cardId);
    } else {
      interactedIdsRef.current.delete(cardId);
    }
  }, []);

  // Staggered autoplay coordinator: advances ONE eligible visible card per interval and preloads
  // only the next card's upcoming photo.
  useEffect(() => {
    if (!showAutoplayToggle || autoplayPaused || quickLookOpen) {
      return;
    }

    const cardIdsInOrder = activeCards.filter((card) => card.photoCount > 1).map((card) => card.id);
    if (cardIdsInOrder.length === 0) return;

    const tickMs = unitCardSeconds * 1000;
    const interval = window.setInterval(() => {
      const eligible = cardIdsInOrder.filter(
        (id) => visibleIdsRef.current.has(id) && !interactedIdsRef.current.has(id),
      );
      const nextId = pickNextAutoplayCardId(eligible, lastAdvancedIdRef.current);
      if (!nextId) return;

      lastAdvancedIdRef.current = nextId;
      setAdvanceTokens((prev) => ({
        ...prev,
        [nextId]: (prev[nextId] ?? 0) + 1,
      }));

      const upcomingId = pickNextAutoplayCardId(eligible, nextId);
      setPreloadCardId(upcomingId);
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [activeCards, autoplayPaused, quickLookOpen, showAutoplayToggle, unitCardSeconds]);

  function openQuickLook(card: UnitDisplayCard) {
    setQuickLookCard(card);
    setQuickLookOpen(true);
  }

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
              onClick={() => {
                setContactMounted(true);
                setContactOpen(true);
              }}
              className="min-h-12 gap-2 px-5"
            >
              <MessageSquareIcon aria-hidden="true" className="size-4" />
              Message
            </Button>
          }
        />
        {contactMounted ? (
          <LazyPropertyContactSheet
            open={contactOpen}
            onOpenChange={setContactOpen}
            propertyName={propertyName}
            contact={contact}
            replyHours={replyHours}
          />
        ) : null}
      </section>
    );
  }

  const allRooms = cards.every((card) => card.kind === 'room');
  const headingLabel = allRooms ? 'Rooms' : 'Units';
  const nounPlural = allRooms ? 'rooms' : 'units';
  const hasPhoneOverflow = activeCards.length > PHONE_INITIAL_VISIBLE_COUNT && !showAllOnPhone;

  return (
    <section
      id="units"
      aria-labelledby="units-heading"
      data-slot="units-section"
      data-unit-autoplay={unitCardAutoplay ? 'on' : 'off'}
      className="scroll-mt-32 space-y-5 lg:scroll-mt-24"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="units-heading" className="font-heading text-xl font-semibold tracking-tight">
            {headingLabel}
          </h2>
          {showAutoplayToggle ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={autoplayPaused}
              onClick={() => setAutoplayPaused((value) => !value)}
              className="min-h-9 gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              {autoplayPaused ? (
                <>
                  <PlayIcon aria-hidden="true" className="size-3.5 fill-current" />
                  Play
                </>
              ) : (
                <>
                  <PauseIcon aria-hidden="true" className="size-3.5 fill-current" />
                  Pause
                </>
              )}
            </Button>
          ) : null}
        </div>

        {grouped.grouped ? (
          <SegmentedControl
            aria-label="Filter units by stay type"
            value={activeTab}
            onValueChange={(nextTab) => {
              setActiveTab(nextTab);
              setShowAllOnPhone(false);
            }}
            size="sm"
            className="w-full sm:w-auto sm:min-w-64"
            options={[
              { value: 'stays', label: `Stays (${grouped.stays.length})` },
              { value: 'rentals', label: `Monthly rentals (${grouped.rentals.length})` },
            ]}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {activeCards.map((card, index) => (
          <article
            key={card.id}
            data-slot={card.kind === 'room' ? 'room-card' : 'unit-card'}
            className={cn(
              'flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors duration-fast hover-hover:hover:border-primary/40',
              hasPhoneOverflow && index >= PHONE_INITIAL_VISIBLE_COUNT && 'hidden md:flex',
            )}
          >
            <UnitPhotoCarousel
              cardId={card.id}
              title={card.title}
              photos={card.photos}
              badgeLabel={card.kind === 'room' ? card.badgeLabel : null}
              advanceToken={advanceTokens[card.id] ?? 0}
              preloadNext={preloadCardId === card.id}
              onInteractionChange={handleInteractionChange}
              onVisibilityChange={handleVisibilityChange}
              onOpenQuickLook={() => openQuickLook(card)}
            />

            <button
              type="button"
              onClick={() => openQuickLook(card)}
              aria-haspopup="dialog"
              className="press flex flex-1 flex-col justify-between gap-3 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
            >
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
            </button>
          </article>
        ))}
      </div>

      {hasPhoneOverflow ? (
        <div className="md:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAllOnPhone(true)}
            className="min-h-12 w-full gap-2 rounded-xl bg-card text-sm font-semibold text-foreground"
          >
            <span>
              Show all {activeCards.length} {nounPlural}
            </span>
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}

      {quickLookCard ? (
        <LazyUnitQuickLookSheet
          key={quickLookCard.id}
          open={quickLookOpen}
          onOpenChange={setQuickLookOpen}
          slug={slug}
          card={quickLookCard}
        />
      ) : null}
    </section>
  );
}
