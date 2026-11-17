import { z } from 'zod';

import { accountsRow, plansRow, subscriptionsRow } from '../tables/index.js';

export const SUBSCRIPTION_DERIVED_STATES = [
  'trial',
  'active',
  'due',
  'overdue',
  'paused',
  'cancelled',
] as const;

export const subscriptionDerivedStateSchema = z.enum(SUBSCRIPTION_DERIVED_STATES);
export type SubscriptionDerivedState = z.infer<typeof subscriptionDerivedStateSchema>;

export const adminOwnerItemViewSchema = accountsRow
  .pick({
    id: true,
    name: true,
    status: true,
    is_demo: true,
    contact_email: true,
    contact_mobile: true,
    approved_at: true,
    verified_at: true,
    created_at: true,
  })
  .extend({
    subscription_status: subscriptionsRow.shape.status,
    subscription_derived_state: subscriptionDerivedStateSchema,
    trial_ends_on: subscriptionsRow.shape.trial_ends_on,
    paid_through: subscriptionsRow.shape.paid_through,
    extra_units: subscriptionsRow.shape.extra_units,
    unit_count: z.int().min(0),
    bookings_last_30_days: z.int().min(0),
    storage_used_bytes: z.int().min(0),
    storage_limit_bytes: plansRow.shape.storage_bytes,
    pending_plan_payments: z.int().min(0),
  });
export type AdminOwnerItemView = z.infer<typeof adminOwnerItemViewSchema>;
