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
import { Scroller } from '@smartapp/ui/components/scroller';
import { cn } from '@smartapp/ui/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon, Grid2x2Icon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import type { ResolvedPhotoGroup, ResolvedPropertyPhoto } from '../property-rules';

export interface HeroPhotoViewerModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialMode: 'carousel' | 'grid';
  readonly startIndex: number;
  readonly propertyName: string;
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
}

function buildPhotoGroups(
  allPhotos: readonly ResolvedPropertyPhoto[],
): readonly ResolvedPhotoGroup[] {
  const groups: {
    id: string;
    label: string;
    startIndex: number;
    photos: ResolvedPropertyPhoto[];
  }[] = [];
  const byId = new Map<string, (typeof groups)[number]>();

  allPhotos.forEach((photo, index) => {
    const existing = byId.get(photo.groupId);
    if (existing) {
      existing.photos.push(photo);
    } else {
      const created = {
        id: photo.groupId,
        label: photo.groupLabel,
        startIndex: index,
        photos: [photo],
      };
      byId.set(photo.groupId, created);
      groups.push(created);
    }
  });

  return groups;
}

/** Lazy-loaded full-screen photo viewer (grouped-by-unit overview + swipe carousel). */
export function HeroPhotoViewerModal({
  open,
  onOpenChange,
  initialMode,
  startIndex,
  propertyName,
  allPhotos,
}: HeroPhotoViewerModalProps) {
  const photoGroups = useMemo(() => buildPhotoGroups(allPhotos), [allPhotos]);
  const [viewerMode, setViewerMode] = useState<'carousel' | 'grid'>(initialMode);
  const [viewerStartIndex, setViewerStartIndex] = useState(startIndex);
  const [viewerIndex, setViewerIndex] = useState(startIndex);
  const [viewerApi, setViewerApi] = useState<CarouselApi>();

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
    if (open && viewerMode === 'carousel' && viewerApi) {
      viewerApi.scrollTo(viewerStartIndex, true);
    }
  }, [open, viewerMode, viewerApi, viewerStartIndex]);

  const viewerOpts = useMemo(
    () => ({ loop: allPhotos.length > 1, align: 'start' as const, startIndex: viewerStartIndex }),
    [allPhotos.length, viewerStartIndex],
  );

  const totalCount = allPhotos.length;
  const activeViewerPhoto = allPhotos[viewerIndex] ?? allPhotos[0];
  const hasMultipleGroups = photoGroups.length > 1;

  function openCarouselAt(index: number) {
    const safeIndex = Math.max(0, Math.min(index, allPhotos.length - 1));
    setViewerStartIndex(safeIndex);
    setViewerIndex(safeIndex);
    setViewerMode('carousel');
  }

  function jumpToGroup(group: ResolvedPhotoGroup) {
    setViewerStartIndex(group.startIndex);
    setViewerIndex(group.startIndex);
    setViewerMode('carousel');
    viewerApi?.scrollTo(group.startIndex, false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex h-dvh max-h-dvh w-screen max-w-none flex-col justify-between gap-0 rounded-none border-0 p-0 sm:max-w-none',
          viewerMode === 'grid' ? 'bg-background text-foreground' : 'bg-scrim text-on-scrim',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 sm:px-6',
            viewerMode === 'grid' && 'border-b border-border bg-card',
          )}
        >
          <div className="min-w-0">
            <DialogTitle
              className={cn(
                'truncate font-heading text-base font-semibold',
                viewerMode === 'grid' ? 'text-foreground' : 'text-on-scrim',
              )}
            >
              {viewerMode === 'grid'
                ? `All photos · ${propertyName}`
                : (activeViewerPhoto?.groupLabel ?? propertyName)}
            </DialogTitle>
            <DialogDescription
              className={cn(
                'text-xs tabular',
                viewerMode === 'grid' ? 'text-muted-foreground' : 'text-on-scrim/80',
              )}
            >
              {viewerMode === 'grid'
                ? `${totalCount} photos across ${photoGroups.length} ${photoGroups.length === 1 ? 'section' : 'sections'}`
                : `${viewerIndex + 1} / ${totalCount}`}
            </DialogDescription>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasMultipleGroups ? (
              <Button
                type="button"
                variant={viewerMode === 'grid' ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setViewerMode((prev) => (prev === 'grid' ? 'carousel' : 'grid'))}
                className={cn(
                  'min-h-11 gap-1.5 rounded-full px-3',
                  viewerMode === 'carousel' &&
                    'text-on-scrim hover:bg-on-scrim/15 hover:text-on-scrim',
                )}
              >
                <Grid2x2Icon aria-hidden="true" className="size-4" />
                <span>{viewerMode === 'grid' ? 'Slide view' : 'By unit'}</span>
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close photo viewer"
              className={cn(
                'size-11 shrink-0 rounded-full',
                viewerMode === 'carousel' &&
                  'text-on-scrim hover:bg-on-scrim/15 hover:text-on-scrim',
              )}
            >
              <XIcon aria-hidden="true" className="size-5" />
            </Button>
          </div>
        </div>

        {viewerMode === 'grid' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] sm:px-6">
            <div className="mx-auto max-w-5xl space-y-8">
              {photoGroups.map((group) => (
                <section
                  key={group.id}
                  aria-labelledby={`photo-group-${group.id}`}
                  className="space-y-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      id={`photo-group-${group.id}`}
                      className="font-heading text-lg font-semibold text-foreground"
                    >
                      {group.label}
                    </h3>
                    <span className="text-xs text-muted-foreground tabular">
                      {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                    {group.photos.map((photo, localIdx) => {
                      const absoluteIdx = group.startIndex + localIdx;
                      return (
                        <button
                          key={photo.fileId}
                          type="button"
                          onClick={() => openCarouselAt(absoluteIdx)}
                          aria-label={`Open ${group.label} photo ${localIdx + 1}: ${photo.alt}`}
                          className="group relative aspect-4/3 overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring"
                        >
                          <Image
                            src={normalizeMediaSrc(photo.url)}
                            alt={photo.alt}
                            fill
                            loading="lazy"
                            sizes="(min-width: 768px) 240px, 46vw"
                            className="object-cover transition-transform duration-base ease-enter hover-hover:group-hover:scale-[1.03]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <>
            {hasMultipleGroups ? (
              <div className="px-4 pb-2 sm:px-6">
                <Scroller orientation="horizontal" hideScrollbar className="mx-auto max-w-5xl">
                  <div className="flex w-max items-center gap-1.5 py-1">
                    {photoGroups.map((group) => {
                      const isActive = activeViewerPhoto?.groupId === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => jumpToGroup(group)}
                          className={cn(
                            'min-h-9 rounded-full px-3 text-xs font-medium outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                              ? 'bg-card text-foreground'
                              : 'bg-on-scrim/15 text-on-scrim hover:bg-on-scrim/25',
                          )}
                        >
                          {group.label} ({group.photos.length})
                        </button>
                      );
                    })}
                  </div>
                </Scroller>
              </div>
            ) : null}

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
                      <div className="relative mx-auto h-[62dvh] w-full max-w-5xl px-4 sm:px-14">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
