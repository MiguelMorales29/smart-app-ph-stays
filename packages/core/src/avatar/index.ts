import { z } from 'zod';

import { uuidSchema } from '../ids/index.js';

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
export const ownerAvatarStyleSchema = z.enum(OWNER_AVATAR_STYLES);
export type OwnerAvatarStyle = z.infer<typeof ownerAvatarStyleSchema>;

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
export const avatarThemeSchema = z.enum(AVATAR_THEMES);
export type AvatarTheme = z.infer<typeof avatarThemeSchema>;

/** The 12 faces per style, in order: face N is drawn from seed N. */
export const OWNER_FACE_SEEDS = [
  'Ligaya',
  'Bayani',
  'Mayumi',
  'Dakila',
  'Tala',
  'Amihan',
  'Lakan',
  'Diwa',
  'Hiraya',
  'Malaya',
  'Isko',
  'Liwayway',
] as const;

export const OWNER_AVATAR_DIR = '/avatars/owner';
export const OWNER_FACES_PER_STYLE = 12;

/** "none" turns an optional piece off (glasses, beard, …). */
export const FACE_NONE = 'none';

export const faceRecipeSchema = z.object({
  style: ownerAvatarStyleSchema,
  seed: z.string().trim().min(1).max(40),
  parts: z
    .record(z.string().regex(/^[a-zA-Z]{1,32}$/), z.string().regex(/^[a-zA-Z0-9]{1,32}$/))
    .refine((parts) => Object.keys(parts).length <= 32, { message: 'too_many_parts' }),
});
export type FaceRecipe = z.infer<typeof faceRecipeSchema>;

export const AVATAR_MAKE_PARTS = [
  'hair',
  'hairColor',
  'skin',
  'eyes',
  'eyebrows',
  'mouth',
  'glasses',
  'earrings',
  'extra',
] as const;
export const avatarMakePartSchema = z.enum(AVATAR_MAKE_PARTS);
export type AvatarMakePart = z.infer<typeof avatarMakePartSchema>;

export const AVATAR_MAKE_COUNTS = {
  hair: 45,
  hairColor: 14,
  skin: 4,
  eyes: 26,
  eyebrows: 15,
  mouth: 30,
  glasses: 6,
  earrings: 7,
  extra: 5,
} as const satisfies Record<AvatarMakePart, number>;

export const AVATAR_MAKE_OPTIONAL: readonly AvatarMakePart[] = ['glasses', 'earrings', 'extra'];

const pieceSchema = (count: number) =>
  z
    .number()
    .int()
    .min(0)
    .max(count - 1);

export const avatarMakeSchema = z.object({
  hair: pieceSchema(AVATAR_MAKE_COUNTS.hair),
  hairColor: pieceSchema(AVATAR_MAKE_COUNTS.hairColor),
  skin: pieceSchema(AVATAR_MAKE_COUNTS.skin),
  eyes: pieceSchema(AVATAR_MAKE_COUNTS.eyes),
  eyebrows: pieceSchema(AVATAR_MAKE_COUNTS.eyebrows),
  mouth: pieceSchema(AVATAR_MAKE_COUNTS.mouth),
  glasses: pieceSchema(AVATAR_MAKE_COUNTS.glasses),
  earrings: pieceSchema(AVATAR_MAKE_COUNTS.earrings),
  extra: pieceSchema(AVATAR_MAKE_COUNTS.extra),
});
export type AvatarMake = z.infer<typeof avatarMakeSchema>;

export const AVATAR_SVG_MAX = 40_000;
export const avatarSvgSchema = z
  .string()
  .max(AVATAR_SVG_MAX)
  .regex(/^<svg[\s>]/)
  .refine((svg) => !/<script|<foreignobject|\son[a-z]+\s*=|javascript:/i.test(svg), {
    message: 'unsafe_svg',
  });

export const STARTING_MAKE: AvatarMake = {
  hair: 0,
  hairColor: 8,
  skin: 1,
  eyes: 25,
  eyebrows: 9,
  mouth: 22,
  glasses: 0,
  earrings: 0,
  extra: 0,
};

/** A saved drawing as an image data URL for <img src>. */
export function avatarSvgSrc(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Profile picture shape shared across owners and members. Keeps the legacy `preset` variant and
 * optional `text`/`theme` on `initials` so older saved profiles continue to work without migration.
 */
export const profileAvatarSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('face'),
    style: ownerAvatarStyleSchema,
    face: z.number().int().min(1).max(12),
    theme: avatarThemeSchema,
  }),
  z.object({
    kind: z.literal('custom'),
    recipe: faceRecipeSchema,
    svg: avatarSvgSchema,
    theme: avatarThemeSchema,
  }),
  z.object({
    kind: z.literal('initials'),
    text: z.string().min(1).max(3).optional(),
    theme: avatarThemeSchema.optional(),
  }),
  z.object({
    kind: z.literal('photo'),
    file_id: uuidSchema,
  }),
  // Legacy preset saved before UI-2 (e.g. "notionists-Mabuhay"); mapped cleanly to a Sketch face.
  z.object({
    kind: z.literal('preset'),
    preset_id: z.string().min(1).max(40),
  }),
]);
export type ProfileAvatar = z.infer<typeof profileAvatarSchema>;

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

function hashSeed(input: string): number {
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
    const face = (hashSeed(avatar.preset_id) % OWNER_FACES_PER_STYLE) + 1;
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

export const FACE_PARTS = {
  sketch: ['hair', 'brows', 'eyes', 'glasses', 'lips', 'nose', 'beard'],
  soft: ['hair', 'eyes', 'eyebrows', 'mouth', 'glasses', 'earrings', 'freckles'],
  bright: [
    'hair',
    'hairColor',
    'baseColor',
    'eyes',
    'eyebrows',
    'mouth',
    'glasses',
    'earrings',
    'facialHair',
    'shirt',
    'shirtColor',
  ],
  people: [
    'head',
    'headContrastColor',
    'skinColor',
    'face',
    'facialHair',
    'accessories',
    'clothingColor',
  ],
  pixel: [
    'hair',
    'hairColor',
    'skinColor',
    'eyes',
    'mouth',
    'glasses',
    'beard',
    'hat',
    'clothing',
    'clothingColor',
  ],
  fun: ['shapeColor', 'eyes', 'mouth'],
  adventure: [
    'hair',
    'hairColor',
    'skinColor',
    'eyes',
    'eyebrows',
    'mouth',
    'glasses',
    'earrings',
    'features',
  ],
} as const satisfies Record<OwnerAvatarStyle, readonly string[]>;

export const FACE_BASE: Partial<Record<OwnerAvatarStyle, Record<string, string[]>>> = {
  fun: { backgroundColor: ['transparent'] },
};

export function isColourPart(part: string): boolean {
  return part.endsWith('Color');
}

export function faceOptions(
  recipe: FaceRecipe,
  optional: (part: string) => boolean,
): Record<string, string | string[] | number> {
  const options: Record<string, string | string[] | number> = {
    ...FACE_BASE[recipe.style],
    seed: recipe.seed,
  };
  for (const [part, choice] of Object.entries(recipe.parts)) {
    if (choice === FACE_NONE) {
      options[`${part}Probability`] = 0;
      continue;
    }
    options[part] = [choice];
    if (optional(part)) options[`${part}Probability`] = 100;
  }
  return options;
}

export function recipeFromPicks(
  style: OwnerAvatarStyle,
  seed: string,
  picks: Record<string, unknown>,
  optionalParts: readonly string[],
): FaceRecipe {
  const parts: Record<string, string> = {};
  for (const [part, value] of Object.entries(picks)) {
    if (/background/i.test(part) || typeof value !== 'string') continue;
    const choice = value.replace(/^#/, '');
    if (/^[a-zA-Z0-9]{1,32}$/.test(choice) && /^[a-zA-Z]{1,32}$/.test(part)) parts[part] = choice;
  }
  for (const part of optionalParts) if (!(part in parts)) parts[part] = FACE_NONE;
  return { style, seed, parts };
}

function makeFace(style: OwnerAvatarStyle, n: number, theme: AvatarTheme): ResolvedPersonAvatar {
  return { kind: 'face', style, face: n, theme };
}

export const JOIN_FACES: readonly ResolvedPersonAvatar[] = [
  makeFace('people', 2, 'sky'),
  makeFace('people', 1, 'blush'),
  makeFace('people', 4, 'sun'),
  makeFace('people', 7, 'mint'),
  makeFace('people', 9, 'lilac'),
  makeFace('people', 10, 'sand'),
];

export const faceWords = {
  styles: {
    soft: 'Soft',
    sketch: 'Sketch',
    bright: 'Bright',
    people: 'People',
    pixel: 'Pixel',
    fun: 'Fun',
    adventure: 'Adventure',
    initials: 'Initials',
  },
  customise: 'Customise this face',
  backToFaces: 'Back to faces',
  customiseLine: 'Change any piece. It is drawn on your device and uses none of your storage.',
  parts: {
    hair: 'Hair',
    head: 'Hair',
    hairColor: 'Hair colour',
    headContrastColor: 'Hair colour',
    face: 'Face',
    accessories: 'Glasses',
    skinColor: 'Skin',
    baseColor: 'Skin',
    eyes: 'Eyes',
    eyebrows: 'Eyebrows',
    brows: 'Eyebrows',
    mouth: 'Mouth',
    lips: 'Mouth',
    nose: 'Nose',
    glasses: 'Glasses',
    earrings: 'Earrings',
    freckles: 'Freckles',
    beard: 'Beard',
    facialHair: 'Beard',
    shirt: 'Top',
    clothing: 'Top',
    shirtColor: 'Top colour',
    clothingColor: 'Top colour',
    hat: 'Hat',
    features: 'Extras',
    shapeColor: 'Colour',
  },
  partsLabel: 'Pieces',
  none: 'None',
  choice: (part: string, n: number) => `${part} ${n}`,
  colourChoice: (part: string, hex: string) => `${part} #${hex}`,
  drawFailed: 'Could not load the face pieces. Check your connection and try again.',
  tryAgain: 'Try again',
  loadingPieces: 'Loading the pieces…',
  styleLabel: 'Style',
  face: (n: number) => `Face ${n}`,
  surprise: 'Surprise me',
  initialsLine: (initials: string) => `Your initials, ${initials}, on the colour you pick.`,
  colour: 'Colour',
  themes: {
    sky: 'Sky',
    mint: 'Mint',
    sun: 'Sun',
    blush: 'Blush',
    lilac: 'Lilac',
    sand: 'Sand',
    navy: 'Navy',
    brand: 'Blue',
  },
  credit: 'Faces by DiceBear. Bright by Micah Lanier and Adventure by Lisa Wischofsky (CC BY 4.0).',
} as const;

export const avatarMakerWords = {
  partsLabel: 'Piece to change',
  parts: {
    hair: 'Hair',
    hairColor: 'Hair colour',
    skin: 'Skin',
    eyes: 'Eyes',
    eyebrows: 'Eyebrows',
    mouth: 'Mouth',
    glasses: 'Glasses',
    earrings: 'Earrings',
    extra: 'Extras',
  },
  choice: (part: string, n: number) => `${part} ${n}`,
  none: 'None',
  hairColors: [
    'Auburn',
    'Copper',
    'Red',
    'Platinum',
    'Blonde',
    'Ash brown',
    'Brown',
    'Dark brown',
    'Black',
    'Grey',
    'Green',
    'Teal',
    'Pink',
    'Plum',
  ],
  skins: ['Light', 'Medium', 'Brown', 'Dark'],
  extras: ['None', 'Moustache', 'Blush', 'Beauty mark', 'Freckles'],
  surprise: 'Surprise me',
  loading: 'Getting the pieces ready',
  failed: 'Could not load the pieces. Check your connection, then try again.',
  tryAgain: 'Try again',
} as const;
