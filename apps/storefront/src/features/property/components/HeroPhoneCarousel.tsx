'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { ResolvedPropertyPhoto } from '../property-rules';

export interface HeroPhoneCarouselProps {
  readonly propertyName: string;
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
  readonly onOpenCarouselAt: (index: number) => void;
}

/**
 * Lazy-loaded Embla phone swipe gallery for the property hero (D81, E4):
 * - Mounted on touch/pointer or after browser idle on phones only, keeping Embla off initial LCP.
 * - Never auto-advances; slide 0 reuses the already-preloaded cover image, rest load on swipe.
 */
export function HeroPhoneCarousel({
  propertyName,
  allPhotos,
  onOpenCarouselAt,
}: HeroPhoneCarouselProps) {
  const [phoneApi, setPhoneApi] = useState<CarouselApi>();
  const [phoneIndex, setPhoneIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<ReadonlySet<number>>(() => new Set([0, 1]));

  const totalCount = allPhotos.length;

  useEffect(() => {
    if (!phoneApi) return;
    const onSelect = () => {
      const idx = phoneApi.selectedScrollSnap();
      setPhoneIndex(idx);
      setLoadedIndices((prev) => {
        if (prev.has(idx) && (idx + 1 >= totalCount || prev.has(idx + 1))) return prev;
        const next = new Set(prev);
        next.add(idx);
        if (idx + 1 < totalCount) next.add(idx + 1);
        return next;
      });
    };
    phoneApi.on('reInit', onSelect);
    phoneApi.on('select', onSelect);
    return () => {
      phoneApi.off('reInit', onSelect);
      phoneApi.off('select', onSelect);
    };
  }, [phoneApi, totalCount]);

  const phoneOpts = useMemo(() => ({ loop: false, align: 'start' as const }), []);

  return (
    <div className="relative">
      <Carousel setApi={setPhoneApi} opts={phoneOpts} aria-label={`${propertyName} photo gallery`}>
        <CarouselContent className="-ml-0">
          {allPhotos.map((photo, index) => (
            <CarouselItem key={photo.fileId} className="pl-0">
              <button
                type="button"
                onClick={() => onOpenCarouselAt(index)}
                aria-label={`View photo ${index + 1} of ${totalCount}: ${photo.alt}`}
                className="relative block aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                {loadedIndices.has(index) ? (
                  <Image
                    src={normalizeMediaSrc(photo.url)}
                    alt={photo.alt}
                    fill
                    {...(index === 0
                      ? { priority: true, fetchPriority: 'high' as const }
                      : { loading: 'lazy' as const })}
                    sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {totalCount > 1 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-scrim px-3 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
        >
          {phoneIndex + 1} / {totalCount}
        </div>
      ) : null}
    </div>
  );
}
