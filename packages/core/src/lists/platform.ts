import { z } from 'zod';

export const ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'] as const;
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const MEMBER_ROLES = ['owner', 'staff'] as const;
export const memberRoleSchema = z.enum(MEMBER_ROLES);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const MEMBER_STATUSES = ['active', 'removed'] as const;
export const memberStatusSchema = z.enum(MEMBER_STATUSES);
export type MemberStatus = z.infer<typeof memberStatusSchema>;

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'paused', 'cancelled'] as const;
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const COUNTER_KINDS = ['booking', 'inquiry', 'lease', 'bill', 'receipt'] as const;
export const counterKindSchema = z.enum(COUNTER_KINDS);
export type CounterKind = z.infer<typeof counterKindSchema>;

export const AUDIT_ACTOR_KINDS = ['owner', 'staff', 'super_admin', 'customer', 'system'] as const;
export const auditActorKindSchema = z.enum(AUDIT_ACTOR_KINDS);
export type AuditActorKind = z.infer<typeof auditActorKindSchema>;

export const JOB_RUN_STATUSES = ['running', 'ok', 'failed'] as const;
export const jobRunStatusSchema = z.enum(JOB_RUN_STATUSES);
export type JobRunStatus = z.infer<typeof jobRunStatusSchema>;

export const DATA_EXPORT_RANGES = ['this_month', 'last_month', 'everything'] as const;
export const dataExportRangeSchema = z.enum(DATA_EXPORT_RANGES);
export type DataExportRange = z.infer<typeof dataExportRangeSchema>;

export const DATA_EXPORT_PARTS = ['bookings', 'payments', 'proofs'] as const;
export const dataExportPartSchema = z.enum(DATA_EXPORT_PARTS);
export type DataExportPart = z.infer<typeof dataExportPartSchema>;

export const DATA_EXPORT_STATUSES = ['preparing', 'ready', 'failed', 'expired'] as const;
export const dataExportStatusSchema = z.enum(DATA_EXPORT_STATUSES);
export type DataExportStatus = z.infer<typeof dataExportStatusSchema>;

export const PAGE_REPORT_REASONS = [
  'fake_page',
  'wrong_payment_account',
  'scam_attempt',
  'other',
] as const;
export const pageReportReasonSchema = z.enum(PAGE_REPORT_REASONS);
export type PageReportReason = z.infer<typeof pageReportReasonSchema>;

export const PAGE_REPORT_STATUSES = ['new', 'reviewing', 'closed'] as const;
export const pageReportStatusSchema = z.enum(PAGE_REPORT_STATUSES);
export type PageReportStatus = z.infer<typeof pageReportStatusSchema>;

export const APPLICATION_RENTS = ['staycation', 'apartments', 'bed_spaces', 'mix'] as const;
export const applicationRentsSchema = z.enum(APPLICATION_RENTS);
export type ApplicationRents = z.infer<typeof applicationRentsSchema>;

export const SIGN_UP_METHODS = ['password', 'google'] as const;
export const signUpMethodSchema = z.enum(SIGN_UP_METHODS);
export type SignUpMethod = z.infer<typeof signUpMethodSchema>;

export const UNIT_COUNT_BANDS = ['1', '2_5', '6_20', '21_plus'] as const;
export const unitCountBandSchema = z.enum(UNIT_COUNT_BANDS);
export type UnitCountBand = z.infer<typeof unitCountBandSchema>;

export const PROPERTY_COUNT_BANDS = ['1', '2_3', '4_plus'] as const;
export const propertyCountBandSchema = z.enum(PROPERTY_COUNT_BANDS);
export type PropertyCountBand = z.infer<typeof propertyCountBandSchema>;

export const SETUP_STEP_KEYS = [
  'property',
  'unit',
  'photos',
  'price',
  'payment_accounts',
  'rules',
  'publish',
] as const;
export const setupStepKeySchema = z.enum(SETUP_STEP_KEYS);
export type SetupStepKey = z.infer<typeof setupStepKeySchema>;

export const SETUP_STEP_STATUSES = ['done', 'todo', 'waiting'] as const;
export const setupStepStatusSchema = z.enum(SETUP_STEP_STATUSES);
export type SetupStepStatus = z.infer<typeof setupStepStatusSchema>;
