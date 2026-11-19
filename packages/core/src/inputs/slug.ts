import { SLUG_PATTERN, isReservedSlug } from '../lists/slugs.js';

export const MAX_SLUG_LENGTH = 40;
export const MIN_SLUG_LENGTH = 3;

export type SlugFormatStatus = 'valid' | 'reserved' | 'invalid';

/**
 * Converts a property name or raw string into a clean web address slug:
 * - removes accents (`ñ` -> `n`)
 * - removes straight (`'`) and curly (`'`, `'`) apostrophes
 * - turns `&` into `and`
 * - replaces anything else with hyphens
 * - truncates to at most 40 characters, cutting cleanly at a hyphen boundary
 */
export function slugifyPropertyName(raw: string): string {
  const cleaned = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0027\u2018\u2019]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (cleaned.length <= MAX_SLUG_LENGTH) {
    return cleaned;
  }

  const slice = cleaned.slice(0, MAX_SLUG_LENGTH);
  const nextChar = cleaned[MAX_SLUG_LENGTH];
  if (nextChar === '-') {
    return slice.replace(/-+$/g, '');
  }

  const lastHyphen = slice.lastIndexOf('-');
  if (lastHyphen >= MIN_SLUG_LENGTH) {
    return slice.slice(0, lastHyphen).replace(/-+$/g, '');
  }
  return slice.replace(/-+$/g, '');
}

/**
 * Checks whether a candidate slug has valid format (3–40 chars, lowercase letters/digits/single hyphens)
 * and is not in `RESERVED_SLUGS`.
 */
export function checkSlugFormat(slug: string): SlugFormatStatus {
  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return 'invalid';
  }
  if (isReservedSlug(slug)) {
    return 'reserved';
  }
  return 'valid';
}

const SUGGESTION_SUFFIXES = ['stay', 'ph', 'home', '2', '3', '4', '5'] as const;

/**
 * Suggests up to 3 valid, non-reserved, available slugs based on a raw or normalized input.
 */
export function suggestAlternativeSlugs(
  raw: string,
  isTaken: (candidate: string) => boolean = () => false,
): string[] {
  const base = slugifyPropertyName(raw);
  const seed = base.length >= MIN_SLUG_LENGTH ? base : `${base || 'my'}-stay`;
  const results: string[] = [];

  for (const suffix of SUGGESTION_SUFFIXES) {
    if (results.length >= 3) break;
    const maxBaseLen = MAX_SLUG_LENGTH - suffix.length - 1;
    const trimmedBase =
      seed.length <= maxBaseLen
        ? seed
        : slugifyPropertyName(seed.slice(0, maxBaseLen)).replace(/-+$/g, '');
    const candidate = trimmedBase.length > 0 ? `${trimmedBase}-${suffix}` : `stay-${suffix}`;
    if (
      checkSlugFormat(candidate) === 'valid' &&
      !isTaken(candidate) &&
      !results.includes(candidate)
    ) {
      results.push(candidate);
    }
  }

  return results;
}
