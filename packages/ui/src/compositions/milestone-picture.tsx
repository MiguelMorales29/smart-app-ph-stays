import { cn } from 'cn';
import { milestoneArtSrc, type MilestoneArtKey } from '@smartapp/ui/lib/milestone-art';

/**
 * A 3D milestone picture on a token-coloured disc (D54). The picture itself can't be recoloured,
 * so the disc carries the brand: primary tint, or mint only for celebrations. Decorative only.
 */
export function MilestonePicture({
  art,
  tone = 'primary',
  size = 'md',
  className,
}: {
  readonly art: MilestoneArtKey;
  readonly tone?: 'primary' | 'celebrate' | undefined;
  readonly size?: 'sm' | 'md' | undefined;
  readonly className?: string | undefined;
}) {
  return (
    <span
      data-slot="milestone-picture"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        tone === 'celebrate' ? 'bg-brand-accent/20' : 'bg-primary-tint',
        size === 'sm' ? 'size-16' : 'size-24',
        className,
      )}
    >
      <img
        src={milestoneArtSrc(art)}
        alt=""
        width={96}
        height={96}
        decoding="async"
        className={cn('object-contain', size === 'sm' ? 'size-11' : 'size-16')}
      />
    </span>
  );
}
