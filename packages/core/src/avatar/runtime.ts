import type { FaceRecipe, OwnerAvatarStyle, AvatarTheme, ProfileAvatar } from './index.js';

/** Seven DiceBear styles offered in the owner/member picture picker (pre-rendered WebPs + lazy customiser). */
export const OWNER_AVATAR_STYLES = [
  'sketch',
  'soft',
  'bright',
  'people',
  'pixel',
  'fun',
  'adventure',
] as const;

/** Background disc tokens behind a face or initials (defined in packages/ui/src/styles/tokens.css). */
export const AVATAR_THEMES = [
  'sky',
  'mint',
  'sun',
  'blush',
  'lilac',
  'sand',
  'navy',
  'brand',
] as const;

export const OWNER_AVATAR_DIR = '/avatars/owner';
export const OWNER_FACES_PER_STYLE = 12;

/** Normalised avatar value used by PersonAvatar and FacePicker (no legacy `preset` branch). */
export type ResolvedPersonAvatar =
  | {
      readonly kind: 'face';
      readonly style: OwnerAvatarStyle;
      readonly face: number;
      readonly theme: AvatarTheme;
    }
  | {
      readonly kind: 'custom';
      readonly recipe: FaceRecipe;
      readonly svg: string;
      readonly theme: AvatarTheme;
    }
  | {
      readonly kind: 'initials';
      readonly text?: string | undefined;
      readonly theme: AvatarTheme;
    }
  | {
      readonly kind: 'photo';
      readonly file_id: string;
    };

/** A saved drawing as an image data URL for <img src>. */
export function avatarSvgSrc(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function hashAvatarSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Maps any saved profile avatar (including `null`, legacy `preset`, or `initials` without a theme)
 * into a normalised avatar for `PersonAvatar` and `FacePicker`.
 */
export function resolveProfileAvatar(
  avatar: ProfileAvatar | null | undefined,
  defaultTheme: AvatarTheme = 'sky',
): ResolvedPersonAvatar {
  if (!avatar) {
    return { kind: 'initials', theme: defaultTheme };
  }
  if (avatar.kind === 'preset') {
    const face = (hashAvatarSeed(avatar.preset_id) % OWNER_FACES_PER_STYLE) + 1;
    return { kind: 'face', style: 'sketch', face, theme: defaultTheme };
  }
  if (avatar.kind === 'initials') {
    return {
      kind: 'initials',
      text: avatar.text,
      theme: avatar.theme ?? defaultTheme,
    };
  }
  return avatar;
}

/** The image URL of a face, custom SVG or legacy preset; null for initials and uploaded photos. */
export function ownerAvatarFile(avatar: ProfileAvatar | ResolvedPersonAvatar): string | null {
  if (avatar.kind === 'preset') {
    const resolved = resolveProfileAvatar(avatar);
    return ownerAvatarFile(resolved);
  }
  if (avatar.kind === 'face') {
    return `${OWNER_AVATAR_DIR}/${avatar.style}-${String(avatar.face).padStart(2, '0')}.webp`;
  }
  if (avatar.kind === 'custom') {
    return avatarSvgSrc(avatar.svg);
  }
  return null;
}

/** "JD" from "Juan Dela Cruz", "K" from "Kris". */
export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
