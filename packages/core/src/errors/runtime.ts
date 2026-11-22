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

export type ErrorCode = (typeof ERROR_CODES)[number];

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

export type ErrorReason = (typeof ERROR_REASONS)[number];

export const UNIT_READY_MISSING = ['photos', 'price'] as const;
export type UnitReadyMissing = (typeof UNIT_READY_MISSING)[number];

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: AppError };

export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODES.some((code) => code === value);
}

export function isErrorReason(value: string): value is ErrorReason {
  return ERROR_REASONS.some((reason) => reason === value);
}

export function appError(
  code: ErrorCode,
  message?: string,
  details?: Readonly<Record<string, unknown>>,
): AppError {
  if (!isErrorCode(code)) {
    throw new RangeError(`Unknown error code: ${String(code)}`);
  }
  const resolvedMessage = message ?? words.errors[code];

  if (details === undefined) {
    return {
      code,
      message: resolvedMessage,
    };
  }

  return {
    code,
    message: resolvedMessage,
    details,
  };
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}
