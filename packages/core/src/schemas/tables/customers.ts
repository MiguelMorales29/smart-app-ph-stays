import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import { consentKindSchema, consentSourceSchema, customerStatusSchema } from '../../lists/index.js';
import { isoTimestampSchema } from './common.js';

export const customersRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  profile_id: uuidSchema.nullable(),
  full_name: z.string().min(1).max(80),
  email: z
    .email()
    .refine((value) => value === value.toLowerCase(), 'Customer email must be lower-case.'),
  mobile: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?\d+$/, 'Mobile must contain digits with an optional leading plus.'),
  status: customerStatusSchema,
  owner_note: z.string().max(500).nullable(),
  anonymised_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type CustomersRow = z.infer<typeof customersRow>;

export const customerConsentsRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  customer_id: uuidSchema,
  kind: consentKindSchema,
  granted: z.boolean(),
  source: consentSourceSchema,
  notice_version: z.string().min(1).max(40),
  created_at: isoTimestampSchema,
});
export type CustomerConsentsRow = z.infer<typeof customerConsentsRow>;
