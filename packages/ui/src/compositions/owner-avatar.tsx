import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from 'cn';
import { Avatar, AvatarFallback, AvatarImage } from '@smartapp/ui/components/avatar';

export type OwnerAvatarValue =
  | { readonly kind: 'initials'; readonly text: string }
  | { readonly kind: 'preset'; readonly preset_id: string }
  | { readonly kind: 'photo'; readonly file_id: string };

/** DiceBear Notionists seeds offered in the picker (preset_id `notionists-<seed>`, D59). */
export const AVATAR_SEEDS = [
  'Mabuhay',
  'Sampaguita',
  'Bayanihan',
  'Kalamansi',
  'Banaue',
  'Sinigang',
  'Habagat',
  'Tala',
] as const;

export function avatarPresetId(seed: string): string {
  return `notionists-${seed}`;
}

function seedFromPreset(presetId: string): string | null {
  return presetId.startsWith('notionists-') ? presetId.slice('notionists-'.length) : null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '?';
}

/**
 * Makes the DiceBear Notionists picture for a seed (CC0), in the browser and loaded only when
 * needed, never through DiceBear's online API. Transparent background: the token disc behind it
 * carries the colour.
 */
function useDiceBear(seed: string | null): string | null {
  const [uri, setUri] = useState<{ seed: string; uri: string } | null>(null);
  useEffect(() => {
    if (seed === null) return;
    let cancelled = false;
    void Promise.all([import('@dicebear/core'), import('@dicebear/notionists')]).then(
      ([core, style]) => {
        if (cancelled) return;
        const next = core.createAvatar(style, { seed, radius: 50 }).toDataUri();
        setUri({ seed, uri: next });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [seed]);
  return seed !== null && uri?.seed === seed ? uri.uri : null;
}

export interface OwnerAvatarProps {
  readonly name: string;
  readonly avatar: OwnerAvatarValue | null;
  /** URL of the uploaded photo, when avatar.kind is photo. */
  readonly photoUrl?: string | undefined;
  /** Used when there is no avatar yet, so every owner still gets a picture (their profile id). */
  readonly fallbackSeed?: string | undefined;
  readonly size?: 'sm' | 'default' | 'lg' | undefined;
  readonly className?: string | undefined;
}

/** Owner picture: their photo, else a DiceBear Notionists avatar, else initials (D59). */
export function OwnerAvatar({
  name,
  avatar,
  photoUrl,
  fallbackSeed,
  size = 'default',
  className,
}: OwnerAvatarProps) {
  const seed =
    avatar?.kind === 'preset'
      ? seedFromPreset(avatar.preset_id)
      : avatar === null
        ? (fallbackSeed ?? null)
        : null;
  const generated = useDiceBear(seed);
  const src = avatar?.kind === 'photo' ? photoUrl : (generated ?? undefined);
  const initials = avatar?.kind === 'initials' ? avatar.text : initialsOf(name);
  return (
    <Avatar
      data-slot="owner-avatar"
      size={size}
      className={cn('bg-primary-tint', size === 'lg' && 'size-16', className)}
    >
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback className="bg-primary-tint font-medium text-primary-hover">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** Eight DiceBear choices for the account page. */
export function AvatarSeedPicker({
  value,
  onValueChange,
}: {
  readonly value: string | null;
  readonly onValueChange: (presetId: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pick a picture"
      className="grid grid-cols-4 gap-2 sm:grid-cols-8"
    >
      {AVATAR_SEEDS.map((seed) => {
        const presetId = avatarPresetId(seed);
        const checked = value === presetId;
        return (
          <button
            key={seed}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`Picture ${AVATAR_SEEDS.indexOf(seed) + 1}`}
            onClick={() => onValueChange(presetId)}
            className={cn(
              'relative flex aspect-square min-h-11 items-center justify-center rounded-full border-2 outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50',
              checked ? 'border-primary' : 'border-transparent hover-hover:hover:border-border',
            )}
          >
            <OwnerAvatar
              name={seed}
              avatar={{ kind: 'preset', preset_id: presetId }}
              size="lg"
              className="size-full"
            />
            {checked ? (
              <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon aria-hidden="true" className="size-3" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
