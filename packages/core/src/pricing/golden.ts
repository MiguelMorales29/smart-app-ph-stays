import { centavos } from '../money/index.js';
import { calendarDate } from '../time/index.js';
import type {
  QuoteRateOverride,
  QuoteRefusalReason,
  QuoteStayInput,
  QuoteStayTerms,
  QuoteUnitFee,
  QuoteWeekdayRate,
} from './quoteStay.js';

export type GoldenQuoteExpected =
  | {
      readonly ok: true;
      readonly nights: number;
      readonly nightsSubtotalCentavos: number;
      readonly discountCentavos: number;
      readonly feesSubtotalCentavos: number;
      readonly totalCentavos: number;
      readonly requiredCentavos: number;
    }
  | {
      readonly ok: false;
      readonly reason: QuoteRefusalReason;
    };

export interface GoldenQuoteCase {
  readonly id: string;
  readonly description: string;
  readonly input: QuoteStayInput;
  readonly expected: GoldenQuoteExpected;
}

const TODAY = calendarDate('2026-12-10'); // Thursday

const BASE_TERMS: QuoteStayTerms = {
  base_nightly_centavos: centavos(250000), // ₱2,500.00
  base_guests: 2,
  max_guests: 6,
  min_nights: 1,
  max_nights: 30,
  weekly_discount_percent: 10,
  monthly_discount_percent: 25,
  down_payment_percent: 50,
  advance_notice_days: 1,
  booking_window_days: 365,
};

const WEEKEND_RATES: readonly QuoteWeekdayRate[] = [
  { iso_weekday: 5, nightly_centavos: centavos(320000) }, // Friday: ₱3,200.00
  { iso_weekday: 6, nightly_centavos: centavos(320000) }, // Saturday: ₱3,200.00
];

const HOLIDAY_OVERRIDES: readonly QuoteRateOverride[] = [
  {
    during: { start: calendarDate('2026-12-24'), end: calendarDate('2026-12-26') }, // Dec 24 & 25
    nightly_centavos: centavos(450000), // ₱4,500.00
    label: 'Christmas',
  },
];

const STANDARD_FEES: readonly QuoteUnitFee[] = [
  {
    code: 'cleaning',
    label: 'Cleaning fee',
    amount_centavos: centavos(50000), // ₱500.00 per stay
    basis: 'per_stay',
    is_active: true,
    sort_order: 0,
  },
  {
    code: 'extra_guest',
    label: 'Extra guest fee',
    amount_centavos: centavos(30000), // ₱300.00 per extra guest per night
    basis: 'per_extra_guest_per_night',
    is_active: true,
    sort_order: 1,
  },
];

export const GOLDEN_QUOTE_CASES: readonly GoldenQuoteCase[] = [
  {
    id: 'G01_weeknight_single',
    description: '1 weeknight (Mon Dec 14 -> Tue Dec 15), 2 adults, base rate + cleaning',
    // Hand math:
    // - Night 2026-12-14 (Mon): 250,000
    // - Discount: 0
    // - Cleaning fee: 50,000
    // - Total: 250,000 + 50,000 = 300,000 (₱3,000.00)
    // - Down payment (50%): 150,000 (₱1,500.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-15'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 1,
      nightsSubtotalCentavos: 250000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 300000,
      requiredCentavos: 150000,
    },
  },
  {
    id: 'G02_weekend_two_nights',
    description: '2 weekend nights (Fri Dec 11 -> Sun Dec 13), 2 adults',
    // Hand math:
    // - Fri 2026-12-11: 320,000
    // - Sat 2026-12-12: 320,000
    // - Nights subtotal: 640,000
    // - Cleaning fee: 50,000
    // - Total: 690,000 (₱6,900.00)
    // - Down payment (50%): 345,000 (₱3,450.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-11'),
      checkOut: calendarDate('2026-12-13'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 2,
      nightsSubtotalCentavos: 640000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 690000,
      requiredCentavos: 345000,
    },
  },
  {
    id: 'G03_holiday_override_beats_weekday',
    description: '2 nights inside Christmas override (Thu Dec 24 -> Sat Dec 26)',
    // Hand math:
    // - Thu 2026-12-24 (override): 450,000
    // - Fri 2026-12-25 (override beats Friday 320,000): 450,000
    // - Nights subtotal: 900,000
    // - Cleaning fee: 50,000
    // - Total: 950,000 (₱9,500.00)
    // - Down payment (50%): 475,000 (₱4,750.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-24'),
      checkOut: calendarDate('2026-12-26'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 2,
      nightsSubtotalCentavos: 900000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 950000,
      requiredCentavos: 475000,
    },
  },
  {
    id: 'G04_crossing_into_and_out_of_override',
    description: '4 nights crossing override and weekend (Wed Dec 23 -> Sun Dec 27)',
    // Hand math:
    // - Wed 2026-12-23 (base): 250,000
    // - Thu 2026-12-24 (override): 450,000
    // - Fri 2026-12-25 (override): 450,000
    // - Sat 2026-12-26 (weekend): 320,000
    // - Nights subtotal: 250,000 + 450,000 + 450,000 + 320,000 = 1,470,000
    // - Cleaning fee: 50,000
    // - Total: 1,520,000 (₱15,200.00)
    // - Down payment (50%): 760,000 (₱7,600.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-23'),
      checkOut: calendarDate('2026-12-27'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 4,
      nightsSubtotalCentavos: 1470000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 1520000,
      requiredCentavos: 760000,
    },
  },
  {
    id: 'G05_seven_nights_weekly_discount',
    description: '7 nights (Mon Dec 14 -> Mon Dec 21) applies 10% weekly discount to nights only',
    // Hand math:
    // - 5 weeknights @ 250,000 = 1,250,000
    // - 2 weekend nights (Fri Dec 18, Sat Dec 19) @ 320,000 = 640,000
    // - Nights subtotal: 1,890,000
    // - Weekly discount (10% of 1,890,000): 189,000
    // - Cleaning fee: 50,000 (not discounted)
    // - Total: 1,890,000 - 189,000 + 50,000 = 1,751,000 (₱17,510.00)
    // - Down payment (50%): 875,500 (₱8,755.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-21'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 7,
      nightsSubtotalCentavos: 1890000,
      discountCentavos: 189000,
      feesSubtotalCentavos: 50000,
      totalCentavos: 1751000,
      requiredCentavos: 875500,
    },
  },
  {
    id: 'G06_twenty_eight_nights_monthly_discount',
    description: '28 nights (Jan 4 -> Feb 1, 2027) applies only the larger 25% monthly discount',
    // Hand math:
    // - 4 full weeks = 20 weeknights @ 250,000 (5,000,000) + 8 weekend nights @ 320,000 (2,560,000)
    // - Nights subtotal: 7,560,000
    // - Monthly discount (25% of 7,560,000): 1,890,000
    // - Cleaning fee: 50,000
    // - Total: 7,560,000 - 1,890,000 + 50,000 = 5,720,000 (₱57,200.00)
    // - Down payment (50%): 2,860,000 (₱28,600.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2027-01-04'),
      checkOut: calendarDate('2027-02-01'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 28,
      nightsSubtotalCentavos: 7560000,
      discountCentavos: 1890000,
      feesSubtotalCentavos: 50000,
      totalCentavos: 5720000,
      requiredCentavos: 2860000,
    },
  },
  {
    id: 'G07_twenty_eight_nights_weekly_larger_than_monthly',
    description: '28 nights when weekly_discount_percent (20%) > monthly_discount_percent (15%)',
    // Hand math:
    // - Nights subtotal: 7,560,000
    // - Larger discount (20% of 7,560,000): 1,512,000
    // - Cleaning fee: 50,000
    // - Total: 7,560,000 - 1,512,000 + 50,000 = 6,098,000
    // - Down payment (50%): 3,049,000
    input: {
      terms: {
        ...BASE_TERMS,
        weekly_discount_percent: 20,
        monthly_discount_percent: 15,
      },
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2027-01-04'),
      checkOut: calendarDate('2027-02-01'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 28,
      nightsSubtotalCentavos: 7560000,
      discountCentavos: 1512000,
      feesSubtotalCentavos: 50000,
      totalCentavos: 6098000,
      requiredCentavos: 3049000,
    },
  },
  {
    id: 'G08_extra_guests_fee',
    description:
      '3 weeknights (Mon Dec 14 -> Thu Dec 17) with 3 adults + 2 children (3 extra guests)',
    // Hand math:
    // - 3 weeknights @ 250,000 = 750,000
    // - Extra guests: (3 + 2) - 2 = 3 extra guests * 3 nights * 30,000 = 270,000
    // - Cleaning fee: 50,000
    // - Fees subtotal: 320,000
    // - Total: 750,000 + 320,000 = 1,070,000 (₱10,700.00)
    // - Down payment (50%): 535,000 (₱5,350.00)
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-17'),
      adults: 3,
      children: 2,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 3,
      nightsSubtotalCentavos: 750000,
      discountCentavos: 0,
      feesSubtotalCentavos: 320000,
      totalCentavos: 1070000,
      requiredCentavos: 535000,
    },
  },
  {
    id: 'G09_ten_percent_down_payment',
    description: '2 weeknights with 10% down payment',
    // Hand math:
    // - 2 weeknights @ 250,000 = 500,000
    // - Cleaning fee: 50,000
    // - Total: 550,000 (₱5,500.00)
    // - Down payment (10%): 55,000 (₱550.00)
    input: {
      terms: { ...BASE_TERMS, down_payment_percent: 10 },
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-16'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 2,
      nightsSubtotalCentavos: 500000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 550000,
      requiredCentavos: 55000,
    },
  },
  {
    id: 'G10_hundred_percent_down_payment',
    description: '2 weeknights with 100% full payment required at hold',
    // Hand math:
    // - 2 weeknights @ 250,000 = 500,000
    // - Cleaning fee: 50,000
    // - Total: 550,000 (₱5,500.00)
    // - Down payment (100%): 550,000 (₱5,500.00)
    input: {
      terms: { ...BASE_TERMS, down_payment_percent: 100 },
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-16'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: true,
      nights: 2,
      nightsSubtotalCentavos: 500000,
      discountCentavos: 0,
      feesSubtotalCentavos: 50000,
      totalCentavos: 550000,
      requiredCentavos: 550000,
    },
  },
  {
    id: 'G11_refusal_min_nights',
    description: 'Refuses 1-night stay when min_nights is 2',
    input: {
      terms: { ...BASE_TERMS, min_nights: 2 },
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-15'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'min_nights',
    },
  },
  {
    id: 'G12_refusal_max_nights',
    description: 'Refuses 15-night stay when max_nights is 14',
    input: {
      terms: { ...BASE_TERMS, max_nights: 14 },
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-29'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'max_nights',
    },
  },
  {
    id: 'G13_refusal_too_many_guests',
    description: 'Refuses 5 adults + 2 children when max_guests is 6',
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-16'),
      adults: 5,
      children: 2,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'too_many_guests',
    },
  },
  {
    id: 'G14_refusal_advance_notice',
    description: 'Refuses same-day check-in (2026-12-10) when advance_notice_days is 1',
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-10'),
      checkOut: calendarDate('2026-12-12'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'advance_notice',
    },
  },
  {
    id: 'G15_refusal_beyond_booking_window',
    description: 'Refuses stay beyond 365-day booking window (2027-12-15)',
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2027-12-15'),
      checkOut: calendarDate('2027-12-17'),
      adults: 2,
      children: 0,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'beyond_booking_window',
    },
  },
  {
    id: 'G16_refusal_invalid_guests',
    description: 'Refuses 0 adults',
    input: {
      terms: BASE_TERMS,
      weekdayRates: WEEKEND_RATES,
      rateOverrides: HOLIDAY_OVERRIDES,
      fees: STANDARD_FEES,
      checkIn: calendarDate('2026-12-14'),
      checkOut: calendarDate('2026-12-16'),
      adults: 0,
      children: 2,
      today: TODAY,
    },
    expected: {
      ok: false,
      reason: 'invalid_guests',
    },
  },
] as const;
