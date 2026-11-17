import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  notificationChannelSchema,
  notificationStatusSchema,
  pushAudienceSchema,
} from '../../lists/index.js';
import { isoTimestampSchema, jsonRecordSchema } from './common.js';

export const pushSubscriptionsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema.nullable(),
    audience: pushAudienceSchema,
    customer_id: uuidSchema.nullable(),
    profile_id: uuidSchema.nullable(),
    property_id: uuidSchema.nullable(),
    endpoint: z.url(),
    p256dh: z.string().min(1).max(256),
    auth_key: z.string().min(1).max(128),
    last_success_at: isoTimestampSchema.nullable(),
    revoked_at: isoTimestampSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine(
    (row) =>
      (row.audience === 'customer' && row.customer_id !== null && row.profile_id === null) ||
      (row.audience === 'owner' && row.profile_id !== null && row.customer_id === null),
    {
      message: 'customer_id or profile_id must match audience.',
    },
  );
export type PushSubscriptionsRow = z.infer<typeof pushSubscriptionsRow>;

export const notificationsOutboxRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema.nullable(),
  channel: notificationChannelSchema,
  template: z.string().min(1).max(80),
  customer_id: uuidSchema.nullable(),
  profile_id: uuidSchema.nullable(),
  to_email: z.email().nullable(),
  payload: jsonRecordSchema,
  dedupe_key: z.string().min(1).max(200),
  status: notificationStatusSchema,
  attempts: z.int().min(0),
  next_attempt_at: isoTimestampSchema,
  last_error: z.string().max(500).nullable(),
  sent_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type NotificationsOutboxRow = z.infer<typeof notificationsOutboxRow>;
