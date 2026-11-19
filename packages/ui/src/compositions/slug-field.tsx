import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
import { CheckIcon, LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react';
import { checkSlugFormat, slugifyPropertyName } from '@smartapp/core';
import { cn } from 'cn';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@smartapp/ui/components/input-group';

export type SlugCheckStatus = 'available' | 'taken' | 'reserved' | 'invalid';

export interface SlugCheckResult {
  readonly status: SlugCheckStatus;
  readonly suggestions: readonly string[];
}

export interface SlugFieldProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'defaultValue'
> {
  readonly value: string;
  readonly onValueChange: (slug: string) => void;
  /** Checks the address with the data layer (checkSlug). Called 400 ms after typing stops. */
  readonly check: (slug: string) => Promise<SlugCheckResult>;
  /** The guest-facing host shown before the slash, e.g. "smartapp.ph". */
  readonly host?: string | undefined;
  /** The current saved address: no check needed while unchanged. */
  readonly savedValue?: string | undefined;
  readonly onStatusChange?: ((status: SlugCheckStatus | 'checking' | 'idle') => void) | undefined;
}

type State =
  | { readonly kind: 'idle' }
  | { readonly kind: 'checking' }
  | { readonly kind: 'done'; readonly result: SlugCheckResult };

/** Turns a property name into its web address ("Tita Lorna's Dorm" → tita-lornas-dorm). */
export const slugFromName = slugifyPropertyName;

/**
 * The web-address field (Phase 4 plan, section 5): a / prefix, checked 400 ms after typing stops,
 * with the answer in a fixed-height slot so nothing jumps.
 */
export function SlugField({
  value,
  onValueChange,
  check,
  host,
  savedValue,
  onStatusChange,
  id,
  ...props
}: SlugFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const statusId = `${inputId}-status`;
  const [state, setState] = useState<State>({ kind: 'idle' });
  const latest = useRef(0);
  const checkRef = useRef(check);
  const statusRef = useRef(onStatusChange);
  useEffect(() => {
    checkRef.current = check;
    statusRef.current = onStatusChange;
  });

  useEffect(() => {
    const request = ++latest.current;
    if (value.length === 0 || value === savedValue) {
      const idle = window.setTimeout(() => {
        setState({ kind: 'idle' });
        statusRef.current?.('idle');
      }, 0);
      return () => window.clearTimeout(idle);
    }
    const format = checkSlugFormat(value);
    const timer = window.setTimeout(() => {
      if (format !== 'valid') {
        setState({
          kind: 'done',
          result: { status: format === 'reserved' ? 'reserved' : 'invalid', suggestions: [] },
        });
        statusRef.current?.(format === 'reserved' ? 'reserved' : 'invalid');
        return;
      }
      setState({ kind: 'checking' });
      statusRef.current?.('checking');
      void checkRef.current(value).then(
        (result) => {
          if (request !== latest.current) return;
          setState({ kind: 'done', result });
          statusRef.current?.(result.status);
        },
        () => {
          if (request !== latest.current) return;
          setState({ kind: 'idle' });
          statusRef.current?.('idle');
        },
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [value, savedValue]);

  const result = state.kind === 'done' ? state.result : null;
  const bad = result !== null && result.status !== 'available';

  return (
    <div data-slot="slug-field" className="flex flex-col gap-1.5">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText className="max-w-40 truncate text-foreground">
            {host ? `${host}/` : '/'}
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          value={value}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={bad ? true : undefined}
          aria-describedby={statusId}
          onChange={(event) => onValueChange(event.target.value.toLowerCase().replace(/\s+/g, '-'))}
          {...props}
        />
      </InputGroup>
      <div id={statusId} aria-live="polite" className="min-h-6 text-sm">
        {state.kind === 'checking' ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <LoaderCircleIcon aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            Checking…
          </span>
        ) : null}
        {result?.status === 'available' ? (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <CheckIcon aria-hidden="true" className="size-4 text-success" />
            {value} is free
          </span>
        ) : null}
        {result?.status === 'taken' ? (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-foreground">
            <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
            Taken.
            {result.suggestions.length > 0 ? (
              <>
                {' '}
                Try:
                {result.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="min-h-6 rounded-md bg-primary-tint px-1.5 font-medium text-primary-hover underline-offset-2 hover-hover:hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none pointer-coarse:min-h-11"
                    onClick={() => onValueChange(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </>
            ) : null}
          </span>
        ) : null}
        {result?.status === 'reserved' ? (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
            That word is kept for the app
          </span>
        ) : null}
        {result?.status === 'invalid' ? (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
            Use 3 to 40 letters or numbers
          </span>
        ) : null}
        {state.kind === 'idle' ? (
          <span className={cn('text-muted-foreground')}>
            You can change it later; old links keep working.
          </span>
        ) : null}
      </div>
    </div>
  );
}
