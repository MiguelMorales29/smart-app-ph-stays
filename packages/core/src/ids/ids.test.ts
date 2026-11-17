import { describe, expect, it } from 'vitest';

import { DEMO_ID_PREFIX, isDemoId, uuidSchema } from './index.js';

describe('ids', () => {
  it('defines the dec0de demo id prefix', () => {
    expect(DEMO_ID_PREFIX).toBe('dec0de');
  });

  it('accepts version-4 variant-8 demo UUIDs and recognizes them with isDemoId', () => {
    const sampleDemoId = 'dec0de00-0000-4000-8000-000000000001';
    expect(uuidSchema.parse(sampleDemoId)).toBe(sampleDemoId);
    expect(isDemoId(sampleDemoId)).toBe(true);

    const upperDemoId = 'DEC0DE00-0000-4000-8000-000000000001';
    expect(uuidSchema.parse(upperDemoId)).toBe(upperDemoId);
    expect(isDemoId(upperDemoId)).toBe(true);
  });

  it('distinguishes regular UUIDs from demo IDs', () => {
    const regularId = '550e8400-e29b-41d4-a716-446655440000';
    expect(uuidSchema.parse(regularId)).toBe(regularId);
    expect(isDemoId(regularId)).toBe(false);
  });

  it('rejects malformed strings and non-RFC UUIDs', () => {
    const nonRfcDemoId = 'dec0de00-0000-0000-0000-000000000001';
    expect(uuidSchema.safeParse(nonRfcDemoId).success).toBe(false);
    expect(isDemoId(nonRfcDemoId)).toBe(false);

    expect(uuidSchema.safeParse('dec0de-not-a-uuid').success).toBe(false);
    expect(isDemoId('dec0de-not-a-uuid')).toBe(false);
    expect(uuidSchema.safeParse('').success).toBe(false);
  });
});
