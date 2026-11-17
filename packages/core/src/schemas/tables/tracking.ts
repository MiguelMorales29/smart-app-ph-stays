import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  metaActionSourceSchema,
  metaDeliveryEntityTypeSchema,
  metaDeliveryStatusSchema,
  metaDeliveryTriggerSchema,
  metaEventNameSchema,
  metaPixelScopeSchema,
  metaPixelStatusSchema,
} from '../../lists/index.js';
import { isoTimestampSchema, jsonRecordSchema } from './common.js';

export const metaPixelsRow = z
  .object({
    id: uuidSchema,
    scope: metaPixelScopeSchema,
    account_id: uuidSchema.nullable(),
    property_id: uuidSchema.nullable(),
    pixel_id: z.string().regex(/^\d{10,20}$/, 'pixel_id must be 10 to 20 digits.'),
    status: metaPixelStatusSchema,
    test_event_code: z.string().min(1).max(60).nullable(),
    api_version: z.string().min(1).max(20),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
    updated_by: uuidSchema.nullable(),
  })
  .refine((row) => row.status !== 'test' || row.test_event_code !== null, {
    message: 'test_event_code is required when status is test.',
  })
  .refine((row) => row.status !== 'live' || row.test_event_code === null, {
    message: 'test_event_code must be null when status is live.',
  });
export type MetaPixelsRow = z.infer<typeof metaPixelsRow>;

export const metaEventSwitchesRow = z
  .object({
    pixel_ref: uuidSchema,
    event_name: metaEventNameSchema,
    browser_enabled: z.boolean(),
    server_enabled: z.boolean(),
    updated_at: isoTimestampSchema,
  })
  .refine(
    (row) =>
      (row.event_name !== 'StartTrial' && row.event_name !== 'Purchase') || !row.browser_enabled,
    {
      message: 'browser_enabled must be false for StartTrial and Purchase.',
    },
  )
  .refine(
    (row) =>
      (row.event_name !== 'PageView' && row.event_name !== 'ViewContent') || !row.server_enabled,
    {
      message: 'server_enabled must be false for PageView and ViewContent.',
    },
  );
export type MetaEventSwitchesRow = z.infer<typeof metaEventSwitchesRow>;

export const metaAttributionRow = z.object({
  account_id: uuidSchema,
  ads_consent: z.boolean(),
  consent_at: isoTimestampSchema.nullable(),
  fbp: z.string().max(256).nullable(),
  fbc: z.string().max(256).nullable(),
  client_ip: z.string().max(64).nullable(),
  user_agent: z.string().max(512).nullable(),
  captured_at: isoTimestampSchema,
  refreshed_at: isoTimestampSchema,
});
export type MetaAttributionRow = z.infer<typeof metaAttributionRow>;

export const metaCapiDeliveriesRow = z.object({
  id: uuidSchema,
  pixel_ref: uuidSchema,
  event_name: metaEventNameSchema,
  event_id: z.string().min(1).max(120),
  account_id: uuidSchema,
  entity_type: metaDeliveryEntityTypeSchema,
  entity_id: uuidSchema,
  event_time: isoTimestampSchema,
  payload: jsonRecordSchema,
  is_test: z.boolean(),
  status: metaDeliveryStatusSchema,
  attempts: z.int().min(0),
  next_attempt_at: isoTimestampSchema,
  claim_token: uuidSchema.nullable(),
  claimed_at: isoTimestampSchema.nullable(),
  http_status: z.int().min(100).max(599).nullable(),
  events_received: z.int().min(0).nullable(),
  fbtrace_id: z.string().max(120).nullable(),
  last_error: z.string().max(500).nullable(),
  created_at: isoTimestampSchema,
  sent_at: isoTimestampSchema.nullable(),
  triggered_by: metaDeliveryTriggerSchema,
  action_source: metaActionSourceSchema,
  time_clamped: z.boolean(),
});
export type MetaCapiDeliveriesRow = z.infer<typeof metaCapiDeliveriesRow>;
