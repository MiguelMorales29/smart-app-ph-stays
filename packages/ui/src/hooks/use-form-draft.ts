import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'smartapp-draft:';
const SAVE_DELAY_MS = 800;

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return parsed;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): drafts are a convenience, so stay quiet.
  }
}

export function clearFormDraft(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export interface FormDraft<T> {
  /** A kept draft from before (the app reloaded or the owner left), or null. */
  readonly saved: T | null;
  /** Keep the draft: returns it and hides the question. */
  readonly keep: () => T | null;
  /** Throw the draft away. */
  readonly discard: () => void;
  /** Call after a successful save. */
  readonly clear: () => void;
}

/**
 * Keeps unsaved form values on the device, 800 ms after typing stops, so they survive the app
 * being reloaded (owners jump to GCash to copy a number and iOS may reload the app). On return it
 * offers "We kept the changes you didn't save. Keep them / Start over" (Phase 4 plan, section 6).
 *
 * `parse` checks the stored value (use the form's Zod schema's safeParse) so an old draft from a
 * different form shape is ignored.
 */
export function useFormDraft<T>({
  key,
  values,
  dirty,
  parse,
}: {
  /** One key per form and record, e.g. `unit:${unitId}`. */
  readonly key: string;
  readonly values: T;
  readonly dirty: boolean;
  readonly parse: (value: unknown) => T | null;
}): FormDraft<T> {
  const [saved, setSaved] = useState<T | null>(() =>
    typeof window === 'undefined' ? null : parse(read(key)),
  );
  const parseRef = useRef(parse);
  useEffect(() => {
    parseRef.current = parse;
  });
  const asked = saved !== null;

  useEffect(() => {
    if (!dirty || asked) return;
    const timer = window.setTimeout(() => write(key, values), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [key, values, dirty, asked]);

  const keep = useCallback(() => {
    const value = saved;
    setSaved(null);
    return value;
  }, [saved]);
  const discard = useCallback(() => {
    clearFormDraft(key);
    setSaved(null);
  }, [key]);
  const clear = useCallback(() => {
    clearFormDraft(key);
    setSaved(null);
  }, [key]);

  return { saved, keep, discard, clear };
}
