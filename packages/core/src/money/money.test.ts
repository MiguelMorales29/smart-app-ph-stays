import { describe, expect, it } from 'vitest';

import {
  centavos,
  centavosSchema,
  formatPeso,
  percentOf,
  pesos,
  signedCentavos,
  signedCentavosSchema,
  sum,
} from './index.js';

describe('money', () => {
  describe('centavosSchema and centavos', () => {
    it('accepts zero and positive integers', () => {
      expect(centavosSchema.parse(0)).toBe(0);
      expect(centavos(59900)).toBe(59900);
    });

    it('rejects negative numbers, floats, and non-finite values', () => {
      expect(centavosSchema.safeParse(-1).success).toBe(false);
      expect(centavosSchema.safeParse(12.5).success).toBe(false);
      expect(centavosSchema.safeParse(Number.NaN).success).toBe(false);
      expect(centavosSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    });
  });

  describe('signedCentavosSchema and signedCentavos', () => {
    it('accepts negative, zero, and positive integers', () => {
      expect(signedCentavosSchema.parse(-25000)).toBe(-25000);
      expect(signedCentavos(0)).toBe(0);
      expect(signedCentavos(25000)).toBe(25000);
    });

    it('rejects floats and non-finite values', () => {
      expect(signedCentavosSchema.safeParse(-12.5).success).toBe(false);
      expect(signedCentavosSchema.safeParse(Number.NaN).success).toBe(false);
    });
  });

  describe('pesos', () => {
    it('converts whole and two-decimal peso amounts to integer centavos', () => {
      expect(pesos(0)).toBe(0);
      expect(pesos(599)).toBe(59900);
      expect(pesos(2600.5)).toBe(260050);
      expect(pesos(19.99)).toBe(1999);
      expect(pesos(1250000)).toBe(125000000);
    });

    it('rejects negative amounts, non-finite values, and sub-centavo fractions', () => {
      expect(() => pesos(-1)).toThrow(RangeError);
      expect(() => pesos(Number.NaN)).toThrow(RangeError);
      expect(() => pesos(1.005)).toThrow(RangeError);
    });
  });

  describe('formatPeso', () => {
    it('formats whole pesos without decimals and fractional pesos with two decimals', () => {
      expect(formatPeso(pesos(0))).toBe('₱0');
      expect(formatPeso(pesos(2600))).toBe('₱2,600');
      expect(formatPeso(pesos(2600.5))).toBe('₱2,600.50');
      expect(formatPeso(pesos(2600.05))).toBe('₱2,600.05');
      expect(formatPeso(pesos(1250000))).toBe('₱1,250,000');
    });

    it('formats negative signed centavos for discount lines', () => {
      expect(formatPeso(signedCentavos(-50000))).toBe('-₱500');
      expect(formatPeso(signedCentavos(-50050))).toBe('-₱500.50');
    });

    it('rejects non-integer values', () => {
      expect(() => formatPeso(12.34)).toThrow(RangeError);
    });
  });

  describe('sum', () => {
    it('sums an array of centavos amounts', () => {
      expect(sum([])).toBe(0);
      expect(sum([pesos(2600), pesos(500.5), pesos(100.5)])).toBe(320100);
    });
  });

  describe('percentOf', () => {
    it('computes exact percentages and rounds half-up to the nearest centavo', () => {
      expect(percentOf(pesos(2600), 0)).toBe(0);
      expect(percentOf(pesos(2600), 100)).toBe(260000);
      expect(percentOf(pesos(2600), 50)).toBe(130000);
      expect(percentOf(centavos(1), 50)).toBe(1); // 0.5 -> 1 (half-up)
      expect(percentOf(centavos(3), 50)).toBe(2); // 1.5 -> 2 (half-up)
      expect(percentOf(centavos(333), 10)).toBe(33); // 33.3 -> 33
      expect(percentOf(centavos(335), 10)).toBe(34); // 33.5 -> 34 (half-up)
      expect(percentOf(pesos(1000), 12.5)).toBe(12500);
    });

    it('rejects negative or non-finite percents', () => {
      expect(() => percentOf(pesos(100), -5)).toThrow(RangeError);
      expect(() => percentOf(pesos(100), Number.NaN)).toThrow(RangeError);
    });
  });
});
