import {
  formatPeso,
  type CalendarDate,
  type CancellationPreset,
  type Centavos,
  type PropertyContact,
  type PropertyPageDraft,
  type PropertyView,
  type PublicAmenityView,
  type PublicPagePhoto,
  type PublicUnitCardView,
  type UnitType,
  type WeeklyHours,
} from '@smartapp/core';

export interface PropertySectionVisibility {
  readonly announcement: boolean;
  readonly banners: boolean;
  readonly about: boolean;
  readonly units: boolean;
  readonly highlights: boolean;
  readonly rules: boolean;
  readonly location: boolean;
  readonly times: boolean;
  readonly faq: boolean;
}

export interface ResolvedPropertyPhoto {
  readonly fileId: string;
  readonly url: string;
  readonly alt: string;
}

export interface ResolvedHeroPhotos {
  /** Always sourced from `page_media.hero_cover` (never picked on the page side). */
  readonly cover: ResolvedPropertyPhoto | null;
  /** Up to 5 hero photos starting with `cover`, used for the desktop 1+4 mosaic. */
  readonly mosaicPhotos: readonly ResolvedPropertyPhoto[];
  /** Full deduplicated gallery list (cover, hero photos, property photos, unit photos). */
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
}

export interface ResolvedBannerItem {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly title: string | null;
  readonly line: string | null;
  readonly link: string | null;
}

export interface StartingPrice {
  readonly amountCentavos: number;
  readonly suffix: 'a night' | 'a month';
  readonly formatted: string;
}

export type GroupedUnitsResult =
  | {
      readonly grouped: true;
      readonly stays: readonly PublicUnitCardView[];
      readonly rentals: readonly PublicUnitCardView[];
    }
  | {
      readonly grouped: false;
      readonly units: readonly PublicUnitCardView[];
    };

export interface PropertyContactLink {
  readonly kind: 'phone' | 'messenger' | 'facebook' | 'instagram' | 'tiktok' | 'viber' | 'whatsapp';
  readonly label: string;
  readonly href: string;
  readonly external: boolean;
}

function sectionSwitchOn(draft: PropertyPageDraft, key: string): boolean {
  return draft.look.sections[key] ?? true;
}

/** True while an announcement has text and has not passed its end date (Manila midnight). */
export function isAnnouncementActive(
  announcement: PropertyPageDraft['look']['announcement'],
  today: CalendarDate,
): boolean {
  if (!announcement) return false;
  if (announcement.text.trim().length === 0) return false;
  if (announcement.endDate !== null && today > announcement.endDate) return false;
  return true;
}

/** Resolves which property page sections should render, honouring `look.sections` and data presence. */
export function resolvePropertySections(
  propertyView: PropertyView,
  today: CalendarDate,
): PropertySectionVisibility {
  const published = propertyView.page.published;
  if (!published) {
    return {
      announcement: false,
      banners: false,
      about: false,
      units: false,
      highlights: false,
      rules: false,
      location: false,
      times: false,
      faq: false,
    };
  }

  const banners = resolveBannerItems(propertyView);
  const highlights = resolveHighlightAmenities(propertyView);
  const aboutText = (published.about ?? propertyView.property.description ?? '').trim();

  return {
    announcement:
      sectionSwitchOn(published, 'announcement') &&
      isAnnouncementActive(published.look.announcement, today),
    banners: sectionSwitchOn(published, 'banners') && banners.length > 0,
    about:
      sectionSwitchOn(published, 'about') &&
      (aboutText.length > 0 || propertyView.host.display_name.trim().length > 0),
    units: sectionSwitchOn(published, 'units'),
    highlights: sectionSwitchOn(published, 'highlights') && highlights.length > 0,
    rules: sectionSwitchOn(published, 'rules'),
    location: sectionSwitchOn(published, 'location'),
    times: sectionSwitchOn(published, 'times'),
    faq: sectionSwitchOn(published, 'faq') && published.faq.length > 0,
  };
}

function toResolvedPhoto(photo: PublicPagePhoto): ResolvedPropertyPhoto {
  return {
    fileId: photo.file_id,
    url: photo.url,
    alt: photo.alt,
  };
}

/**
 * Builds the hero mosaic and full-screen gallery photo lists.
 * Cover always comes straight from `page_media.hero_cover` (already resolved with fallback by P5-1).
 */
export function resolveHeroPhotos(propertyView: PropertyView): ResolvedHeroPhotos {
  const cover = propertyView.page_media.hero_cover
    ? toResolvedPhoto(propertyView.page_media.hero_cover)
    : null;

  const seen = new Set<string>();
  const allPhotos: ResolvedPropertyPhoto[] = [];

  const pushUnique = (photo: ResolvedPropertyPhoto | null) => {
    if (!photo || seen.has(photo.fileId)) return;
    seen.add(photo.fileId);
    allPhotos.push(photo);
  };

  pushUnique(cover);
  for (const photo of propertyView.page_media.hero_photos) {
    pushUnique(toResolvedPhoto(photo));
  }

  const mosaicPhotos = allPhotos.slice(0, 5);

  for (const photo of propertyView.photos) {
    pushUnique({
      fileId: photo.file_id,
      url: photo.url,
      alt: photo.alt_text.trim() || propertyView.property.name,
    });
  }

  for (const unit of propertyView.units) {
    for (const photo of unit.photos) {
      pushUnique({
        fileId: photo.file_id,
        url: photo.url,
        alt: photo.alt_text.trim() || `${unit.name} photo`,
      });
    }
  }

  return {
    cover,
    mosaicPhotos,
    allPhotos,
  };
}

/** Resolves published promo banners against `page_media.banners`. */
export function resolveBannerItems(propertyView: PropertyView): readonly ResolvedBannerItem[] {
  const published = propertyView.page.published;
  if (!published) return [];

  const mediaById = new Map(propertyView.page_media.banners.map((item) => [item.file_id, item]));
  const items: ResolvedBannerItem[] = [];

  published.look.banners.forEach((banner, index) => {
    const resolved = mediaById.get(banner.photo) ?? propertyView.page_media.banners[index];
    if (!resolved) return;
    items.push({
      id: `${banner.photo}-${index}`,
      url: resolved.url,
      alt: banner.alt,
      title: banner.title?.trim() ? banner.title.trim() : null,
      line: banner.line?.trim() ? banner.line.trim() : null,
      link: banner.link?.trim() ? banner.link.trim() : null,
    });
  });

  return items;
}

/** Featured units first (in `published.units` order), then remaining listed units by `sort_order`. */
export function orderUnitsForProperty(
  units: readonly PublicUnitCardView[],
  featuredUnitIds: readonly string[],
): readonly PublicUnitCardView[] {
  const featuredRank = new Map<string, number>();
  featuredUnitIds.forEach((id, index) => {
    if (!featuredRank.has(id)) {
      featuredRank.set(id, index);
    }
  });

  return [...units].sort((a, b) => {
    const aRank = featuredRank.get(a.id);
    const bRank = featuredRank.get(b.id);
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return a.sort_order - b.sort_order;
  });
}

/** Groups units into "Stays" and "Monthly rentals" only when both modes exist. */
export function groupUnitsByMode(orderedUnits: readonly PublicUnitCardView[]): GroupedUnitsResult {
  const stays = orderedUnits.filter((unit) => unit.mode === 'short_stay');
  const rentals = orderedUnits.filter((unit) => unit.mode === 'long_term');

  if (stays.length > 0 && rentals.length > 0) {
    return { grouped: true, stays, rentals };
  }
  return { grouped: false, units: orderedUnits };
}

/** Lowest starting price across listed units, preferring nightly stays when present. */
export function computeStartingPrice(units: readonly PublicUnitCardView[]): StartingPrice | null {
  const nightlyPrices = units
    .filter((unit) => unit.mode === 'short_stay')
    .map((unit) => unit.price_from ?? unit.stay_terms?.base_nightly_centavos ?? null)
    .filter((value): value is Centavos => value !== null && value > 0);

  if (nightlyPrices.length > 0) {
    const lowest = Math.min(...nightlyPrices);
    return {
      amountCentavos: lowest,
      suffix: 'a night',
      formatted: `from ${formatPeso(lowest)} a night`,
    };
  }

  const monthlyPrices = units
    .filter((unit) => unit.mode === 'long_term')
    .map((unit) => unit.lease_terms?.monthly_rent_centavos ?? null)
    .filter((value): value is Centavos => value !== null && value > 0);

  if (monthlyPrices.length > 0) {
    const lowest = Math.min(...monthlyPrices);
    return {
      amountCentavos: lowest,
      suffix: 'a month',
      formatted: `from ${formatPeso(lowest)} a month`,
    };
  }

  return null;
}

/** Formats one unit's card price line ("from ₱2,600 a night" or "₱4,800 a month"). */
export function formatUnitCardPrice(unit: PublicUnitCardView): string | null {
  if (unit.mode === 'short_stay') {
    const amount = unit.price_from ?? unit.stay_terms?.base_nightly_centavos ?? null;
    if (amount === null) return null;
    return `from ${formatPeso(amount)} a night`;
  }

  const monthly = unit.lease_terms?.monthly_rent_centavos ?? null;
  if (monthly === null) return null;
  return `${formatPeso(monthly)} a month`;
}

const UNIT_TYPE_LABELS: Readonly<Record<UnitType, string>> = {
  entire_place: 'Whole place',
  private_room: 'Private room',
  bed_space: 'Bed space',
};

export function formatUnitType(unitType: UnitType): string {
  return UNIT_TYPE_LABELS[unitType];
}

export function formatGuestCount(count: number): string {
  return count === 1 ? '1 guest' : `${count} guests`;
}

export function formatBedCount(count: number): string {
  return count === 1 ? '1 bed' : `${count} beds`;
}

/** Up to 6 highlight amenities chosen on the published page, preserving the owner's order. */
export function resolveHighlightAmenities(
  propertyView: PropertyView,
): readonly PublicAmenityView[] {
  const published = propertyView.page.published;
  if (!published || published.highlights.length === 0) return [];

  const byId = new Map(propertyView.amenities.map((amenity) => [amenity.id, amenity]));
  const result: PublicAmenityView[] = [];
  for (const id of published.highlights) {
    const found = byId.get(id);
    if (found) result.push(found);
    if (result.length === 6) break;
  }
  return result;
}

/** Town and province only — never the exact street address or barangay (decision E7). */
export function formatAreaLabel(property: PropertyView['property']): string {
  return `${property.city}, ${property.province}`;
}

/** Formats `HH:MM` or `HH:MM:SS` wall time into Manila-style 12-hour text (`2:00 PM`, or compact `2 PM`). */
export function formatWallTime12h(
  wallTime: string,
  options?: { readonly compact?: boolean },
): string {
  const parts = /^(\d{2}):(\d{2})/.exec(wallTime.trim());
  if (!parts?.[1] || !parts[2]) return wallTime;
  const rawHours = Number(parts[1]);
  const minutes = Number(parts[2]);
  const suffix = rawHours >= 12 ? 'PM' : 'AM';
  const hour12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  if (options?.compact && minutes === 0) {
    return `${hour12} ${suffix}`;
  }
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Readonly<Record<(typeof DAY_KEYS)[number], string>> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

function formatDayRanges(
  ranges: readonly { readonly start: string; readonly end: string }[],
): string {
  if (ranges.length === 0) return '';
  return ranges
    .map(
      (range) =>
        `${formatWallTime12h(range.start, { compact: true })}–${formatWallTime12h(range.end, { compact: true })}`,
    )
    .join(', ');
}

function formatDaySpan(indices: readonly number[]): string {
  if (indices.length === 7) return 'every day';
  const groups: number[][] = [];
  for (const idx of indices) {
    const last = groups[groups.length - 1];
    if (last && last[last.length - 1] === idx - 1) {
      last.push(idx);
    } else {
      groups.push([idx]);
    }
  }
  return groups
    .map((group) => {
      const startKey = DAY_KEYS[group[0] ?? 0];
      const endKey = DAY_KEYS[group[group.length - 1] ?? 0];
      if (!startKey || !endKey) return '';
      if (group.length === 1) return DAY_LABELS[startKey];
      if (group.length === 2) return `${DAY_LABELS[startKey]} & ${DAY_LABELS[endKey]}`;
      return `${DAY_LABELS[startKey]}–${DAY_LABELS[endKey]}`;
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * Turns a weekly hours schedule into plain-English summary lines
 * (e.g. `"Replies 9 AM–6 PM, Mon–Sat"`, or `"Replies any time"` when unset).
 */
export function formatWeeklyHoursSummary(
  hours: WeeklyHours | null,
  kind: 'reply' | 'viewing',
): string | null {
  const prefix = kind === 'reply' ? 'Replies' : 'Viewings';
  if (!hours) {
    return kind === 'reply' ? 'Replies any time' : null;
  }

  const byText = new Map<string, number[]>();
  DAY_KEYS.forEach((dayKey, index) => {
    const formatted = formatDayRanges(hours[dayKey]);
    if (!formatted) return;
    const existing = byText.get(formatted);
    if (existing) {
      existing.push(index);
    } else {
      byText.set(formatted, [index]);
    }
  });

  if (byText.size === 0) {
    return kind === 'reply' ? 'Replies any time' : null;
  }

  const segments = [...byText.entries()].map(([timeText, dayIndices]) => {
    const span = formatDaySpan(dayIndices);
    return span === 'every day' ? `${timeText}, every day` : `${timeText}, ${span}`;
  });

  return `${prefix} ${segments.join(' · ')}`;
}

/** Guest-facing plain-English cancellation summary for the property page. */
export function guestCancellationCopy(property: {
  readonly cancellation_preset: CancellationPreset;
  readonly cancellation_note: string | null;
  readonly rebook_min_days: number;
  readonly rebook_within_months: number;
}): { readonly label: string; readonly summary: string } {
  const customNote = property.cancellation_note?.trim() ?? '';
  switch (property.cancellation_preset) {
    case 'flexible':
      return {
        label: 'Flexible',
        summary: 'Full refund if you cancel at least 1 day before check-in.',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        summary: 'Full refund up to 5 days before check-in, and half back after that.',
      };
    case 'firm':
      return {
        label: 'Firm',
        summary:
          'Full refund up to 30 days before check-in, half back up to 7 days before, and no refund after.',
      };
    case 'dp_rebook':
      return {
        label: 'Down payment kept, one date change',
        summary: `Down payments are non-refundable, but you may move your dates once at least ${property.rebook_min_days} days before check-in (within ${property.rebook_within_months} months).`,
      };
    case 'non_refundable':
      return {
        label: 'Non-refundable',
        summary: 'Payments are non-refundable once your booking is confirmed.',
      };
    case 'custom':
      return {
        label: 'Custom policy',
        summary: customNote || 'Check with the host for cancellation terms before booking.',
      };
  }
}

function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizePhoneDigits(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

/** Builds only the contact links the owner has configured. */
export function resolveContactLinks(contact: PropertyContact): readonly PropertyContactLink[] {
  const links: PropertyContactLink[] = [];

  if (contact.phone?.trim()) {
    links.push({
      kind: 'phone',
      label: 'Call',
      href: `tel:${normalizePhoneDigits(contact.phone)}`,
      external: false,
    });
  }
  if (contact.messenger?.trim()) {
    links.push({
      kind: 'messenger',
      label: 'Messenger',
      href: normalizeHttpUrl(contact.messenger),
      external: true,
    });
  }
  if (contact.facebook?.trim()) {
    links.push({
      kind: 'facebook',
      label: 'Facebook',
      href: normalizeHttpUrl(contact.facebook),
      external: true,
    });
  }
  if (contact.instagram?.trim()) {
    links.push({
      kind: 'instagram',
      label: 'Instagram',
      href: normalizeHttpUrl(contact.instagram),
      external: true,
    });
  }
  if (contact.tiktok?.trim()) {
    links.push({
      kind: 'tiktok',
      label: 'TikTok',
      href: normalizeHttpUrl(contact.tiktok),
      external: true,
    });
  }
  if (contact.viber?.trim()) {
    const raw = contact.viber.trim();
    const href = /^https?:\/\//i.test(raw)
      ? raw
      : `viber://chat?number=${encodeURIComponent(normalizePhoneDigits(raw))}`;
    links.push({
      kind: 'viber',
      label: 'Viber',
      href,
      external: true,
    });
  }
  if (contact.whatsapp?.trim()) {
    const raw = contact.whatsapp.trim();
    const digits = raw.replace(/\D/g, '');
    const href = /^https?:\/\//i.test(raw) ? raw : `https://wa.me/${digits}`;
    links.push({
      kind: 'whatsapp',
      label: 'WhatsApp',
      href,
      external: true,
    });
  }

  return links;
}

/** Resolves where the phone sticky "Check dates" button points. */
export function resolvePrimaryCtaTarget(
  slug: string,
  orderedUnits: readonly PublicUnitCardView[],
): string | null {
  if (orderedUnits.length === 0) return null;
  if (orderedUnits.length === 1 && orderedUnits[0]) {
    return `/${slug}/units/${orderedUnits[0].slug}`;
  }
  return '#units';
}

/** Validates a promo banner link so relative property paths and safe links work seamlessly. */
export function resolveBannerHref(slug: string, link: string | null): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) {
    return trimmed.startsWith(`/${slug}`) ? trimmed : `/${slug}${trimmed}`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}
