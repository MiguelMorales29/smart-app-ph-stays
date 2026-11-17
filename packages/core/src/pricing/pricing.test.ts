import { describe, expect, it } from 'vitest';

import { centavos } from '../money/index.js';
import { calendarDate } from '../time/index.js';
import { GOLDEN_QUOTE_CASES } from './golden.js';
import { QUOTE_REFUSAL_REASONS, quoteRefusalReasonSchema, quoteStay, stayQuoteSchema } from './quoteStay.js';

describe('pricing / quoteStay', () => {
  it('defines at least 15 golden cases and validates QUOTE_REFUSAL_REASONS', () => {
    expect(GOLDEN_QUOTE_CASES.length).toBeGreaterThanOrEqual(15);
    for (const reason of QUOTE_REFUSAL_REASONS) {
      expect(quoteRefusalReasonSchema.parse(reason)).toBe(reason);
    }
  });

  it.each(GOLDEN_QUOTE_CASES)('matches golden case $id ($description)', (golden) => {
    const outcome = quoteStay(golden.input);

    if (!golden.expected.ok) {
      expect(outcome).toEqual({
        ok: false,
        reason: golden.expected.reason,
      });
      return;
    }

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(stayQuoteSchema.safeParse(outcome.data).success).toBe(true);
    expect(outcome.data.nights).toBe(golden.expected.nights);
    expect(outcome.data.nights_subtotal_centavos).toBe(golden.expected.nightsSubtotalCentavos);
    expect(outcome.data.discount_centavos).toBe(golden.expected.discountCentavos);
    expect(outcome.data.fees_subtotal_centavos).toBe(golden.expected.feesSubtotalCentavos);
    expect(outcome.data.total_centavos).toBe(golden.expected.totalCentavos);
    expect(outcome.data.required_centavos).toBe(golden.expected.requiredCentavos);

    const lineSum = outcome.data.lines.reduce((acc, line) => acc + line.amount_centavos, 0);
    expect(lineSum).toBe(outcome.data.total_centavos);
  });

  it('supports per_night fees and ignores inactive fees', () => {
    const baseCase = GOLDEN_QUOTE_CASES[0];
    if (!baseCase) {
      throw new Error('Missing golden case 0');
    }

    const outcome = quoteStay({
      ...baseCase.input,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-16'),
      fees: [
        {
          code: 'other',
          label: 'Pool heating',
          amount_centavos: centavos(20000),
          basis: 'per_night',
          is_active: true,
          sort_order: 0,
        },
        {
          code: 'cleaning',
          label: 'Inactive fee',
          amount_centavos: centavos(99900),
          basis: 'per_stay',
          is_active: false,
          sort_order: 1,
        },
      ],
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.data.fees_subtotal_centavos).toBe(40000);
      expect(outcome.data.total_centavos).toBe(540000);
    }
  });
});
