'use client';

import { Button } from '@smartapp/ui/components/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { cn } from '@smartapp/ui/lib/utils';
import {
  BathIcon,
  BedDoubleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { normalizeMediaSrc } from '../media-src';
import { formatBedCount, formatGuestCount, type UnitDisplayCard } from '../property-rules';

export interface UnitQuickLookSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly slug: string;
  readonly card: UnitDisplayCard;
}

function formatBathrooms(count: number): string {
  return count === 1 ? '1 bath' : `${count} baths`;
}

/**
 * Unit quick look (D81): lazy-loaded sheet on phones / dialog on desktop showing a photo carousel
 * with per-photo descriptions, key facts (guests, beds, bathrooms, floor area), top 6 amenities,
 * clamped description with "Read more", price, and "Check dates" + "See full details" actions.
 */
export function UnitQuickLookSheet({ open, onOpenChange, slug, card }: UnitQuickLookSheetProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<ReadonlySet<number>>(() => new Set([0, 1]));
  const [expandedDesc, setExpandedDesc] = useState(false);

  const unitHref = `/${slug}/units/${card.targetUnitSlug}`;
  const photos = card.photos;
  const totalPhotos = photos.length;
  const carouselOpts = useMemo(
    () => ({ loop: totalPhotos > 1, align: 'start' as const }),
    [totalPhotos],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const next = api.selectedScrollSnap();
      setActiveIndex(next);
      setLoadedIndices((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(next);
        if (totalPhotos > 1) {
          nextSet.add((next + 1) % totalPhotos);
          nextSet.add((next - 1 + totalPhotos) % totalPhotos);
        }
        return nextSet;
      });
    };
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, totalPhotos]);

  const activePhoto = photos[activeIndex] ?? photos[0] ?? null;
  const trimmedDesc = card.description?.trim() ?? '';
  const shouldClampDesc = trimmedDesc.length > 150 || trimmedDesc.split('\n').length > 3;

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={card.title}
      description={card.factsLine}
      height="full"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={unitHref} onClick={() => onOpenChange(false)} />}
            className="min-h-12 gap-2"
          >
            <ExternalLinkIcon aria-hidden="true" className="size-4" />
            See full details
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={unitHref} onClick={() => onOpenChange(false)} />}
            className="min-h-12 gap-2 font-semibold"
          >
            <CalendarIcon aria-hidden="true" className="size-4" />
            Check dates
          </Button>
        </>
      }
    >
      <div data-slot="unit-quick-look" className="space-y-5 py-1">
        {totalPhotos > 0 ? (
          <div className="space-y-2">
            <div className="group/ql relative">
              <Carousel setApi={setApi} opts={carouselOpts} aria-label={`${card.title} photos`}>
                <CarouselContent className="-ml-0">
                  {photos.map((photo, index) => (
                    <CarouselItem key={photo.fileId} className="pl-0">
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
                        {loadedIndices.has(index) ? (
                          <Image
                            src={normalizeMediaSrc(photo.url)}
                            alt={photo.alt}
                            fill
                            sizes="(min-width: 768px) 620px, 100vw"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {totalPhotos > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Previous photo"
                    onClick={() => api?.scrollPrev()}
                    className="absolute top-1/2 left-2 z-10 hidden size-10 -translate-y-1/2 rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-xs hover:bg-card sm:inline-flex"
                  >
                    <ChevronLeftIcon aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Next photo"
                    onClick={() => api?.scrollNext()}
                    className="absolute top-1/2 right-2 z-10 hidden size-10 -translate-y-1/2 rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-xs hover:bg-card sm:inline-flex"
                  >
                    <ChevronRightIcon aria-hidden="true" className="size-4" />
                  </Button>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 bottom-2.5 rounded-full bg-scrim px-2.5 py-1 text-xs font-medium text-on-scrim tabular backdrop-blur-xs"
                  >
                    {activeIndex + 1} / {totalPhotos}
                  </span>
                </>
              ) : null}
            </div>

            {activePhoto ? (
              <p
                aria-live="polite"
                aria-atomic="true"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {activePhoto.alt}
              </p>
            ) : null}
          </div>
        ) : null}

        {card.priceText ? (
          <p className="font-heading text-xl font-semibold text-[var(--card-link,var(--property-10-text))] tabular">
            {card.priceText}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
            <UsersIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <dd className="truncate font-medium text-card-foreground">
              {card.kind === 'room' ? '1 guest / bed' : formatGuestCount(card.maxGuests)}
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
            <BedDoubleIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <dd className="truncate font-medium text-card-foreground">
              {formatBedCount(card.bedCount)}
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
            <BathIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <dd className="truncate font-medium text-card-foreground">
              {formatBathrooms(card.bathrooms)}
            </dd>
          </div>
          {card.floorAreaSqm ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
              <Maximize2Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <dd className="truncate font-medium text-card-foreground tabular">
                {card.floorAreaSqm} sqm
              </dd>
            </div>
          ) : null}
        </dl>

        {card.topAmenities.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">Top amenities</h3>
            <ul className="flex flex-wrap gap-2">
              {card.topAmenities.map((amenity) => (
                <li
                  key={amenity.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground"
                >
                  <SparklesIcon
                    aria-hidden="true"
                    className="size-3.5 text-[var(--card-link,var(--property-10-text))]"
                  />
                  <span>{amenity.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {trimmedDesc ? (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground">About this space</h3>
            <p
              className={cn(
                'text-sm leading-relaxed text-foreground',
                !expandedDesc && shouldClampDesc && 'line-clamp-3',
              )}
            >
              {trimmedDesc}
            </p>
            {shouldClampDesc ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setExpandedDesc((prev) => !prev)}
                aria-expanded={expandedDesc}
                className="min-h-10 px-0 font-semibold text-[var(--card-link,var(--property-10-text))]"
              >
                {expandedDesc ? 'Show less' : 'Read more'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppSheet>
  );
}
