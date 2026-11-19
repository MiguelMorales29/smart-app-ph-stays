import { z } from 'zod';

import { propertiesRow } from '../schemas/tables/index.js';
import { checkNonOverlappingWeeklyHours } from './rules.js';

export const hoursFormSchema = z
  .object(propertiesRow.shape)
  .pick({
    reply_hours: true,
    viewing_hours: true,
  })
  .superRefine((data, ctx) => {
    checkNonOverlappingWeeklyHours(data.reply_hours, 'reply_hours', ctx);
    checkNonOverlappingWeeklyHours(data.viewing_hours, 'viewing_hours', ctx);
  });

export type HoursForm = z.infer<typeof hoursFormSchema>;
