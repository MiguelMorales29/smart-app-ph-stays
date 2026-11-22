import { z } from 'zod';

import { words } from '../words.js';
import {
  ERROR_CODES,
  ERROR_REASONS,
  UNIT_READY_MISSING,
  appError,
  err,
  isErrorCode,
  isErrorReason,
  ok,
  type AppError,
  type ErrorCode,
  type ErrorReason,
  type Result,
  type UnitReadyMissing,
} from './runtime.js';

export {
  ERROR_CODES,
  ERROR_REASONS,
  UNIT_READY_MISSING,
  appError,
  err,
  isErrorCode,
  isErrorReason,
  ok,
  type AppError,
  type ErrorCode,
  type ErrorReason,
  type Result,
  type UnitReadyMissing,
};

export const errorCodeSchema = z.enum(ERROR_CODES);

export const errorReasonSchema = z.enum(ERROR_REASONS);

export const unitReadyMissingSchema = z.enum(UNIT_READY_MISSING);

export const errorDetailsSchema = z.object({
  reason: errorReasonSchema,
  fields: z.record(z.string(), z.string()).optional(),
  missing: z.array(unitReadyMissingSchema).optional(),
  limit: z.int().min(0).optional(),
  used: z.int().min(0).optional(),
  draft: z.unknown().optional(),
  draft_rev: z.int().min(0).optional(),
  draft_updated_at: z.string().nullable().optional(),
});

export type ErrorDetails = Readonly<z.infer<typeof errorDetailsSchema>>;

export interface ParsedErrorDetails {
  readonly reason: ErrorReason | null;
  readonly fields: Readonly<Record<string, string>>;
  readonly missing: readonly UnitReadyMissing[];
  readonly limit: number | null;
  readonly used: number | null;
  readonly draft?: unknown;
  readonly draft_rev?: number;
  readonly draft_updated_at?: string | null;
}

const rawErrorDetailsReader = z.object({
  reason: errorReasonSchema.optional(),
  fields: z.record(z.string(), z.string()).optional(),
  missing: z.array(unitReadyMissingSchema).optional(),
  limit: z.int().min(0).optional(),
  used: z.int().min(0).optional(),
  draft: z.unknown().optional(),
  draft_rev: z.int().min(0).optional(),
  draft_updated_at: z.string().nullable().optional(),
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
    const draftRevOnly = z.int().min(0).safeParse(error.details['draft_rev']);
    const draftUpdatedAtOnly = z.string().nullable().safeParse(error.details['draft_updated_at']);
    return {
      reason: reasonOnly.success ? reasonOnly.data : null,
      fields: fieldsOnly.success ? fieldsOnly.data : {},
      missing: missingOnly.success ? missingOnly.data : [],
      limit: limitOnly.success ? limitOnly.data : null,
      used: usedOnly.success ? usedOnly.data : null,
      ...(error.details['draft'] !== undefined ? { draft: error.details['draft'] } : {}),
      ...(draftRevOnly.success ? { draft_rev: draftRevOnly.data } : {}),
      ...(error.details['draft_updated_at'] !== undefined && draftUpdatedAtOnly.success
        ? { draft_updated_at: draftUpdatedAtOnly.data }
        : {}),
    };
  }

  return {
    reason: parsed.data.reason ?? null,
    fields: parsed.data.fields ?? {},
    missing: parsed.data.missing ?? [],
    limit: parsed.data.limit ?? null,
    used: parsed.data.used ?? null,
    ...(parsed.data.draft !== undefined ? { draft: parsed.data.draft } : {}),
    ...(parsed.data.draft_rev !== undefined ? { draft_rev: parsed.data.draft_rev } : {}),
    ...(parsed.data.draft_updated_at !== undefined
      ? { draft_updated_at: parsed.data.draft_updated_at }
      : {}),
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
  if (extra?.draft !== undefined) {
    details['draft'] = extra.draft;
  }
  if (extra?.draft_rev !== undefined) {
    details['draft_rev'] = extra.draft_rev;
  }
  if (extra?.draft_updated_at !== undefined) {
    details['draft_updated_at'] = extra.draft_updated_at;
  }
  return appError(code, message ?? words.errorReasons[validReason], details);
}
