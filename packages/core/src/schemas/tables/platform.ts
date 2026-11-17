import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  accountStatusSchema,
  auditActorKindSchema,
  counterKindSchema,
  dataExportPartSchema,
  dataExportRangeSchema,
  dataExportStatusSchema,
  jobRunStatusSchema,
  memberRoleSchema,
  memberStatusSchema,
  pageReportReasonSchema,
  pageReportStatusSchema,
  subscriptionPaymentMethodSchema,
  subscriptionPaymentStatusSchema,
  subscriptionStatusSchema,
} from '../../lists/index.js';
import { centavosSchema } from '../../money/index.js';
import { calendarDateSchema } from '../../time/index.js';
import {
  isoTimestampSchema,
  jsonRecordSchema,
  memberNotifyPrefsSchema,
  positiveCentavosSchema,
  profileAvatarSchema,
} from './common.js';

export const profilesRow = z.object({
  id: uuidSchema,
  full_name: z.string().min(1).max(80),
  avatar: profileAvatarSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type ProfilesRow = z.infer<typeof profilesRow>;

export const platformAdminsRow = z.object({
  profile_id: uuidSchema,
  created_by: uuidSchema.nullable(),
  created_at: isoTimestampSchema,
});
export type PlatformAdminsRow = z.infer<typeof platformAdminsRow>;

export const accountsRow = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(80),
  status: accountStatusSchema,
  is_demo: z.boolean(),
  contact_email: z.email(),
  contact_mobile: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?\d+$/, 'Mobile must contain digits with an optional leading plus.'),
  notify_email: z.email(),
  timezone: z.string().min(1).max(60),
  currency: z.string().length(3),
  approved_at: isoTimestampSchema.nullable(),
  approved_by: uuidSchema.nullable(),
  verified_at: isoTimestampSchema.nullable(),
  verified_by: uuidSchema.nullable(),
  verification_note: z.string().max(300).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type AccountsRow = z.infer<typeof accountsRow>;

export const accountMembersRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  profile_id: uuidSchema,
  role: memberRoleSchema,
  status: memberStatusSchema,
  notify: memberNotifyPrefsSchema,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type AccountMembersRow = z.infer<typeof accountMembersRow>;

export const plansRow = z.object({
  id: uuidSchema,
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  price_centavos: positiveCentavosSchema,
  included_units: z.int().min(1),
  extra_unit_centavos: centavosSchema,
  storage_bytes: z.int().min(1),
  trial_days: z.int().min(0),
  is_active: z.boolean(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type PlansRow = z.infer<typeof plansRow>;

export const subscriptionsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  plan_id: uuidSchema,
  status: subscriptionStatusSchema,
  trial_ends_on: calendarDateSchema.nullable(),
  paid_through: calendarDateSchema.nullable(),
  extra_units: z.int().min(0),
  paused_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type SubscriptionsRow = z.infer<typeof subscriptionsRow>;

export const subscriptionPaymentsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    subscription_id: uuidSchema,
    months: z.union([z.literal(1), z.literal(3), z.literal(6)]),
    amount_centavos: positiveCentavosSchema,
    method: subscriptionPaymentMethodSchema,
    reference_no: z.string().min(1).max(80),
    proof_file_id: uuidSchema,
    status: subscriptionPaymentStatusSchema,
    reviewed_by: uuidSchema.nullable(),
    reviewed_at: isoTimestampSchema.nullable(),
    reject_reason: z.string().min(1).max(300).nullable(),
    covers_from: calendarDateSchema.nullable(),
    covers_to: calendarDateSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => row.status !== 'rejected' || row.reject_reason !== null, {
    message: 'Rejected subscription payments require a reject_reason.',
  })
  .refine(
    (row) => row.status !== 'approved' || (row.covers_from !== null && row.covers_to !== null),
    {
      message: 'Approved subscription payments require covers_from and covers_to dates.',
    },
  );
export type SubscriptionPaymentsRow = z.infer<typeof subscriptionPaymentsRow>;

export const featureFlagsRow = z.object({
  key: z.string().min(1).max(60),
  description: z.string().min(1).max(300),
  default_enabled: z.boolean(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type FeatureFlagsRow = z.infer<typeof featureFlagsRow>;

export const accountFeaturesRow = z.object({
  account_id: uuidSchema,
  flag_key: z.string().min(1).max(60),
  enabled: z.boolean(),
  set_by: uuidSchema.nullable(),
  set_at: isoTimestampSchema,
});
export type AccountFeaturesRow = z.infer<typeof accountFeaturesRow>;

export const accountCountersRow = z.object({
  account_id: uuidSchema,
  kind: counterKindSchema,
  last_value: z.int().min(0),
  updated_at: isoTimestampSchema,
});
export type AccountCountersRow = z.infer<typeof accountCountersRow>;

export const idempotencyKeysRow = z.object({
  id: uuidSchema,
  scope: z.string().min(1).max(80),
  key: z.string().min(1).max(120),
  account_id: uuidSchema.nullable(),
  request_hash: z.string().min(1).max(128),
  response_status: z.int().min(100).max(599),
  response_body: jsonRecordSchema,
  expires_at: isoTimestampSchema,
  created_at: isoTimestampSchema,
});
export type IdempotencyKeysRow = z.infer<typeof idempotencyKeysRow>;

export const auditLogsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema.nullable(),
  actor_kind: auditActorKindSchema,
  actor_profile_id: uuidSchema.nullable(),
  action: z.string().min(1).max(80),
  entity_table: z.string().min(1).max(80),
  entity_id: uuidSchema,
  detail: jsonRecordSchema,
  created_at: isoTimestampSchema,
});
export type AuditLogsRow = z.infer<typeof auditLogsRow>;

export const jobRunsRow = z.object({
  id: uuidSchema,
  job: z.string().min(1).max(80),
  started_at: isoTimestampSchema,
  finished_at: isoTimestampSchema.nullable(),
  status: jobRunStatusSchema,
  rows_affected: z.int().min(0),
  error: z.string().max(500).nullable(),
  created_at: isoTimestampSchema,
});
export type JobRunsRow = z.infer<typeof jobRunsRow>;

export const dataExportsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  range: dataExportRangeSchema,
  parts: z.array(dataExportPartSchema).min(1),
  status: dataExportStatusSchema,
  file_id: uuidSchema.nullable(),
  expires_at: isoTimestampSchema.nullable(),
  created_by: uuidSchema,
  created_at: isoTimestampSchema,
});
export type DataExportsRow = z.infer<typeof dataExportsRow>;

export const pageReportsRow = z.object({
  id: uuidSchema,
  property_id: uuidSchema,
  reason: pageReportReasonSchema,
  details: z.string().min(1).max(500),
  reporter_email: z.email().nullable(),
  status: pageReportStatusSchema,
  created_at: isoTimestampSchema,
  closed_at: isoTimestampSchema.nullable(),
  closed_by: uuidSchema.nullable(),
});
export type PageReportsRow = z.infer<typeof pageReportsRow>;
