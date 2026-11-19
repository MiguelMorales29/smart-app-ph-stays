import { useId, useState, type ComponentProps } from 'react';
import { TriangleAlertIcon } from 'lucide-react';
import { formatPesos, parsePesosToCentavos } from '@smartapp/core';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@smartapp/ui/components/input-group';

/** Above this many centavos (₱100,000) the field asks the owner to double-check. */
const CHECK_ABOVE_CENTAVOS = 10_000_000;

export interface MoneyInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  /** Whole centavos, or null when empty or not a valid amount. */
  readonly value: number | null;
  readonly onValueChange: (centavos: number | null) => void;
  /** Shown after the big-amount check: "a night", "a month". */
  readonly per?: string | undefined;
  readonly invalid?: boolean | undefined;
}

function display(value: number | null): string {
  if (value === null) return '';
  return formatPesos(value).replace(/^₱/, '');
}

/**
 * Peso amount field (Phase 4 plan, section 9): accepts "1,500", "1500", "₱1500" and "1.5k", keeps
 * whole centavos, shows "1,500" after you leave the field, and never uses type=number.
 */
export function MoneyInput({
  value,
  onValueChange,
  per = 'a night',
  invalid,
  onBlur,
  onFocus,
  id,
  ...props
}: MoneyInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? display(value);
  const big = value !== null && value > CHECK_ABOVE_CENTAVOS;

  return (
    <div data-slot="money-input" className="flex flex-col gap-1.5">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText aria-hidden="true">₱</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          className="tabular"
          aria-invalid={invalid === true ? true : undefined}
          value={shown}
          onFocus={(event) => {
            setDraft(display(value));
            onFocus?.(event);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            onValueChange(parsePesosToCentavos(event.target.value));
          }}
          onBlur={(event) => {
            setDraft(null);
            onBlur?.(event);
          }}
          {...props}
        />
      </InputGroup>
      {big ? (
        <p className="flex items-center gap-1.5 text-sm text-foreground" role="status">
          <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
          Is ₱{display(value)} {per} right?
        </p>
      ) : null}
    </div>
  );
}
