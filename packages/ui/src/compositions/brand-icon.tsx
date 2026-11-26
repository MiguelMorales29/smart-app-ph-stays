import { LandmarkIcon, QrCodeIcon, WalletIcon } from 'lucide-react';
import { cn } from '@smartapp/ui/lib/utils';

/**
 * Brand marks (R-4, D94, AUDIT-1 A18), used only to say which service a link or payment method is.
 *
 * - Messenger, Facebook and Google come from simple-icons 16.36.0 (CC0-1.0), unaltered, in the
 *   colour simple-icons lists for each brand. The trademarks stay with their owners.
 * - GCash, Maya and the banks need their official marks, unaltered (verdict 2). The sandbox can't
 *   download them, so until the files are added under `src/assets/brands/` (see the README there)
 *   each shows a neutral wallet or bank icon, never a copy of the brand.
 */
export type Brand = 'messenger' | 'facebook' | 'google' | 'gcash' | 'maya' | 'bank' | 'qr_ph';

interface SimpleIcon {
  readonly title: string;
  readonly hex: string;
  readonly path: string;
}

const SIMPLE_ICONS: Partial<Record<Brand, SimpleIcon>> = {
  messenger: {
    title: 'Messenger',
    hex: '#0866FF', // brand-guard-ignore: the brand's own colour (simple-icons)
    path: 'M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13',
  },
  facebook: {
    title: 'Facebook',
    hex: '#0866FF', // brand-guard-ignore: the brand's own colour (simple-icons)
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  },
  google: {
    title: 'Google',
    hex: '#4285F4', // brand-guard-ignore: the brand's own colour (simple-icons)
    path: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z',
  },
};

/**
 * Official GCash, Maya and bank marks, once their files are added (official files only, unaltered,
 * with TRADEMARKS.md). Empty until then, so nothing here imitates a brand.
 */
const OFFICIAL_MARKS: Partial<Record<Brand, string>> = {};

const SIZE = {
  sm: { tile: 'size-8', glyph: 'size-4' },
  md: { tile: 'size-10', glyph: 'size-5' },
} as const;

/**
 * A brand's mark in a round tile (`tile`) or on its own. `label` is the name read by screen
 * readers when the mark stands alone; next to the brand's written name, leave it empty.
 */
export function BrandIcon({
  brand,
  label,
  size = 'md',
  tile = true,
  className,
}: {
  readonly brand: Brand;
  readonly label?: string | undefined;
  readonly size?: keyof typeof SIZE | undefined;
  readonly tile?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const sizes = SIZE[size];
  const simple = SIMPLE_ICONS[brand];
  const official = OFFICIAL_MARKS[brand];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };

  let glyph;
  if (simple) {
    glyph = (
      <svg viewBox="0 0 24 24" className={sizes.glyph} fill={simple.hex} aria-hidden="true">
        <path d={simple.path} />
      </svg>
    );
  } else if (official) {
    glyph = <img src={official} alt="" className={cn(sizes.glyph, 'object-contain')} />;
  } else {
    const Fallback = brand === 'bank' ? LandmarkIcon : brand === 'qr_ph' ? QrCodeIcon : WalletIcon;
    glyph = <Fallback aria-hidden="true" className={cn(sizes.glyph, 'text-muted-foreground')} />;
  }

  if (!tile) {
    return (
      <span data-slot="brand-icon" className={cn('inline-flex shrink-0', className)} {...a11y}>
        {glyph}
      </span>
    );
  }
  return (
    <span
      data-slot="brand-icon"
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-border bg-card',
        sizes.tile,
        className,
      )}
      {...a11y}
    >
      {glyph}
    </span>
  );
}
