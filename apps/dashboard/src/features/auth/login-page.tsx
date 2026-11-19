import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signInFormSchema, type SignInForm } from '@smartapp/core';
import { Alert, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Field, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { TriangleAlertIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useDashboard } from '@/app/dashboard-context';
import { extractAppError } from '@/data/shared';
import { useSignInMutation, useSignInWithGoogleMutation } from '@/data/auth/writes';
import { DemoGoogleButton } from './demo-google-dialog';
import { useStartOwnerSession } from '@/app/auth/owner-session';

const MAX_TRIES = 5;

/** /login (OW-01, F20): one answer for any failed sign-in, a pause after 5 tries. */
export function LoginPage() {
  const { client } = useDashboard();
  const navigate = useNavigate();
  const startSession = useStartOwnerSession();
  const signIn = useSignInMutation();
  const google = useSignInWithGoogleMutation();
  const [failures, setFailures] = useState(0);
  const [failed, setFailed] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });
  const locked = failures >= MAX_TRIES;

  async function onGoogle(credential: string) {
    setTopError(null);
    try {
      const result = await google.mutateAsync({ credential });
      if (result.kind === 'signed_in') {
        await startSession(result);
        return;
      }
      await navigate({ to: '/signup', search: {} });
      setTopError(null);
    } catch (caught) {
      setTopError(extractAppError(caught).message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Manage your bookings, guests and page.</p>
      </div>

      {failed ? (
        <Alert variant="destructive" role="alert">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>
            {locked ? 'Too many tries' : "That email and password don't match"}
          </AlertTitle>
          <AlertDescription>
            {locked
              ? 'Wait 15 minutes, or reset your password.'
              : 'Try again or reset your password.'}
          </AlertDescription>
        </Alert>
      ) : null}
      {topError ? (
        <Alert variant="destructive">
          <AlertDescription>{topError}</AlertDescription>
        </Alert>
      ) : null}

      <DemoGoogleButton
        onCredential={(credential) => void onGoogle(credential)}
        disabled={google.isPending}
      />
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          setFailed(false);
          setTopError(null);
          try {
            const result = await signIn.mutateAsync({
              email: values.email.trim(),
              password: values.password,
            });
            setFailures(0);
            await startSession(result);
          } catch (caught) {
            const error = extractAppError(caught);
            if (error.details?.offline === true) {
              setTopError(error.message);
              return;
            }
            setFailures((count) => count + 1);
            setFailed(true);
            form.setValue('password', '');
            form.setFocus('password');
          }
        })}
      >
        <Field data-invalid={form.formState.errors.email ? true : undefined}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            enterKeyHint="next"
            aria-invalid={form.formState.errors.email ? true : undefined}
            {...form.register('email')}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>
        <Field data-invalid={form.formState.errors.password ? true : undefined}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Link
              to="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary-hover underline-offset-4 hover-hover:hover:underline sm:min-h-0"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            enterKeyHint="go"
            invalid={form.formState.errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>
        <AsyncButton
          type="submit"
          className="min-h-11"
          state={signIn.isPending ? 'busy' : 'idle'}
          busyLabel="Signing in…"
          disabled={locked}
        >
          Sign in
        </AsyncButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link
          to="/signup"
          search={{}}
          className="font-medium text-primary-hover underline underline-offset-4"
        >
          Apply as an owner
        </Link>
      </p>
      {import.meta.env.VITE_DATA_SOURCE === 'memory' &&
      import.meta.env.VITE_APP_ENV !== 'production' &&
      client?.mode === 'memory' ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Sample data: sign in as owner.ulap-suites@demo.invalid with the password demo-owner-pass.
          Codes are 123456.
        </p>
      ) : null}
    </div>
  );
}
