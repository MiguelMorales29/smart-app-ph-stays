import { z } from 'zod';

import { centavos, centavosSchema, percentOf, signedCentavos, sum } from '../money/index.js';
import type { Centavos } from '../money/index.js';
import { bookingLinesRow, unitStayTermsRow, unitsRow } from '../schemas/tables/index.js';
import { rateOverridesRow, unitFeesRow, weekdayRatesRow } from '../schemas/tables/price.js';
import { calendarDateSchema, eachNight, nightsBetween, weekdayOf } from '../time/index.js';

export const QUOTE_REFUSAL_REASONS = [
  'invalid_guests',
  'too_many_guests',
  'min_nights',
  'max_nights',
  'advance_notice',
  'beyond_booking_window',
] as const;

export const quoteRefusalReasonSchema = z.enum(QUOTE_REFUSAL_REASONS);
export type QuoteRefusalReason = z.infer<typeof quoteRefusalReasonSchema>;

export const quoteStayTermsSchema = z
  .object(unitStayTermsRow.shape)
  .pick({
    base_nightly_centavos: true,
    base_guests: true,
    min_nights: true,
    max_nights: true,
    weekly_discount_percent: true,
    monthly_discount_percent: true,
    down_payment_percent: true,
    advance_notice_days: true,
    booking_window_days: true,
  })
  .extend(unitsRow.pick({ max_guests: true }).shape);
export type QuoteStayTerms = z.infer<typeof quoteStayTermsSchema>;

export const quoteWeekdayRateSchema = weekdayRatesRow.pick({
  iso_weekday: true,
  nightly_centavos: true,
});
export type QuoteWeekdayRate = z.infer<typeof quoteWeekdayRateSchema>;

export const quoteRateOverrideSchema = rateOverridesRow.pick({
  during: true,
  nightly_centavos: true,
  label: true,
});
export type QuoteRateOverride = z.infer<typeof quoteRateOverrideSchema>;

export const quoteUnitFeeSchema = unitFeesRow.pick({
  code: true,
  label: true,
  amount_centavos: true,
  basis: true,
  is_active: true,
  sort_order: true,
});
export type QuoteUnitFee = z.infer<typeof quoteUnitFeeSchema>;

export const quoteLineSchema = z.object(bookingLinesRow.shape).pick({
  kind: true,
  label: true,
  stay_date: true,
  quantity: true,
  unit_centavos: true,
  amount_centavos: true,
  sort_order: true,
});
export type QuoteLine = z.infer<typeof quoteLineSchema>;

export const stayQuoteSchema = z.object({
  check_in: calendarDateSchema,
  check_out: calendarDateSchema,
  nights: z.int().min(1),
  adults: z.int().min(1),
  children: z.int().min(0),
  lines: z.array(quoteLineSchema),
  nights_subtotal_centavos: centavosSchema,
  discount_centavos: centavosSchema,
  fees_subtotal_centavos: centavosSchema,
  total_centavos: centavosSchema,
  required_centavos: centavosSchema,
});
export type StayQuote = z.infer<typeof stayQuoteSchema>;

export type QuoteStayOutcome =
  | { readonly ok: true; readonly data: StayQuote }
  | { readonly ok: false; readonly reason: QuoteRefusalReason };

export interface QuoteStayInput {
  readonly terms: QuoteStayTerms;
  readonly weekdayRates: readonly QuoteWeekdayRate[];
  readonly rateOverrides: readonly QuoteRateOverride[];
  readonly fees: readonly QuoteUnitFee[];
  readonly checkIn: z.infer<typeof calendarDateSchema>;
  readonly checkOut: z.infer<typeof calendarDateSchema>;
  readonly adults: number;
  readonly children: number;
  readonly today: z.infer<typeof calendarDateSchema>;
}

export function quoteStay(input: QuoteStayInput): QuoteStayOutcome {
  const { terms, weekdayRates, rateOverrides, fees, checkIn, checkOut, adults, children, today } =
    input;

  if (!Number.isInteger(adults) || !Number.isInteger(children) || adults < 1 || children < 0) {
    return { ok: false, reason: 'invalid_guests' };
  }

  const totalGuests = adults + children;
  if (totalGuests > terms.max_guests) {
    return { ok: false, reason: 'too_many_guests' };
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < terms.min_nights) {
    return { ok: false, reason: 'min_nights' };
  }

  if (nights > terms.max_nights) {
    return { ok: false, reason: 'max_nights' };
  }

  if (nightsBetween(today, checkIn) < terms.advance_notice_days) {
    return { ok: false, reason: 'advance_notice' };
  }

  const stayNights = eachNight(checkIn, checkOut);
  for (const nightDate of stayNights) {
    if (nightsBetween(today, nightDate) > terms.booking_window_days) {
      return { ok: false, reason: 'beyond_booking_window' };
    }
  }

  const lines: QuoteLine[] = [];
  const nightAmounts: Centavos[] = [];

  for (const nightDate of stayNights) {
    const matchedOverride = rateOverrides.find(
      (override) =>
        nightsBetween(override.during.start, nightDate) >= 0 &&
        nightsBetween(nightDate, override.during.end) > 0,
    );

    let nightRate: Centavos;
    let label = `Night of ${nightDate}`;

    if (matchedOverride !== undefined) {
      nightRate = matchedOverride.nightly_centavos;
      if (matchedOverride.label !== null && matchedOverride.label.trim().length > 0) {
        label = `Night of ${nightDate} (${matchedOverride.label})`;
      }
    } else {
      const weekday = weekdayOf(nightDate);
      const isoWeekday = weekday === 0 ? 7 : weekday;
      const matchedWeekday = weekdayRates.find((rate) => rate.iso_weekday === isoWeekday);
      nightRate =
        matchedWeekday !== undefined
          ? matchedWeekday.nightly_centavos
          : terms.base_nightly_centavos;
    }

    nightAmounts.push(nightRate);
    lines.push({
      kind: 'night',
      label,
      stay_date: nightDate,
      quantity: 1,
      unit_centavos: nightRate,
      amount_centavos: signedCentavos(nightRate),
      sort_order: lines.length,
    });
  }

  const nightsSubtotalCentavos = sum(nightAmounts);

  let discountPercent = 0;
  let discountLabel = '';
  if (nights >= 28) {
    if (terms.monthly_discount_percent >= terms.weekly_discount_percent) {
      discountPercent = terms.monthly_discount_percent;
      discountLabel = `Monthly discount (${discountPercent}%)`;
    } else {
      discountPercent = terms.weekly_discount_percent;
      discountLabel = `Weekly discount (${discountPercent}%)`;
    }
  } else if (nights >= 7) {
    discountPercent = terms.weekly_discount_percent;
    discountLabel = `Weekly discount (${discountPercent}%)`;
  }

  const discountCentavos =
    discountPercent > 0 ? percentOf(nightsSubtotalCentavos, discountPercent) : centavos(0);

  if (discountCentavos > 0) {
    lines.push({
      kind: 'discount',
      label: discountLabel,
      stay_date: null,
      quantity: 1,
      unit_centavos: discountCentavos,
      amount_centavos: signedCentavos(-discountCentavos),
      sort_order: lines.length,
    });
  }

  const extraGuests = Math.max(0, totalGuests - terms.base_guests);
  const activeFees = [...fees]
    .filter((fee) => fee.is_active && fee.amount_centavos > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  const feeAmounts: Centavos[] = [];

  for (const fee of activeFees) {
    let quantity = 0;
    if (fee.basis === 'per_stay') {
      quantity = 1;
    } else if (fee.basis === 'per_night') {
      quantity = nights;
    } else if (fee.basis === 'per_extra_guest_per_night') {
      quantity = extraGuests * nights;
    }

    if (quantity <= 0) {
      continue;
    }

    const feeTotal = centavos(quantity * fee.amount_centavos);
    feeAmounts.push(feeTotal);
    lines.push({
      kind: 'fee',
      label: fee.label,
      stay_date: null,
      quantity,
      unit_centavos: fee.amount_centavos,
      amount_centavos: signedCentavos(feeTotal),
      sort_order: lines.length,
    });
  }

  const feesSubtotalCentavos = sum(feeAmounts);
  const totalCentavos = centavos(nightsSubtotalCentavos - discountCentavos + feesSubtotalCentavos);
  const requiredCentavos = percentOf(totalCentavos, terms.down_payment_percent);

  return {
    ok: true,
    data: {
      check_in: checkIn,
      check_out: checkOut,
      nights,
      adults,
      children,
      lines,
      nights_subtotal_centavos: nightsSubtotalCentavos,
      discount_centavos: discountCentavos,
      fees_subtotal_centavos: feesSubtotalCentavos,
      total_centavos: totalCentavos,
      required_centavos: requiredCentavos,
    },
  };
}
