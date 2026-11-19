import { z } from 'zod';

import { houseRulesRow, propertiesRow } from '../schemas/tables/index.js';
import { checkCustomCancellationNote } from './rules.js';

export const policiesFormSchema = z
  .object(propertiesRow.shape)
  .pick({
    checkin_time: true,
    checkout_time: true,
    cancellation_preset: true,
    cancellation_note: true,
    rebook_min_days: true,
    rebook_within_months: true,
    guest_ids_required: true,
    guest_list_due_hours: true,
    arrival_info: true,
    privacy_contact: true,
  })
  .extend({
    house_rules: z.array(houseRulesRow.shape.body).max(20),
  })
  .superRefine(checkCustomCancellationNote);

export type PoliciesForm = z.infer<typeof policiesFormSchema>;
