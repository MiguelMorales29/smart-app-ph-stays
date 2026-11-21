import { calendarDate, fixedClock, resolveDemoWorld } from '@smartapp/core';
import { getDataSource } from '@smartapp/data';
import { describe, expect, it } from 'vitest';

import {
  computeStartingPrice,
  formatAreaLabel,
  formatWallTime12h,
  formatWeeklyHoursSummary,
  groupUnitsByMode,
  guestCancellationCopy,
  isAnnouncementActive,
  orderUnitsForProperty,
  resolveBannerHref,
  resolveContactLinks,
  resolveHeroPhotos,
  resolvePrimaryCtaTarget,
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

  it('honours look.sections show/hide switches on Ulap Suites and Tita Lorna Dorm', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const lorna = await loadDemoProperty('tita-lorna-dorm');
    const today = calendarDate('2026-12-10');

    expect(resolvePropertySections(ulap, today)).toEqual({
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

    expect(resolvePropertySections(lorna, today)).toEqual({
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
    }
  });

  it('uses page_media.hero_cover directly as the cover photo and deduplicates hero and gallery photos', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const hero = resolveHeroPhotos(ulap);

    expect(hero.cover).not.toBeNull();
    expect(hero.cover?.fileId).toBe(ulap.page_media.hero_cover?.file_id);
    expect(hero.mosaicPhotos[0]?.fileId).toBe(ulap.page_media.hero_cover?.file_id);
    expect(hero.mosaicPhotos.length).toBeLessThanOrEqual(5);
    expect(new Set(hero.allPhotos.map((p) => p.fileId)).size).toBe(hero.allPhotos.length);
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

  it('formats area-only location without exact address (E7)', async () => {
    const ulap = await loadDemoProperty('ulap-suites');
    const area = formatAreaLabel(ulap.property);
    expect(area).toBe(`${ulap.property.city}, ${ulap.property.province}`);
    if (ulap.property.address_line) {
      expect(area).not.toContain(ulap.property.address_line);
    }
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
      closed_dates: [],
    };
    expect(formatWeeklyHoursSummary(hours, 'reply')).toBe('Replies 9 AM–6 PM, Mon–Sat');
    expect(formatWeeklyHoursSummary(null, 'reply')).toBe('Replies any time');
    expect(formatWeeklyHoursSummary(null, 'viewing')).toBeNull();
  });

  it('formats guest-facing cancellation presets and contact links cleanly', () => {
    expect(
      guestCancellationCopy({
        cancellation_preset: 'dp_rebook',
        cancellation_note: null,
        rebook_min_days: 7,
        rebook_within_months: 6,
      }).summary,
    ).toContain('7 days before check-in');

    const links = resolveContactLinks({
      phone: '+63 917 000 0101',
      messenger: 'https://m.me/ulapsuites',
      facebook: null,
      instagram: null,
      tiktok: null,
      viber: '+639170000101',
      whatsapp: null,
      google_review_url: 'https://g.page/r/example',
    });
    expect(links.map((l) => l.label)).toEqual(['Call', 'Messenger', 'Viber']);
    expect(links[0]?.href).toBe('tel:+639170000101');
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
