import { useId, type ReactNode } from 'react';
import { cn } from 'cn';
import { RadioGroup, RadioGroupItem } from '@smartapp/ui/components/radio-group';

export interface RadioCardOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
}

/**
 * One choice from a few, shown as tappable cards (property type, what you rent, cancellation
 * preset). Built on the installed RadioGroup, so arrow keys and screen readers work.
 */
export function RadioCards<T extends string>({
  options,
  value,
  onValueChange,
  columns = 2,
  invalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: {
  readonly options: readonly RadioCardOption<T>[];
  readonly value: T | null;
  readonly onValueChange: (value: T) => void;
  readonly columns?: 1 | 2 | 3 | 4 | undefined;
  readonly invalid?: boolean | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
  readonly className?: string | undefined;
}) {
  const baseId = useId();
  return (
    <RadioGroup
      data-slot="radio-cards"
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) onValueChange(match.value);
      }}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-invalid={invalid === true ? true : undefined}
      className={cn(
        'grid gap-2',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 min-[420px]:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-3',
        columns === 4 && 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {options.map((option) => {
        const id = `${baseId}-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors duration-fast',
              'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              checked
                ? 'border-primary bg-primary-tint'
                : 'border-border bg-card hover-hover:hover:bg-muted',
              invalid === true && !checked && 'border-destructive',
            )}
          >
            <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
            {option.icon ? (
              <span aria-hidden="true" className="mt-0.5 text-muted-foreground [&_svg]:size-4">
                {option.icon}
              </span>
            ) : null}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">{option.label}</span>
              {option.description ? (
                <span className="text-muted-foreground">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
