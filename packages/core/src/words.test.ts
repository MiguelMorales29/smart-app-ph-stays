import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from './errors/index.js';
import { BANKS } from './lists/payments.js';
import { words } from './words.js';

describe('words', () => {
  it('defines non-empty appName and productName', () => {
    expect(words.appName.length).toBeGreaterThan(0);
    expect(words.productName.length).toBeGreaterThan(0);
  });

  it('defines one non-empty message for every error code', () => {
    expect(Object.keys(words.errors).sort()).toEqual([...ERROR_CODES].sort());
    for (const code of ERROR_CODES) {
      expect(words.errors[code].trim().length).toBeGreaterThan(0);
    }
  });

  it('defines one non-empty display label for every bank code', () => {
    expect(Object.keys(words.banks).sort()).toEqual([...BANKS].sort());
    for (const bank of BANKS) {
      expect(words.banks[bank].trim().length).toBeGreaterThan(0);
    }
  });
});
