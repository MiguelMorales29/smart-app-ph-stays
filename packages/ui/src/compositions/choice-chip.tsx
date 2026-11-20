import type { ReactNode } from 'react';
import { CheckIcon } from 'lucide-react';
import { Toggle } from '@smartapp/ui/components/toggle';
import { cn } from '@smartapp/ui/lib/utils';

/** The selected-state chip (Pattern Guide §3.5): tint, a blue ring and a check, in both modes. */
export const CHIP_CLASS =
  'press min-h-11 rounded-full border border-input bg-card px-3.5 text-sm font-medium text-foreground pointer-fine:min-h-9 hover-hover:hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary-tint aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_0.5px_var(--primary)] data-pressed:border-primary data-pressed:bg-primary-tint';

export function ChoiceChip({
  pressed,
  onPressedChange,
  children,
  className,
  icon,
}: {
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly icon?: ReactNode | undefined;
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      className={cn(CHIP_CLASS, className)}
    >
      {pressed ? (
        <CheckIcon aria-hidden="true" className="size-4 text-primary" />
      ) : icon ? (
        <span aria-hidden="true" className="contents">
          {icon}
        </span>
      ) : null}
      {children}
    </Toggle>
  );
}
