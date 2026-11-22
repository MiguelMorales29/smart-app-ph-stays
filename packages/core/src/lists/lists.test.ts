import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import {
  ACCOUNT_STATUSES,
  AMENITY_GROUPS,
  AUDIT_ACTOR_KINDS,
  BANKS,
  BOOKING_ACTOR_KINDS,
  BOOKING_CANCELLED_BY,
  BOOKING_EVENT_TYPES,
  BOOKING_LINE_KINDS,
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  CANCELLATION_PRESETS,
  CONSENT_KINDS,
  CONSENT_SOURCES,
  COUNTER_KINDS,
  CUSTOMER_STATUSES,
  DATA_EXPORT_PARTS,
  DATA_EXPORT_RANGES,
  DATA_EXPORT_STATUSES,
  FEE_BASES,
  FEE_KINDS,
  FILE_BUCKETS,
  FILE_PURPOSES,
  FILE_STATUSES,
  FILE_UPLOADER_KINDS,
  FONT_PAIRS,
  JOB_RUN_STATUSES,
  MEMBER_ROLES,
  MEMBER_STATUSES,
  MESSAGE_KINDS,
  MESSAGE_SENDER_KINDS,
  META_ACTION_SOURCES,
  META_DELIVERY_ENTITY_TYPES,
  META_DELIVERY_STATUSES,
  META_DELIVERY_TRIGGERS,
  META_EVENT_NAMES,
  META_PIXEL_SCOPES,
  META_PIXEL_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  OCCUPANCY_KINDS,
  PAGE_REPORT_REASONS,
  PAGE_REPORT_STATUSES,
  PAYMENT_ACCOUNT_METHODS,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_SUBMITTERS,
  PROPERTY_STATUSES,
  PUSH_AUDIENCES,
  RESERVED_SLUGS,
  SUBSCRIPTION_PAYMENT_METHODS,
  SUBSCRIPTION_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  THREAD_STATUSES,
  UNIT_MODES,
  UNIT_STATUSES,
  UNIT_TYPES,
  accountStatusSchema,
  amenityGroupSchema,
  auditActorKindSchema,
  bankSchema,
  bookingActorKindSchema,
  bookingCancelledBySchema,
  bookingEventTypeSchema,
  bookingLineKindSchema,
  bookingSourceSchema,
  bookingStatusSchema,
  cancellationPresetSchema,
  consentKindSchema,
  consentSourceSchema,
  counterKindSchema,
  customerStatusSchema,
  dataExportPartSchema,
  dataExportRangeSchema,
  dataExportStatusSchema,
  feeBasisSchema,
  feeKindSchema,
  fileBucketSchema,
  filePurposeSchema,
  fileStatusSchema,
  fileUploaderKindSchema,
  fontPairSchema,
  isReservedSlug,
  jobRunStatusSchema,
  memberRoleSchema,
  memberStatusSchema,
  messageKindSchema,
  messageSenderKindSchema,
  metaActionSourceSchema,
  metaDeliveryEntityTypeSchema,
  metaDeliveryStatusSchema,
  metaDeliveryTriggerSchema,
  metaEventNameSchema,
  metaPixelScopeSchema,
  metaPixelStatusSchema,
  notificationChannelSchema,
  notificationStatusSchema,
  occupancyKindSchema,
  pageReportReasonSchema,
  pageReportStatusSchema,
  paymentAccountMethodSchema,
  paymentKindSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  paymentSubmitterSchema,
  propertySlugSchema,
  propertyStatusSchema,
  pushAudienceSchema,
  reservedSlugSchema,
  subscriptionPaymentMethodSchema,
  subscriptionPaymentStatusSchema,
  subscriptionStatusSchema,
  threadStatusSchema,
  unitModeSchema,
  unitSlugSchema,
  unitStatusSchema,
  unitTypeSchema,
} from './index.js';

interface ClosedListCase {
  readonly name: string;
  readonly values: readonly string[];
  readonly schema: z.ZodType<string>;
}

const closedLists: readonly ClosedListCase[] = [
  { name: 'OCCUPANCY_KINDS', values: OCCUPANCY_KINDS, schema: occupancyKindSchema },
  { name: 'PROPERTY_STATUSES', values: PROPERTY_STATUSES, schema: propertyStatusSchema },
  { name: 'CANCELLATION_PRESETS', values: CANCELLATION_PRESETS, schema: cancellationPresetSchema },
  { name: 'UNIT_MODES', values: UNIT_MODES, schema: unitModeSchema },
  { name: 'UNIT_TYPES', values: UNIT_TYPES, schema: unitTypeSchema },
  { name: 'UNIT_STATUSES', values: UNIT_STATUSES, schema: unitStatusSchema },
  { name: 'AMENITY_GROUPS', values: AMENITY_GROUPS, schema: amenityGroupSchema },
  { name: 'FONT_PAIRS', values: FONT_PAIRS, schema: fontPairSchema },
  { name: 'FEE_KINDS', values: FEE_KINDS, schema: feeKindSchema },
  { name: 'FEE_BASES', values: FEE_BASES, schema: feeBasisSchema },
  { name: 'CUSTOMER_STATUSES', values: CUSTOMER_STATUSES, schema: customerStatusSchema },
  { name: 'CONSENT_KINDS', values: CONSENT_KINDS, schema: consentKindSchema },
  { name: 'CONSENT_SOURCES', values: CONSENT_SOURCES, schema: consentSourceSchema },
  { name: 'BOOKING_STATUSES', values: BOOKING_STATUSES, schema: bookingStatusSchema },
  { name: 'BOOKING_SOURCES', values: BOOKING_SOURCES, schema: bookingSourceSchema },
  { name: 'BOOKING_CANCELLED_BY', values: BOOKING_CANCELLED_BY, schema: bookingCancelledBySchema },
  { name: 'BOOKING_LINE_KINDS', values: BOOKING_LINE_KINDS, schema: bookingLineKindSchema },
  { name: 'BOOKING_EVENT_TYPES', values: BOOKING_EVENT_TYPES, schema: bookingEventTypeSchema },
  { name: 'BOOKING_ACTOR_KINDS', values: BOOKING_ACTOR_KINDS, schema: bookingActorKindSchema },
  { name: 'PAYMENT_KINDS', values: PAYMENT_KINDS, schema: paymentKindSchema },
  { name: 'PAYMENT_STATUSES', values: PAYMENT_STATUSES, schema: paymentStatusSchema },
  { name: 'PAYMENT_SUBMITTERS', values: PAYMENT_SUBMITTERS, schema: paymentSubmitterSchema },
  {
    name: 'PAYMENT_ACCOUNT_METHODS',
    values: PAYMENT_ACCOUNT_METHODS,
    schema: paymentAccountMethodSchema,
  },
  { name: 'PAYMENT_METHODS', values: PAYMENT_METHODS, schema: paymentMethodSchema },
  {
    name: 'SUBSCRIPTION_PAYMENT_METHODS',
    values: SUBSCRIPTION_PAYMENT_METHODS,
    schema: subscriptionPaymentMethodSchema,
  },
  {
    name: 'SUBSCRIPTION_PAYMENT_STATUSES',
    values: SUBSCRIPTION_PAYMENT_STATUSES,
    schema: subscriptionPaymentStatusSchema,
  },
  { name: 'BANKS', values: BANKS, schema: bankSchema },
  { name: 'THREAD_STATUSES', values: THREAD_STATUSES, schema: threadStatusSchema },
  { name: 'MESSAGE_SENDER_KINDS', values: MESSAGE_SENDER_KINDS, schema: messageSenderKindSchema },
  { name: 'MESSAGE_KINDS', values: MESSAGE_KINDS, schema: messageKindSchema },
  { name: 'FILE_BUCKETS', values: FILE_BUCKETS, schema: fileBucketSchema },
  { name: 'FILE_PURPOSES', values: FILE_PURPOSES, schema: filePurposeSchema },
  { name: 'FILE_UPLOADER_KINDS', values: FILE_UPLOADER_KINDS, schema: fileUploaderKindSchema },
  { name: 'FILE_STATUSES', values: FILE_STATUSES, schema: fileStatusSchema },
  { name: 'ACCOUNT_STATUSES', values: ACCOUNT_STATUSES, schema: accountStatusSchema },
  { name: 'MEMBER_ROLES', values: MEMBER_ROLES, schema: memberRoleSchema },
  { name: 'MEMBER_STATUSES', values: MEMBER_STATUSES, schema: memberStatusSchema },
  {
    name: 'SUBSCRIPTION_STATUSES',
    values: SUBSCRIPTION_STATUSES,
    schema: subscriptionStatusSchema,
  },
  { name: 'COUNTER_KINDS', values: COUNTER_KINDS, schema: counterKindSchema },
  { name: 'AUDIT_ACTOR_KINDS', values: AUDIT_ACTOR_KINDS, schema: auditActorKindSchema },
  { name: 'JOB_RUN_STATUSES', values: JOB_RUN_STATUSES, schema: jobRunStatusSchema },
  { name: 'DATA_EXPORT_RANGES', values: DATA_EXPORT_RANGES, schema: dataExportRangeSchema },
  { name: 'DATA_EXPORT_PARTS', values: DATA_EXPORT_PARTS, schema: dataExportPartSchema },
  { name: 'DATA_EXPORT_STATUSES', values: DATA_EXPORT_STATUSES, schema: dataExportStatusSchema },
  { name: 'PAGE_REPORT_REASONS', values: PAGE_REPORT_REASONS, schema: pageReportReasonSchema },
  { name: 'PAGE_REPORT_STATUSES', values: PAGE_REPORT_STATUSES, schema: pageReportStatusSchema },
  { name: 'PUSH_AUDIENCES', values: PUSH_AUDIENCES, schema: pushAudienceSchema },
  {
    name: 'NOTIFICATION_CHANNELS',
    values: NOTIFICATION_CHANNELS,
    schema: notificationChannelSchema,
  },
  {
    name: 'NOTIFICATION_STATUSES',
    values: NOTIFICATION_STATUSES,
    schema: notificationStatusSchema,
  },
  { name: 'META_PIXEL_SCOPES', values: META_PIXEL_SCOPES, schema: metaPixelScopeSchema },
  { name: 'META_PIXEL_STATUSES', values: META_PIXEL_STATUSES, schema: metaPixelStatusSchema },
  { name: 'META_EVENT_NAMES', values: META_EVENT_NAMES, schema: metaEventNameSchema },
  {
    name: 'META_DELIVERY_ENTITY_TYPES',
    values: META_DELIVERY_ENTITY_TYPES,
    schema: metaDeliveryEntityTypeSchema,
  },
  {
    name: 'META_DELIVERY_STATUSES',
    values: META_DELIVERY_STATUSES,
    schema: metaDeliveryStatusSchema,
  },
  {
    name: 'META_DELIVERY_TRIGGERS',
    values: META_DELIVERY_TRIGGERS,
    schema: metaDeliveryTriggerSchema,
  },
  { name: 'META_ACTION_SOURCES', values: META_ACTION_SOURCES, schema: metaActionSourceSchema },
];

describe('closed lists', () => {
  it.each(closedLists)('$name has unique values accepted by its schema', ({ values, schema }) => {
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);

    for (const value of values) {
      expect(schema.parse(value)).toBe(value);
    }

    expect(schema.safeParse('__invalid__').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });

  it('keeps payment method lists separate per blueprint rules', () => {
    expect(paymentAccountMethodSchema.safeParse('qr_ph').success).toBe(true);
    expect(paymentMethodSchema.safeParse('qr_ph').success).toBe(false);
    expect(paymentMethodSchema.safeParse('cash').success).toBe(true);
    expect(subscriptionPaymentMethodSchema.safeParse('cash').success).toBe(false);
  });

  it('includes D27 and UI-2 file purposes guest_id, data_export and profile_photo (11 total)', () => {
    expect(FILE_PURPOSES).toHaveLength(11);
    expect(filePurposeSchema.safeParse('guest_id').success).toBe(true);
    expect(filePurposeSchema.safeParse('data_export').success).toBe(true);
    expect(filePurposeSchema.safeParse('profile_photo').success).toBe(true);
  });

  it('includes all 13 Philippine bank codes', () => {
    expect(BANKS).toHaveLength(13);
    expect(bankSchema.safeParse('china_bank').success).toBe(true);
    expect(bankSchema.safeParse('other').success).toBe(true);
  });

  it('includes demo-media and app route words in RESERVED_SLUGS and enforces 3..40 slug rules (D28)', () => {
    expect(RESERVED_SLUGS).toContain('demo-media');
    expect(RESERVED_SLUGS).toContain('admin');
    expect(RESERVED_SLUGS).toContain('book');
    expect(RESERVED_SLUGS).toContain('settings');
    expect(reservedSlugSchema.safeParse('demo-media').success).toBe(true);
    expect(isReservedSlug('demo-media')).toBe(true);
    expect(isReservedSlug('bahay-batis')).toBe(false);

    expect(propertySlugSchema.safeParse('bahay-batis').success).toBe(true);
    expect(propertySlugSchema.safeParse('demo-media').success).toBe(false);
    expect(propertySlugSchema.safeParse('admin').success).toBe(false);
    expect(propertySlugSchema.safeParse('ab').success).toBe(false);
    expect(propertySlugSchema.safeParse('a'.repeat(41)).success).toBe(false);
    expect(propertySlugSchema.safeParse('Bad-Slug').success).toBe(false);
    expect(unitSlugSchema.safeParse('buong-bahay').success).toBe(true);
  });
});
