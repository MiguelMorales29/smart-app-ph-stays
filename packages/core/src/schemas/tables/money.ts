import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  paymentKindSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  paymentSubmitterSchema,
} from '../../lists/index.js';
import { calendarDateSchema } from '../../time/index.js';
import { isoTimestampSchema, positiveCentavosSchema } from './common.js';

export const paymentsRow = z
  .object({
    id: uuidSchema,
    account_id: uuidSchema,
    customer_id: uuidSchema,
    booking_id: uuidSchema.nullable(),
    bill_id: uuidSchema.nullable(),
    kind: paymentKindSchema,
    amount_centavos: positiveCentavosSchema,
    method: paymentMethodSchema,
    reference_no: z.string().min(1).max(80).nullable(),
    reference_norm: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[A-Z0-9]+$/, 'reference_norm must be upper-case letters and digits only.')
      .nullable(),
    paid_on: calendarDateSchema,
    status: paymentStatusSchema,
    submitted_by: paymentSubmitterSchema,
    reviewed_by: uuidSchema.nullable(),
    reviewed_at: isoTimestampSchema.nullable(),
    reject_reason: z.string().min(1).max(300).nullable(),
    receipt_no: z.int().min(1).nullable(),
    wallet_checked: z.boolean(),
    created_at: isoTimestampSchema,
    updated_at: isoTimestampSchema,
  })
  .refine((row) => (row.booking_id !== null ? 1 : 0) + (row.bill_id !== null ? 1 : 0) === 1, {
    message: 'Exactly one of booking_id or bill_id must be set.',
  })
  .refine((row) => (row.reference_no === null) === (row.reference_norm === null), {
    message: 'reference_no and reference_norm must both be set or both be null.',
  })
  .refine((row) => row.method === 'cash' || row.method === 'other' || row.reference_no !== null, {
    message: 'reference_no is required unless method is cash or other.',
  })
  .refine((row) => row.status !== 'rejected' || row.reject_reason !== null, {
    message: 'reject_reason is required when status is rejected.',
  })
  .refine(
    (row) =>
      row.status !== 'approved' ||
      row.method === 'cash' ||
      row.method === 'other' ||
      row.wallet_checked,
    {
      message: 'wallet_checked must be true to approve a gcash, maya or bank payment.',
    },
  );
export type PaymentsRow = z.infer<typeof paymentsRow>;

export const paymentProofsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  payment_id: uuidSchema,
  file_id: uuidSchema,
  sort_order: z.int().min(0).max(2),
  created_at: isoTimestampSchema,
});
export type PaymentProofsRow = z.infer<typeof paymentProofsRow>;
