import { describe, expect, it } from 'vitest';

import { rateOverridesRow, unitFeesRow, weekdayRatesRow } from './price.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('price table schemas', () => {
  it('validates weekdayRatesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      unit_id: id3,
      iso_weekday: 5,
      nightly_centavos: 320000,
      created_at: ts,
      updated_at: ts,
    };
    expect(weekdayRatesRow.safeParse(valid).success).toBe(true);
    expect(weekdayRatesRow.safeParse({ ...valid, iso_weekday: 0 }).success).toBe(false);
    expect(weekdayRatesRow.safeParse({ ...valid, iso_weekday: 8 }).success).toBe(false);
    expect(weekdayRatesRow.safeParse({ ...valid, nightly_centavos: 0 }).success).toBe(false);
  });

  it('validates rateOverridesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      unit_id: id3,
      during: { start: '2026-12-24', end: '2026-12-26' },
      nightly_centavos: 450000,
      label: 'Christmas Eve & Day',
      created_at: ts,
      updated_at: ts,
    };
    expect(rateOverridesRow.safeParse(valid).success).toBe(true);
    expect(
      rateOverridesRow.safeParse({
        ...valid,
        during: { start: '2026-12-24', end: '2026-12-24' },
      }).success,
    ).toBe(false);
    expect(
      rateOverridesRow.safeParse({
        ...valid,
        during: { start: '2026-12-26', end: '2026-12-24' },
      }).success,
    ).toBe(false);
    expect(rateOverridesRow.safeParse({ ...valid, nightly_centavos: 0 }).success).toBe(false);
  });

  it('validates unitFeesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      unit_id: id3,
      code: 'cleaning',
      label: 'Cleaning fee',
      amount_centavos: 50000,
      basis: 'per_stay',
      is_active: true,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(unitFeesRow.safeParse(valid).success).toBe(true);
    expect(unitFeesRow.safeParse({ ...valid, code: 'resort_tax' }).success).toBe(false);
    expect(unitFeesRow.safeParse({ ...valid, basis: 'per_guest' }).success).toBe(false);
    expect(unitFeesRow.safeParse({ ...valid, amount_centavos: -100 }).success).toBe(false);
  });
});
