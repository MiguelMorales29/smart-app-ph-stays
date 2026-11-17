import { describe, expect, it } from 'vitest';

import { DEMO_ID_PREFIX, isDemoId, uuidSchema } from '../ids/index.js';
import { DEMO_IDS, makeDemoUuid } from './ids.js';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) {
      collectStrings(child, out);
    }
  }
  return out;
}

describe('demo ids', () => {
  it('ensures every literal ID in DEMO_IDS is unique, starts with dec0de, and passes uuidSchema', () => {
    const allIds = collectStrings(DEMO_IDS);
    expect(allIds.length).toBeGreaterThan(50);
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const id of allIds) {
      expect(id.startsWith(DEMO_ID_PREFIX)).toBe(true);
      expect(uuidSchema.safeParse(id).success).toBe(true);
      expect(isDemoId(id)).toBe(true);
    }
  });

  it('makeDemoUuid formats valid version-4 variant-8 demo UUIDs', () => {
    const generated = makeDemoUuid('10', '0013', 42);
    expect(generated).toBe('dec0de10-0013-4000-8000-00000000002a');
    expect(uuidSchema.safeParse(generated).success).toBe(true);
    expect(isDemoId(generated)).toBe(true);
  });
});
