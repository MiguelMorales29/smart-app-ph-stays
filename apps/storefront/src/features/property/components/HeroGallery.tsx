'use client';

import { Button } from '@smartapp/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@smartapp/ui/components/dialog';
import { cn } from '@smartapp/ui/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, ImagesIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { ResolvedPropertyPhoto } from '../property-rules';

export interface HeroGalleryProps {
  readonly propertyName: string;
  readonly mosaicPhotos: readonly ResolvedPropertyPhoto[];
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
}

/**
 * Property hero gallery (part 4):
 * - Phone: full-width Embla swipe gallery with a "1 / N" counter; never auto-advances (E4).
 * - From 768 px: 1 large cover + up to 4 small photos mosaic with "Show all photos".
 * - Both open a full-screen viewer with swipe, arrows, Escape and screen-reader photo alt readout.
 */
export function HeroGallery({ propertyName, mosaicPhotos, allPhotos }: HeroGalleryProps) {
  const [phoneApi, setPhoneApi] = useState<CarouselApi>();
  const [phoneIndex, setPhoneIndex] = useState(0);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerApi, setViewerApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!phoneApi) return;
    const onSelect = () => setPhoneIndex(phoneApi.selectedScrollSnap());
    phoneApi.on('reInit', onSelect);
    phoneApi.on('select', onSelect);
    return () => {
      phoneApi.off('reInit', onSelect);
      phoneApi.off('select', onSelect);
    };
  }, [phoneApi]);

  useEffect(() => {
    if (!viewerApi) return;
    const onSelect = () => setViewerIndex(viewerApi.selectedScrollSnap());
    viewerApi.on('reInit', onSelect);
    viewerApi.on('select', onSelect);
    return () => {
      viewerApi.off('reInit', onSelect);
      viewerApi.off('select', onSelect);
    };
  }, [viewerApi]);

  useEffect(() => {
    if (viewerOpen && viewerApi) {
      viewerApi.scrollTo(viewerStartIndex, true);
    }
  }, [viewerOpen, viewerApi, viewerStartIndex]);

  const phoneOpts = useMemo(() => ({ loop: false, align: 'start' as const }), []);
  const viewerOpts = useMemo(
    () => ({ loop: allPhotos.length > 1, align: 'start' as const, startIndex: viewerStartIndex }),
    [allPhotos.length, viewerStartIndex],
  );

  if (allPhotos.length === 0) {
    return null;
  }

  function openViewer(index: number) {
    const safeIndex = Math.max(0, Math.min(index, allPhotos.length - 1));
    setViewerStartIndex(safeIndex);
    setViewerIndex(safeIndex);
    setViewerOpen(true);
  }

  const totalCount = allPhotos.length;
  const activeViewerPhoto = allPhotos[viewerIndex] ?? allPhotos[0];
  const coverPhoto = mosaicPhotos[0] ?? allPhotos[0];
  const secondaryPhotos = mosaicPhotos.slice(1, 5);

  return (
    <section aria-label={`${propertyName} photos`} data-slot="hero-gallery" className="relative">
      {/* Phone swipe gallery: never auto-advances (decision E4) */}
      <div className="relative md:hidden">
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
                  onClick={() => openViewer(index)}
                  aria-label={`View photo ${index + 1} of ${totalCount}: ${photo.alt}`}
                  className="relative block aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <Image
                    src={normalizeMediaSrc(photo.url)}
                    alt={photo.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 767px) 100vw, 1px"
                    className="object-cover"
                  />
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
              onClick={() => openViewer(0)}
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
                sizes="(min-width: 1280px) 512px, (min-width: 768px) 50vw, 1px"
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
                  onClick={() => openViewer(photoIndex)}
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
                    sizes="(min-width: 1280px) 256px, (min-width: 768px) 25vw, 1px"
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
              onClick={() => openViewer(0)}
              className="absolute right-3 bottom-3 min-h-11 gap-2 rounded-full border border-border bg-card/95 px-4 text-foreground shadow-sm backdrop-blur-sm hover:bg-card"
            >
              <ImagesIcon aria-hidden="true" className="size-4" />
              Show all photos
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Full-screen photo viewer */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-dvh max-h-dvh w-screen max-w-none flex-col justify-between gap-0 rounded-none border-0 bg-scrim p-0 text-on-scrim sm:max-w-none"
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 sm:px-6">
            <div className="min-w-0">
              <DialogTitle className="truncate font-heading text-base font-semibold text-on-scrim">
                {propertyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-on-scrim/80 tabular">
                {viewerIndex + 1} / {totalCount}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewerOpen(false)}
              aria-label="Close photo viewer"
              className="size-11 shrink-0 rounded-full text-on-scrim hover:bg-on-scrim/15 hover:text-on-scrim"
            >
              <XIcon aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center">
            <Carousel
              setApi={setViewerApi}
              opts={viewerOpts}
              aria-label={`${propertyName} full-screen photo viewer`}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {allPhotos.map((photo, index) => (
                  <CarouselItem key={`viewer-${photo.fileId}`} className="pl-0">
                    <div className="relative mx-auto h-[65dvh] w-full max-w-5xl px-4 sm:px-14">
                      <Image
                        src={normalizeMediaSrc(photo.url)}
                        alt={photo.alt}
                        fill
                        sizes="100vw"
                        priority={index === viewerStartIndex}
                        className="object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {totalCount > 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => viewerApi?.scrollPrev()}
                  aria-label="Previous photo"
                  className="absolute left-2 z-10 hidden size-11 rounded-full bg-card/90 text-foreground shadow-md hover:bg-card sm:inline-flex"
                >
                  <ChevronLeftIcon aria-hidden="true" className="size-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => viewerApi?.scrollNext()}
                  aria-label="Next photo"
                  className="absolute right-2 z-10 hidden size-11 rounded-full bg-card/90 text-foreground shadow-md hover:bg-card sm:inline-flex"
                >
                  <ChevronRightIcon aria-hidden="true" className="size-5" />
                </Button>
              </>
            ) : null}
          </div>

          <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] text-center sm:px-6">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="mx-auto max-w-2xl text-sm text-on-scrim/90"
            >
              {activeViewerPhoto?.alt ?? ''}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
