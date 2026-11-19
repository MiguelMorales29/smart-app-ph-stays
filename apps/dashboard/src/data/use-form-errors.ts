import { readErrorDetails, type AppError, type ErrorReason } from '@smartapp/core';
import { useCallback, useState } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { extractAppError } from './shared';

export interface FormErrorTarget<TFieldValues extends FieldValues> {
  readonly setError: UseFormReturn<TFieldValues>['setError'];
  readonly setFocus: UseFormReturn<TFieldValues>['setFocus'];
  readonly clearErrors: UseFormReturn<TFieldValues>['clearErrors'];
}

export interface ApplyFormErrorOptions<TFieldValues extends FieldValues> {
  /**
   * Valid form field names that can receive inline field errors and focus.
   */
  readonly knownFields?: readonly Path<TFieldValues>[];
  /**
   * Maps backend/contract field names (e.g. `newSlug`, `accountNumber`) to form field names.
   */
  readonly fieldMap?: Readonly<Record<string, Path<TFieldValues>>>;
  /**
   * Maps typed ErrorReasons (e.g. `slug_taken`, `email_taken`) to a target form field
   * when `details.fields` does not explicitly include one.
   */
  readonly reasonFieldMap?: Partial<Readonly<Record<ErrorReason, Path<TFieldValues>>>>;
}

const DEFAULT_REASON_FIELD_NAMES: Partial<Readonly<Record<ErrorReason, string>>> = {
  slug_taken: 'slug',
  slug_reserved: 'slug',
  slug_change_limit: 'slug',
  email_taken: 'email',
  bank_limit: 'method',
  wrong_password: 'password',
  file_too_large: 'file',
  not_image: 'file',
};

export interface AppliedFormErrorResult<TFieldValues extends FieldValues> {
  readonly topError: string | null;
  readonly focusedField: Path<TFieldValues> | null;
  readonly fieldCount: number;
}

/**
 * Pure helper that maps an `AppError` (or unknown thrown error) onto React Hook Form fields,
 * focuses the first errored field, and returns a top-level message for unmapped/unknown errors.
 */
export function applyAppErrorToForm<TFieldValues extends FieldValues>(
  caught: AppError | unknown,
  form: FormErrorTarget<TFieldValues>,
  options: ApplyFormErrorOptions<TFieldValues> = {},
): AppliedFormErrorResult<TFieldValues> {
  const normalizedError = extractAppError(caught);

  const details = readErrorDetails(normalizedError);
  const knownList = options.knownFields ?? [];
  const fieldMap = options.fieldMap ?? {};
  const reasonFieldMap = options.reasonFieldMap ?? {};

  const resolveField = (rawKey: string): Path<TFieldValues> | null => {
    const mapped = fieldMap[rawKey];
    if (mapped !== undefined) return mapped;
    for (const candidate of knownList) {
      if (candidate === rawKey) return candidate;
    }
    return null;
  };

  let focusedField: Path<TFieldValues> | null = null;
  let fieldCount = 0;
  let unmappedTopMessage: string | null = null;

  for (const [rawField, message] of Object.entries(details.fields)) {
    const resolved = resolveField(rawField);
    if (resolved !== null) {
      form.setError(resolved, { type: 'server', message });
      if (focusedField === null) {
        focusedField = resolved;
      }
      fieldCount += 1;
    } else if (unmappedTopMessage === null) {
      unmappedTopMessage = message;
    }
  }

  if (fieldCount === 0 && details.reason !== null) {
    const explicitReasonField = reasonFieldMap[details.reason];
    const fallbackName = DEFAULT_REASON_FIELD_NAMES[details.reason];
    const targetField =
      explicitReasonField ?? (fallbackName !== undefined ? resolveField(fallbackName) : null);
    if (targetField !== null) {
      form.setError(targetField, { type: 'server', message: normalizedError.message });
      focusedField = targetField;
      fieldCount = 1;
    }
  }

  if (focusedField !== null) {
    form.setFocus(focusedField);
    return {
      topError: null,
      focusedField,
      fieldCount,
    };
  }

  const topMessage = unmappedTopMessage ?? normalizedError.message;
  form.setError('root', { type: 'server', message: topMessage });
  return {
    topError: topMessage,
    focusedField: null,
    fieldCount: 0,
  };
}

export interface UseFormErrorsResult<TFieldValues extends FieldValues> {
  readonly topError: string | null;
  readonly clearTopError: () => void;
  readonly applyError: (caught: AppError | unknown) => AppliedFormErrorResult<TFieldValues>;
}

/**
 * Maps contract/API error reasons and `details.fields` onto React Hook Form fields,
 * focuses the first errored field, and surfaces unknown/root errors at the top of the form.
 */
export function useFormErrors<TFieldValues extends FieldValues>(
  form: FormErrorTarget<TFieldValues>,
  options: ApplyFormErrorOptions<TFieldValues> = {},
): UseFormErrorsResult<TFieldValues> {
  const [topError, setTopError] = useState<string | null>(null);

  const clearTopError = useCallback(() => {
    setTopError(null);
    form.clearErrors('root');
  }, [form]);

  const applyError = useCallback(
    (caught: AppError | unknown) => {
      const outcome = applyAppErrorToForm(caught, form, options);
      setTopError(outcome.topError);
      return outcome;
    },
    [form, options],
  );

  return {
    topError,
    clearTopError,
    applyError,
  };
}
