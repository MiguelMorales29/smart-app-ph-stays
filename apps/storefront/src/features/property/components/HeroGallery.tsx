'use client';

import { Button } from '@smartapp/ui/components/button';
import { cn } from '@smartapp/ui/lib/utils';
import { ImagesIcon } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { ResolvedPropertyPhoto } from '../property-rules';
import { LazyHeroPhoneCarousel, LazyHeroPhotoViewerModal } from './LazySheets';

export interface HeroGalleryProps {
  readonly propertyName: string;
  readonly mosaicPhotos: readonly ResolvedPropertyPhoto[];
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
}

/**
 * Property hero gallery (part 4, D81, D74–D77):
 * - Phone: static LCP cover + "1 / N" counter on SSR/first paint; upgrades in place (zero CLS,
 *   never unmounting the reserved `aspect-4/3` box) to the lazy-loaded Embla swipe gallery on
 *   touch/pointer interaction (never auto-advances, E4).
 * - From 768 px: 1 large cover + up to 4 small photos mosaic with "Show all photos".
 * - Full-screen grouped viewer modal is lazy-loaded only when opened.
 */
export function HeroGallery({ propertyName, mosaicPhotos, allPhotos }: HeroGalleryProps) {
  const [phoneCarouselActive, setPhoneCarouselActive] = useState(false);

  const [viewerMounted, setViewerMounted] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSession, setViewerSession] = useState(0);
  const [viewerMode, setViewerMode] = useState<'carousel' | 'grid'>('carousel');
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const totalCount = allPhotos.length;

  const hasMultipleGroups = useMemo(() => {
    const groupIds = new Set<string>();
    for (const photo of allPhotos) {
      groupIds.add(photo.groupId);
      if (groupIds.size > 1) return true;
    }
    return false;
  }, [allPhotos]);

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
    setViewerMode(hasMultipleGroups ? 'grid' : 'carousel');
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
      {/* Phone swipe gallery: never auto-advances (decision E4); fixed aspect-4/3 box prevents CLS */}
      {coverPhoto ? (
        <div
          className="space-y-2.5 md:hidden"
          onTouchStart={() => {
            if (totalCount > 1) setPhoneCarouselActive(true);
          }}
          onPointerDown={() => {
            if (totalCount > 1) setPhoneCarouselActive(true);
          }}
        >
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
            <button
              type="button"
              onClick={() => openCarouselAt(0)}
              aria-label={`View photo 1 of ${totalCount}: ${coverPhoto.alt}`}
              aria-hidden={phoneCarouselActive || undefined}
              tabIndex={phoneCarouselActive ? -1 : undefined}
              className="relative block size-full overflow-hidden text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Image
                src={normalizeMediaSrc(coverPhoto.url)}
                alt={coverPhoto.alt}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </button>

            {totalCount > 1 ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-scrim px-3 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
              >
                1 / {totalCount}
              </div>
            ) : null}

            {phoneCarouselActive && totalCount > 1 ? (
              <div className="absolute inset-0 z-10">
                <LazyHeroPhoneCarousel
                  propertyName={propertyName}
                  allPhotos={allPhotos}
                  onOpenCarouselAt={openCarouselAt}
                />
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
      ) : null}

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
        />
      ) : null}
    </section>
  );
}
