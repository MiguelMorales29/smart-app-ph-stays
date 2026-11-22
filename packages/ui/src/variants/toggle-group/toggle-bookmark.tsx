'use client';

import { Toggle } from '@smartapp/ui/components/toggle';
import { BookmarkIcon } from 'lucide-react';

export interface ToggleBookmarkProps {
  readonly label?: string | undefined;
  readonly defaultPressed?: boolean | undefined;
  readonly pressed?: boolean | undefined;
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
}

/** Outline bookmark toggle variant (ported from food app `c-toggle-6`). */
export function ToggleBookmark({
  label = 'Save',
  defaultPressed,
  pressed,
  onPressedChange,
}: ToggleBookmarkProps) {
  return (
    <Toggle
      variant="outline"
      aria-label={`Toggle ${label.toLowerCase()}`}
      {...(pressed !== undefined
        ? { pressed }
        : defaultPressed !== undefined
          ? { defaultPressed }
          : {})}
      {...(onPressedChange ? { onPressedChange } : {})}
    >
      <BookmarkIcon aria-hidden="true" className="group-aria-pressed/toggle:fill-current" />
      {label}
    </Toggle>
  );
}
