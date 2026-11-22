import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BannerCarousel, type BannerCarouselLabels, type BannerSlide } from './banner-carousel';

const LABELS: BannerCarouselLabels = {
  region: 'Promo banners',
  slideOf: (index, total) => `Banner ${index} of ${total}`,
  showBanner: (index) => `Show banner ${index}`,
  previous: 'Previous banner',
  next: 'Next banner',
  pause: 'Pause banners',
  play: 'Play banners',
};

const SLIDE_A: BannerSlide = {
  id: 'a',
  src: '/demo-media/ulap-suites/banners/banner-1.webp',
  alt: 'Taal sunrise balcony',
  title: 'Weekday getaway',
  description: 'Save 10% on 7-night stays.',
};

const SLIDE_B: BannerSlide = {
  id: 'b',
  src: '/demo-media/ulap-suites/banners/banner-2.webp',
  alt: 'Projector movie night',
  title: 'Movie night ready',
  description: 'Cozy studio with fiber Wi-Fi.',
};

describe('BannerCarousel', () => {
  it('renders nothing when slides is empty', () => {
    const html = renderToStaticMarkup(
      createElement(BannerCarousel, { slides: [], labels: LABELS }),
    );
    expect(html).toBe('');
  });

  it('renders a single still card without carousel dot controls when given 1 slide', () => {
    const html = renderToStaticMarkup(
      createElement(BannerCarousel, { slides: [SLIDE_A], labels: LABELS }),
    );
    expect(html).toContain('data-slot="banner-carousel-single"');
    expect(html).toContain('Weekday getaway');
    expect(html).toContain('Taal sunrise balcony');
    expect(html).not.toContain('Pause banners');
    expect(html).not.toContain('data-slot="banner-carousel-loading"');
  });

  it('renders a height-matched static track with slide 0 only on SSR for 2+ slides before lazy hydration', () => {
    const html = renderToStaticMarkup(
      createElement(BannerCarousel, { slides: [SLIDE_A, SLIDE_B], labels: LABELS }),
    );
    expect(html).toContain('data-slot="banner-carousel-loading"');
    expect(html).toContain('Weekday getaway');
    expect(html).not.toContain('Movie night ready');
  });
});
