import { cn } from 'cn';

const SIZE = {
  sm: { mark: 'size-8 text-xs', text: 'text-base' },
  md: { mark: 'size-10 text-sm', text: 'text-xl' },
  lg: { mark: 'size-14 text-lg', text: 'text-2xl' },
} as const;

export interface BrandLockupProps {
  readonly name?: string | undefined;
  readonly size?: keyof typeof SIZE | undefined;
  readonly stacked?: boolean | undefined;
  readonly markSrc?: string | null | undefined;
  readonly markSrc2x?: string | null | undefined;
  readonly className?: string | undefined;
}

/**
 * Platform logo lockup (ported from food app): optional mark image (or built-in monogram mark)
 * paired with real theme-aware text where the final word ("PH") uses Smart Blue `--primary`.
 */
export function BrandLockup({
  name = 'Smart App PH',
  size = 'md',
  stacked = false,
  markSrc = null,
  markSrc2x = null,
  className,
}: BrandLockupProps) {
  const s = SIZE[size];
  const words = name.trim().split(/\s+/).filter(Boolean);
  const last = words.length > 1 ? words.pop() : null;

  return (
    <span
      data-slot="brand-lockup"
      className={cn(
        'inline-flex items-center gap-2.5',
        stacked && 'flex-col gap-2 text-center',
        className,
      )}
    >
      {markSrc ? (
        <img
          src={markSrc}
          srcSet={markSrc2x ? `${markSrc} 1x, ${markSrc2x} 2x` : undefined}
          alt=""
          width={96}
          height={96}
          decoding="async"
          className={cn('shrink-0 object-contain', s.mark)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-xl bg-primary font-heading font-bold text-primary-foreground shadow-xs',
            s.mark,
          )}
        >
          SA
        </span>
      )}
      <span className={cn('leading-none font-extrabold tracking-tight text-foreground', s.text)}>
        {words.join(' ')}
        {last ? <span className="text-primary"> {last}</span> : null}
      </span>
    </span>
  );
}
