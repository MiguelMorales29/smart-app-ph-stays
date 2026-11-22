import { describe, expect, it } from 'vitest';

import { formatShortCalendarPrice } from './calendar-price-range';

describe('formatShortCalendarPrice (FIX-1 I)', () => {
  it('formats nightly centavos cleanly for compact mobile calendar cells', () => {
    expect(formatShortCalendarPrice(260_000)).toBe('2.6k');
    expect(formatShortCalendarPrice(300_000)).toBe('3k');
    expect(formatShortCalendarPrice(1_250_000)).toBe('12.5k');
    expect(formatShortCalendarPrice(85_000)).toBe('850');
    expect(formatShortCalendarPrice(100_000)).toBe('1k');
  });
});
