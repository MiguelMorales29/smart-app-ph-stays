import { describe, expect, it } from 'vitest';

import { words } from './words.js';

describe('words', () => {
  it('defines non-empty appName and productName', () => {
    expect(words.appName.length).toBeGreaterThan(0);
    expect(words.productName.length).toBeGreaterThan(0);
  });
});
