import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import { feeBasisSchema, feeKindSchema } from '../../lists/index.js';
import { centavosSchema } from '../../money/index.js';
import { boundedDateRangeSchema, isoTimestampSchema, positiveCentavosSchema } from './common.js';

export const weekdayRatesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  unit_id: uuidSchema,
  iso_weekday: z.int().min(1).max(7),
  nightly_centavos: positiveCentavosSchema,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type WeekdayRatesRow = z.infer<typeof weekdayRatesRow>;

export const rateOverridesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  unit_id: uuidSchema,
  during: boundedDateRangeSchema,
  nightly_centavos: positiveCentavosSchema,
  label: z.string().max(80).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type RateOverridesRow = z.infer<typeof rateOverridesRow>;

export const unitFeesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  unit_id: uuidSchema,
  code: feeKindSchema,
  label: z.string().min(1).max(80),
  amount_centavos: centavosSchema,
  basis: feeBasisSchema,
  is_active: z.boolean(),
  sort_order: z.int().min(0),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type UnitFeesRow = z.infer<typeof unitFeesRow>;
