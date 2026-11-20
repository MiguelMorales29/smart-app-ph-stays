import { MinusIcon, PlusIcon } from 'lucide-react';
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import { cn } from '@smartapp/ui/lib/utils';

/**
 * A compact − value + pill for small counts on a grouped row (Pattern Guide §3.4). Large ranges
 * use a picker sheet instead.
 */
export function InlineStepper({
  id,
  label,
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  unit,
  className,
}: {
  readonly id?: string | undefined;
  /** Spoken name, e.g. "Guests". The buttons say "Fewer guests" / "More guests". */
  readonly label: string;
  readonly value: number;
  readonly onValueChange: (value: number) => void;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  /** Shown after the number for screen readers, e.g. "nights". */
  readonly unit?: string | undefined;
  readonly className?: string | undefined;
}) {
  const word = label.toLowerCase();
  return (
    <NumberFieldPrimitive.Root
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => onValueChange(next ?? min)}
      className={cn('inline-flex shrink-0', className)}
    >
      <NumberFieldPrimitive.Group
        data-slot="inline-stepper"
        className="inline-flex items-center gap-1 rounded-full bg-muted p-[3px]"
      >
        <NumberFieldPrimitive.Decrement
          aria-label={`Fewer ${word}`}
          className="press grid size-11 place-items-center rounded-full bg-card text-foreground shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 pointer-fine:size-8 dark:bg-raised"
        >
          <MinusIcon aria-hidden="true" className="size-4" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          aria-label={unit ? `${label} (${unit})` : label}
          className="w-9 bg-transparent text-center text-base font-semibold text-foreground tabular outline-none pointer-fine:text-sm"
        />
        <NumberFieldPrimitive.Increment
          aria-label={`More ${word}`}
          className="press grid size-11 place-items-center rounded-full bg-card text-foreground shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 pointer-fine:size-8 dark:bg-raised"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}
