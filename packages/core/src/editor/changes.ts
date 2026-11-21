import { z } from 'zod';

import type { FontPair } from '../lists/index.js';
import type { PropertyPageDraft } from '../schemas/tables/common.js';
import { hexToOklch } from '../theme/palette.js';

/**
 * The 14 wave 1 parts of the property page in the Editor (§7a "The sections" table, without part 14 "Guest count").
 * Ported from the food app's `packages/core/src/schemas/editor.ts`, `rules/editor.ts` and
 * `apps/dashboard/src/features/editor/change-text.ts`.
 */
export const EDITOR_PARTS = [
  'style',
  'fonts',
  'install',
  'hero',
  'banners',
  'announcement',
  'about',
  'units',
  'highlights',
  'rules',
  'location',
  'times',
  'faq',
  'seo',
] as const;

export const editorPartSchema = z.enum(EDITOR_PARTS);
export type EditorPart = z.infer<typeof editorPartSchema>;

export const EDITOR_PART_NAMES: Readonly<Record<EditorPart, string>> = {
  style: 'Style: logo and colours',
  fonts: 'Fonts',
  install: 'Install look',
  hero: 'Hero photos',
  banners: 'Promo banners',
  announcement: 'Announcement',
  about: 'About and host',
  units: 'Units',
  highlights: 'Highlights',
  rules: 'Rules and policies',
  location: 'Location and contact',
  times: 'Times',
  faq: 'FAQ',
  seo: 'Share and search',
};

export const FONT_PAIR_NAMES: Readonly<Record<FontPair, string>> = {
  malinaw: 'Malinaw',
  friendly: 'Friendly',
  street: 'Street',
  cafe: 'Café',
  elegant: 'Elegant',
  bakery: 'Bakery',
  playful: 'Playful',
  modern: 'Modern',
  bold: 'Bold',
  homey: 'Homey',
};

export const SECTION_SWITCH_KEYS = [
  'banners',
  'announcement',
  'about',
  'units',
  'highlights',
  'rules',
  'location',
  'times',
  'faq',
] as const;

export const sectionSwitchKeySchema = z.enum(SECTION_SWITCH_KEYS);
export type SectionSwitchKey = z.infer<typeof sectionSwitchKeySchema>;

export const SECTION_SWITCH_NAMES: Readonly<Record<SectionSwitchKey, string>> = {
  banners: 'Promo banners',
  announcement: 'Announcement',
  about: 'About and host',
  units: 'Units',
  highlights: 'Highlights',
  rules: 'Rules and policies',
  location: 'Location and contact',
  times: 'Times',
  faq: 'FAQ',
};

const PART_SWITCHES: Readonly<Record<EditorPart, readonly SectionSwitchKey[]>> = {
  style: [],
  fonts: [],
  install: [],
  hero: [],
  banners: ['banners'],
  announcement: ['announcement'],
  about: ['about'],
  units: ['units'],
  highlights: ['highlights'],
  rules: ['rules'],
  location: ['location'],
  times: ['times'],
  faq: ['faq'],
  seo: [],
};

export function partSwitchKeys(part: EditorPart): readonly SectionSwitchKey[] {
  return PART_SWITCHES[part];
}

/** On when any of its switches is on (defaults to true when unset); null for a part that is always shown. */
export function partIsOn(draft: PropertyPageDraft, part: EditorPart): boolean | null {
  const keys = PART_SWITCHES[part];
  if (keys.length === 0) return null;
  return keys.some((key) => draft.look.sections[key] ?? true);
}

/** Turns one Editor part on or off. */
export function withPartSection(
  draft: PropertyPageDraft,
  part: EditorPart,
  on: boolean,
): PropertyPageDraft {
  const sections = { ...draft.look.sections };
  for (const key of PART_SWITCHES[part]) {
    sections[key] = on;
  }
  return { ...draft, look: { ...draft.look, sections } };
}

export const COLOUR_FAMILIES = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'brown',
  'grey',
  'black',
  'white',
] as const;
export type ColourFamily = (typeof COLOUR_FAMILIES)[number];

export const COLOUR_FAMILY_NAMES: Readonly<Record<ColourFamily, string>> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  brown: 'Brown',
  grey: 'Grey',
  black: 'Black',
  white: 'White',
};

/** A plain name for a colour ("Red", "Brown"), so the owner never has to read a code. */
export function colourFamily(hex: string): ColourFamily {
  const c = hexToOklch(hex);
  if (!c) return 'grey';
  if (c.c < 0.03) {
    if (c.l >= 0.92) return 'white';
    if (c.l <= 0.25) return 'black';
    return 'grey';
  }
  const h = c.h;
  if (h >= 35 && h < 95 && c.l < 0.55) return 'brown';
  if (h < 34) return 'red';
  if (h < 75) return 'orange';
  if (h < 115) return 'yellow';
  if (h < 165) return 'green';
  if (h < 215) return 'teal';
  if (h < 285) return 'blue';
  if (h < 320) return 'purple';
  return 'pink';
}

export function colourName(hex: string): string {
  return COLOUR_FAMILY_NAMES[colourFamily(hex)];
}

// Stable JSON with sorted keys, so two drafts built in a different order still compare equal.
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function sameDraft(a: PropertyPageDraft, b: PropertyPageDraft): boolean {
  return stable(a) === stable(b);
}

function how(before: unknown, after: unknown): 'added' | 'removed' | 'changed' {
  if (before === null || before === undefined) return 'added';
  if (after === null || after === undefined) return 'removed';
  return 'changed';
}

export const pageChangeItemSchema = z.object({
  part: editorPartSchema,
  words: z.string().min(1).max(200),
});

export type PageChangeItem = z.infer<typeof pageChangeItemSchema>;

const PART_FOR_SWITCH: Readonly<Record<SectionSwitchKey, EditorPart>> = {
  banners: 'banners',
  announcement: 'announcement',
  about: 'about',
  units: 'units',
  highlights: 'highlights',
  rules: 'rules',
  location: 'location',
  times: 'times',
  faq: 'faq',
};

/**
 * Plain-words list of differences between `published` and `draft`, as `{ part, words }[]`
 * ("Fonts: Café", "Banner 2 photo"). Ported from the food app's `change-text.ts` and `editorChanges`.
 */
export function getPageChangesList(
  published: PropertyPageDraft | null,
  draft: PropertyPageDraft,
): PageChangeItem[] {
  if (published === null) {
    return [{ part: 'style', words: 'Initial page ready to publish' }];
  }

  const out: PageChangeItem[] = [];
  const a = published.look;
  const b = draft.look;

  // 1. Style: logo, colours, tagline
  if (published.logo !== draft.logo) {
    const kind = how(published.logo, draft.logo);
    const label =
      kind === 'added' ? 'Logo added' : kind === 'removed' ? 'Logo removed' : 'New logo';
    out.push({ part: 'style', words: label });
  }
  if (a.brandColor.toLowerCase() !== b.brandColor.toLowerCase()) {
    out.push({
      part: 'style',
      words: `Brand colour: ${colourName(b.brandColor)} ${b.brandColor.toUpperCase()}`,
    });
  }
  if (a.pageColor.toLowerCase() !== b.pageColor.toLowerCase()) {
    out.push({ part: 'style', words: `Page colour: ${b.pageColor.toUpperCase()}` });
  }
  if (a.cardColor.toLowerCase() !== b.cardColor.toLowerCase()) {
    out.push({ part: 'style', words: `Card colour: ${b.cardColor.toUpperCase()}` });
  }
  if (a.accentColor.toLowerCase() !== b.accentColor.toLowerCase()) {
    out.push({
      part: 'style',
      words: `Accent colour: ${colourName(b.accentColor)} ${b.accentColor.toUpperCase()}`,
    });
  }
  if (a.logoShape !== b.logoShape) {
    out.push({
      part: 'style',
      words: b.logoShape === 'circle' ? 'Logo shape: circle' : 'Logo shape: rounded square',
    });
  }
  if ((published.tagline ?? '') !== (draft.tagline ?? '')) {
    out.push({ part: 'style', words: 'Tagline changed' });
  }

  // 2. Fonts
  if (a.fontPair !== b.fontPair) {
    out.push({ part: 'fonts', words: `Fonts: ${FONT_PAIR_NAMES[b.fontPair]}` });
  }

  // 3. Install look
  if (stable(published.install) !== stable(draft.install)) {
    if (published.install.homeScreenName !== draft.install.homeScreenName) {
      out.push({ part: 'install', words: `Home screen name: ${draft.install.homeScreenName}` });
    } else if (
      published.install.splashColor.toLowerCase() !== draft.install.splashColor.toLowerCase()
    ) {
      out.push({
        part: 'install',
        words: `Splash colour: ${draft.install.splashColor.toUpperCase()}`,
      });
    } else {
      out.push({ part: 'install', words: 'Install look changed' });
    }
  }

  // 4. Hero photos
  if (stable(published.hero) !== stable(draft.hero)) {
    if (published.hero.cover !== draft.hero.cover) {
      out.push({ part: 'hero', words: 'Cover photo changed' });
    } else {
      out.push({ part: 'hero', words: 'Hero photos changed' });
    }
  }

  // 5. Promo banners
  if (stable(a.banners) !== stable(b.banners)) {
    if (a.banners.length !== b.banners.length) {
      out.push({ part: 'banners', words: `Banners: ${a.banners.length} → ${b.banners.length}` });
    } else {
      let describedSingle = false;
      for (let i = 0; i < b.banners.length; i += 1) {
        const beforeBanner = a.banners[i];
        const afterBanner = b.banners[i];
        if (!beforeBanner || !afterBanner) continue;
        if (stable(beforeBanner) !== stable(afterBanner)) {
          if (beforeBanner.photo !== afterBanner.photo) {
            out.push({ part: 'banners', words: `Banner ${i + 1} photo` });
          } else {
            out.push({ part: 'banners', words: `Banner ${i + 1} text` });
          }
          describedSingle = true;
        }
      }
      if (!describedSingle) {
        out.push({ part: 'banners', words: 'Banners changed' });
      }
    }
  }
  if (a.bannerSeconds !== b.bannerSeconds && b.banners.length > 1) {
    out.push({ part: 'banners', words: `Each banner shows ${b.bannerSeconds} seconds` });
  }

  // 6. Announcement
  if (stable(a.announcement) !== stable(b.announcement)) {
    const kind = how(a.announcement, b.announcement);
    const label =
      kind === 'added'
        ? 'Announcement added'
        : kind === 'removed'
          ? 'Announcement removed'
          : 'Announcement changed';
    out.push({ part: 'announcement', words: label });
  }

  // 7. About and host
  if ((published.about ?? '') !== (draft.about ?? '')) {
    out.push({ part: 'about', words: 'About changed' });
  }
  if (stable(published.host) !== stable(draft.host)) {
    if (published.host.displayName !== draft.host.displayName) {
      out.push({ part: 'about', words: `Host name: ${draft.host.displayName}` });
    } else if (published.host.photoFile !== draft.host.photoFile) {
      out.push({ part: 'about', words: 'Host photo changed' });
    } else {
      out.push({ part: 'about', words: 'Host languages changed' });
    }
  }

  // 8. Units
  if (stable(published.units) !== stable(draft.units)) {
    out.push({
      part: 'units',
      words:
        published.units.length !== draft.units.length
          ? `Featured units: ${published.units.length} → ${draft.units.length}`
          : 'Featured units reordered',
    });
  }

  // 9. Highlights
  if (stable(published.highlights) !== stable(draft.highlights)) {
    out.push({
      part: 'highlights',
      words:
        published.highlights.length !== draft.highlights.length
          ? `Highlights: ${published.highlights.length} → ${draft.highlights.length}`
          : 'Highlights changed',
    });
  }

  // 13. FAQ
  if (stable(published.faq) !== stable(draft.faq)) {
    out.push({
      part: 'faq',
      words:
        published.faq.length !== draft.faq.length
          ? `FAQ: ${published.faq.length} → ${draft.faq.length}`
          : 'FAQ changed',
    });
  }

  // 15. Share and search (seo)
  if (stable(published.seo) !== stable(draft.seo)) {
    if ((published.seo.title ?? '') !== (draft.seo.title ?? '')) {
      out.push({ part: 'seo', words: 'Share title changed' });
    }
    if ((published.seo.description ?? '') !== (draft.seo.description ?? '')) {
      out.push({ part: 'seo', words: 'Share description changed' });
    }
    if (published.seo.sharePictureFile !== draft.seo.sharePictureFile) {
      out.push({ part: 'seo', words: 'Share picture changed' });
    }
    if (published.seo.hideFromSearch !== draft.seo.hideFromSearch) {
      out.push({
        part: 'seo',
        words: draft.seo.hideFromSearch ? 'Search indexing: hidden' : 'Search indexing: shown',
      });
    }
  }

  // Section show/hide switches
  for (const sectionKey of SECTION_SWITCH_KEYS) {
    const beforeOn = a.sections[sectionKey] ?? true;
    const afterOn = b.sections[sectionKey] ?? true;
    if (beforeOn !== afterOn) {
      out.push({
        part: PART_FOR_SWITCH[sectionKey],
        words: `${SECTION_SWITCH_NAMES[sectionKey]}: ${afterOn ? 'shown' : 'hidden'}`,
      });
    }
  }

  return out;
}
