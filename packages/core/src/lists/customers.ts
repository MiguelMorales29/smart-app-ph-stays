import { z } from 'zod';

export const CUSTOMER_STATUSES = ['active', 'blocked'] as const;
export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);
export type CustomerStatus = z.infer<typeof customerStatusSchema>;

export const CONSENT_KINDS = ['privacy_notice', 'marketing', 'ad_audience'] as const;
export const consentKindSchema = z.enum(CONSENT_KINDS);
export type ConsentKind = z.infer<typeof consentKindSchema>;

export const CONSENT_SOURCES = [
  'booking_form',
  'inquiry_form',
  'account_page',
  'owner_recorded',
] as const;
export const consentSourceSchema = z.enum(CONSENT_SOURCES);
export type ConsentSource = z.infer<typeof consentSourceSchema>;
