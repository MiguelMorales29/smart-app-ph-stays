import type { ComponentProps } from 'react';
import { formatPhMobile, normalizePhMobile } from '@smartapp/core';
import { MaskInput } from '@smartapp/ui/components/mask-input';

/** Turns whatever was typed or pasted (0917…, 917…, +63 917…) into 11 local digits (09…). */
function toLocalDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('63')) digits = `0${digits.slice(2)}`;
  if (digits.startsWith('9')) digits = `0${digits}`;
  return digits.slice(0, 11);
}

const PH_MOBILE_MASK = {
  pattern: '#### ### ####',
  transform: toLocalDigits,
  validate: (value: string) => normalizePhMobile(value) !== null,
};

export interface PhoneInputProps extends Omit<
  ComponentProps<typeof MaskInput>,
  'value' | 'defaultValue' | 'onValueChange' | 'mask'
> {
  /** Stored form, +639XXXXXXXXX, or '' when empty. */
  readonly value: string;
  /** Called with +639XXXXXXXXX when the number is complete and valid, otherwise with what was typed. */
  readonly onValueChange: (value: string) => void;
}

/**
 * Philippine mobile field (also GCash and Maya numbers): shows 0917 123 4567, stores +639…
 * (Phase 4 plan, section 9). The keyboard is the phone keypad.
 */
export function PhoneInput({ value, onValueChange, ...props }: PhoneInputProps) {
  const shown = value.startsWith('+63') ? formatPhMobile(value) : value;
  return (
    <MaskInput
      data-slot="phone-input"
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="0917 123 4567"
      mask={PH_MOBILE_MASK}
      value={shown}
      onValueChange={(masked) => {
        onValueChange(normalizePhMobile(masked) ?? masked);
      }}
      {...props}
    />
  );
}
