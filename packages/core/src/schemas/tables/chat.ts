import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  messageKindSchema,
  messageSenderKindSchema,
  threadStatusSchema,
} from '../../lists/index.js';
import { isoTimestampSchema } from './common.js';

export const threadsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    customer_id: uuidSchema,
    booking_id: uuidSchema.nullable(),
    inquiry_id: uuidSchema.nullable(),
    lease_id: uuidSchema.nullable(),
    token_hash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, 'token_hash must be a 64-character lower-case SHA-256 hex digest.'),
    status: threadStatusSchema,
    closed_at: isoTimestampSchema.nullable(),
    last_message_at: isoTimestampSchema.nullable(),
    customer_read_at: isoTimestampSchema.nullable(),
    owner_read_at: isoTimestampSchema.nullable(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine(
    (row) => {
      const hasBooking = row.booking_id !== null;
      const hasRental = row.inquiry_id !== null || row.lease_id !== null;
      return hasBooking !== hasRental;
    },
    {
      message:
        'A thread must belong to a booking or to a rental (inquiry/lease), never both or neither.',
    },
  );
export type ThreadsRow = z.infer<typeof threadsRow>;

export const messagesRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    thread_id: uuidSchema,
    sender_kind: messageSenderKindSchema,
    sender_profile_id: uuidSchema.nullable(),
    kind: messageKindSchema,
    body: z.string().min(1).max(2000),
    payment_id: uuidSchema.nullable(),
    file_id: uuidSchema.nullable(),
    hidden_at: isoTimestampSchema.nullable(),
    hidden_by: uuidSchema.nullable(),
    created_at: isoTimestampSchema,
  })
  .refine((row) => (row.kind === 'payment') === (row.payment_id !== null), {
    message: 'payment_id is required on payment messages and must be null otherwise.',
  });
export type MessagesRow = z.infer<typeof messagesRow>;

export const savedRepliesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  title: z.string().min(1).max(40),
  body: z.string().min(1).max(2000),
  sort_order: z.int().min(0),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type SavedRepliesRow = z.infer<typeof savedRepliesRow>;
