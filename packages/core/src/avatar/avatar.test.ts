import { describe, expect, it } from 'vitest';

import {
  ownerAvatarFile,
  personInitials,
  profileAvatarSchema,
  resolveProfileAvatar,
} from './index.js';

describe('profile avatar helpers and legacy preset fallback', () => {
  it('deterministically maps legacy preset_id values to a Sketch WebP face', () => {
    const legacy = { kind: 'preset' as const, preset_id: 'notionists-Mabuhay' };
    expect(profileAvatarSchema.safeParse(legacy).success).toBe(true);

    const first = resolveProfileAvatar(legacy);
    const second = resolveProfileAvatar(legacy);
    expect(first).toEqual(second);
    expect(first.kind).toBe('face');
    if (first.kind === 'face') {
      expect(first.style).toBe('sketch');
      expect(first.face).toBeGreaterThanOrEqual(1);
      expect(first.face).toBeLessThanOrEqual(12);
    }

    const file = ownerAvatarFile(legacy);
    expect(file).toMatch(/^\/avatars\/owner\/sketch-\d{2}\.webp$/);
  });

  it('defaults theme on legacy initials avatars without breaking text limits', () => {
    const resolved = resolveProfileAvatar({ kind: 'initials', text: 'MV' });
    expect(resolved).toEqual({ kind: 'initials', text: 'MV', theme: 'sky' });
    expect(personInitials('Clarisse Sy-Tan')).toBe('CS');
  });
});
