'use client';

import * as React from 'react';
import { ArrowLeftIcon, PaletteIcon, ShuffleIcon } from 'lucide-react';
import {
  AVATAR_THEMES,
  OWNER_AVATAR_STYLES,
  OWNER_FACE_SEEDS,
  OWNER_FACES_PER_STYLE,
  faceWords,
  ownerAvatarFile,
  personInitials,
  resolveProfileAvatar,
  type AvatarTheme,
  type FaceRecipe,
  type OwnerAvatarStyle,
  type ProfileAvatar,
  type ResolvedPersonAvatar,
} from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { Scroller } from '@smartapp/ui/components/scroller';
import { ToggleGroup, ToggleGroupItem } from '@smartapp/ui/components/toggle-group';
import { cn } from 'cn';

import { AVATAR_BG } from './avatar-theme';
import { FaceCustomiser } from './face-customiser';

const W = faceWords;
type StyleChoice = OwnerAvatarStyle | 'initials';
const STYLE_CHOICES: readonly StyleChoice[] = [...OWNER_AVATAR_STYLES, 'initials'];
const FACES = Array.from({ length: OWNER_FACES_PER_STYLE }, (_, i) => i + 1);

function themeOf(avatar: ResolvedPersonAvatar): AvatarTheme {
  return avatar.kind === 'photo' ? 'sky' : avatar.theme;
}

function styleOf(avatar: ResolvedPersonAvatar, fallback: OwnerAvatarStyle): StyleChoice {
  if (avatar.kind === 'face') return avatar.style;
  if (avatar.kind === 'custom') return avatar.recipe.style;
  if (avatar.kind === 'initials') return 'initials';
  return fallback;
}

function faceOfSeed(seed: string): number {
  const index = OWNER_FACE_SEEDS.findIndex((s) => s === seed);
  return index < 0 ? 1 : index + 1;
}

/**
 * The Faces tab of a picture picker (ported from the food app): 7 styles × 12 faces or initials,
 * Customise any face piece by piece (`FaceCustomiser`), Surprise me, and 8 background colours.
 */
export function FacePicker({
  value,
  name,
  startStyle = 'soft',
  onChange,
  showCredit = false,
  className,
}: {
  readonly value: ProfileAvatar | null;
  readonly name: string;
  readonly startStyle?: OwnerAvatarStyle | undefined;
  readonly onChange: (avatar: ProfileAvatar) => void;
  /** Show the DiceBear CC-BY-4.0 credit line underneath (required when rendered standalone, D84). */
  readonly showCredit?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const resolved = resolveProfileAvatar(value);
  const [theme, setTheme] = React.useState<AvatarTheme>(() => themeOf(resolved));
  const [style, setStyle] = React.useState<StyleChoice>(() => styleOf(resolved, startStyle));
  const [recipe, setRecipe] = React.useState<FaceRecipe | null>(
    resolved.kind === 'custom' ? resolved.recipe : null,
  );

  const pickTheme = (t: AvatarTheme) => {
    setTheme(t);
    if (resolved.kind !== 'photo') onChange({ ...resolved, theme: t });
    else if (style === 'initials') onChange({ kind: 'initials', theme: t });
    else onChange({ kind: 'face', style, face: 1, theme: t });
  };

  const pickStyle = (next: StyleChoice) => {
    setStyle(next);
    setRecipe(null);
    if (next === 'initials') onChange({ kind: 'initials', theme });
    else
      onChange({
        kind: 'face',
        style: next,
        face: resolved.kind === 'face' ? resolved.face : 1,
        theme,
      });
  };

  const customise = (s: OwnerAvatarStyle) => {
    const face = resolved.kind === 'face' && resolved.style === s ? resolved.face : 1;
    setRecipe({ style: s, seed: OWNER_FACE_SEEDS[face - 1] ?? OWNER_FACE_SEEDS[0], parts: {} });
  };

  const backToFaces = (from: FaceRecipe) => {
    setRecipe(null);
    onChange({ kind: 'face', style: from.style, face: faceOfSeed(from.seed), theme });
  };

  const surprise = () => {
    const s = OWNER_AVATAR_STYLES[Math.floor(Math.random() * OWNER_AVATAR_STYLES.length)] ?? 'soft';
    const t = AVATAR_THEMES[Math.floor(Math.random() * 6)] ?? 'sky';
    setStyle(s);
    setTheme(t);
    setRecipe(null);
    onChange({
      kind: 'face',
      style: s,
      face: 1 + Math.floor(Math.random() * FACES.length),
      theme: t,
    });
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Scroller orientation="horizontal" hideScrollbar className="-mx-1 px-1">
        <ToggleGroup
          aria-label={W.styleLabel}
          value={[style]}
          onValueChange={(next) => {
            const picked = STYLE_CHOICES.find((s) => s === next[0]);
            if (picked) pickStyle(picked);
          }}
          className="w-max"
        >
          {STYLE_CHOICES.map((s) => (
            <ToggleGroupItem key={s} value={s} className="h-11 shrink-0 px-3 md:h-9">
              {W.styles[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Scroller>

      {style === 'initials' ? (
        <p className="text-sm text-muted-foreground">
          {W.initialsLine(personInitials(name) || '?')}
        </p>
      ) : recipe ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 md:h-9"
              onClick={() => backToFaces(recipe)}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {W.backToFaces}
            </Button>
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">{W.customiseLine}</p>
          </div>
          <FaceCustomiser
            value={recipe}
            tileClassName={AVATAR_BG[theme]}
            onChange={(next, svg) => {
              setRecipe(next);
              onChange({ kind: 'custom', recipe: next, svg, theme });
            }}
          />
        </div>
      ) : (
        <>
          <div role="radiogroup" aria-label={W.styles[style]} className="flex flex-wrap gap-3">
            {FACES.map((face) => {
              const picked =
                resolved.kind === 'face' && resolved.style === style && resolved.face === face;
              const avatar: ProfileAvatar = { kind: 'face', style, face, theme };
              return (
                <button
                  key={face}
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  aria-label={W.face(face)}
                  onClick={() => onChange(avatar)}
                  className={cn(
                    'size-16 shrink-0 overflow-hidden rounded-full transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-95',
                    AVATAR_BG[theme],
                    picked && 'ring-3 ring-primary ring-offset-2 ring-offset-background',
                  )}
                >
                  <img
                    src={ownerAvatarFile(avatar) ?? ''}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full"
                  />
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-11 md:h-9" onClick={() => customise(style)}>
              <PaletteIcon aria-hidden="true" />
              {W.customise}
            </Button>
            <Button type="button" variant="outline" className="h-11 md:h-9" onClick={surprise}>
              <ShuffleIcon aria-hidden="true" />
              {W.surprise}
            </Button>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{W.colour}</p>
        <div role="radiogroup" aria-label={W.colour} className="flex flex-wrap gap-2">
          {AVATAR_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              aria-label={W.themes[t]}
              onClick={() => pickTheme(t)}
              className={cn(
                'size-10 shrink-0 rounded-full border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                AVATAR_BG[t],
                theme === t && 'ring-3 ring-primary ring-offset-2 ring-offset-background',
              )}
            />
          ))}
        </div>
      </div>

      {showCredit ? <p className="text-xs text-muted-foreground">{W.credit}</p> : null}
    </div>
  );
}
