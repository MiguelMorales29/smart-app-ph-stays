'use client';

import { Badge } from '@smartapp/ui/components/badge';
import { Button } from '@smartapp/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import { cn } from '@smartapp/ui/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, ImagesIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { UnitCardPhoto } from '../property-rules';

export interface UnitPhotoCarouselProps {
  readonly cardId: string;
  readonly title: string;
  readonly photos: readonly UnitCardPhoto[];
  readonly badgeLabel: string | null;
  /** Incrementing token triggered by the section's staggered autoplay coordinator. */
  readonly advanceToken: number;
  /** True when the section coordinator wants this card to preload its next photo ahead of its turn. */
  readonly preloadNext: boolean;
  readonly onInteractionChange: (cardId: string, paused: boolean) => void;
  readonly onVisibilityChange: (cardId: string, visible: boolean) => void;
  readonly onOpenQuickLook: () => void;
}

/**
 * Unit card photo area (D81):
 * - Installed shadcn Carousel: swipe on phones, small hover arrows on desktop, compact dots, `+N` count.
 * - Only slide 0 renders `<Image>` on initial page load; subsequent photos mount when swiped,
 *   hovered/focused, or preloaded as the single next slide by the section autoplay coordinator.
 */
export function UnitPhotoCarousel({
  cardId,
  title,
  photos,
  badgeLabel,
  advanceToken,
  preloadNext,
  onInteractionChange,
  onVisibilityChange,
  onOpenQuickLook,
}: UnitPhotoCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<ReadonlySet<number>>(() => new Set([0]));
  const lastAdvanceRef = useRef(0);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;
  const hasMultiple = total > 1;
  const extraPhotos = total > 1 ? total - 1 : 0;

  const opts = useMemo(() => ({ loop: hasMultiple, align: 'start' as const }), [hasMultiple]);

  // Track whether this card is visible in the viewport for staggered autoplay.
  useEffect(() => {
    if (!hasMultiple) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        onVisibilityChange(cardId, entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      onVisibilityChange(cardId, false);
    };
  }, [cardId, hasMultiple, onVisibilityChange]);

  // Keep selected index synced and lazily mark active + adjacent slide loaded on swipe.
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setSelected(idx);
      setLoadedIndices((prev) => {
        if (prev.has(idx) && (!hasMultiple || prev.has((idx + 1) % total))) {
          return prev;
        }
        const next = new Set(prev);
        next.add(idx);
        if (hasMultiple) {
          next.add((idx + 1) % total);
        }
        return next;
      });
    };
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, hasMultiple, total]);

  // Advance by 1 slide when the section coordinator dispatches this card's staggered turn.
  // Embla's `select` event then marks the new active & next slide loaded.
  useEffect(() => {
    if (!hasMultiple || !api || advanceToken === 0 || advanceToken === lastAdvanceRef.current) {
      return;
    }
    lastAdvanceRef.current = advanceToken;
    api.scrollNext();
  }, [advanceToken, api, hasMultiple]);

  function shouldRenderPhoto(index: number): boolean {
    if (loadedIndices.has(index)) return true;
    if (preloadNext && hasMultiple && index === (selected + 1) % total) return true;
    return false;
  }

  function ensureNeighborLoaded() {
    if (!hasMultiple) return;
    const nextIdx = (selected + 1) % total;
    const prevIdx = (selected - 1 + total) % total;
    setLoadedIndices((prev) => {
      if (prev.has(nextIdx) && prev.has(prevIdx)) return prev;
      const next = new Set(prev);
      next.add(nextIdx);
      next.add(prevIdx);
      return next;
    });
  }

  function handleSlideClick() {
    onOpenQuickLook();
  }

  // Cap visible dots at 5 so cards with 6–10 photos stay crisp.
  const dotIndices = useMemo(() => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, idx) => idx);
    }
    const start = Math.max(0, Math.min(selected - 2, total - 5));
    return Array.from({ length: 5 }, (_, idx) => start + idx);
  }, [selected, total]);

  return (
    <div
      ref={containerRef}
      data-slot="unit-photo-carousel"
      className="group/unit-photo relative aspect-4/3 w-full overflow-hidden bg-muted"
      onMouseEnter={() => {
        ensureNeighborLoaded();
        onInteractionChange(cardId, true);
      }}
      onMouseLeave={() => onInteractionChange(cardId, false)}
      onTouchStart={() => {
        ensureNeighborLoaded();
        onInteractionChange(cardId, true);
      }}
      onFocusCapture={() => onInteractionChange(cardId, true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          containerRef.current &&
          (!(nextTarget instanceof Node) || !containerRef.current.contains(nextTarget))
        ) {
          onInteractionChange(cardId, false);
        }
      }}
    >
      {total === 0 ? (
        <button
          type="button"
          onClick={onOpenQuickLook}
          aria-label={`Quick look: ${title}`}
          className="flex size-full items-center justify-center text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <HomeIcon aria-hidden="true" className="size-8 opacity-50" />
        </button>
      ) : hasMultiple ? (
        <Carousel setApi={setApi} opts={opts} aria-label={`${title} photos`} className="size-full">
          <CarouselContent className="-ml-0 h-full">
            {photos.map((photo, index) => (
              <CarouselItem key={photo.fileId} className="pl-0">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
                  }}
                  onClick={(event) => {
                    const start = pointerDownPosRef.current;
                    pointerDownPosRef.current = null;
                    if (
                      start &&
                      (Math.abs(event.clientX - start.x) > 8 ||
                        Math.abs(event.clientY - start.y) > 8)
                    ) {
                      return;
                    }
                    handleSlideClick();
                  }}
                  aria-label={`Quick look ${title}: photo ${index + 1} of ${total}`}
                  className="relative block aspect-4/3 w-full overflow-hidden bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {shouldRenderPhoto(index) ? (
                    <Image
                      src={normalizeMediaSrc(photo.url)}
                      alt={photo.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 360px, (min-width: 768px) 46vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <button
          type="button"
          onClick={onOpenQuickLook}
          aria-label={`Quick look: ${title}`}
          className="relative block aspect-4/3 w-full overflow-hidden bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <Image
            src={normalizeMediaSrc(photos[0]?.url ?? '')}
            alt={photos[0]?.alt ?? title}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover/unit-photo:scale-[1.03]"
          />
        </button>
      )}

      {hasMultiple ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Previous ${title} photo`}
            onClick={(event) => {
              event.stopPropagation();
              ensureNeighborLoaded();
              api?.scrollPrev();
            }}
            className="absolute top-1/2 left-2 z-10 hidden size-8 -translate-y-1/2 rounded-full bg-card/90 text-foreground opacity-0 shadow-sm backdrop-blur-xs transition-opacity duration-fast hover:bg-card hover-hover:md:inline-flex group-hover/unit-photo:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Next ${title} photo`}
            onClick={(event) => {
              event.stopPropagation();
              ensureNeighborLoaded();
              api?.scrollNext();
            }}
            className="absolute top-1/2 right-2 z-10 hidden size-8 -translate-y-1/2 rounded-full bg-card/90 text-foreground opacity-0 shadow-sm backdrop-blur-xs transition-opacity duration-fast hover:bg-card hover-hover:md:inline-flex group-hover/unit-photo:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Button>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1"
          >
            {dotIndices.map((dotIdx) => (
              <span
                key={dotIdx}
                className={cn(
                  'h-1.5 rounded-full transition-[width,background-color] duration-fast',
                  dotIdx === selected ? 'w-3.5 bg-on-scrim' : 'w-1.5 bg-on-scrim/55',
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {extraPhotos > 0 ? (
        <span
          aria-label={`${total} photos`}
          className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-scrim px-2.5 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
        >
          <ImagesIcon aria-hidden="true" className="size-3" />+{extraPhotos}
        </span>
      ) : null}

      {badgeLabel ? (
        <Badge
          variant="secondary"
          className="absolute top-2.5 left-2.5 rounded-full border border-border/60 bg-card/95 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs"
        >
          {badgeLabel}
        </Badge>
      ) : null}
    </div>
  );
}
