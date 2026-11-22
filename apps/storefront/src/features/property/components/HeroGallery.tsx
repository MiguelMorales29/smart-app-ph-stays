'use client';

import { Button } from '@smartapp/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import { cn } from '@smartapp/ui/lib/utils';
import { ImagesIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { ResolvedPhotoGroup, ResolvedPropertyPhoto } from '../property-rules';
import { LazyHeroPhotoViewerModal } from './LazySheets';

export interface HeroGalleryProps {
  readonly propertyName: string;
  readonly mosaicPhotos: readonly ResolvedPropertyPhoto[];
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
  readonly photoGroups: readonly ResolvedPhotoGroup[];
}

/**
 * Property hero gallery (part 4, D81, D74–D77):
 * - Phone: full-width Embla swipe gallery with "1 / N" counter (never auto-advances, E4) plus a
 *   "Show all photos" button under the gallery; only slide 0 loads eagerly, rest load when swiped.
 * - From 768 px: 1 large cover + up to 4 small photos mosaic with "Show all photos".
 * - Full-screen viewer modal is lazy-loaded only when opened.
 */
export function HeroGallery({
  propertyName,
  mosaicPhotos,
  allPhotos,
  photoGroups,
}: HeroGalleryProps) {
  const [phoneApi, setPhoneApi] = useState<CarouselApi>();
  const [phoneIndex, setPhoneIndex] = useState(0);
  const [loadedPhoneIndices, setLoadedPhoneIndices] = useState<ReadonlySet<number>>(
    () => new Set([0]),
  );

  const [viewerMounted, setViewerMounted] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSession, setViewerSession] = useState(0);
  const [viewerMode, setViewerMode] = useState<'carousel' | 'grid'>('carousel');
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const totalCount = allPhotos.length;

  useEffect(() => {
    if (!phoneApi) return;
    const onSelect = () => {
      const idx = phoneApi.selectedScrollSnap();
      setPhoneIndex(idx);
      setLoadedPhoneIndices((prev) => {
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

  if (totalCount === 0) {
    return null;
  }

  function openCarouselAt(index: number) {
    const safeIndex = Math.max(0, Math.min(index, totalCount - 1));
    setViewerStartIndex(safeIndex);
    setViewerMode('carousel');
    setViewerSession((n) => n + 1);
    setViewerMounted(true);
    setViewerOpen(true);
  }

  function openGroupedOverview() {
    setViewerMode(photoGroups.length > 1 ? 'grid' : 'carousel');
    setViewerSession((n) => n + 1);
    setViewerMounted(true);
    setViewerOpen(true);
  }

  const coverPhoto = mosaicPhotos[0] ?? allPhotos[0];
  const secondaryPhotos = mosaicPhotos.slice(1, 5);

  return (
    <section
      id="hero-gallery"
      aria-label={`${propertyName} photos`}
      data-slot="hero-gallery"
      className="relative"
    >
      {/* Phone swipe gallery: never auto-advances (decision E4); only cover downloads upfront */}
      <div
        className="space-y-2.5 md:hidden"
        onTouchStart={() => {
          if (totalCount > 1) {
            setLoadedPhoneIndices((prev) => {
              if (prev.has(1)) return prev;
              const next = new Set(prev);
              next.add(1);
              return next;
            });
          }
        }}
      >
        <div className="relative">
          <Carousel
            setApi={setPhoneApi}
            opts={phoneOpts}
            aria-label={`${propertyName} photo gallery`}
          >
            <CarouselContent className="-ml-0">
              {allPhotos.map((photo, index) => (
                <CarouselItem key={photo.fileId} className="pl-0">
                  <button
                    type="button"
                    onClick={() => openCarouselAt(index)}
                    aria-label={`View photo ${index + 1} of ${totalCount}: ${photo.alt}`}
                    className="relative block aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {loadedPhoneIndices.has(index) ? (
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

        {totalCount > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={openGroupedOverview}
            className="min-h-11 w-full gap-2 rounded-xl bg-card text-sm font-medium text-foreground"
          >
            <ImagesIcon aria-hidden="true" className="size-4" />
            Show all {totalCount} photos
          </Button>
        ) : null}
      </div>

      {/* Tablet & desktop mosaic: 1 large cover + up to 4 small photos */}
      {coverPhoto ? (
        <div className="relative hidden md:block">
          <div
            className={cn(
              'grid gap-2 overflow-hidden rounded-2xl',
              secondaryPhotos.length === 0
                ? 'grid-cols-1'
                : secondaryPhotos.length === 1
                  ? 'grid-cols-2'
                  : 'grid-cols-4 grid-rows-2',
            )}
          >
            <button
              type="button"
              onClick={() => openCarouselAt(0)}
              aria-label={`View photo 1 of ${totalCount}: ${coverPhoto.alt}`}
              className={cn(
                'group relative block w-full overflow-hidden bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset',
                secondaryPhotos.length >= 2
                  ? 'col-span-2 row-span-2 aspect-4/3 h-full'
                  : 'aspect-16/9',
              )}
            >
              <Image
                src={normalizeMediaSrc(coverPhoto.url)}
                alt={coverPhoto.alt}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover:scale-[1.02]"
              />
            </button>

            {secondaryPhotos.map((photo, idx) => {
              const photoIndex = idx + 1;
              const spanFull =
                secondaryPhotos.length === 2 || (secondaryPhotos.length === 3 && idx === 2);
              return (
                <button
                  key={photo.fileId}
                  type="button"
                  onClick={() => openCarouselAt(photoIndex)}
                  aria-label={`View photo ${photoIndex + 1} of ${totalCount}: ${photo.alt}`}
                  className={cn(
                    'group relative block aspect-4/3 w-full overflow-hidden bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset',
                    spanFull && 'col-span-2',
                  )}
                >
                  <Image
                    src={normalizeMediaSrc(photo.url)}
                    alt={photo.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1280px) 280px, (min-width: 768px) 25vw, 1px"
                    className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover:scale-[1.03]"
                  />
                </button>
              );
            })}
          </div>

          {totalCount > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openGroupedOverview}
              className="absolute right-3 bottom-3 min-h-11 gap-2 rounded-full border border-border bg-card/95 px-4 text-foreground shadow-sm backdrop-blur-sm hover:bg-card"
            >
              <ImagesIcon aria-hidden="true" className="size-4" />
              Show all photos
            </Button>
          ) : null}
        </div>
      ) : null}

      {viewerMounted ? (
        <LazyHeroPhotoViewerModal
          key={viewerSession}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          initialMode={viewerMode}
          startIndex={viewerStartIndex}
          propertyName={propertyName}
          allPhotos={allPhotos}
          photoGroups={photoGroups}
        />
      ) : null}
    </section>
  );
}
