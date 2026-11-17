import { describe, expect, it } from 'vitest';

import { words } from '../words.js';
import { ERROR_CODES, appError, err, errorCodeSchema, ok } from './index.js';
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
