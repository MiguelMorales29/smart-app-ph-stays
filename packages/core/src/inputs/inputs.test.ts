import { describe, expect, it } from 'vitest';

import {
  HALF_HOUR_TIMES,
  HALF_HOUR_TIME_OPTIONS,
  checkSlugFormat,
  formatBankAccount,
  formatPesos,
  formatPhMobile,
  formatWallTime12h,
  formatWalletMobile,
  isHalfHourTime,
  isValidBankAccount,
  isValidPhMobile,
  isValidWalletMobile,
  normalizeBankAccount,
  normalizePhMobile,
  normalizeWalletMobile,
  parsePesosToCentavos,
  parseWallTime12h,
  slugifyPropertyName,
  suggestAlternativeSlugs,
} from './index.js';

describe('Philippine mobile helper (and GCash / Maya wallets)', () => {
  it('accepts 0917..., 917..., +63..., and 63... formats and normalizes to +639...', () => {
    expect(normalizePhMobile('09171234567')).toBe('+639171234567');
    expect(normalizePhMobile('0917 123 4567')).toBe('+639171234567');
    expect(normalizePhMobile('0917-123-4567')).toBe('+639171234567');
    expect(normalizePhMobile('9171234567')).toBe('+639171234567');
    expect(normalizePhMobile('+639171234567')).toBe('+639171234567');
    expect(normalizePhMobile('+63 917 123 4567')).toBe('+639171234567');
    expect(normalizePhMobile('639171234567')).toBe('+639171234567');
    expect(isValidPhMobile('0917 123 4567')).toBe(true);
    expect(normalizeWalletMobile('0917-123-4567')).toBe('+639171234567');
    expect(isValidWalletMobile('+639171234567')).toBe(true);
  });

  it('formats valid mobiles as 0917 123 4567', () => {
    expect(formatPhMobile('+639171234567')).toBe('0917 123 4567');
    expect(formatPhMobile('9171234567')).toBe('0917 123 4567');
    expect(formatWalletMobile('09171234567')).toBe('0917 123 4567');
    expect(formatPhMobile('bad')).toBe('bad');
  });

  it('rejects invalid mobile numbers', () => {
    expect(normalizePhMobile('')).toBeNull();
    expect(normalizePhMobile('0917123')).toBeNull();
    expect(normalizePhMobile('08171234567')).toBeNull();
    expect(normalizePhMobile('0917123456789')).toBeNull();
    expect(normalizePhMobile('+19171234567')).toBeNull();
    expect(normalizePhMobile('0917abc4567')).toBeNull();
    expect(isValidPhMobile('0281234567')).toBe(false);
    expect(isValidWalletMobile('not-a-mobile')).toBe(false);
  });
});

describe('bank account helper', () => {
  it('accepts 8–20 digits after removing spaces and dashes and formats in groups of 4', () => {
    expect(normalizeBankAccount('12345678')).toBe('12345678');
    expect(normalizeBankAccount('0012-3456-7890')).toBe('001234567890');
    expect(normalizeBankAccount('0012 3456 7890 1234 5678')).toBe('00123456789012345678');
    expect(isValidBankAccount('0012-3456-7890')).toBe(true);

    expect(formatBankAccount('12345678')).toBe('1234 5678');
    expect(formatBankAccount('001234567890')).toBe('0012 3456 7890');
    expect(formatBankAccount('0012-3456-7890-12')).toBe('0012 3456 7890 12');
    expect(formatBankAccount('short')).toBe('short');
  });

  it('rejects fewer than 8 digits, more than 20 digits, or non-digit characters', () => {
    expect(normalizeBankAccount('')).toBeNull();
    expect(normalizeBankAccount('1234567')).toBeNull();
    expect(normalizeBankAccount('123456789012345678901')).toBeNull();
    expect(normalizeBankAccount('1234ABCD5678')).toBeNull();
    expect(isValidBankAccount('1234-567')).toBe(false);
  });
});

describe('pesos helper', () => {
  it('parses comma, plain, peso-prefixed, decimal, and k shorthand inputs into centavos', () => {
    expect(parsePesosToCentavos('1,500')).toBe(150_000);
    expect(parsePesosToCentavos('1500')).toBe(150_000);
    expect(parsePesosToCentavos('₱1500')).toBe(150_000);
    expect(parsePesosToCentavos('₱ 1,500.50')).toBe(150_050);
    expect(parsePesosToCentavos('1.5k')).toBe(150_000);
    expect(parsePesosToCentavos('2.25K')).toBe(225_000);
    expect(parsePesosToCentavos('0')).toBe(0);
  });

  it('refuses negatives, more than 2 decimals, and non-numeric strings', () => {
    expect(parsePesosToCentavos('-1500')).toBeNull();
    expect(parsePesosToCentavos('-1.5k')).toBeNull();
    expect(parsePesosToCentavos('1500.125')).toBeNull();
    expect(parsePesosToCentavos('1.123456k')).toBeNull();
    expect(parsePesosToCentavos('')).toBeNull();
    expect(parsePesosToCentavos('free')).toBeNull();
  });

  it('formats centavos as ₱1,500 or ₱1,500.50', () => {
    expect(formatPesos(150_000)).toBe('₱1,500');
    expect(formatPesos(150_050)).toBe('₱1,500.50');
    expect(formatPesos(0)).toBe('₱0');
    expect(formatPesos(-50_000)).toBe('-₱500');
  });
});

describe('time helper', () => {
  it('exposes 48 thirty-minute choices and converts between 14:00 and 2:00 PM', () => {
    expect(HALF_HOUR_TIMES).toHaveLength(48);
    expect(HALF_HOUR_TIME_OPTIONS).toHaveLength(48);
    expect(HALF_HOUR_TIME_OPTIONS[0]).toEqual({ value: '00:00', label: '12:00 AM' });
    expect(HALF_HOUR_TIME_OPTIONS[28]).toEqual({ value: '14:00', label: '2:00 PM' });

    expect(formatWallTime12h('14:00')).toBe('2:00 PM');
    expect(formatWallTime12h('00:00')).toBe('12:00 AM');
    expect(formatWallTime12h('12:30:00')).toBe('12:30 PM');
    expect(formatWallTime12h('23:30')).toBe('11:30 PM');

    expect(parseWallTime12h('2:00 PM')).toBe('14:00');
    expect(parseWallTime12h('12:00 am')).toBe('00:00');
    expect(parseWallTime12h('12:30 PM')).toBe('12:30');
    expect(parseWallTime12h('14:00')).toBe('14:00');
    expect(isHalfHourTime('14:30')).toBe(true);
  });

  it('rejects non-30-minute times and malformed values', () => {
    expect(isHalfHourTime('14:15')).toBe(false);
    expect(formatWallTime12h('25:00')).toBeNull();
    expect(parseWallTime12h('2:15 PM')).toBeNull();
    expect(parseWallTime12h('14:15')).toBeNull();
    expect(parseWallTime12h('13:00 PM')).toBeNull();
    expect(parseWallTime12h('not-a-time')).toBeNull();
    expect(parseWallTime12h('2:15 PM', false)).toBe('14:15');
  });
});

describe('web address slug helper', () => {
  it('strips accents, apostrophes, expands &, replaces non-alnum with hyphens, and cuts at hyphen <= 40 chars', () => {
    expect(slugifyPropertyName('Piña & Café')).toBe('pina-and-cafe');
    expect(slugifyPropertyName("Tita Lorna's Dorm")).toBe('tita-lornas-dorm');
    expect(slugifyPropertyName('Tita Lorna’s ‘Cozy’ Suites')).toBe('tita-lornas-cozy-suites');
    expect(slugifyPropertyName('  Ulap   Suites --- Tagaytay! ')).toBe('ulap-suites-tagaytay');

    const longName = 'Casa Vista Grand Tagaytay Ridge Mountain Resort And Spa';
    const slug = slugifyPropertyName(longName);
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug).toBe('casa-vista-grand-tagaytay-ridge-mountain');
    expect(slug.endsWith('-')).toBe(false);
  });

  it('checks format against RESERVED_SLUGS and suggests up to 3 available alternatives', () => {
    expect(checkSlugFormat('ulap-suites')).toBe('valid');
    expect(checkSlugFormat('admin')).toBe('reserved');
    expect(checkSlugFormat('demo-media')).toBe('reserved');
    expect(checkSlugFormat('ab')).toBe('invalid');
    expect(checkSlugFormat('Bad_Slug')).toBe('invalid');
    expect(checkSlugFormat('a'.repeat(41))).toBe('invalid');

    const taken = new Set(['ulap-suites-stay']);
    const suggestions = suggestAlternativeSlugs('Ulap Suites', (c) => taken.has(c));
    expect(suggestions).toHaveLength(3);
    expect(suggestions).not.toContain('ulap-suites-stay');
    for (const s of suggestions) {
      expect(checkSlugFormat(s)).toBe('valid');
    }

    const reservedSuggestions = suggestAlternativeSlugs('admin');
    expect(reservedSuggestions).toHaveLength(3);
    for (const s of reservedSuggestions) {
      expect(checkSlugFormat(s)).toBe('valid');
    }
  });
});
