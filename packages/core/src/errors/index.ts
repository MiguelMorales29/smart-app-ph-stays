import { z } from 'zod';

import { words } from '../words.js';

export const ERROR_CODES = [
  'dates_taken',
  'price_changed',
  'hold_limit',
  'reference_used',
  'invalid_move',
  'not_allowed',
  'not_found',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const ERROR_REASONS = [
  'invalid_input',
  'slug_taken',
  'slug_reserved',
  'slug_change_limit',
  'email_taken',
  'unit_limit',
  'storage_full',
  'file_too_large',
  'not_image',
  'last_payment_method',
  'bank_limit',
  'changed_elsewhere',
  'wallet_not_checked',
  'wrong_password',
  'unit_not_ready',
] as const;

export const errorReasonSchema = z.enum(ERROR_REASONS);

export type ErrorReason = z.infer<typeof errorReasonSchema>;

export const UNIT_READY_MISSING = ['photos', 'price'] as const;
export const unitReadyMissingSchema = z.enum(UNIT_READY_MISSING);
export type UnitReadyMissing = z.infer<typeof unitReadyMissingSchema>;

export const errorDetailsSchema = z.object({
  reason: errorReasonSchema,
  fields: z.record(z.string(), z.string()).optional(),
  missing: z.array(unitReadyMissingSchema).optional(),
  limit: z.int().min(0).optional(),
  used: z.int().min(0).optional(),
});

export type ErrorDetails = Readonly<z.infer<typeof errorDetailsSchema>>;

export interface ParsedErrorDetails {
  readonly reason: ErrorReason | null;
  readonly fields: Readonly<Record<string, string>>;
  readonly missing: readonly UnitReadyMissing[];
  readonly limit: number | null;
  readonly used: number | null;
}

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: AppError };

const rawErrorDetailsReader = z.object({
  reason: errorReasonSchema.optional(),
  fields: z.record(z.string(), z.string()).optional(),
  missing: z.array(unitReadyMissingSchema).optional(),
  limit: z.int().min(0).optional(),
  used: z.int().min(0).optional(),
});

export function readErrorDetails(error: AppError): ParsedErrorDetails {
  if (error.details === undefined) {
    return { reason: null, fields: {}, missing: [], limit: null, used: null };
  }

  const parsed = rawErrorDetailsReader.safeParse(error.details);
  if (!parsed.success) {
    const reasonOnly = errorReasonSchema.safeParse(error.details['reason']);
    const fieldsOnly = z.record(z.string(), z.string()).safeParse(error.details['fields']);
    const missingOnly = z.array(unitReadyMissingSchema).safeParse(error.details['missing']);
    const limitOnly = z.int().min(0).safeParse(error.details['limit']);
    const usedOnly = z.int().min(0).safeParse(error.details['used']);
    return {
      reason: reasonOnly.success ? reasonOnly.data : null,
      fields: fieldsOnly.success ? fieldsOnly.data : {},
      missing: missingOnly.success ? missingOnly.data : [],
      limit: limitOnly.success ? limitOnly.data : null,
      used: usedOnly.success ? usedOnly.data : null,
    };
  }

  return {
    reason: parsed.data.reason ?? null,
    fields: parsed.data.fields ?? {},
    missing: parsed.data.missing ?? [],
    limit: parsed.data.limit ?? null,
    used: parsed.data.used ?? null,
  };
}

export function appError(
  code: ErrorCode,
  message?: string,
  details?: Readonly<Record<string, unknown>>,
): AppError {
  const validCode = errorCodeSchema.parse(code);
  const resolvedMessage = message ?? words.errors[validCode];

  if (details === undefined) {
    return {
      code: validCode,
      message: resolvedMessage,
    };
  }

  return {
    code: validCode,
    message: resolvedMessage,
    details,
  };
}

export function reasonError(
  code: ErrorCode,
  reason: ErrorReason,
  extra?: Omit<ErrorDetails, 'reason'>,
  message?: string,
): AppError {
  const validReason = errorReasonSchema.parse(reason);
  const details: Record<string, unknown> = { reason: validReason };
  if (extra?.fields !== undefined) {
    details['fields'] = extra.fields;
  }
  if (extra?.missing !== undefined) {
    details['missing'] = extra.missing;
  }
  if (extra?.limit !== undefined) {
    details['limit'] = extra.limit;
  }
  if (extra?.used !== undefined) {
    details['used'] = extra.used;
  }
  return appError(code, message ?? words.errorReasons[validReason], details);
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}
