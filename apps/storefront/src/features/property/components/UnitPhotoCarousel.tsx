'use client';

import { Badge } from '@smartapp/ui/components/badge';
import { cn } from '@smartapp/ui/lib/utils';
import { HomeIcon, ImagesIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { UnitCardPhoto } from '../property-rules';
import { LazyUnitPhotoCarouselInteractive } from './LazySheets';

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
 * - Renders a pixel-identical static cover frame on SSR & initial paint so zero unit Embla
 *   instances run during initial page load.
 * - Upgrades smoothly to the lazy-loaded installed `Carousel` (`UnitPhotoCarouselInteractive`)
 *   when the card scrolls into view, is hovered/touched/focused, or starts staggered autoplay.
 * - Only slide 0 loads with the page; remaining photos load on swipe or next-slide preload.
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
  const [interactive, setInteractive] = useState(false);

  const total = photos.length;
  const hasMultiple = total > 1;
  const extraPhotos = total > 1 ? total - 1 : 0;
  const firstPhoto = photos[0];
  const staticDotCount = Math.min(total, 5);

  // Track viewport visibility for staggered autoplay AND upgrade multi-photo cards to Embla once
  // they actually enter the viewport (keeping initial above-the-fold load Embla-free).
  useEffect(() => {
    if (!hasMultiple) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInteractive(true);
        }
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

  const showInteractive = hasMultiple && (interactive || advanceToken > 0 || preloadNext);

  return (
    <div
      ref={containerRef}
      data-slot="unit-photo-carousel"
      className="group/unit-photo relative aspect-4/3 w-full overflow-hidden bg-muted"
      onPointerEnter={() => {
        if (hasMultiple) setInteractive(true);
        onInteractionChange(cardId, true);
      }}
      onPointerLeave={() => onInteractionChange(cardId, false)}
      onTouchStart={() => {
        if (hasMultiple) setInteractive(true);
        onInteractionChange(cardId, true);
      }}
      onFocusCapture={() => {
        if (hasMultiple) setInteractive(true);
        onInteractionChange(cardId, true);
      }}
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
      ) : (
        <>
          <button
            type="button"
            onClick={onOpenQuickLook}
            aria-label={`Quick look: ${title}`}
            aria-hidden={showInteractive || undefined}
            tabIndex={showInteractive ? -1 : undefined}
            className="relative block aspect-4/3 w-full overflow-hidden bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {firstPhoto ? (
              <Image
                src={normalizeMediaSrc(firstPhoto.url)}
                alt={firstPhoto.alt}
                fill
                loading="lazy"
                fetchPriority="low"
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 46vw, calc(100vw - 32px)"
                className={cn(
                  'object-cover',
                  !hasMultiple &&
                    'transition-transform duration-base ease-enter hover-hover:group-hover/unit-photo:scale-[1.03]',
                )}
              />
            ) : null}
          </button>

          {hasMultiple ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1"
            >
              {Array.from({ length: staticDotCount }, (_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={cn(
                    'h-1.5 rounded-full',
                    dotIdx === 0 ? 'w-3.5 bg-on-scrim' : 'w-1.5 bg-on-scrim/55',
                  )}
                />
              ))}
            </div>
          ) : null}

          {showInteractive ? (
            <div className="absolute inset-0 z-10">
              <LazyUnitPhotoCarouselInteractive
                cardId={cardId}
                title={title}
                photos={photos}
                advanceToken={advanceToken}
                preloadNext={preloadNext}
                onInteractionChange={onInteractionChange}
                onOpenQuickLook={onOpenQuickLook}
              />
            </div>
          ) : null}
        </>
      )}

      {extraPhotos > 0 ? (
        <span
          aria-label={`${total} photos`}
          className="pointer-events-none absolute right-2.5 bottom-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-scrim px-2.5 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
        >
          <ImagesIcon aria-hidden="true" className="size-3" />+{extraPhotos}
        </span>
      ) : null}

      {badgeLabel ? (
        <Badge
          variant="secondary"
          className="pointer-events-none absolute top-2.5 left-2.5 z-20 rounded-full border border-border/60 bg-card/95 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs"
        >
          {badgeLabel}
        </Badge>
      ) : null}
    </div>
  );
}
