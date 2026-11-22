// Particle burst adapted from https://opensourceui.in/components/like-button (MIT, Opensource UI by Bidyut Kundu)
// and food app `heart-toggle.tsx`: CSS-only particles, reduced-motion safe, mapped to `--property-10` / `--primary`.
'use client';

import { Hitbox } from '@smartapp/ui/components/hitbox';
import { Toggle } from '@smartapp/ui/components/toggle';
import { cn } from 'cn';
import { HeartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cssVars } from '../lib/css-vars';

const PARTICLES = [
  { x: 0, y: -22 },
  { x: 18, y: -14 },
  { x: 22, y: 4 },
  { x: 13, y: 20 },
  { x: -13, y: 20 },
  { x: -22, y: 4 },
  { x: -18, y: -14 },
] as const;

function HeartBurst() {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const id = globalThis.requestAnimationFrame(() => setOut(true));
    return () => globalThis.cancelAnimationFrame(id);
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden"
    >
      {PARTICLES.map((particle) => (
        <span
          key={`${particle.x}:${particle.y}`}
          data-out={out ? '' : undefined}
          className="like-particle absolute top-1/2 left-1/2 size-1.5 rounded-full bg-[var(--property-10,var(--primary))]"
          style={cssVars({
            '--particle-x': `${particle.x}px`,
            '--particle-y': `${particle.y}px`,
          })}
        />
      ))}
    </span>
  );
}

export interface HeartToggleProps {
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
  /** Spoken label while off (e.g. "Save Studio Fog"). */
  readonly label: string;
  /** Spoken label while on (e.g. "Remove Studio Fog from saved stays"). */
  readonly pressedLabel: string;
  /** `glass`: frosted chip on a photo. `card`: solid round button on a card. */
  readonly variant?: 'glass' | 'card' | undefined;
  /** `sm`: 32 px chip with expanded hitbox. `md`: 44 px control. */
  readonly size?: 'sm' | 'md' | undefined;
  readonly className?: string | undefined;
}

/**
 * Save-to-favourites heart toggle with spring pop and CSS particle burst (zero `motion`).
 */
export function HeartToggle({
  pressed,
  onPressedChange,
  label,
  pressedLabel,
  variant = 'glass',
  size = 'sm',
  className,
}: HeartToggleProps) {
  const [bursts, setBursts] = useState(0);

  return (
    <span
      data-slot="heart-toggle"
      className={cn(
        'inline-flex rounded-full border border-border/70',
        variant === 'glass' ? 'bg-card/80 shadow-sm backdrop-blur-sm' : 'bg-card shadow-xs',
        className,
      )}
    >
      <Hitbox
        size={size === 'sm' ? 'default' : 'sm'}
        radius="full"
        render={
          <Toggle
            pressed={pressed}
            onPressedChange={(next) => {
              if (next) setBursts((n) => n + 1);
              onPressedChange(next);
            }}
            aria-label={pressed ? pressedLabel : label}
            className={cn(
              'rounded-full bg-transparent p-0 hover:bg-transparent aria-pressed:bg-transparent',
              size === 'sm' ? 'size-8 min-w-8' : 'size-11 min-w-11',
            )}
          >
            <span className="relative flex size-5 items-center justify-center">
              {pressed && bursts > 0 ? <HeartBurst key={bursts} /> : null}
              <HeartIcon
                aria-hidden="true"
                strokeWidth={2.25}
                className={cn(
                  'relative size-4.5 transition-all duration-slow ease-enter motion-reduce:transition-none',
                  pressed
                    ? 'heart-glow scale-110 fill-[var(--property-10,var(--primary))] text-[var(--property-10,var(--primary))]'
                    : 'heart-shadow scale-100 fill-transparent text-foreground',
                )}
              />
            </span>
          </Toggle>
        }
      />
    </span>
  );
}
