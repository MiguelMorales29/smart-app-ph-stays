import { z } from 'zod';

import { centavosSchema } from '../../money/index.js';
import { calendarDateSchema } from '../../time/index.js';
import {
  bookingEventsRow,
  bookingGuestsRow,
  bookingLinesRow,
  bookingsRow,
  boundedDateRangeSchema,
  customersRow,
  messagesRow,
  paymentProofsRow,
  paymentsRow,
  threadsRow,
  unitOccupancyRow,
  unitsRow,
} from '../tables/index.js';

export const ownerHomeCountsViewSchema = z.object({
  arrivals_today: z.int().min(0),
  departures_today: z.int().min(0),
  proofs_to_check: z.int().min(0),
  holds_expiring_soon: z.int().min(0),
  unread_threads: z.int().min(0),
});
export type OwnerHomeCountsView = z.infer<typeof ownerHomeCountsViewSchema>;

export const bookingBoardItemViewSchema = z
  .object(bookingsRow.shape)
  .pick({
    id: true,
    property_id: true,
    unit_id: true,
    customer_id: true,
    booking_no: true,
    status: true,
    source: true,
    adults: true,
    children: true,
    nights: true,
    total_centavos: true,
    required_centavos: true,
    created_at: true,
  })
  .extend({
    unit_name: unitsRow.shape.name,
    customer_name: customersRow.shape.full_name,
    check_in: calendarDateSchema,
    check_out: calendarDateSchema,
    hold_expires_at: unitOccupancyRow.shape.expires_at,
    paid_centavos: centavosSchema,
    balance_centavos: centavosSchema,
  });
export type BookingBoardItemView = z.infer<typeof bookingBoardItemViewSchema>;

export const bookingDetailViewSchema = z.object({
  booking: bookingsRow,
  occupancy: unitOccupancyRow,
  unit: unitsRow.pick({
    id: true,
    slug: true,
    name: true,
    max_guests: true,
  }),
  customer: customersRow,
  lines: z.array(bookingLinesRow),
  events: z.array(bookingEventsRow),
  guests: z.array(bookingGuestsRow),
  payments: z.array(paymentsRow),
  paid_centavos: centavosSchema,
  balance_centavos: centavosSchema,
  thread_id: threadsRow.shape.id,
});
export type BookingDetailView = z.infer<typeof bookingDetailViewSchema>;

export const paymentReviewItemViewSchema = z
  .object(paymentsRow.shape)
  .pick({
    id: true,
    booking_id: true,
    customer_id: true,
    kind: true,
    amount_centavos: true,
    method: true,
    reference_no: true,
    paid_on: true,
    status: true,
    submitted_by: true,
    reject_reason: true,
    receipt_no: true,
    wallet_checked: true,
    created_at: true,
  })
  .extend({
    booking_no: bookingsRow.shape.booking_no,
    unit_name: unitsRow.shape.name,
    customer_name: customersRow.shape.full_name,
    proof_file_ids: z.array(paymentProofsRow.shape.file_id).max(3),
  });
export type PaymentReviewItemView = z.infer<typeof paymentReviewItemViewSchema>;

export const inboxThreadItemViewSchema = z
  .object(threadsRow.shape)
  .pick({
    id: true,
    booking_id: true,
    customer_id: true,
    status: true,
    last_message_at: true,
    customer_read_at: true,
    owner_read_at: true,
    created_at: true,
  })
  .extend({
    customer_name: customersRow.shape.full_name,
    unit_name: unitsRow.shape.name,
    booking_no: bookingsRow.shape.booking_no.nullable(),
    booking_status: bookingsRow.shape.status.nullable(),
    last_message_preview: messagesRow.shape.body.nullable(),
    unread_for_owner: z.boolean(),
  });
export type InboxThreadItemView = z.infer<typeof inboxThreadItemViewSchema>;

export const calendarTimelineItemSchema = z
  .object(unitOccupancyRow.shape)
  .pick({
    id: true,
    unit_id: true,
    during: true,
    buffer_nights: true,
    kind: true,
    active: true,
    expires_at: true,
    note: true,
  })
  .extend({
    booking_id: bookingsRow.shape.id.nullable(),
    booking_no: bookingsRow.shape.booking_no.nullable(),
    booking_status: bookingsRow.shape.status.nullable(),
    customer_name: customersRow.shape.full_name.nullable(),
  });
export type CalendarTimelineItem = z.infer<typeof calendarTimelineItemSchema>;

export const calendarTimelineUnitSchema = unitsRow
  .pick({
    id: true,
    property_id: true,
    slug: true,
    name: true,
    mode: true,
    unit_type: true,
    status: true,
    sort_order: true,
  })
  .extend({
    items: z.array(calendarTimelineItemSchema),
  });
export type CalendarTimelineUnit = z.infer<typeof calendarTimelineUnitSchema>;

export const calendarTimelineViewSchema = z.object({
  range: boundedDateRangeSchema,
  units: z.array(calendarTimelineUnitSchema),
});
export type CalendarTimelineView = z.infer<typeof calendarTimelineViewSchema>;
