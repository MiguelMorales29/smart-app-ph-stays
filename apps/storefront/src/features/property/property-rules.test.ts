import { calendarDate, fixedClock, resolveDemoWorld } from '@smartapp/core';
import { getDataSource } from '@smartapp/data';
import { describe, expect, it } from 'vitest';

import {
  buildUnitDisplayCards,
  computeStartingPrice,
  formatAreaLabel,
  formatSpecialDays,
  formatWallTime12h,
  formatWeeklyHoursSummary,
  groupDisplayCardsByMode,
  groupUnitsByMode,
  guestCancellationCopy,
  isAnnouncementActive,
  officialPropertyAddress,
  orderUnitsForProperty,
  pickNextAutoplayCardId,
  resolveBannerHref,
  resolveContactLinks,
  resolveHeroPhotos,
  resolvePrimaryCtaTarget,
  resolvePropertyNavItems,
  resolvePropertySections,
} from './property-rules';

async function loadDemoProperty(slug: string, pack: 'marketing' | 'qa' = 'marketing') {
  const clock = fixedClock('2026-12-10T10:00:00+08:00');
  const source = await getDataSource({
    adapter: 'memory',
    pack,
    clock,
    storefrontOrigin: '',
  });
  const res = await source.getProperty({ slug }, { role: 'guest' });
  if (!res.ok) {
    throw new Error(`Expected ${slug} in ${pack} pack to load, got ${res.error.code}`);
  }
  return res.data;
}

describe('property-rules', () => {
  it('hides announcements after their end date at Manila midnight and keeps them on the end date', () => {
    const announcement = {
      text: 'Weekend promo',
      tone: 'info' as const,
      endDate: calendarDate('2026-12-10'),
    };
    expect(isAnnouncementActive(announcement, calendarDate('2026-12-09'))).toBe(true);
    expect(isAnnouncementActive(announcement, calendarDate('2026-12-10'))).toBe(true);
    expect(isAnnouncementActive(announcement, calendarDate('2026-12-11'))).toBe(false);
    expect(
      isAnnouncementActive({ ...announcement, endDate: null }, calendarDate('2027-01-01')),
    ).toBe(true);
  });

  it('honours look.sections show/hide switches and derives visible section nav items', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');
    const today = calendarDate('2026-12-10');

    const ulapVis = resolvePropertySections(ulap, today);
    expect(ulapVis).toEqual({
      announcement: true,
      banners: true,
      about: true,
      units: true,
      highlights: true,
      rules: true,
      location: true,
      times: true,
      faq: true,
    });
    expect(resolvePropertyNavItems(ulapVis).map((item) => item.id)).toEqual([
      'units',
      'about',
      'rules',
      'location',
      'faq',
    ]);

    const lornaVis = resolvePropertySections(lorna, today);
    expect(lornaVis).toEqual({
      announcement: false,
      banners: false,
      about: true,
      units: true,
      highlights: true,
      rules: true,
      location: true,
      times: true,
      faq: false,
    });
    expect(resolvePropertyNavItems(lornaVis).map((item) => item.id)).toEqual([
      'units',
      'about',
      'rules',
      'location',
    ]);

    if (ulap.page.published) {
      const hiddenRulesView = {
        ...ulap,
        page: {
          ...ulap.page,
          published: {
            ...ulap.page.published,
            look: {
              ...ulap.page.published.look,
              sections: {
                ...ulap.page.published.look.sections,
                rules: false,
                faq: false,
              },
            },
          },
        },
      };
      const visibility = resolvePropertySections(hiddenRulesView, today);
      expect(visibility.rules).toBe(false);
      expect(visibility.faq).toBe(false);
      expect(resolvePropertyNavItems(visibility).map((item) => item.id)).toEqual([
        'units',
        'about',
        'location',
      ]);
    }
  });

  it('uses page_media.hero_cover directly and groups gallery photos by property and unit/room', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');
    const hero = resolveHeroPhotos(ulap);

    expect(hero.cover).not.toBeNull();
    expect(hero.cover?.fileId).toBe(ulap.page_media.hero_cover?.file_id);
    expect(hero.mosaicPhotos[0]?.fileId).toBe(ulap.page_media.hero_cover?.file_id);
    expect(hero.mosaicPhotos.length).toBeLessThanOrEqual(5);
    expect(new Set(hero.allPhotos.map((p) => p.fileId)).size).toBe(hero.allPhotos.length);
    expect(hero.photoGroups.length).toBeGreaterThan(1);
    expect(hero.photoGroups[0]?.label).toBe('Ulap Suites');

    const lornaHero = resolveHeroPhotos(lorna);
    const groupLabels = lornaHero.photoGroups.map((g) => g.label);
    expect(groupLabels).toContain('Room 2A');
    expect(groupLabels).toContain('Room 3B');
    // Room 2A beds share one photo group rather than repeating 4 identical bed groups.
    expect(groupLabels.filter((label) => label === 'Room 2A')).toHaveLength(1);
  });

  it('groups bed spaces into one card per room without unbacked free counts, and keeps whole units individual', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');

    const lornaOrdered = orderUnitsForProperty(lorna.units, lorna.page.published?.units ?? []);
    const lornaCards = buildUnitDisplayCards(
      lornaOrdered,
      lorna.amenities,
      lorna.page.published?.highlights ?? [],
    );

    expect(lornaCards).toHaveLength(2);
    expect(lornaCards[0]).toMatchObject({
      kind: 'room',
      title: 'Room 2A',
      targetUnitSlug: 'room-2a-bed-1',
      factsLine: 'Ladies · 4 beds · Shared bathroom',
      bedCount: 4,
    });
    expect(lornaCards[0]?.factsLine).not.toContain('free');
    expect(lornaCards[0]?.priceText).toMatch(/^from ₱[\d,]+ a month$/);

    expect(lornaCards[1]).toMatchObject({
      kind: 'room',
      title: 'Room 3B',
      targetUnitSlug: 'room-3b-bed-1',
      factsLine: 'Gents · 6 beds · Shared bathroom',
      bedCount: 6,
    });

    const ulapOrdered = orderUnitsForProperty(ulap.units, ulap.page.published?.units ?? []);
    const ulapCards = buildUnitDisplayCards(
      ulapOrdered,
      ulap.amenities,
      ulap.page.published?.highlights ?? [],
    );
    expect(ulapCards).toHaveLength(ulap.units.length);
    expect(ulapCards[0]?.kind).toBe('unit');
    expect(ulapCards[0]?.factsLine).toContain('Whole place');
    expect(ulapCards[0]?.highlightChip).not.toBeNull();
    expect(ulapCards[0]?.topAmenities.length).toBeGreaterThan(0);
    expect(ulapCards[0]?.topAmenities.length).toBeLessThanOrEqual(6);

    // Every Ulap Suites unit's cover photo is a bedroom or living-room photo, never a bathroom.
    for (const card of ulapCards) {
      expect(card.coverAlt.toLowerCase()).not.toContain('bathroom');
    }

    // Staggered autoplay advances one visible card at a time in round-robin order.
    expect(pickNextAutoplayCardId(['a', 'b', 'c'], null)).toBe('a');
    expect(pickNextAutoplayCardId(['a', 'b', 'c'], 'a')).toBe('b');
    expect(pickNextAutoplayCardId(['a', 'b', 'c'], 'c')).toBe('a');
    expect(pickNextAutoplayCardId(['b', 'c'], 'a')).toBe('b');
    expect(pickNextAutoplayCardId([], 'a')).toBeNull();

    const mixed = groupDisplayCardsByMode([ulapCards[0]!, lornaCards[0]!]);
    expect(mixed.grouped).toBe(true);
    if (mixed.grouped) {
      expect(mixed.stays).toHaveLength(1);
      expect(mixed.rentals).toHaveLength(1);
    }
  });

  it('orders featured units first and groups Stays and Monthly rentals only when both exist', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');

    const ulapFeatured = ulap.page.published?.units ?? [];
    const orderedUlap = orderUnitsForProperty(ulap.units, ulapFeatured);
    expect(orderedUlap.slice(0, ulapFeatured.length).map((u) => u.id)).toEqual(ulapFeatured);

    const ulapGrouped = groupUnitsByMode(orderedUlap);
    expect(ulapGrouped.grouped).toBe(false);

    const mixed = groupUnitsByMode([orderedUlap[0]!, lorna.units[0]!]);
    expect(mixed.grouped).toBe(true);
    if (mixed.grouped) {
      expect(mixed.stays).toHaveLength(1);
      expect(mixed.rentals).toHaveLength(1);
    }
  });

  it('computes starting prices for nightly stays and monthly rentals', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');

    const ulapPrice = computeStartingPrice(ulap.units);
    expect(ulapPrice?.suffix).toBe('a night');
    expect(ulapPrice?.formatted).toMatch(/^from ₱[\d,]+ a night$/);

    const lornaPrice = computeStartingPrice(lorna.units);
    expect(lornaPrice?.suffix).toBe('a month');
    expect(lornaPrice?.formatted).toMatch(/^from ₱[\d,]+ a month$/);

    expect(computeStartingPrice([])).toBeNull();
  });

  it('formats area-only location without exact address (E7) and official web address (D77)', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const area = formatAreaLabel(ulap.property);
    expect(area).toBe(`${ulap.property.city}, ${ulap.property.province}`);
    if (ulap.property.address_line) {
      expect(area).not.toContain(ulap.property.address_line);
    }
    expect(officialPropertyAddress('ulap-suites')).toBe('smartapp.webserbisyo.com/ulap-suites');
  });

  it('formats Manila wall times and weekly hours in plain words', () => {
    expect(formatWallTime12h('14:00')).toBe('2:00 PM');
    expect(formatWallTime12h('12:00')).toBe('12:00 PM');
    expect(formatWallTime12h('09:30')).toBe('9:30 AM');

    const hours = {
      mon: [{ start: '09:00', end: '18:00' }],
      tue: [{ start: '09:00', end: '18:00' }],
      wed: [{ start: '09:00', end: '18:00' }],
      thu: [{ start: '09:00', end: '18:00' }],
      fri: [{ start: '09:00', end: '18:00' }],
      sat: [{ start: '09:00', end: '18:00' }],
      sun: [],
    };
    expect(formatWeeklyHoursSummary(hours, 'reply')).toBe('Replies 9 AM–6 PM, Mon–Sat');
    expect(formatWeeklyHoursSummary(null, 'reply')).toBe('Replies any time');
    expect(formatWeeklyHoursSummary(null, 'viewing')).toBeNull();
  });

  it('formats guest-facing cancellation presets and contact links cleanly (including SMS option)', () => {
    expect(
      guestCancellationCopy({
        cancellation_preset: 'dp_rebook',
        cancellation_note: null,
        rebook_min_days: 7,
        rebook_within_months: 6,
      }).summary,
    ).toContain('7 days before check-in');

    const baseContact = {
      phone: '+63 917 000 0101',
      messenger: 'https://m.me/ulapsuites',
      facebook: null,
      instagram: null,
      tiktok: null,
      viber: '+639170000101',
      whatsapp: null,
      google_review_url: 'https://g.page/r/example',
    };

    const links = resolveContactLinks(baseContact);
    expect(links.map((l) => l.label)).toEqual(['Call', 'Messenger', 'Viber']);
    expect(links[0]?.href).toBe('tel:+639170000101');

    const withSms = resolveContactLinks(baseContact, { includeSms: true });
    expect(withSms.map((l) => l.label)).toEqual(['Call', 'Text (SMS)', 'Messenger', 'Viber']);
    expect(withSms[1]?.href).toBe('sms:+639170000101');
  });

  it('points Check dates to the single unit or #units for multiple units', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const bahay = await loadDemoProperty('bahay-batis');

    expect(resolvePrimaryCtaTarget('ulap-suites', ulap.units)).toBe('#units');
    expect(resolvePrimaryCtaTarget('bahay-batis', bahay.units)).toBe(
      `/bahay-batis/units/${bahay.units[0]?.slug}`,
    );
    expect(resolvePrimaryCtaTarget('ulap-suites', [])).toBeNull();
    expect(resolveBannerHref('ulap-suites', '/units/studio-fog')).toBe(
      '/ulap-suites/units/studio-fog',
    );
    expect(resolveBannerHref('ulap-suites', '/ulap-suites/units/studio-fog')).toBe(
      '/ulap-suites/units/studio-fog',
    );
    expect(
      resolveDemoWorld({ pack: 'marketing', clock: fixedClock('2026-12-10T10:00:00+08:00') }),
    ).toBeDefined();
  });
});

describe('formatSpecialDays (R-2b)', () => {
  it('says when, what and why in one line', () => {
    expect(
      formatSpecialDays([
        {
          starts_on: calendarDate('2026-12-24'),
          ends_on: calendarDate('2026-12-25'),
          kind: 'hours',
          ranges: [{ start: '09:00', end: '12:00' }],
          applies_to: 'both',
          reason: 'Christmas',
        },
        {
          starts_on: calendarDate('2027-01-01'),
          ends_on: calendarDate('2027-01-01'),
          kind: 'closed',
          ranges: [],
          applies_to: 'viewings',
          reason: null,
        },
      ]).map(({ when, what }) => ({ when, what })),
    ).toEqual([
      { when: 'Thu, 24 – Fri, 25 Dec', what: 'Replies and viewings 9 AM–12 PM · Christmas' },
      { when: 'Fri, 1 Jan', what: 'Viewings closed' },
    ]);
  });
});
