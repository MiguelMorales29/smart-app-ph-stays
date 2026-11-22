'use client';

import { Toggle } from '@smartapp/ui/components/toggle';
import { HeartIcon } from 'lucide-react';
import { useState } from 'react';

export interface ToggleFavoriteProps {
  readonly defaultPressed?: boolean | undefined;
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
}

/** Icon-only favorite heart toggle variant (ported from food app `c-toggle-9`). */
export function ToggleFavorite({ defaultPressed = false, onPressedChange }: ToggleFavoriteProps) {
  const [pressed, setPressed] = useState(defaultPressed);

  return (
    <Toggle
      aria-label={pressed ? 'Remove from saved places' : 'Save place'}
      pressed={pressed}
      onPressedChange={(next) => {
        setPressed(next);
        onPressedChange?.(next);
      }}
    >
      <HeartIcon aria-hidden="true" className={pressed ? 'fill-current' : undefined} />
    </Toggle>
  );
}
