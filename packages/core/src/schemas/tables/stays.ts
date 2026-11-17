import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  bookingActorKindSchema,
  bookingCancelledBySchema,
  bookingEventTypeSchema,
  bookingLineKindSchema,
  bookingSourceSchema,
  bookingStatusSchema,
  occupancyKindSchema,
} from '../../lists/index.js';
import { centavosSchema, signedCentavosSchema } from '../../money/index.js';
import { calendarDateSchema } from '../../time/index.js';
import { isoTimestampSchema, jsonRecordSchema, occupancyDateRangeSchema } from './common.js';

export const unitOccupancyRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    unit_id: uuidSchema,
    during: occupancyDateRangeSchema,
    buffer_nights: z.int().min(0).max(7),
    kind: occupancyKindSchema,
    active: z.boolean(),
    expires_at: isoTimestampSchema.nullable(),
    note: z.string().max(200).nullable(),
    created_by: uuidSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
    released_at: isoTimestampSchema.nullable(),
  })
  .refine((row) => (row.kind === 'hold') === (row.expires_at !== null), {
    message: 'expires_at is required for holds and must be null for other occupancy kinds.',
  })
  .refine((row) => row.active || row.released_at !== null, {
    message: 'Inactive occupancy rows must record released_at.',
  })
  .refine((row) => row.during.end !== null || row.kind === 'lease', {
    message: 'during.end may be null only for lease occupancy rows.',
  });
export type UnitOccupancyRow = z.infer<typeof unitOccupancyRow>;

export const bookingsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    property_id: uuidSchema,
    unit_id: uuidSchema,
    customer_id: uuidSchema,
    occupancy_id: uuidSchema,
    booking_no: z.int().min(1),
    status: bookingStatusSchema,
    source: bookingSourceSchema,
    source_note: z.string().max(200).nullable(),
    adults: z.int().min(1),
    children: z.int().min(0),
    nights: z.int().min(1),
    total_centavos: centavosSchema,
    required_centavos: centavosSchema,
    guest_note: z.string().max(500).nullable(),
    reward_claim_id: uuidSchema.nullable(),
    confirmed_at: isoTimestampSchema.nullable(),
    checked_in_at: isoTimestampSchema.nullable(),
    checked_out_at: isoTimestampSchema.nullable(),
    cancelled_at: isoTimestampSchema.nullable(),
    cancelled_by: bookingCancelledBySchema.nullable(),
    cancel_reason: z.string().max(300).nullable(),
    vehicle_plate: z.string().max(15).nullable(),
    guest_list_submitted_at: isoTimestampSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => row.required_centavos <= row.total_centavos, {
    message: 'required_centavos cannot exceed total_centavos.',
  });
export type BookingsRow = z.infer<typeof bookingsRow>;

export const bookingLinesRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    booking_id: uuidSchema,
    kind: bookingLineKindSchema,
    label: z.string().min(1).max(120),
    stay_date: calendarDateSchema.nullable(),
    quantity: z.int().min(1),
    unit_centavos: centavosSchema,
    amount_centavos: signedCentavosSchema,
    sort_order: z.int().min(0),
    created_at: isoTimestampSchema,
  })
  .refine((row) => (row.kind === 'night') === (row.stay_date !== null), {
    message: 'stay_date is required for night lines and must be null otherwise.',
  })
  .refine(
    (row) => {
      if (row.kind === 'discount') {
        return (
          row.amount_centavos < 0 && row.amount_centavos === -(row.quantity * row.unit_centavos)
        );
      }
      return row.amount_centavos >= 0 && row.amount_centavos === row.quantity * row.unit_centavos;
    },
    {
      message:
        'amount_centavos must equal quantity * unit_centavos (negative only for discount lines).',
    },
  );
export type BookingLinesRow = z.infer<typeof bookingLinesRow>;

export const bookingEventsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  booking_id: uuidSchema,
  type: bookingEventTypeSchema,
  from_status: bookingStatusSchema.nullable(),
  to_status: bookingStatusSchema.nullable(),
  actor_kind: bookingActorKindSchema,
  actor_profile_id: uuidSchema.nullable(),
  detail: jsonRecordSchema,
  created_at: isoTimestampSchema,
});
export type BookingEventsRow = z.infer<typeof bookingEventsRow>;

export const bookingGuestsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  booking_id: uuidSchema,
  full_name: z.string().min(1).max(80),
  is_minor: z.boolean(),
  id_file_id: uuidSchema.nullable(),
  sort_order: z.int().min(0),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type BookingGuestsRow = z.infer<typeof bookingGuestsRow>;

export const stayReviewsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  booking_id: uuidSchema,
  customer_id: uuidSchema,
  stars: z.int().min(1).max(5),
  note: z.string().max(300).nullable(),
  note_hidden: z.boolean(),
  created_at: isoTimestampSchema,
});
export type StayReviewsRow = z.infer<typeof stayReviewsRow>;
