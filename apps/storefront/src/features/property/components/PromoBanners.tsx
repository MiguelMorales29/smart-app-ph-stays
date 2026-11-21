'use client';

import {
  BannerCarousel,
  type BannerCarouselLabels,
  type BannerSlide,
} from '@smartapp/ui/compositions/banner-carousel';
import Image from 'next/image';
import Link from 'next/link';

import { normalizeMediaSrc } from '../media-src';
import { resolveBannerHref, type ResolvedBannerItem } from '../property-rules';

const BANNER_LABELS: BannerCarouselLabels = {
  region: 'Promo banners',
  slideOf: (index, total) => `Promo banner ${index} of ${total}`,
  showBanner: (index) => `Show promo banner ${index}`,
  previous: 'Previous promo banner',
  next: 'Next promo banner',
  pause: 'Pause promo banners',
  play: 'Play promo banners',
};

export interface PromoBannersProps {
  readonly slug: string;
  readonly banners: readonly ResolvedBannerItem[];
  readonly seconds: number;
  readonly show?: { readonly index: number; readonly at: number } | undefined;
}

/** Promo banners (part 5): uses the ported BannerCarousel (2+ slides) or a still card (1 slide). */
export function PromoBanners({ slug, banners, seconds, show }: PromoBannersProps) {
  if (banners.length === 0) return null;

  const slides: BannerSlide[] = banners.map((banner) => {
    const href = resolveBannerHref(slug, banner.link);
    const isExternal = href !== null && /^https?:\/\//i.test(href);
    return {
      id: banner.id,
      src: normalizeMediaSrc(banner.url),
      alt: banner.alt,
      title: banner.title,
      description: banner.line,
      ...(href
        ? {
            action: {
              label: 'See details',
              link: isExternal ? (
                <a href={href} target="_blank" rel="noopener noreferrer" />
              ) : (
                <Link href={href} />
              ),
            },
          }
        : {}),
    };
  });

  return (
    <section aria-label="Promos" data-slot="promo-banners">
      <BannerCarousel
        slides={slides}
        seconds={seconds}
        sizes="(min-width: 1280px) 1024px, 100vw"
        labels={BANNER_LABELS}
        show={show}
        renderImage={({ src, alt, sizes, priority, className }) => (
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
        )}
      />
    </section>
  );
}
