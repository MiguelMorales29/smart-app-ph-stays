'use client';

import { Button } from '@smartapp/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import { cn } from '@smartapp/ui/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { UnitCardPhoto } from '../property-rules';

export interface UnitPhotoCarouselInteractiveProps {
  readonly cardId: string;
  readonly title: string;
  readonly photos: readonly UnitCardPhoto[];
  readonly advanceToken: number;
  readonly preloadNext: boolean;
  readonly onInteractionChange: (cardId: string, paused: boolean) => void;
  readonly onOpenQuickLook: () => void;
}

/**
 * Lazy-loaded interactive Embla carousel for multi-photo unit cards (D81):
 * - Swipe on phones, small hover arrows on desktop, compact dots.
 * - Only slide 0 renders eagerly on mount; subsequent photos load when swiped, hovered, or
 *   preloaded as the next slide by the Units section autoplay coordinator.
 */
export function UnitPhotoCarouselInteractive({
  cardId,
  title,
  photos,
  advanceToken,
  preloadNext,
  onInteractionChange,
  onOpenQuickLook,
}: UnitPhotoCarouselInteractiveProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<ReadonlySet<number>>(() => new Set([0]));
  const lastAdvanceRef = useRef(0);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;
  const opts = useMemo(() => ({ loop: total > 1, align: 'start' as const }), [total]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setSelected(idx);
      setLoadedIndices((prev) => {
        if (prev.has(idx) && prev.has((idx + 1) % total)) return prev;
        const next = new Set(prev);
        next.add(idx);
        next.add((idx + 1) % total);
        return next;
      });
    };
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, total]);

  useEffect(() => {
    if (!api || advanceToken === 0 || advanceToken === lastAdvanceRef.current) return;
    lastAdvanceRef.current = advanceToken;
    api.scrollNext();
  }, [advanceToken, api]);

  function shouldRenderPhoto(index: number): boolean {
    if (loadedIndices.has(index)) return true;
    if (preloadNext && index === (selected + 1) % total) return true;
    return false;
  }

  function ensureNeighborLoaded() {
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

  const dotIndices = useMemo(() => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, idx) => idx);
    }
    const start = Math.max(0, Math.min(selected - 2, total - 5));
    return Array.from({ length: 5 }, (_, idx) => start + idx);
  }, [selected, total]);

  return (
    <>
      <div
        className="size-full"
        onMouseEnter={() => {
          ensureNeighborLoaded();
          onInteractionChange(cardId, true);
        }}
        onTouchStart={() => {
          ensureNeighborLoaded();
          onInteractionChange(cardId, true);
        }}
      >
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
                    onOpenQuickLook();
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
      </div>

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
  );
}
