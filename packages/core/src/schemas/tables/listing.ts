import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  amenityGroupSchema,
  bankSchema,
  cancellationPresetSchema,
  downPaymentKindSchema,
  paymentAccountMethodSchema,
  propertySlugSchema,
  propertyStatusSchema,
  roomBathroomSchema,
  roomGuestsSchema,
  unitModeSchema,
  unitSlugSchema,
  unitStatusSchema,
  unitTypeSchema,
} from '../../lists/index.js';
import { centavosSchema } from '../../money/index.js';
import { calendarDateSchema } from '../../time/index.js';
import {
  isoTimestampSchema,
  positiveCentavosSchema,
  propertyContactSchema,
  propertyPageDraftSchema,
  wallTimeSchema,
  weeklyHoursSchema,
} from './common.js';

export const propertiesRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    slug: propertySlugSchema,
    old_slugs: z.array(propertySlugSchema),
    name: z.string().min(1).max(80),
    tagline: z.string().max(80).nullable(),
    description: z.string().max(4000).nullable(),
    address_line: z.string().min(1).max(200),
    barangay: z.string().max(120).nullable(),
    city: z.string().min(1).max(80),
    province: z.string().min(1).max(80),
    region: z.string().min(1).max(80),
    country: z.string().length(2),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    map_url: z.string().max(500).nullable(),
    checkin_time: wallTimeSchema,
    checkout_time: wallTimeSchema,
    arrival_info: z.string().max(2000).nullable(),
    cancellation_preset: cancellationPresetSchema,
    cancellation_note: z.string().max(1000).nullable(),
    privacy_contact: z.email(),
    logo_file_id: uuidSchema.nullable(),
    status: propertyStatusSchema,
    published_at: isoTimestampSchema.nullable(),
    archived_at: isoTimestampSchema.nullable(),
    rebook_min_days: z.int().min(0).max(365),
    rebook_within_months: z.int().min(1).max(24),
    guest_ids_required: z.boolean(),
    guest_list_due_hours: z.int().min(0).max(168),
    contact: propertyContactSchema,
    show_exact_location: z.boolean(),
    reply_hours: weeklyHoursSchema.nullable(),
    viewing_hours: weeklyHoursSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => (row.latitude === null) === (row.longitude === null), {
    message: 'latitude and longitude must both be set or both be null.',
  })
  .refine(
    (row) =>
      row.cancellation_preset !== 'custom' ||
      (row.cancellation_note !== null && row.cancellation_note.trim().length > 0),
    {
      message: 'cancellation_note is required when cancellation_preset is custom.',
    },
  );
export type PropertiesRow = z.infer<typeof propertiesRow>;

export const propertyPagesRow = z.object({
  property_id: uuidSchema,
  account_id: uuidSchema,
  draft: propertyPageDraftSchema,
  published: propertyPageDraftSchema.nullable(),
  draft_rev: z.int().min(0),
  version: z.int().min(0),
  draft_updated_at: isoTimestampSchema,
  published_at: isoTimestampSchema.nullable(),
  published_by: uuidSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type PropertyPagesRow = z.infer<typeof propertyPagesRow>;

/**
 * A shared room whose beds are rented one by one (R-1b, D92). The room holds what every bed shares
 * (name, who may stay, bathroom, description); each bed is a `units` row with `room_id` set.
 */
export const roomsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  property_id: uuidSchema,
  name: z.string().trim().min(1).max(40),
  guests: roomGuestsSchema,
  bathroom: roomBathroomSchema,
  description: z.string().max(2000).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type RoomsRow = z.infer<typeof roomsRow>;

export const unitsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  property_id: uuidSchema,
  slug: unitSlugSchema,
  name: z.string().min(1).max(80),
  mode: unitModeSchema,
  unit_type: unitTypeSchema,
  /** Set for bed spaces only: the shared room the bed is in. */
  room_id: uuidSchema.nullable(),
  description: z.string().max(4000).nullable(),
  max_guests: z.int().min(1),
  bedrooms: z.int().min(0),
  beds: z.int().min(0),
  bathrooms: z
    .number()
    .min(0)
    .max(99.9)
    .refine((value) => Number.isInteger(value * 10), {
      message: 'bathrooms may have at most one decimal place.',
    }),
  floor_area_sqm: z
    .number()
    .gt(0)
    .max(99999.9)
    .refine((value) => Number.isInteger(value * 10), {
      message: 'floor_area_sqm may have at most one decimal place.',
    })
    .nullable(),
  arrival_info: z.string().max(2000).nullable(),
  sort_order: z.int().min(0),
  status: unitStatusSchema,
  archived_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type UnitsRow = z.infer<typeof unitsRow>;

export const unitStayTermsRow = z
  .object({
    unit_id: uuidSchema,
    account_id: uuidSchema,
    base_nightly_centavos: positiveCentavosSchema,
    base_guests: z.int().min(1),
    min_nights: z.int().min(1).max(365),
    max_nights: z.int().min(1).max(365),
    prep_nights: z.int().min(0).max(2),
    weekly_discount_percent: z.int().min(0).max(90),
    monthly_discount_percent: z.int().min(0).max(90),
    down_payment_percent: z.int().min(10).max(100),
    /** R-3 (D93): `fixed` uses `down_payment_centavos`, capped at the stay total. */
    down_payment_kind: downPaymentKindSchema,
    down_payment_centavos: positiveCentavosSchema.nullable(),
    hold_minutes: z.int().min(15).max(1440),
    advance_notice_days: z.int().min(0).max(365),
    booking_window_days: z.int().min(1).max(730),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => row.max_nights >= row.min_nights, {
    message: 'max_nights must be greater than or equal to min_nights.',
  })
  .refine((row) => row.down_payment_kind === 'percent' || row.down_payment_centavos !== null, {
    message: 'A fixed down payment needs an amount.',
    path: ['down_payment_centavos'],
  });
export type UnitStayTermsRow = z.infer<typeof unitStayTermsRow>;

export const unitLeaseTermsRow = z.object({
  unit_id: uuidSchema,
  account_id: uuidSchema,
  monthly_rent_centavos: positiveCentavosSchema,
  min_lease_months: z.int().min(1),
  advance_months: z.int().min(0),
  deposit_months: z.int().min(0),
  reservation_fee_centavos: centavosSchema,
  available_from: calendarDateSchema,
  inclusions: z.string().max(1000).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type UnitLeaseTermsRow = z.infer<typeof unitLeaseTermsRow>;

export const listingPhotosRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  property_id: uuidSchema,
  unit_id: uuidSchema.nullable(),
  file_id: uuidSchema,
  alt_text: z.string().min(1).max(160),
  sort_order: z.int().min(0),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type ListingPhotosRow = z.infer<typeof listingPhotosRow>;

/**
 * An amenity's icon (D93): a Lucide icon name ("wifi") or an emoji the owner picked ("emoji:🏓").
 */
export const amenityIconSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^(emoji:.{1,16}|[a-z0-9-]{1,50})$/u, 'Pick an icon or an emoji.');

export const amenitiesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema.nullable(),
  code: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  icon: amenityIconSchema,
  grp: amenityGroupSchema,
  sort_order: z.int().min(0),
  is_active: z.boolean(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type AmenitiesRow = z.infer<typeof amenitiesRow>;

export const unitAmenitiesRow = z.object({
  account_id: uuidSchema,
  unit_id: uuidSchema,
  amenity_id: uuidSchema,
  created_at: isoTimestampSchema,
});
export type UnitAmenitiesRow = z.infer<typeof unitAmenitiesRow>;

/** Amenities set once for the whole property ("At the property", R-3, D93): every unit shows them. */
export const propertyAmenitiesRow = z.object({
  account_id: uuidSchema,
  property_id: uuidSchema,
  amenity_id: uuidSchema,
  created_at: isoTimestampSchema,
});
export type PropertyAmenitiesRow = z.infer<typeof propertyAmenitiesRow>;

export const houseRulesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  property_id: uuidSchema,
  body: z.string().min(1).max(200),
  sort_order: z.int().min(0),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type HouseRulesRow = z.infer<typeof houseRulesRow>;

export const paymentAccountsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    method: paymentAccountMethodSchema,
    bank: bankSchema.nullable(),
    bank_name: z.string().min(1).max(80).nullable(),
    account_name: z.string().min(1).max(120),
    account_number: z.string().min(1).max(80),
    qr_file_id: uuidSchema.nullable(),
    instructions: z.string().max(300).nullable(),
    is_active: z.boolean(),
    is_sample: z.boolean(),
    sort_order: z.int().min(0),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => (row.method === 'bank') === (row.bank !== null), {
    message: 'bank is required when method is bank and must be null otherwise.',
  })
  .refine(
    (row) => row.bank !== 'other' || (row.bank_name !== null && row.bank_name.trim().length > 0),
    {
      message: 'bank_name is required when bank is other.',
    },
  );
export type PaymentAccountsRow = z.infer<typeof paymentAccountsRow>;
