'use client';

import { ToggleGroup, ToggleGroupItem } from '@smartapp/ui/components/toggle-group';

export interface ToggleGroupSpacedProps {
  readonly defaultValue?: string[] | undefined;
  readonly value?: string[] | undefined;
  readonly onValueChange?: ((value: string[]) => void) | undefined;
}

/** Spaced outline toggle-group variant (ported from food app `c-toggle-group-4`). */
export function ToggleGroupSpaced({
  defaultValue = ['week'],
  value,
  onValueChange,
}: ToggleGroupSpacedProps) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={2}
      {...(value !== undefined ? { value } : { defaultValue })}
      {...(onValueChange ? { onValueChange } : {})}
      aria-label="Date range period"
    >
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  );
}
