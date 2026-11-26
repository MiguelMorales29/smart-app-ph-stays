import { createElement } from 'react';
import { amenityIcon } from '@smartapp/ui/lib/amenity-icons';
import { cn } from '@smartapp/ui/lib/utils';

const EMOJI_PREFIX = 'emoji:';

/** The emoji an owner picked for an amenity ("emoji:🀄" gives "🀄"), or null for a Lucide icon. */
export function amenityEmoji(icon: string): string | null {
  return icon.startsWith(EMOJI_PREFIX) ? icon.slice(EMOJI_PREFIX.length) : null;
}

/**
 * An amenity's icon (D93): the Lucide icon from the catalogue, or the emoji the owner picked for
 * their own amenity. Always shown next to the amenity's name, so it is hidden from screen readers.
 */
export function AmenityGlyph({
  icon,
  className,
}: {
  readonly icon: string;
  readonly className?: string | undefined;
}) {
  const emoji = amenityEmoji(icon);
  if (emoji) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-4 items-center justify-center text-sm leading-none',
          className,
        )}
      >
        {emoji}
      </span>
    );
  }
  return createElement(amenityIcon(icon), {
    'aria-hidden': true,
    className: cn('size-4', className),
  });
}
