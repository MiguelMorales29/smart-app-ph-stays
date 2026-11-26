import { DEMO_IDS, calendarDate, centavos, fixedClock } from '@smartapp/core';
import { clearMemoryUploads, getDataSource, registerMemoryUploadUrl } from '@smartapp/data';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

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

  it('renders full-width sections, unit photo carousels, Show all button and official trust panel on Ulap Suites', async () => {
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
    expect(html).toContain('data-slot="property-section-tabs"');
    expect(html).not.toContain('data-slot="property-booking-card"');
    expect(html).toContain('data-slot="property-announcement"');
    expect(html).toContain('data-slot="hero-gallery"');
    expect(html).toContain('data-slot="promo-banners"');
    expect(html).toContain('data-slot="units-section"');
    expect(html).toContain('data-slot="unit-photo-carousel"');
    expect(html).toContain('Show all 6 units');
    expect(html).toContain('data-slot="highlights-section"');
    expect(html).toContain('data-slot="about-host-section"');
    expect(html).toContain('Hosting since');
    expect(html).toContain('data-slot="rules-section"');
    expect(html).toContain('IDs are asked before arrival');
    expect(html).toContain('Exact address is shared after payment');
    expect(html).toContain('data-slot="times-section"');
    expect(html).toContain('data-slot="faq-section"');
    expect(html).toContain('This is the official page for Ulap Suites');
    expect(html).toContain('smartapp.webserbisyo.com/ulap-suites');
    expect(html).toContain('personal GCash or bank account in chat or by text');
    expect(html).toContain('Report this page');
    expect(html).not.toContain('/ulap-suites/inquire');
    // Default unitCardAutoplay is false, so no section Pause button renders in Units.
    expect(html).not.toContain('>Pause<');

    if (ulap.property.address_line) {
      expect(html).not.toContain(ulap.property.address_line);
    }
  }, 15_000);

  it('wires look.unitCardAutoplay to the Units section and keeps autoplay off on SSR under reduced motion', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const ulap = await loadProperty('ulap-suites');
    const published = ulap.page.published;
    if (!published) throw new Error('Expected published page');

    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: {
          ...ulap,
          page: {
            ...ulap.page,
            published: {
              ...published,
              look: {
                ...published.look,
                unitCardAutoplay: true,
                unitCardSeconds: 5,
              },
            },
          },
        },
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('data-unit-autoplay="on"');
  });

  it('renders room cards (not individual beds) and honours hidden sections on Tita Lorna Dorm', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const lorna = await loadProperty('tita-lorna-dorm');
    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: lorna,
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('Tita Lorna');
    expect(html).toContain('data-slot="room-card"');
    expect(html).toContain('Room 2A');
    expect(html).toContain('Ladies · 4 beds');
    expect(html).toContain('Room 3B');
    expect(html).toContain('Gents · 6 beds');
    expect(html).toContain('a month');
    expect(html).not.toContain('data-slot="property-announcement"');
    expect(html).not.toContain('data-slot="promo-banners"');
    expect(html).not.toContain('data-slot="faq-section"');
  });

  it('shows the empty-units state with a Message button (no /inquire) and surfaces payment-account warnings', async () => {
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
    expect(html).toContain('Message');
    expect(html).not.toContain('/ulap-suites/inquire');
    expect(html).toContain('changed in the last 7 days');
  });

  afterEach(() => {
    clearMemoryUploads();
  });

  it('renders an owner-added unit and its uploaded photos on the storefront unit card (FIX-1 B & J)', async () => {
    const { PropertyPageView } = await import('./PropertyPageView');
    const clock = fixedClock('2026-12-10T10:00:00+08:00');
    const source = await getDataSource({
      adapter: 'memory',
      pack: 'qa',
      clock,
      storefrontOrigin: '',
    });
    const session = {
      role: 'owner' as const,
      accountId: DEMO_IDS.ulapSuites.account,
      profileId: DEMO_IDS.people.owners.ulapSuites,
    };

    const created = await source.saveUnit(
      {
        idempotencyKey: 'sf-fix1-unit',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: null,
        expectedUpdatedAt: null,
        name: 'Sunrise Balcony Studio',
        slug: 'sunrise-balcony-studio',
        mode: 'short_stay',
        unitType: 'entire_place',
        roomId: null,
        description: 'Morning sun over the ridge.',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        floorAreaSqm: 28,
        arrivalInfo: null,
        amenityIds: [DEMO_IDS.amenities.wifi],
        stayTerms: {
          base_nightly_centavos: centavos(310_000),
          base_guests: 2,
          min_nights: 1,
          max_nights: 14,
          prep_nights: 0,
          weekly_discount_percent: 0,
          monthly_discount_percent: 0,
          down_payment_percent: 30,
          hold_minutes: 60,
          advance_notice_days: 0,
          booking_window_days: 365,
        },
        leaseTerms: null,
      },
      session,
    );
    if (!created.ok) throw new Error(created.error.message);

    const dataUrl = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const fileIds: string[] = [];
    for (let i = 1; i <= 3; i += 1) {
      const slot = await source.requestUpload(
        {
          idempotencyKey: `sf-fix1-req-${i}`,
          accountId: DEMO_IDS.ulapSuites.account,
          purpose: 'unit_photo',
          mime: 'image/webp',
          sizeBytes: 24_000,
          width: 1200,
          height: 900,
          filename: `sunrise-${i}.webp`,
        },
        session,
      );
      if (!slot.ok) throw new Error(slot.error.message);
      registerMemoryUploadUrl(slot.data.file.id, dataUrl);
      const confirmed = await source.confirmUpload(
        {
          idempotencyKey: `sf-fix1-conf-${i}`,
          accountId: DEMO_IDS.ulapSuites.account,
          fileId: slot.data.file.id,
          width: 1200,
          height: 900,
          usedByTable: 'listing_photos',
          usedById: created.data.unit.id,
        },
        session,
      );
      if (!confirmed.ok) throw new Error(confirmed.error.message);
      fileIds.push(slot.data.file.id);
    }

    const savedPhotos = await source.saveListingPhotos(
      {
        idempotencyKey: 'sf-fix1-photos',
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: created.data.unit.id,
        photos: fileIds.map((fileId, idx) => ({ fileId, altText: `Sunrise photo ${idx + 1}` })),
      },
      session,
    );
    if (!savedPhotos.ok) throw new Error(savedPhotos.error.message);

    const listed = await source.setUnitStatus(
      {
        idempotencyKey: 'sf-fix1-list',
        accountId: DEMO_IDS.ulapSuites.account,
        unitId: created.data.unit.id,
        status: 'listed',
        expectedUpdatedAt: created.data.unit.updated_at,
      },
      session,
    );
    if (!listed.ok) throw new Error(listed.error.message);

    const propRes = await source.getProperty({ slug: 'ulap-suites' }, { role: 'guest' });
    if (!propRes.ok) throw new Error(propRes.error.message);

    const html = renderToStaticMarkup(
      createElement(PropertyPageView, {
        propertyView: propRes.data,
        today: calendarDate('2026-12-10'),
      }),
    );

    expect(html).toContain('Sunrise Balcony Studio');
    expect(html).toContain(dataUrl);
  });
});
