import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  accountStatusSchema,
  setupStepKeySchema,
  setupStepStatusSchema,
} from '../../lists/index.js';
import { centavosSchema } from '../../money/index.js';
import { calendarDateSchema } from '../../time/index.js';
import { propertyPageDraftSchema } from '../tables/common.js';
import {
  accountMembersRow,
  accountsRow,
  bookingEventsRow,
  bookingGuestsRow,
  bookingLinesRow,
  bookingsRow,
  boundedDateRangeSchema,
  customersRow,
  houseRulesRow,
  isoTimestampSchema,
  listingPhotosRow,
  messagesRow,
  ownerApplicationsRow,
  paymentProofsRow,
  paymentsRow,
  plansRow,
  profilesRow,
  propertiesRow,
  propertyPagesRow,
  rateOverridesRow,
  subscriptionsRow,
  threadsRow,
  unitFeesRow,
  unitLeaseTermsRow,
  unitOccupancyRow,
  unitStayTermsRow,
  unitsRow,
  weekdayRatesRow,
} from '../tables/index.js';
import { propertyViewSchema } from './public.js';

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

export const ownerSessionViewSchema = z.object({
  role: z.literal('owner'),
  accountId: accountsRow.shape.id,
  profileId: profilesRow.shape.id,
});
export type OwnerSessionView = z.infer<typeof ownerSessionViewSchema>;

export const authOwnerResultViewSchema = z.object({
  account: accountsRow,
  profile: profilesRow,
  session: ownerSessionViewSchema,
});
export type AuthOwnerResultView = z.infer<typeof authOwnerResultViewSchema>;

export const applyOwnerResultViewSchema = z.object({
  account: accountsRow,
  profile: profilesRow,
  application: ownerApplicationsRow,
  session: ownerSessionViewSchema,
});
export type ApplyOwnerResultView = z.infer<typeof applyOwnerResultViewSchema>;

export const googleSignInResultViewSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('signed_in'),
    account: accountsRow,
    profile: profilesRow,
    session: ownerSessionViewSchema,
  }),
  z.object({
    kind: z.literal('needs_application'),
    email: z.email(),
    fullName: z.string().min(1).max(80),
  }),
]);
export type GoogleSignInResultView = z.infer<typeof googleSignInResultViewSchema>;

export const accountDeletionRequestViewSchema = z.object({
  status: z.enum(['none', 'scheduled']),
  requested_at: isoTimestampSchema.nullable(),
  scheduled_for: isoTimestampSchema.nullable(),
});
export type AccountDeletionRequestView = z.infer<typeof accountDeletionRequestViewSchema>;

export const ownerPropertySummaryViewSchema = z.object(propertiesRow.shape).pick({
  id: true,
  slug: true,
  name: true,
  city: true,
  status: true,
  updated_at: true,
});
export type OwnerPropertySummaryView = z.infer<typeof ownerPropertySummaryViewSchema>;

export const ownerAccountViewSchema = z.object({
  account: accountsRow,
  profile: profilesRow,
  profile_photo_url: z.string().nullable(),
  member: accountMembersRow,
  application: ownerApplicationsRow.nullable(),
  subscription: subscriptionsRow.nullable(),
  plan: plansRow.nullable(),
  properties: z.array(ownerPropertySummaryViewSchema),
  deletion_request: accountDeletionRequestViewSchema,
});
export type OwnerAccountView = z.infer<typeof ownerAccountViewSchema>;

export const setupChecklistItemViewSchema = z.object({
  key: setupStepKeySchema,
  status: setupStepStatusSchema,
});
export type SetupChecklistItemView = z.infer<typeof setupChecklistItemViewSchema>;

export const setupChecklistViewSchema = z.object({
  items: z.array(setupChecklistItemViewSchema).length(7),
  account_status: accountStatusSchema,
  can_publish: z.boolean(),
});
export type SetupChecklistView = z.infer<typeof setupChecklistViewSchema>;

export const ownerPhotoViewSchema = listingPhotosRow.extend({
  url: z.string().min(1),
});
export type OwnerPhotoView = z.infer<typeof ownerPhotoViewSchema>;

export const ownerPropertyViewSchema = z.object({
  property: propertiesRow,
  page: propertyPagesRow.nullable(),
  photos: z.array(ownerPhotoViewSchema),
  house_rules: z.array(houseRulesRow),
});
export type OwnerPropertyView = z.infer<typeof ownerPropertyViewSchema>;

export const slugCheckViewSchema = z.object({
  status: z.enum(['available', 'taken', 'reserved', 'invalid']),
  normalized: z.string(),
  suggestions: z.array(z.string()).max(3),
});
export type SlugCheckView = z.infer<typeof slugCheckViewSchema>;

export const ownerUnitListItemViewSchema = z.object({
  unit: unitsRow,
  cover_photo: ownerPhotoViewSchema.nullable(),
  photo_count: z.int().min(0),
  stay_terms: unitStayTermsRow.nullable(),
  lease_terms: unitLeaseTermsRow.nullable(),
});
export type OwnerUnitListItemView = z.infer<typeof ownerUnitListItemViewSchema>;

export const ownerUnitDetailViewSchema = z.object({
  unit: unitsRow,
  stay_terms: unitStayTermsRow.nullable(),
  lease_terms: unitLeaseTermsRow.nullable(),
  weekday_rates: z.array(weekdayRatesRow),
  rate_overrides: z.array(rateOverridesRow),
  fees: z.array(unitFeesRow),
  photos: z.array(ownerPhotoViewSchema),
  amenity_ids: z.array(uuidSchema),
});
export type OwnerUnitDetailView = z.infer<typeof ownerUnitDetailViewSchema>;

export const pageEditorViewSchema = z.object({
  property_id: propertyPagesRow.shape.property_id,
  draft: propertyPageDraftSchema,
  published: propertyPageDraftSchema.nullable(),
  draft_rev: propertyPagesRow.shape.draft_rev,
  version: propertyPagesRow.shape.version,
  draft_updated_at: propertyPagesRow.shape.draft_updated_at,
  published_at: propertyPagesRow.shape.published_at,
  preview: propertyViewSchema,
});
export type PageEditorView = z.infer<typeof pageEditorViewSchema>;

export const savePageDraftResultViewSchema = z.object({
  draft_rev: propertyPagesRow.shape.draft_rev,
  draft_updated_at: isoTimestampSchema,
});
export type SavePageDraftResultView = z.infer<typeof savePageDraftResultViewSchema>;

export const discardPageDraftResultViewSchema = z.object({
  draft: propertyPageDraftSchema,
  draft_rev: propertyPagesRow.shape.draft_rev,
  draft_updated_at: isoTimestampSchema,
});
export type DiscardPageDraftResultView = z.infer<typeof discardPageDraftResultViewSchema>;
