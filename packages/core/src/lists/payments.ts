import { z } from 'zod';

export const PAYMENT_KINDS = ['payment', 'refund'] as const;
export const paymentKindSchema = z.enum(PAYMENT_KINDS);
export type PaymentKind = z.infer<typeof paymentKindSchema>;

export const PAYMENT_STATUSES = ['submitted', 'approved', 'rejected', 'reversed'] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const PAYMENT_SUBMITTERS = ['customer', 'owner'] as const;
export const paymentSubmitterSchema = z.enum(PAYMENT_SUBMITTERS);
export type PaymentSubmitter = z.infer<typeof paymentSubmitterSchema>;

export const PAYMENT_ACCOUNT_METHODS = ['gcash', 'maya', 'bank', 'qr_ph'] as const;
export const paymentAccountMethodSchema = z.enum(PAYMENT_ACCOUNT_METHODS);
export type PaymentAccountMethod = z.infer<typeof paymentAccountMethodSchema>;

export const PAYMENT_METHODS = ['gcash', 'maya', 'bank', 'cash', 'other'] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const SUBSCRIPTION_PAYMENT_METHODS = ['gcash', 'maya', 'bank'] as const;
export const subscriptionPaymentMethodSchema = z.enum(SUBSCRIPTION_PAYMENT_METHODS);
export type SubscriptionPaymentMethod = z.infer<typeof subscriptionPaymentMethodSchema>;

export const SUBSCRIPTION_PAYMENT_STATUSES = ['submitted', 'approved', 'rejected'] as const;
export const subscriptionPaymentStatusSchema = z.enum(SUBSCRIPTION_PAYMENT_STATUSES);
export type SubscriptionPaymentStatus = z.infer<typeof subscriptionPaymentStatusSchema>;

export const BANKS = [
  'bdo',
  'bpi',
  'metrobank',
  'landbank',
  'pnb',
  'security_bank',
  'unionbank',
  'rcbc',
  'china_bank',
  'eastwest',
  'gotyme',
  'seabank',
  'other',
] as const;
export const bankSchema = z.enum(BANKS);
export type Bank = z.infer<typeof bankSchema>;
