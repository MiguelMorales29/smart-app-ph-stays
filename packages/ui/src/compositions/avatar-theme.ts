import type { AvatarTheme } from '@smartapp/core';

/** Background and foreground token pairs behind a face or initials (light and dark safe). */
export const AVATAR_BG: Record<AvatarTheme, string> = {
  sky: 'bg-avatar-sky text-avatar-ink',
  mint: 'bg-avatar-mint text-avatar-ink',
  sun: 'bg-avatar-sun text-avatar-ink',
  blush: 'bg-avatar-blush text-avatar-ink',
  lilac: 'bg-avatar-lilac text-avatar-ink',
  sand: 'bg-avatar-sand text-avatar-ink',
  navy: 'bg-avatar-navy text-avatar-ink-on-dark',
  brand: 'bg-avatar-brand text-avatar-ink-on-dark',
};

/** A photo ref the browser can display directly (object URL, data URL, root-relative or HTTP URL). */
export function directPhotoSrc(ref: string): string | null {
  return /^(blob:|data:|https?:\/\/|\/)/.test(ref) ? ref : null;
}
