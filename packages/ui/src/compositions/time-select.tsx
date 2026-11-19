import type { ComponentProps } from 'react';
import { HALF_HOUR_TIME_OPTIONS } from '@smartapp/core';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';

export interface TimeSelectProps extends Omit<
  ComponentProps<typeof NativeSelect>,
  'value' | 'onChange'
> {
  /** Stored as "14:00". */
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

/** 30-minute choices shown as "2:00 PM" and stored as "14:00", using the phone's own picker. */
export function TimeSelect({ value, onValueChange, ...props }: TimeSelectProps) {
  return (
    <NativeSelect
      data-slot="time-select"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      {...props}
    >
      {HALF_HOUR_TIME_OPTIONS.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
