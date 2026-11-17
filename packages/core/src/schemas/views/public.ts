import { z } from 'zod';

import { centavosSchema } from '../../money/index.js';
import { stayQuoteSchema } from '../../pricing/quoteStay.js';
import { calendarDateSchema } from '../../time/index.js';
import {
  accountsRow,
  amenitiesRow,
  bookingLinesRow,
  bookingsRow,
  boundedDateRangeSchema,
  customersRow,
  houseRulesRow,
  listingPhotosRow,
  messagesRow,
  paymentAccountsRow,
  paymentsRow,
  propertiesRow,
  propertyPagesRow,
  rateOverridesRow,
  stayReviewsRow,
  threadsRow,
  unitOccupancyRow,
  unitStayTermsRow,
  unitsRow,
  weekdayRatesRow,
} from '../tables/index.js';

export const publicPropertySummarySchema = z.object(propertiesRow.shape).pick({
  id: true,
  account_id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  address_line: true,
  barangay: true,
  city: true,
  province: true,
  region: true,
  country: true,
  latitude: true,
  longitude: true,
  map_url: true,
  checkin_time: true,
  checkout_time: true,
  cancellation_preset: true,
  cancellation_note: true,
  privacy_contact: true,
  logo_file_id: true,
  rebook_min_days: true,
  rebook_within_months: true,
  guest_ids_required: true,
  guest_list_due_hours: true,
  contact: true,
  show_exact_location: true,
  reply_hours: true,
  viewing_hours: true,
});
export type PublicPropertySummary = z.infer<typeof publicPropertySummarySchema>;

export const publicPhotoViewSchema = listingPhotosRow
  .pick({
    id: true,
    unit_id: true,
    file_id: true,
    alt_text: true,
    sort_order: true,
  })
  .extend({
    url: z.string().min(1),
  });
export type PublicPhotoView = z.infer<typeof publicPhotoViewSchema>;

export const publicAmenityViewSchema = amenitiesRow.pick({
  id: true,
  code: true,
  label: true,
  icon: true,
  grp: true,
  sort_order: true,
});
export type PublicAmenityView = z.infer<typeof publicAmenityViewSchema>;

export const publicHouseRuleViewSchema = houseRulesRow.pick({
  id: true,
  body: true,
  sort_order: true,
});
export type PublicHouseRuleView = z.infer<typeof publicHouseRuleViewSchema>;

export const publicUnitStayTermsViewSchema = z.object(unitStayTermsRow.shape).pick({
  base_nightly_centavos: true,
  base_guests: true,
  min_nights: true,
  max_nights: true,
  weekly_discount_percent: true,
  monthly_discount_percent: true,
  down_payment_percent: true,
  hold_minutes: true,
  advance_notice_days: true,
  booking_window_days: true,
});
export type PublicUnitStayTermsView = z.infer<typeof publicUnitStayTermsViewSchema>;

export const publicUnitCardViewSchema = unitsRow
  .pick({
    id: true,
    property_id: true,
    slug: true,
    name: true,
    mode: true,
    unit_type: true,
    description: true,
    max_guests: true,
    bedrooms: true,
    beds: true,
    bathrooms: true,
    floor_area_sqm: true,
    sort_order: true,
  })
  .extend({
    stay_terms: publicUnitStayTermsViewSchema.nullable(),
    photos: z.array(publicPhotoViewSchema),
    amenity_ids: z.array(amenitiesRow.shape.id),
  });
export type PublicUnitCardView = z.infer<typeof publicUnitCardViewSchema>;

export const publicReviewItemViewSchema = stayReviewsRow.pick({
  id: true,
  stars: true,
  note: true,
  created_at: true,
});
export type PublicReviewItemView = z.infer<typeof publicReviewItemViewSchema>;

export const publicReviewSummarySchema = z.object({
  average_stars: z.number().min(1).max(5).nullable(),
  review_count: z.int().min(0),
  recent_reviews: z.array(publicReviewItemViewSchema),
});
export type PublicReviewSummary = z.infer<typeof publicReviewSummarySchema>;

export const propertyViewSchema = z.object({
  property: publicPropertySummarySchema,
  page: propertyPagesRow.pick({ version: true, published: true }),
  account: accountsRow
    .pick({ is_demo: true })
    .extend({ is_verified: z.boolean(), is_paused: z.boolean() }),
  units: z.array(publicUnitCardViewSchema),
  photos: z.array(publicPhotoViewSchema),
  amenities: z.array(publicAmenityViewSchema),
  house_rules: z.array(publicHouseRuleViewSchema),
  reviews: publicReviewSummarySchema,
});
export type PropertyView = z.infer<typeof propertyViewSchema>;

export const unitCalendarViewSchema = z.object({
  unit_id: unitsRow.shape.id,
  window_start: calendarDateSchema,
  window_end: calendarDateSchema,
  taken_ranges: z.array(boundedDateRangeSchema),
  weekday_rates: z.array(weekdayRatesRow.pick({ iso_weekday: true, nightly_centavos: true })),
  rate_overrides: z.array(
    rateOverridesRow.pick({ during: true, nightly_centavos: true, label: true }),
  ),
});
export type UnitCalendarView = z.infer<typeof unitCalendarViewSchema>;

export const stayQuoteViewSchema = stayQuoteSchema;
export type StayQuoteView = z.infer<typeof stayQuoteViewSchema>;

export const threadPaymentCardViewSchema = z
  .object(paymentsRow.shape)
  .pick({
    id: true,
    kind: true,
    amount_centavos: true,
    method: true,
    reference_no: true,
    paid_on: true,
    status: true,
    submitted_by: true,
    reject_reason: true,
    receipt_no: true,
    created_at: true,
  })
  .extend({
    proof_urls: z.array(z.string().min(1)).max(3),
  });
export type ThreadPaymentCardView = z.infer<typeof threadPaymentCardViewSchema>;

export const threadPaymentAccountViewSchema = z
  .object(paymentAccountsRow.shape)
  .pick({
    id: true,
    method: true,
    bank: true,
    bank_name: true,
    account_name: true,
    account_number: true,
    qr_file_id: true,
    instructions: true,
    is_sample: true,
    sort_order: true,
  })
  .extend({
    is_recently_changed: z.boolean(),
  });
export type ThreadPaymentAccountView = z.infer<typeof threadPaymentAccountViewSchema>;

export const threadMessageViewSchema = z.object(messagesRow.shape).pick({
  id: true,
  sender_kind: true,
  kind: true,
  body: true,
  payment_id: true,
  file_id: true,
  created_at: true,
});
export type ThreadMessageView = z.infer<typeof threadMessageViewSchema>;

export const threadBookingLineViewSchema = z.object(bookingLinesRow.shape).pick({
  id: true,
  kind: true,
  label: true,
  stay_date: true,
  quantity: true,
  unit_centavos: true,
  amount_centavos: true,
  sort_order: true,
});
export type ThreadBookingLineView = z.infer<typeof threadBookingLineViewSchema>;

export const threadBookingSummarySchema = z
  .object(bookingsRow.shape)
  .pick({
    id: true,
    property_id: true,
    unit_id: true,
    booking_no: true,
    status: true,
    adults: true,
    children: true,
    nights: true,
    total_centavos: true,
    required_centavos: true,
    guest_note: true,
    confirmed_at: true,
    checked_in_at: true,
    checked_out_at: true,
    cancelled_at: true,
    cancelled_by: true,
    cancel_reason: true,
    vehicle_plate: true,
    guest_list_submitted_at: true,
    created_at: true,
  })
  .extend({
    check_in: calendarDateSchema,
    check_out: calendarDateSchema,
    hold_expires_at: unitOccupancyRow.shape.expires_at,
    paid_centavos: centavosSchema,
    balance_centavos: centavosSchema,
    property_arrival_info: propertiesRow.shape.arrival_info,
    unit_arrival_info: unitsRow.shape.arrival_info,
    lines: z.array(threadBookingLineViewSchema),
  })
  .refine(
    (booking) => {
      const isConfirmedOrLater =
        booking.status === 'confirmed' ||
        booking.status === 'checked_in' ||
        booking.status === 'completed';
      if (isConfirmedOrLater) {
        return true;
      }
      return booking.property_arrival_info === null && booking.unit_arrival_info === null;
    },
    {
      message: 'Arrival details may only be included once the booking is confirmed.',
    },
  );
export type ThreadBookingSummary = z.infer<typeof threadBookingSummarySchema>;

export const threadViewSchema = z.object({
  thread: z.object(threadsRow.shape).pick({
    id: true,
    status: true,
    closed_at: true,
    last_message_at: true,
    customer_read_at: true,
    owner_read_at: true,
  }),
  property: z.object(propertiesRow.shape).pick({
    id: true,
    slug: true,
    name: true,
    checkin_time: true,
    checkout_time: true,
    cancellation_preset: true,
    cancellation_note: true,
    guest_ids_required: true,
    guest_list_due_hours: true,
  }),
  unit: unitsRow.pick({
    id: true,
    slug: true,
    name: true,
  }),
  customer: customersRow.pick({
    id: true,
    full_name: true,
    email: true,
    mobile: true,
  }),
  booking: threadBookingSummarySchema,
  messages: z.array(threadMessageViewSchema),
  payments: z.array(threadPaymentCardViewSchema),
  payment_accounts: z.array(threadPaymentAccountViewSchema),
});
export type ThreadView = z.infer<typeof threadViewSchema>;
