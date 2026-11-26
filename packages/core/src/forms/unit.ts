import { z } from 'zod';

import { uuidSchema } from '../ids/index.js';
import { positiveCentavosSchema, roomsRow, unitsRow } from '../schemas/tables/index.js';

export const unitFormSchema = z
  .object(unitsRow.shape)
  .pick({
    name: true,
    slug: true,
    mode: true,
    unit_type: true,
    description: true,
    max_guests: true,
    bedrooms: true,
    beds: true,
    bathrooms: true,
    floor_area_sqm: true,
    arrival_info: true,
  })
  .extend({
    amenity_ids: z.array(uuidSchema),
  });
export type UnitForm = z.infer<typeof unitFormSchema>;

/** Edit room (R-1b): what every bed in a shared room shares. */
export const roomFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter the room name.').max(40, 'Use up to 40 characters.'),
  guests: roomsRow.shape.guests,
  bathroom: roomsRow.shape.bathroom,
  description: z.string().max(2000, 'Use up to 2,000 characters.'),
});
export type RoomForm = z.infer<typeof roomFormSchema>;

export const bedSpacesFormSchema = z
  .object({
    room_name: z.string().trim().min(1, 'Enter the room name.').max(40),
    name_prefix: z.string().min(1, 'Enter a bed label prefix.').max(30),
    count: z.int().min(1).max(20),
    start_number: z.int().min(1).max(99),
    mode: unitsRow.shape.mode,
    bathrooms: unitsRow.shape.bathrooms,
    description: unitsRow.shape.description,
    amenity_ids: z.array(uuidSchema),
    monthly_rent_centavos: positiveCentavosSchema.nullable(),
    base_nightly_centavos: positiveCentavosSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'long_term' && data.monthly_rent_centavos === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthly_rent_centavos'],
        message: 'Enter a monthly rent above ₱0.',
      });
    }
    if (data.mode === 'short_stay' && data.base_nightly_centavos === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['base_nightly_centavos'],
        message: 'Enter a nightly price above ₱0.',
      });
    }
  });
export type BedSpacesForm = z.infer<typeof bedSpacesFormSchema>;
