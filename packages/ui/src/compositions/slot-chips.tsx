'use client';

import { Scroller } from '@smartapp/ui/components/scroller';
import { ToggleGroup, ToggleGroupItem } from '@smartapp/ui/components/toggle-group';
import { cn } from 'cn';
import type { ReactNode } from 'react';

export type SlotChipTone = 'default' | 'muted' | 'warning' | 'danger' | 'primary';

const DETAIL_TONE: Record<SlotChipTone, string> = {
  default: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  warning: 'text-warning',
  danger: 'text-destructive',
  primary: 'text-primary',
};

export interface SlotChip {
  readonly value: string;
  readonly label: ReactNode;
  /** Optional second line: e.g. "2 free", "Taken", or "Today". */
  readonly detail?: ReactNode | undefined;
  readonly icon?: ReactNode | undefined;
  readonly tone?: SlotChipTone | undefined;
  readonly disabled?: boolean | undefined;
  /** Crossed out for unavailable check-in or viewing slots. */
  readonly struck?: boolean | undefined;
  /** Dashed ring marking the booking's current check-in or viewing slot. */
  readonly current?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
}

const DAY_BASE =
  'h-16 min-w-18 shrink-0 flex-col gap-0.5 rounded-2xl px-3 text-sm font-semibold aria-pressed:border-transparent';
const TIME_BASE =
  'h-auto min-h-11 min-w-22 flex-col gap-0 rounded-full px-3 py-1 text-base font-medium tabular aria-pressed:border-transparent';

function ChipBody({ chip }: { readonly chip: SlotChip }) {
  return (
    <>
      <span className={cn('flex items-center gap-1', chip.struck && 'line-through')}>
        {chip.label}
      </span>
      {chip.detail ? (
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            DETAIL_TONE[chip.tone ?? 'default'],
            'group-aria-pressed/chip:text-current',
          )}
        >
          {chip.icon}
          {chip.detail}
        </span>
      ) : null}
    </>
  );
}

function chipClass(chip: SlotChip, base: string, pressedClassName: string) {
  return cn(
    'group/chip',
    base,
    pressedClassName,
    chip.disabled && 'opacity-60',
    chip.current && 'border-2 border-dashed border-primary',
  );
}

export interface DayChipsProps {
  readonly chips: readonly SlotChip[];
  readonly value: string | null;
  readonly onValueChange: (value: string) => void;
  readonly label: string;
  /** Active styles, e.g. `aria-pressed:bg-primary aria-pressed:text-primary-foreground`. */
  readonly pressedClassName?: string | undefined;
  readonly trailing?: ReactNode | undefined;
  readonly className?: string | undefined;
}

/** Horizontally scrolling day chips for check-in or viewing date picking (adapted for stays). */
export function DayChips({
  chips,
  value,
  onValueChange,
  label,
  pressedClassName = 'aria-pressed:bg-primary aria-pressed:text-primary-foreground',
  trailing,
  className,
}: DayChipsProps) {
  return (
    <Scroller
      orientation="horizontal"
      hideScrollbar
      className={cn('-mx-1 min-w-0 px-1', className)}
    >
      <div className="flex w-max items-stretch gap-2">
        <ToggleGroup
          value={value ? [value] : []}
          onValueChange={(next) => {
            const picked = next[0];
            if (picked) onValueChange(picked);
          }}
          aria-label={label}
          spacing={2}
          className="flex w-max items-stretch"
        >
          {chips.map((chip) => (
            <ToggleGroupItem
              key={chip.value}
              value={chip.value}
              variant="outline"
              disabled={chip.disabled}
              aria-label={chip.ariaLabel}
              className={chipClass(chip, DAY_BASE, pressedClassName)}
            >
              <ChipBody chip={chip} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {trailing}
      </div>
    </Scroller>
  );
}

export interface TimeChipsProps {
  readonly chips: readonly SlotChip[];
  readonly value: string | null;
  readonly onValueChange: (value: string) => void;
  readonly label: string;
  readonly pressedClassName?: string | undefined;
  readonly className?: string | undefined;
}

/** Wrapping time-slot chips for check-in arrival windows and rental viewing times. */
export function TimeChips({
  chips,
  value,
  onValueChange,
  label,
  pressedClassName = 'aria-pressed:bg-primary aria-pressed:text-primary-foreground',
  className,
}: TimeChipsProps) {
  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(next) => {
        const picked = next[0];
        if (picked) onValueChange(picked);
      }}
      aria-label={label}
      spacing={2}
      className={cn('flex flex-wrap', className)}
    >
      {chips.map((chip) => (
        <ToggleGroupItem
          key={chip.value}
          value={chip.value}
          variant="outline"
          disabled={chip.disabled}
          aria-label={chip.ariaLabel}
          className={chipClass(chip, TIME_BASE, pressedClassName)}
        >
          <ChipBody chip={chip} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
