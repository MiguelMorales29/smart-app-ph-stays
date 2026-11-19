import { appError, reasonError, words } from '@smartapp/core';
import { describe, expect, it, vi } from 'vitest';

import { DataSourceAppError } from './shared';
import { applyAppErrorToForm, type FormErrorTarget } from './use-form-errors';

interface SampleFormValues {
  slug: string;
  email: string;
  password: string;
}

function makeMockForm(): {
  readonly target: FormErrorTarget<SampleFormValues>;
  readonly setError: ReturnType<typeof vi.fn>;
  readonly setFocus: ReturnType<typeof vi.fn>;
  readonly clearErrors: ReturnType<typeof vi.fn>;
} {
  const setError = vi.fn();
  const setFocus = vi.fn();
  const clearErrors = vi.fn();
  const target: FormErrorTarget<SampleFormValues> = {
    setError,
    setFocus,
    clearErrors,
  };
  return { target, setError, setFocus, clearErrors };
}

describe('applyAppErrorToForm (useFormErrors core logic)', () => {
  it('places details.fields onto matching fields and focuses the first errored field', () => {
    const { target, setError, setFocus } = makeMockForm();
    const err = new DataSourceAppError(
      reasonError('not_allowed', 'invalid_input', {
        fields: {
          email: 'Enter a valid email.',
          password: 'Use at least 8 characters.',
        },
      }),
    );

    const outcome = applyAppErrorToForm(err, target, {
      knownFields: ['slug', 'email', 'password'],
    });

    expect(outcome).toEqual({
      topError: null,
      focusedField: 'email',
      fieldCount: 2,
    });
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Enter a valid email.',
    });
    expect(setError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'Use at least 8 characters.',
    });
    expect(setFocus).toHaveBeenCalledWith('email');
  });

  it('maps reason codes such as slug_taken onto the matching form field even without details.fields', () => {
    const { target, setError, setFocus } = makeMockForm();
    const err = new DataSourceAppError(reasonError('not_allowed', 'slug_taken'));

    const outcome = applyAppErrorToForm(err, target, {
      knownFields: ['slug', 'email', 'password'],
    });

    expect(outcome).toEqual({
      topError: null,
      focusedField: 'slug',
      fieldCount: 1,
    });
    expect(setError).toHaveBeenCalledWith('slug', {
      type: 'server',
      message: words.errorReasons.slug_taken,
    });
    expect(setFocus).toHaveBeenCalledWith('slug');
  });

  it('remaps contract field names via fieldMap (for example newSlug -> slug)', () => {
    const { target, setError, setFocus } = makeMockForm();
    const err = new DataSourceAppError(
      reasonError('not_allowed', 'slug_reserved', {
        fields: { newSlug: words.errorReasons.slug_reserved },
      }),
    );

    const outcome = applyAppErrorToForm(err, target, {
      knownFields: ['slug'],
      fieldMap: { newSlug: 'slug' },
    });

    expect(outcome.focusedField).toBe('slug');
    expect(setError).toHaveBeenCalledWith('slug', {
      type: 'server',
      message: words.errorReasons.slug_reserved,
    });
    expect(setFocus).toHaveBeenCalledWith('slug');
  });

  it('surfaces unmapped or unknown errors at the top (root) without focusing a field', () => {
    const { target, setError, setFocus } = makeMockForm();
    const err = new DataSourceAppError(reasonError('not_allowed', 'changed_elsewhere'));

    const outcome = applyAppErrorToForm(err, target, {
      knownFields: ['slug', 'email', 'password'],
    });

    expect(outcome).toEqual({
      topError: words.errorReasons.changed_elsewhere,
      focusedField: null,
      fieldCount: 0,
    });
    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: words.errorReasons.changed_elsewhere,
    });
    expect(setFocus).not.toHaveBeenCalled();

    const generic = applyAppErrorToForm(appError('not_found'), target, {
      knownFields: ['slug'],
    });
    expect(generic.topError).toBe(words.errors.not_found);
  });
});
