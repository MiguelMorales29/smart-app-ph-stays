import { describe, expect, it } from 'vitest';

import {
  guestAvatarChoices,
  guestAvatarPath,
  guestAvatarSetOf,
  guestFaceWords,
  guestPreviewAvatars,
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

  it('provides Toon Head and Big Smile guest face sets with CC-BY-4.0 credit', () => {
    expect(guestAvatarPath(0)).toBe('/avatars/default-01.webp');
    expect(guestAvatarPath(23)).toBe('/avatars/default-24.webp');
    expect(guestAvatarChoices('toon')).toHaveLength(12);
    expect(guestAvatarChoices('toon')[0]).toBe('/avatars/default-01.webp');
    expect(guestAvatarChoices('smile')).toHaveLength(12);
    expect(guestAvatarChoices('smile')[11]).toBe('/avatars/smile-12.webp');
    expect(guestAvatarSetOf('/avatars/default-07.webp')).toBe('toon');
    expect(guestAvatarSetOf('/avatars/smile-03.webp')).toBe('smile');
    expect(guestAvatarSetOf('data:image/webp;base64,AAAA')).toBeNull();
    expect(guestPreviewAvatars('ulap-suites', 4)).toHaveLength(4);
    expect(guestFaceWords.credit).toContain('Johan Melin');
    expect(guestFaceWords.credit).toContain('Ashley Seo');
    expect(guestFaceWords.credit).toContain('CC BY 4.0');
  });
});
