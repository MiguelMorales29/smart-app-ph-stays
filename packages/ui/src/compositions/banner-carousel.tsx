'use client';

import { lazy, Suspense, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';

export interface BannerImageRenderProps {
  readonly src: string;
  readonly alt: string;
  readonly sizes: string;
  readonly priority: boolean;
  readonly className: string;
}

export interface BannerSlide {
  readonly id?: string | undefined;
  readonly src: string;
  readonly alt: string;
  readonly title?: string | null | undefined;
  readonly description?: string | null | undefined;
  /** Editor preview slot so the owner can edit copy directly on the preview (P5-5). */
  readonly titleSlot?: ReactNode | undefined;
  readonly descriptionSlot?: ReactNode | undefined;
  /** App-provided link element (e.g. Next `<Link>`); `packages/ui` never imports a router. */
  readonly action?: { readonly label: string; readonly link: ReactElement } | undefined;
}

export interface BannerCarouselLabels {
  readonly region: string;
  readonly slideOf: (index: number, total: number) => string;
  readonly showBanner: (index: number) => string;
  readonly previous: string;
  readonly next: string;
  readonly pause: string;
  readonly play: string;
}

export interface BannerCarouselProps {
  readonly slides: readonly BannerSlide[];
  /** Whether 2+ slides advance automatically (owner option, default true). */
  readonly autoplay?: boolean | undefined;
  /** Seconds per slide, set by the owner (3 to 10, default 5). */
  readonly seconds?: number | undefined;
  readonly sizes?: string | undefined;
  readonly labels: BannerCarouselLabels;
  readonly renderImage?: ((props: BannerImageRenderProps) => ReactNode) | undefined;
  readonly className?: string | undefined;
  /** Moves to a specific slide when the Page Editor preview selects a banner (`at` retriggers). */
  readonly show?: { readonly index: number; readonly at: number } | undefined;
}

export const BANNER_TRACK = '-ml-3 flex';
export const BANNER_SLIDE = 'min-w-0 shrink-0 grow-0 basis-full pl-3';

export interface BannerFrameProps {
  readonly slide: BannerSlide;
  readonly sizes: string;
  readonly priority?: boolean | undefined;
  /** The active slide zooms gently to 104% while its timer runs (zero under reduced motion). */
  readonly zoom?: boolean | undefined;
  readonly renderImage?: ((props: BannerImageRenderProps) => ReactNode) | undefined;
}

function defaultRenderImage({ src, alt, sizes, priority, className }: BannerImageRenderProps) {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}

/** One promo banner: 16:9 image with an optional scrim overlay for title, one-line copy and action. */
export function BannerFrame({
  slide,
  sizes,
  priority = false,
  zoom = false,
  renderImage = defaultRenderImage,
}: BannerFrameProps) {
  const { action } = slide;
  const title = slide.titleSlot ?? slide.title;
  const description = slide.descriptionSlot ?? slide.description;
  const hasCopy = Boolean(title || description || action);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-property-10-soft md:aspect-21/9">
      {renderImage({
        src: slide.src,
        alt: slide.alt,
        sizes,
        priority,
        className: cn('size-full object-cover', zoom && 'banner-zoom'),
      })}
      {hasCopy ? (
        <div className="absolute inset-0 flex items-end bg-linear-to-t from-scrim via-scrim/45 to-transparent to-70% p-4 text-on-scrim sm:p-5 md:p-6">
          <div className="banner-copy flex max-w-xl flex-col items-start gap-1">
            {title ? (
              <p
                className={cn(
                  'font-heading text-base leading-tight font-semibold tracking-tight text-balance sm:text-lg md:text-2xl',
                  !slide.titleSlot && 'line-clamp-2',
                )}
              >
                {title}
              </p>
            ) : null}
            {description ? (
              <p
                className={cn(
                  'text-sm leading-snug text-on-scrim/90 md:text-base',
                  !slide.descriptionSlot && 'line-clamp-1 md:line-clamp-2',
                )}
              >
                {description}
              </p>
            ) : null}
            {action ? (
              <Button
                size="lg"
                className="mt-1.5 min-h-11 rounded-full pr-3 pl-4 md:mt-2"
                nativeButton={false}
                render={action.link}
              >
                {action.label}
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Loaded only for 2+ slides so single-banner pages never download Embla or autoplay code.
const BannerCarouselSlides = lazy(() => import('./banner-carousel-slides'));

export function BannerCarousel(props: BannerCarouselProps) {
  const { slides, sizes = '(min-width: 1280px) 1024px, 100vw', renderImage } = props;
  const [ready, setReady] = useState(false);
  const many = slides.length > 1;

  useEffect(() => {
    if (!many) return;
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, [many]);

  const first = slides[0];
  if (!first) return null;

  const renderFrame = (slide: BannerSlide, index: number) => (
    <BannerFrame slide={slide} sizes={sizes} priority={index === 0} renderImage={renderImage} />
  );

  if (!many) {
    return (
      <div data-slot="banner-carousel-single" className={props.className}>
        {renderFrame(first, 0)}
      </div>
    );
  }

  // Height-matched static placeholder while the lazy carousel chunk loads, preventing CLS.
  const still = (
    <div data-slot="banner-carousel-loading" className={cn('flex flex-col gap-3', props.className)}>
      <div className="overflow-hidden">
        <div className={BANNER_TRACK}>
          {slides.slice(0, 2).map((slide, index) => (
            <div
              key={slide.id ?? `${index}-${slide.alt}`}
              data-banner-slide=""
              data-active={index === 0 ? '' : undefined}
              className={BANNER_SLIDE}
            >
              {renderFrame(slide, index)}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="min-h-7" />
    </div>
  );

  if (!ready) return still;

  return (
    <Suspense fallback={still}>
      <BannerCarouselSlides {...props} sizes={sizes} />
    </Suspense>
  );
}
