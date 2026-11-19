import { z } from 'zod';

import { propertiesRow } from '../schemas/tables/index.js';
import { checkLatLngPair } from './rules.js';

export const propertyFormSchema = z
  .object(propertiesRow.shape)
  .pick({
    name: true,
    slug: true,
    tagline: true,
    description: true,
    address_line: true,
    barangay: true,
    city: true,
    province: true,
    region: true,
    latitude: true,
    longitude: true,
    map_url: true,
    show_exact_location: true,
    contact: true,
    privacy_contact: true,
    logo_file_id: true,
  })
  .superRefine(checkLatLngPair);

export type PropertyForm = z.infer<typeof propertyFormSchema>;
