import { describe, expect, it } from 'vitest';

import { words } from '../words.js';
import {
  ERROR_CODES,
  ERROR_REASONS,
  appError,
  err,
  errorCodeSchema,
  errorReasonSchema,
  ok,
  readErrorDetails,
  reasonError,
} from './index.js';
import type { Result } from './index.js';

describe('errors', () => {
  it('validates all blueprint error codes and rejects unknown codes', () => {
    expect(ERROR_CODES).toEqual([
      'dates_taken',
      'price_changed',
      'hold_limit',
      'reference_used',
      'invalid_move',
      'not_allowed',
      'not_found',
    ]);

    for (const code of ERROR_CODES) {
      expect(errorCodeSchema.parse(code)).toBe(code);
      expect(words.errors[code].length).toBeGreaterThan(0);
    }

    expect(errorCodeSchema.safeParse('unknown_error').success).toBe(false);
  });

  it('validates all closed error reasons and words', () => {
    expect(ERROR_REASONS).toHaveLength(15);
    for (const reason of ERROR_REASONS) {
      expect(errorReasonSchema.parse(reason)).toBe(reason);
      expect(words.errorReasons[reason].trim().length).toBeGreaterThan(0);
    }
    expect(errorReasonSchema.safeParse('made_up_reason').success).toBe(false);
  });

  it('builds AppError with default message from words or custom message and details', () => {
    const defaultErr = appError('dates_taken');
    expect(defaultErr).toEqual({
      code: 'dates_taken',
      message: words.errors.dates_taken,
    });
    expect('details' in defaultErr).toBe(false);

    const detailedErr = appError('hold_limit', 'Custom message', { maxHolds: 2 });
    expect(detailedErr).toEqual({
      code: 'hold_limit',
      message: 'Custom message',
      details: { maxHolds: 2 },
    });
  });

  it('builds typed reason errors and reads details safely without casts', () => {
    const slugErr = reasonError('not_allowed', 'slug_taken', {
      fields: { slug: words.errorReasons.slug_taken },
    });
    expect(slugErr.code).toBe('not_allowed');
    expect(slugErr.message).toBe(words.errorReasons.slug_taken);
    expect(readErrorDetails(slugErr)).toEqual({
      reason: 'slug_taken',
      fields: { slug: words.errorReasons.slug_taken },
      missing: [],
      limit: null,
      used: null,
    });

    const unitReadyErr = reasonError('invalid_move', 'unit_not_ready', {
      missing: ['photos', 'price'],
    });
    expect(readErrorDetails(unitReadyErr)).toEqual({
      reason: 'unit_not_ready',
      fields: {},
      missing: ['photos', 'price'],
      limit: null,
      used: null,
    });

    const unitLimitErr = reasonError('not_allowed', 'unit_limit', { limit: 5, used: 5 });
    expect(readErrorDetails(unitLimitErr)).toEqual({
      reason: 'unit_limit',
      fields: {},
      missing: [],
      limit: 5,
      used: 5,
    });

    // Handles errors with no details or unrecognised reason safely
    expect(readErrorDetails(appError('not_found'))).toEqual({
      reason: null,
      fields: {},
      missing: [],
      limit: null,
      used: null,
    });
    expect(
      readErrorDetails(appError('not_allowed', 'Other', { reason: 'min_nights', extra: 1 })),
    ).toEqual({
      reason: null,
      fields: {},
      missing: [],
      limit: null,
      used: null,
    });
  });

  it('constructs ok and err Result values', () => {
    const success: Result<number> = ok(42);
    expect(success).toEqual({ ok: true, data: 42 });

    const failure: Result<number> = err(appError('not_found'));
    expect(failure).toEqual({
      ok: false,
      error: {
        code: 'not_found',
        message: words.errors.not_found,
      },
    });
  });
});
