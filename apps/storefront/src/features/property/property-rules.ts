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
  type UnitMode,
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

export interface PropertySectionNavItem {
  readonly id: 'units' | 'about' | 'rules' | 'location' | 'faq';
  readonly label: string;
}

export interface ResolvedPropertyPhoto {
  readonly fileId: string;
  readonly url: string;
  readonly alt: string;
  readonly groupId: string;
  readonly groupLabel: string;
}

export interface ResolvedPhotoGroup {
  readonly id: string;
  readonly label: string;
  readonly startIndex: number;
  readonly photos: readonly ResolvedPropertyPhoto[];
}

export interface ResolvedHeroPhotos {
  /** Always sourced from `page_media.hero_cover` (never picked on the page side). */
  readonly cover: ResolvedPropertyPhoto | null;
  /** Up to 5 hero photos starting with `cover`, used for the desktop 1+4 mosaic. */
  readonly mosaicPhotos: readonly ResolvedPropertyPhoto[];
  /** Full deduplicated gallery list (cover, hero photos, property photos, unit photos). */
  readonly allPhotos: readonly ResolvedPropertyPhoto[];
  /** Photos grouped by property and unit/room name for the "Show all photos" viewer. */
  readonly photoGroups: readonly ResolvedPhotoGroup[];
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

export interface UnitCardPhoto {
  readonly fileId: string;
  readonly url: string;
  readonly alt: string;
}

export interface UnitDisplayCard {
  readonly id: string;
  readonly kind: 'unit' | 'room';
  readonly mode: UnitMode;
  readonly unitType: UnitType;
  readonly title: string;
  readonly targetUnitSlug: string;
  readonly factsLine: string;
  readonly badgeLabel: string | null;
  readonly coverUrl: string | null;
  readonly coverAlt: string;
  readonly photos: readonly UnitCardPhoto[];
  readonly photoCount: number;
  readonly priceText: string | null;
  readonly highlightChip: string | null;
  readonly maxGuests: number;
  readonly bedrooms: number;
  readonly bedCount: number;
  readonly bathrooms: number;
  readonly floorAreaSqm: number | null;
  readonly description: string | null;
  readonly topAmenities: readonly PublicAmenityView[];
}

/** Slim unit summary passed to `PropertyFrame` / `UnitChooserSheet` to avoid duplicating full card data in RSC props. */
export interface UnitChooserOption {
  readonly id: string;
  readonly title: string;
  readonly targetUnitSlug: string;
  readonly coverUrl: string | null;
  readonly coverAlt: string;
  readonly factsLine: string;
  readonly priceText: string | null;
}

export function toUnitChooserOptions(
  cards: readonly UnitDisplayCard[],
): readonly UnitChooserOption[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    targetUnitSlug: card.targetUnitSlug,
    coverUrl: card.coverUrl,
    coverAlt: card.coverAlt,
    factsLine: card.factsLine,
    priceText: card.priceText,
  }));
}

export type GroupedDisplayCardsResult =
  | {
      readonly grouped: true;
      readonly stays: readonly UnitDisplayCard[];
      readonly rentals: readonly UnitDisplayCard[];
    }
  | {
      readonly grouped: false;
      readonly cards: readonly UnitDisplayCard[];
    };

export interface PropertyContactLink {
  readonly kind:
    'phone' | 'sms' | 'messenger' | 'facebook' | 'instagram' | 'tiktok' | 'viber' | 'whatsapp';
  readonly label: string;
  readonly detail?: string | undefined;
  readonly href: string;
  readonly external: boolean;
}

/** Official public web address shown in the trust panel (D71, D77). */
export function officialPropertyAddress(slug: string): string {
  return `smartapp.webserbisyo.com/${slug}`;
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

/** Visible section jump tabs (D79): Units · About · Rules · Location · FAQ. */
export function resolvePropertyNavItems(
  visibility: PropertySectionVisibility,
): readonly PropertySectionNavItem[] {
  const items: PropertySectionNavItem[] = [];
  if (visibility.units) items.push({ id: 'units', label: 'Units' });
  if (visibility.about) items.push({ id: 'about', label: 'About' });
  if (visibility.rules) items.push({ id: 'rules', label: 'Rules' });
  if (visibility.location) items.push({ id: 'location', label: 'Location' });
  if (visibility.faq) items.push({ id: 'faq', label: 'FAQ' });
  return items;
}

function toResolvedPhoto(
  photo: PublicPagePhoto,
  groupId: string,
  groupLabel: string,
): ResolvedPropertyPhoto {
  return {
    fileId: photo.file_id,
    url: photo.url,
    alt: photo.alt,
    groupId,
    groupLabel,
  };
}

function unitPhotoGroupKey(unit: PublicUnitCardView): { id: string; label: string } {
  if (unit.unit_type === 'bed_space' && unit.room) {
    return { id: `room-${unit.room.id}`, label: unit.room.name };
  }
  return {
    id: `unit-${unit.id}`,
    label: unit.name,
  };
}

/**
 * Builds the hero mosaic, deduplicated viewer list, and unit-grouped photo buckets.
 * Cover always comes straight from `page_media.hero_cover` (already resolved with fallback by P5-1).
 */
export function resolveHeroPhotos(propertyView: PropertyView): ResolvedHeroPhotos {
  const propertyGroupId = 'property';
  const propertyGroupLabel = propertyView.property.name;
  const cover = propertyView.page_media.hero_cover
    ? toResolvedPhoto(propertyView.page_media.hero_cover, propertyGroupId, propertyGroupLabel)
    : null;

  const seen = new Set<string>();
  const mosaicSource: ResolvedPropertyPhoto[] = [];
  const allPhotos: ResolvedPropertyPhoto[] = [];
  const groupBuckets = new Map<
    string,
    { readonly id: string; readonly label: string; readonly photos: ResolvedPropertyPhoto[] }
  >();

  const pushUnique = (photo: ResolvedPropertyPhoto | null, intoMosaic = false) => {
    if (!photo || seen.has(photo.fileId)) return;
    seen.add(photo.fileId);
    allPhotos.push(photo);
    if (intoMosaic && mosaicSource.length < 5) {
      mosaicSource.push(photo);
    }
    const existing = groupBuckets.get(photo.groupId);
    if (existing) {
      existing.photos.push(photo);
    } else {
      groupBuckets.set(photo.groupId, {
        id: photo.groupId,
        label: photo.groupLabel,
        photos: [photo],
      });
    }
  };

  pushUnique(cover, true);
  for (const photo of propertyView.page_media.hero_photos) {
    pushUnique(toResolvedPhoto(photo, propertyGroupId, propertyGroupLabel), true);
  }

  for (const photo of propertyView.photos) {
    pushUnique({
      fileId: photo.file_id,
      url: photo.url,
      alt: photo.alt_text.trim() || propertyView.property.name,
      groupId: propertyGroupId,
      groupLabel: propertyGroupLabel,
    });
  }

  for (const unit of propertyView.units) {
    const group = unitPhotoGroupKey(unit);
    for (const photo of unit.photos) {
      pushUnique({
        fileId: photo.file_id,
        url: photo.url,
        alt: photo.alt_text.trim() || `${group.label} photo`,
        groupId: group.id,
        groupLabel: group.label,
      });
    }
  }

  // Re-order `allPhotos` to match the contiguous groups so swiping moves cleanly group by group
  // while keeping the cover first in group 0.
  const orderedAll: ResolvedPropertyPhoto[] = [];
  const photoGroups: ResolvedPhotoGroup[] = [];
  for (const bucket of groupBuckets.values()) {
    if (bucket.photos.length === 0) continue;
    photoGroups.push({
      id: bucket.id,
      label: bucket.label,
      startIndex: orderedAll.length,
      photos: bucket.photos,
    });
    orderedAll.push(...bucket.photos);
  }

  return {
    cover,
    mosaicPhotos: mosaicSource,
    allPhotos: orderedAll,
    photoGroups,
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

const BASIC_AMENITY_CODES = new Set(['wifi', 'aircon', 'water_heater', 'towels']);

/** Picks one concise highlight amenity chip from a unit's own `amenity_ids` (no extra queries). */
export function resolveUnitHighlightChip(
  unitAmenityIds: readonly string[],
  amenitiesById: ReadonlyMap<string, PublicAmenityView>,
  propertyHighlightIds: readonly string[] = [],
): string | null {
  if (unitAmenityIds.length === 0 || amenitiesById.size === 0) return null;

  const matched: PublicAmenityView[] = [];
  for (const id of unitAmenityIds) {
    const found = amenitiesById.get(id);
    if (found) matched.push(found);
  }
  if (matched.length === 0) return null;

  const highlightSet = new Set(propertyHighlightIds);
  const standoutHighlight = matched.find(
    (amenity) => highlightSet.has(amenity.id) && !BASIC_AMENITY_CODES.has(amenity.code),
  );
  if (standoutHighlight) return standoutHighlight.label;

  const standout = matched.find((amenity) => !BASIC_AMENITY_CODES.has(amenity.code));
  if (standout) return standout.label;

  return matched[0]?.label ?? null;
}

/** "Ladies" / "Gents" from the room the owner set up (R-1b); null for rooms open to anyone. */
function roomQualifier(room: PublicUnitCardView['room']): string | null {
  if (room?.guests === 'ladies') return 'Ladies';
  if (room?.guests === 'gents') return 'Gents';
  return null;
}

function lowestPriceTextForGroup(units: readonly PublicUnitCardView[]): string | null {
  const first = units[0];
  if (!first) return null;
  if (first.mode === 'short_stay') {
    const amounts = units
      .map((u) => u.price_from ?? u.stay_terms?.base_nightly_centavos ?? null)
      .filter((v): v is Centavos => v !== null && v > 0);
    if (amounts.length === 0) return null;
    return `from ${formatPeso(Math.min(...amounts))} a night`;
  }
  const amounts = units
    .map((u) => u.lease_terms?.monthly_rent_centavos ?? null)
    .filter((v): v is Centavos => v !== null && v > 0);
  if (amounts.length === 0) return null;
  return `from ${formatPeso(Math.min(...amounts))} a month`;
}

/** Resolves up to 6 unit amenities from `amenity_ids` (no extra queries), keeping property highlights first. */
export function resolveUnitTopAmenities(
  unitAmenityIds: readonly string[],
  amenitiesById: ReadonlyMap<string, PublicAmenityView>,
  propertyHighlightIds: readonly string[] = [],
  limit = 6,
): readonly PublicAmenityView[] {
  if (unitAmenityIds.length === 0 || amenitiesById.size === 0) return [];
  const highlightRank = new Map<string, number>();
  propertyHighlightIds.forEach((id, index) => {
    if (!highlightRank.has(id)) highlightRank.set(id, index);
  });

  const matched: PublicAmenityView[] = [];
  const seen = new Set<string>();
  for (const id of unitAmenityIds) {
    if (seen.has(id)) continue;
    const found = amenitiesById.get(id);
    if (found) {
      seen.add(id);
      matched.push(found);
    }
  }

  return matched
    .sort((a, b) => {
      const aRank = highlightRank.get(a.id);
      const bRank = highlightRank.get(b.id);
      if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;
      return a.sort_order - b.sort_order;
    })
    .slice(0, limit);
}

/** Round-robin selector for staggered unit-card photo autoplay: advances one visible card per tick. */
export function pickNextAutoplayCardId(
  eligibleIds: readonly string[],
  lastId: string | null,
): string | null {
  if (eligibleIds.length === 0) return null;
  if (!lastId) return eligibleIds[0] ?? null;
  const currentIdx = eligibleIds.indexOf(lastId);
  if (currentIdx === -1) return eligibleIds[0] ?? null;
  return eligibleIds[(currentIdx + 1) % eligibleIds.length] ?? null;
}

/**
 * Turns ordered units into display cards (D81):
 * - Bed spaces in the same room (`room`, R-1b) collapse into one room card
 *   (e.g. "Room 2A · Ladies · 4 beds", no unbacked "free" count), linking to the room's first bed.
 * - Other units stay one card each ("Whole place · 2 guests · 1 bed").
 */
export function buildUnitDisplayCards(
  orderedUnits: readonly PublicUnitCardView[],
  amenities: readonly PublicAmenityView[] = [],
  propertyHighlightIds: readonly string[] = [],
): readonly UnitDisplayCard[] {
  const amenitiesById = new Map(amenities.map((amenity) => [amenity.id, amenity]));

  type PendingEntry =
    | { readonly kind: 'unit'; readonly unit: PublicUnitCardView }
    | {
        readonly kind: 'room';
        readonly key: string;
        readonly label: string;
        readonly units: PublicUnitCardView[];
      };

  const entries: PendingEntry[] = [];
  const roomIndex = new Map<string, Extract<PendingEntry, { readonly kind: 'room' }>>();

  for (const unit of orderedUnits) {
    const room = unit.unit_type === 'bed_space' ? unit.room : null;
    if (room) {
      const key = `${unit.mode}::${room.id}`;
      const existing = roomIndex.get(key);
      if (existing) {
        existing.units.push(unit);
      } else {
        const created: Extract<PendingEntry, { readonly kind: 'room' }> = {
          kind: 'room',
          key,
          label: room.name,
          units: [unit],
        };
        roomIndex.set(key, created);
        entries.push(created);
      }
    } else {
      entries.push({ kind: 'unit', unit });
    }
  }

  return entries.map((entry): UnitDisplayCard => {
    if (entry.kind === 'unit') {
      const { unit } = entry;
      const photos: UnitCardPhoto[] = unit.photos.map((photo) => ({
        fileId: photo.file_id,
        url: photo.url,
        alt: photo.alt_text.trim() || unit.name,
      }));
      const cover = photos[0] ?? null;
      return {
        id: unit.id,
        kind: 'unit',
        mode: unit.mode,
        unitType: unit.unit_type,
        title: unit.name,
        targetUnitSlug: unit.slug,
        factsLine: `${formatUnitType(unit.unit_type)} · ${formatGuestCount(unit.max_guests)} · ${formatBedCount(unit.beds)}`,
        badgeLabel: null,
        coverUrl: cover?.url ?? null,
        coverAlt: cover?.alt ?? unit.name,
        photos,
        photoCount: photos.length,
        priceText: formatUnitCardPrice(unit),
        highlightChip: resolveUnitHighlightChip(
          unit.amenity_ids,
          amenitiesById,
          propertyHighlightIds,
        ),
        maxGuests: unit.max_guests,
        bedrooms: unit.bedrooms,
        bedCount: unit.beds,
        bathrooms: unit.bathrooms,
        floorAreaSqm: unit.floor_area_sqm,
        description: unit.description,
        topAmenities: resolveUnitTopAmenities(
          unit.amenity_ids,
          amenitiesById,
          propertyHighlightIds,
        ),
      };
    }

    const first = entry.units[0];
    if (!first) {
      throw new Error('Room group cannot be empty');
    }
    const uniquePhotoIds = new Set<string>();
    const photos: UnitCardPhoto[] = [];
    for (const bed of entry.units) {
      for (const photo of bed.photos) {
        if (!uniquePhotoIds.has(photo.file_id)) {
          uniquePhotoIds.add(photo.file_id);
          photos.push({
            fileId: photo.file_id,
            url: photo.url,
            alt: photo.alt_text.trim() || entry.label,
          });
        }
      }
    }
    const cover = photos[0] ?? null;

    const qualifier = roomQualifier(first.room);
    const bedCount = entry.units.length;
    const bathroom =
      first.room?.bathroom === 'in_room'
        ? 'Bathroom in the room'
        : first.room
          ? 'Shared bathroom'
          : null;
    const factParts = [
      ...(qualifier ? [qualifier] : ['Shared room']),
      formatBedCount(bedCount),
      ...(bathroom ? [bathroom] : []),
    ];

    return {
      id: `room-${entry.key}`,
      kind: 'room',
      mode: first.mode,
      unitType: 'bed_space',
      title: entry.label,
      targetUnitSlug: first.slug,
      factsLine: factParts.join(' · '),
      badgeLabel: qualifier
        ? `${qualifier} · ${formatBedCount(bedCount)}`
        : formatBedCount(bedCount),
      coverUrl: cover?.url ?? null,
      coverAlt: cover?.alt ?? entry.label,
      photos,
      photoCount: photos.length,
      priceText: lowestPriceTextForGroup(entry.units),
      highlightChip: resolveUnitHighlightChip(
        first.amenity_ids,
        amenitiesById,
        propertyHighlightIds,
      ),
      maxGuests: first.max_guests,
      bedrooms: first.bedrooms,
      bedCount,
      bathrooms: first.bathrooms,
      floorAreaSqm: first.floor_area_sqm,
      description: first.room?.description ?? first.description,
      topAmenities: resolveUnitTopAmenities(first.amenity_ids, amenitiesById, propertyHighlightIds),
    };
  });
}

/** Splits display cards into Stays and Monthly rentals tabs only when both modes exist (D81). */
export function groupDisplayCardsByMode(
  cards: readonly UnitDisplayCard[],
): GroupedDisplayCardsResult {
  const stays = cards.filter((card) => card.mode === 'short_stay');
  const rentals = cards.filter((card) => card.mode === 'long_term');
  if (stays.length > 0 && rentals.length > 0) {
    return { grouped: true, stays, rentals };
  }
  return { grouped: false, cards };
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

/** Builds only the contact links the owner has configured (including Call & Text when phone is set). */
export function resolveContactLinks(
  contact: PropertyContact,
  options?: { readonly includeSms?: boolean },
): readonly PropertyContactLink[] {
  const links: PropertyContactLink[] = [];

  if (contact.phone?.trim()) {
    const cleaned = contact.phone.trim();
    const digits = normalizePhoneDigits(cleaned);
    links.push({
      kind: 'phone',
      label: 'Call',
      detail: cleaned,
      href: `tel:${digits}`,
      external: false,
    });
    if (options?.includeSms) {
      links.push({
        kind: 'sms',
        label: 'Text (SMS)',
        detail: cleaned,
        href: `sms:${digits}`,
        external: false,
      });
    }
  }
  if (contact.messenger?.trim()) {
    links.push({
      kind: 'messenger',
      label: 'Messenger',
      detail: 'Fastest way to chat',
      href: normalizeHttpUrl(contact.messenger),
      external: true,
    });
  }
  if (contact.facebook?.trim()) {
    links.push({
      kind: 'facebook',
      label: 'Facebook',
      detail: 'View Facebook page',
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
