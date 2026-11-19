import { z } from 'zod';

import {
  rateOverridesRow,
  unitFeesRow,
  unitStayTermsRow,
  weekdayRatesRow,
} from '../schemas/tables/index.js';
import { checkMinMaxNights } from './rules.js';

export const weekdayRateInputSchema = z.object(weekdayRatesRow.shape).pick({
  iso_weekday: true,
  nightly_centavos: true,
});

export const rateOverrideInputSchema = z.object(rateOverridesRow.shape).pick({
  during: true,
  nightly_centavos: true,
  label: true,
});

export const unitFeeInputSchema = z.object(unitFeesRow.shape).pick({
  code: true,
  label: true,
  amount_centavos: true,
  basis: true,
  is_active: true,
});

export const unitPricesFormSchema = z
  .object(unitStayTermsRow.shape)
  .pick({
    base_nightly_centavos: true,
    base_guests: true,
    min_nights: true,
    max_nights: true,
    prep_nights: true,
    weekly_discount_percent: true,
    monthly_discount_percent: true,
    down_payment_percent: true,
    hold_minutes: true,
    advance_notice_days: true,
    booking_window_days: true,
  })
  .extend({
    weekday_rates: z.array(weekdayRateInputSchema).max(7),
    rate_overrides: z.array(rateOverrideInputSchema).max(60),
    fees: z.array(unitFeeInputSchema).max(10),
  })
  .superRefine((data, ctx) => {
    checkMinMaxNights(data, ctx);

    const seenDays = new Set<number>();
    for (let i = 0; i < data.weekday_rates.length; i += 1) {
      const rate = data.weekday_rates[i];
      if (!rate) continue;
      if (seenDays.has(rate.iso_weekday)) {
        ctx.addIssue({
          code: 'custom',
          path: ['weekday_rates', i, 'iso_weekday'],
          message: 'Each weekday can only have one price.',
        });
      }
      seenDays.add(rate.iso_weekday);
    }
  });

export type UnitPricesForm = z.infer<typeof unitPricesFormSchema>;
