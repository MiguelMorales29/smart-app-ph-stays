import { useId, useState, type ReactNode } from 'react';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { Switch } from '@smartapp/ui/components/switch';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { cn } from '@smartapp/ui/lib/utils';

/**
 * Grouped rows (Pattern Guide §3.2): settings-style rows in a rounded group with a small title.
 * Use RowButton (opens something), RowSwitch, RowPicker (a choice in a sheet) and RowControl
 * (any control on the right, such as InlineStepper).
 */
export function RowGroup({
  title,
  footer,
  children,
  className,
}: {
  readonly title?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  readonly children: ReactNode;
  readonly className?: string | undefined;
}) {
  const titleId = useId();
  return (
    <section
      data-slot="row-group"
      aria-labelledby={title ? titleId : undefined}
      className={cn('flex flex-col gap-1.5', className)}
    >
      {title ? (
        <h3 id={titleId} className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
      {footer ? <p className="text-sm text-muted-foreground">{footer}</p> : null}
    </section>
  );
}

const ROW =
  'flex min-h-13 w-full items-center gap-3 px-4 py-2 text-left text-base text-foreground pointer-fine:min-h-12 pointer-fine:text-sm';

function RowText({
  label,
  hint,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate">{label}</span>
      {hint ? <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span> : null}
    </span>
  );
}

/** A row that opens something: a value on the right and a chevron. */
export function RowButton({
  label,
  hint,
  value,
  icon,
  onClick,
  dot,
  className,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
  readonly value?: ReactNode | undefined;
  readonly icon?: ReactNode | undefined;
  readonly onClick: () => void;
  /** Marks a row that still needs the owner. */
  readonly dot?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        ROW,
        'press outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted',
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <RowText label={label} hint={hint} />
      {dot ? (
        <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Needs you" />
      ) : null}
      {value !== undefined ? (
        <span className="max-w-[55%] truncate text-right text-muted-foreground tabular">
          {value}
        </span>
      ) : null}
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** A row with a switch. The whole row toggles it. */
export function RowSwitch({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean | undefined;
}) {
  const id = useId();
  return (
    <div className={ROW}>
      <label htmlFor={id} id={`${id}-label`} className="min-w-0 flex-1 cursor-pointer">
        <span className="block">{label}</span>
        {hint ? (
          <span id={`${id}-hint`} className="mt-0.5 block text-sm text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </label>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

/** A row with any control on the right (for example an InlineStepper). */
export function RowControl({
  label,
  hint,
  children,
  labelFor,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
  readonly children: ReactNode;
  readonly labelFor?: string | undefined;
}) {
  return (
    <div className={ROW}>
      <span className="min-w-0 flex-1">
        {labelFor ? (
          <label htmlFor={labelFor} className="block">
            {label}
          </label>
        ) : (
          <span className="block">{label}</span>
        )}
        {hint ? <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

export interface PickerOption<T extends string | number> {
  readonly value: T;
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
}

/** A row whose value is picked from a checked list in a half-height sheet. */
export function RowPicker<T extends string | number>({
  label,
  hint,
  value,
  options,
  onValueChange,
  sheetTitle,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
  readonly value: T;
  readonly options: readonly PickerOption<T>[];
  readonly onValueChange: (value: T) => void;
  readonly sheetTitle?: ReactNode | undefined;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);
  return (
    <>
      <RowButton
        label={label}
        hint={hint}
        value={current?.label ?? ''}
        onClick={() => setOpen(true)}
      />
      <AppSheet
        open={open}
        onOpenChange={setOpen}
        title={sheetTitle ?? label}
        height="half"
        size="sm"
      >
        <div
          role="listbox"
          aria-label={typeof label === 'string' ? label : undefined}
          className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  ROW,
                  'press outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted',
                  selected && 'font-semibold',
                )}
              >
                <RowText label={option.label} hint={option.hint} />
                {selected ? (
                  <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </AppSheet>
    </>
  );
}

/** "Custom…" for a number picker (R-3): any whole number in the range the database allows. */
export interface RowPickerCustom {
  readonly min: number;
  readonly max: number;
  /** "nights", "days", "minutes" or "%" shown after the field. */
  readonly unit: string;
  /** Label for the field, such as "Nights". */
  readonly inputLabel: string;
}

/**
 * RowPicker for numbers with a "Custom…" row (R-3, AUDIT-1 A13): presets first, then any whole
 * number in the range the database allows.
 */
export function RowNumberPicker({
  label,
  hint,
  value,
  options,
  onValueChange,
  sheetTitle,
  custom,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode | undefined;
  readonly value: number;
  readonly options: readonly PickerOption<number>[];
  readonly onValueChange: (value: number) => void;
  readonly sheetTitle?: ReactNode | undefined;
  readonly custom: RowPickerCustom;
}) {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const current = options.find((option) => option.value === value);
  const isPreset = (candidate: number) => options.some((option) => option.value === candidate);

  function openSheet(next: boolean) {
    setOpen(next);
    if (next) {
      setTyping(false);
      setError(null);
      setDraft(String(value));
    }
  }

  function applyCustom() {
    const parsed = Number.parseInt(draft.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed < custom.min || parsed > custom.max) {
      setError(`Enter a whole number from ${custom.min} to ${custom.max}.`);
      return;
    }
    onValueChange(parsed);
    setOpen(false);
  }

  return (
    <>
      <RowButton
        label={label}
        hint={hint}
        value={current?.label ?? ''}
        onClick={() => openSheet(true)}
      />
      <AppSheet
        open={open}
        onOpenChange={openSheet}
        title={sheetTitle ?? label}

        size="sm"
      >
        <div
          role="listbox"
          aria-label={typeof label === 'string' ? label : undefined}
          className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
        >
          {options.map((option) => {
            const selected = option.value === value && !typing;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  ROW,
                  'press outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted',
                  selected && 'font-semibold',
                )}
              >
                <RowText label={option.label} hint={option.hint} />
                {selected ? (
                  <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
          {
            <button
              type="button"
              role="option"
              aria-selected={typing}
              onClick={() => {
                setTyping(true);
                setError(null);
                if (isPreset(value)) setDraft('');
              }}
              className={cn(
                ROW,
                'press outline-none hover-hover:hover:bg-muted/60 focus-visible:bg-muted',
                typing && 'font-semibold',
              )}
            >
              <RowText label="Custom…" hint={`Any number from ${custom.min} to ${custom.max}`} />
              {typing ? (
                <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-primary" />
              ) : null}
            </button>
          }
        </div>
        {typing ? (
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applyCustom();
            }}
          >
            <label htmlFor={inputId} className="text-sm font-medium">
              {custom.inputLabel}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
                <input
                  id={inputId}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="off"
                  value={draft}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-base tabular outline-none"
                />
                <span className="text-sm text-muted-foreground">{custom.unit}</span>
              </div>
              <button
                type="submit"
                className="press inline-flex min-h-11 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-medium whitespace-nowrap text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Use this
              </button>
            </div>
            {error ? (
              <p id={`${inputId}-error`} className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}
      </AppSheet>
    </>
  );
}
