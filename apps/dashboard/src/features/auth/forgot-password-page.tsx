import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { accountsRow, resetPasswordFormSchema, type ResetPasswordForm } from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { applyAppErrorToForm } from '@/data/use-form-errors';
import { useRequestPasswordCodeMutation, useResetPasswordMutation } from '@/data/auth/writes';

const emailSchema = z.object({ email: accountsRow.shape.contact_email });

type Stage = 'email' | 'code' | 'done';

/** /forgot-password: email → 6-digit code → new password (F20). Never says whether an email exists. */
export function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>('email');
  const [topError, setTopError] = useState<string | null>(null);
  const requestCode = useRequestPasswordCodeMutation();
  const reset = useResetPasswordMutation();
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { email: '', code: '', newPassword: '', confirmPassword: '' },
  });

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <MilestonePicture art="welcome" size="sm" />
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Password changed</h1>
          <p className="text-sm text-muted-foreground">Other devices are signed out.</p>
        </div>
        <Button className="min-h-11 w-full" render={<Link to="/login" />} nativeButton={false}>
          Sign in
        </Button>
      </div>
    );
  }

  if (stage === 'code') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <MilestonePicture art="code_sent" size="sm" />
          <h1 className="font-heading text-2xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If that email has an account, we sent a 6-digit code to {resetForm.getValues('email')}.
          </p>
        </div>
        {topError ? (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        ) : null}
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={resetForm.handleSubmit(async (values) => {
            setTopError(null);
            try {
              await reset.mutateAsync({
                email: values.email,
                code: values.code,
                newPassword: values.newPassword,
              });
              setStage('done');
            } catch (caught) {
              const applied = applyAppErrorToForm(caught, resetForm, {
                knownFields: ['code', 'newPassword', 'confirmPassword'],
              });
              if (applied.fieldCount === 0) {
                resetForm.setError('code', {
                  type: 'server',
                  message: applied.topError ?? 'That code is wrong or expired. Ask for a new code.',
                });
                resetForm.setFocus('code');
              }
            }
          })}
        >
          <Field data-invalid={resetForm.formState.errors.code ? true : undefined}>
            <FieldLabel htmlFor="reset-code">Code</FieldLabel>
            <Input
              id="reset-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="tabular tracking-[0.3em]"
              aria-invalid={resetForm.formState.errors.code ? true : undefined}
              {...resetForm.register('code')}
            />
            <FieldError>{resetForm.formState.errors.code?.message}</FieldError>
          </Field>
          <Field data-invalid={resetForm.formState.errors.newPassword ? true : undefined}>
            <FieldLabel htmlFor="reset-password">New password</FieldLabel>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              rules="At least 8 characters."
              invalid={resetForm.formState.errors.newPassword !== undefined}
              {...resetForm.register('newPassword')}
            />
            <FieldError>{resetForm.formState.errors.newPassword?.message}</FieldError>
          </Field>
          <Field data-invalid={resetForm.formState.errors.confirmPassword ? true : undefined}>
            <FieldLabel htmlFor="reset-confirm">Type it again</FieldLabel>
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              invalid={resetForm.formState.errors.confirmPassword !== undefined}
              {...resetForm.register('confirmPassword')}
            />
            <FieldError>{resetForm.formState.errors.confirmPassword?.message}</FieldError>
          </Field>
          <AsyncButton
            type="submit"
            className="min-h-11"
            state={reset.isPending ? 'busy' : 'idle'}
            busyLabel="Changing…"
          >
            Change password
          </AsyncButton>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setStage('email')}
          >
            Use a different email
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">We'll email you a 6-digit code.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={emailForm.handleSubmit(async (values) => {
          await requestCode.mutateAsync({ email: values.email.trim() }).catch(() => null);
          resetForm.setValue('email', values.email.trim());
          setStage('code');
        })}
      >
        <Field data-invalid={emailForm.formState.errors.email ? true : undefined}>
          <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            aria-invalid={emailForm.formState.errors.email ? true : undefined}
            {...emailForm.register('email')}
          />
          <FieldError>{emailForm.formState.errors.email?.message}</FieldError>
        </Field>
        <AsyncButton
          type="submit"
          className="min-h-11"
          state={requestCode.isPending ? 'busy' : 'idle'}
          busyLabel="Sending…"
        >
          Send code
        </AsyncButton>
      </form>
      <Link
        to="/login"
        className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-primary-hover underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </div>
  );
}
