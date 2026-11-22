import { calendarDate, fixedClock } from '@smartapp/core';
import { getDataSource } from '@smartapp/data';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

async function loadProperty(slug: string, pack: 'marketing' | 'qa' = 'marketing') {
  const clock = fixedClock('2026-12-10T10:00:00+08:00');
  const source = await getDataSource({
    adapter: 'memory',
    pack,
    clock,
    storefrontOrigin: '',
  });
  const res = await source.getProperty({ slug }, { role: 'guest' });
  if (!res.ok) {
    throw new Error(`Expected ${slug} to load, got ${res.error.code}`);
  }
  return res.data;
}

describe('PropertyPageView', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_ENV = 'development';
    process.env.NEXT_PUBLIC_DATA_SOURCE = 'memory';
    process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN = '';
  });

  it('renders all enabled sections on Ulap Suites without exposing the exact street address', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const ulap = await loadProperty('ulap-suites');
    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: ulap,
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('Ulap Suites');
    expect(html).toContain('Verified owner');
    expect(html).toContain('data-slot="property-announcement"');
    expect(html).toContain('data-slot="hero-gallery"');
    expect(html).toContain('data-slot="promo-banners"');
    expect(html).toContain('data-slot="units-section"');
    expect(html).toContain('data-slot="highlights-section"');
    expect(html).toContain('data-slot="about-host-section"');
    expect(html).toContain('Hosting since');
    expect(html).toContain('data-slot="rules-section"');
    expect(html).toContain('IDs are asked before arrival');
    expect(html).toContain('Exact address is shared after payment');
    expect(html).toContain('data-slot="times-section"');
    expect(html).toContain('data-slot="faq-section"');
    expect(html).toContain('Pay only to the accounts shown in your booking conversation.');
    expect(html).toContain('Report this page');

    if (ulap.property.address_line) {
      expect(html).not.toContain(ulap.property.address_line);
    }
  }, 15_000);

  it('honours hidden sections on Tita Lorna Dorm and formats monthly rentals', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const lorna = await loadProperty('tita-lorna-dorm');
    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: lorna,
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('Tita Lorna');
    expect(html).toContain('a month');
    expect(html).not.toContain('data-slot="property-announcement"');
    expect(html).not.toContain('data-slot="promo-banners"');
    expect(html).not.toContain('data-slot="faq-section"');
  });

  it('shows the empty-units state with a Message link and surfaces recent payment-account warnings', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const ulap = await loadProperty('ulap-suites');
    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: {
          ...ulap,
          units: [],
          trust: {
            ...ulap.trust,
            payment_accounts_changed_recently: true,
          },
        },
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('No units listed yet');
    expect(html).toContain('/ulap-suites/inquire');
    expect(html).toContain('changed in the last 7 days');
  });
});
