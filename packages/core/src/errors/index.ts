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

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: AppError };

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

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}
