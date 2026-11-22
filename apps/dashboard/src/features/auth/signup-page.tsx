import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeftIcon, BadgeCheckIcon, CalendarDaysIcon, SmartphoneIcon } from 'lucide-react';
import {
  accountsRow,
  formatPesos,
  ownerApplicationsRow,
  ownerPasswordSchema,
  phMobileInputSchema,
  profilesRow,
  type ApplicationRents,
  type PropertyCountBand,
  type UnitCountBand,
} from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Checkbox } from '@smartapp/ui/components/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { DraftNotice } from '@smartapp/ui/compositions/draft-notice';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { OtpResend } from '@smartapp/ui/compositions/otp-resend';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { PhoneInput } from '@smartapp/ui/compositions/phone-input';
import { RadioCards } from '@smartapp/ui/compositions/radio-cards';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
} from '@smartapp/ui/components/stepper';
import { useFormDraft } from '@smartapp/ui/hooks/use-form-draft';
import { usePlansQuery } from '@/data/auth/reads';
import {
  useApplyAsOwnerMutation,
  useRequestSignupCodeMutation,
  useSignInWithGoogleMutation,
  useVerifySignupCodeMutation,
} from '@/data/auth/writes';
import { applyAppErrorToForm } from '@/data/use-form-errors';
import { extractAppError } from '@/data/shared';
import { DemoGoogleButton } from './demo-google-dialog';
import { useStartOwnerSession } from '@/app/auth/owner-session';

export type SignupStep = 1 | 2 | 3;

const youSchema = z.object({
  fullName: profilesRow.shape.full_name,
  mobile: phMobileInputSchema,
  email: accountsRow.shape.contact_email,
  password: z.string(),
  acceptedTerms: z.boolean().refine((value) => value, 'Agree to the terms to apply.'),
});

const placeSchema = z.object({
  placeName: accountsRow.shape.name,
  rents: ownerApplicationsRow.shape.rents,
  unitCountBand: ownerApplicationsRow.shape.unit_count_band,
  propertyCountBand: ownerApplicationsRow.shape.property_count_band,
  city: ownerApplicationsRow.shape.city,
  facebookPage: z.string().max(200),
});

type YouForm = z.infer<typeof youSchema>;
type PlaceForm = z.infer<typeof placeSchema>;

interface GoogleApplicant {
  readonly credential: string;
  readonly email: string;
}

const draftSchema = z.object({
  you: youSchema.omit({ password: true }).partial(),
  place: placeSchema.partial(),
});

interface SignupDraft {
  readonly you: Omit<YouForm, 'password'>;
  readonly place: z.infer<typeof draftSchema>['place'];
}

const RENT_OPTIONS: readonly { value: ApplicationRents; label: string; description: string }[] = [
  { value: 'staycation', label: 'Staycation', description: 'Guests stay by the night' },
  { value: 'apartments', label: 'Apartments', description: 'Tenants stay by the month' },
  { value: 'bed_spaces', label: 'Dorm or bed spaces', description: 'Each bed is rented' },
  { value: 'mix', label: 'A mix', description: 'Some of each' },
];

const UNIT_OPTIONS: readonly { value: UnitCountBand; label: string }[] = [
  { value: '1', label: '1' },
  { value: '2_5', label: '2–5' },
  { value: '6_20', label: '6–20' },
  { value: '21_plus', label: '21+' },
];

const PROPERTY_OPTIONS: readonly { value: PropertyCountBand; label: string }[] = [
  { value: '1', label: '1' },
  { value: '2_3', label: '2–3' },
  { value: '4_plus', label: '4+' },
];

const STEP_TITLES = ['You', 'Your place', 'Email code'] as const;

function SellPanel() {
  const plans = usePlansQuery();
  const plan = plans.data?.[0];
  return (
    <aside className="hidden flex-col justify-between gap-8 bg-sidebar p-8 lg:flex">
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold leading-tight text-foreground">
          Your own booking app for your rooms, suites and beds
        </h2>
        <ul className="space-y-3 text-sm text-foreground">
          <li className="flex gap-2.5">
            <SmartphoneIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary-hover"
            />
            Guests book and pay you directly through GCash, Maya or your bank.
          </li>
          <li className="flex gap-2.5">
            <CalendarDaysIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary-hover"
            />
            One calendar, no double bookings.
          </li>
          <li className="flex gap-2.5">
            <BadgeCheckIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary-hover"
            />
            We check every owner, so guests trust your page.
          </li>
        </ul>
      </div>
      <div className="space-y-2">
        {plan ? (
          <p className="text-sm text-foreground">
            <span className="font-heading text-2xl font-semibold tabular">
              {formatPesos(plan.price_centavos)}
            </span>{' '}
            a month, {plan.included_units} units included.{' '}
            {plan.trial_days > 0 ? `First ${plan.trial_days} days free.` : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Loading the plan…</p>
        )}
        <a
          href="/kit/routes"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary-hover underline underline-offset-4"
        >
          See a demo page
        </a>
      </div>
    </aside>
  );
}

function StepHeader({ step, google }: { readonly step: SignupStep; readonly google: boolean }) {
  const total = google ? 2 : 3;
  return (
    <div className="space-y-4">
      <Stepper value={step}>
        <StepperNav aria-label="Application steps">
          {STEP_TITLES.slice(0, total).map((title, index) => (
            <StepperItem
              key={title}
              step={index + 1}
              className="relative flex-1"
              completed={step > index + 1}
            >
              <div className="flex flex-col items-center gap-1.5">
                <StepperIndicator>{index + 1}</StepperIndicator>
                <StepperTitle className="text-xs text-muted-foreground">{title}</StepperTitle>
              </div>
              {index < total - 1 ? <StepperSeparator className="mx-2 mb-5" /> : null}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Step {step} of {total}
      </p>
    </div>
  );
}

function ApplicationSent() {
  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center sm:p-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 duration-slow ease-enter">
      <MilestonePicture art="waiting_approval" />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Application sent</h1>
        <p className="text-sm text-muted-foreground">
          We're checking your application and will email you. Set up your page now; it goes live
          after we approve you.
        </p>
      </div>
      <ol className="w-full max-w-xs space-y-3 text-left text-sm" aria-label="What happens next">
        <li className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-success-tint text-success">
            <BadgeCheckIcon aria-hidden="true" className="size-4" />
          </span>
          <span className="font-medium">Sent</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-primary text-xs font-medium text-primary-hover">
            2
          </span>
          <span>We check your details</span>
        </li>
        <li className="flex items-center gap-3 text-muted-foreground">
          <span className="flex size-7 items-center justify-center rounded-full border border-border text-xs">
            3
          </span>
          <span>You're approved and can publish</span>
        </li>
      </ol>
      <Button
        className="min-h-11 w-full max-w-xs"
        render={<Link to="/onboarding" />}
        nativeButton={false}
      >
        Set up your page
      </Button>
    </div>
  );
}

/** /signup: apply as an owner in 3 short steps (OW-01, D58). */
export function SignupPage() {
  const search = useSearch({ from: '/auth-frame/signup' });
  const navigate = useNavigate();
  const step: SignupStep = search.step ?? 1;
  const [google, setGoogle] = useState<GoogleApplicant | null>(null);
  const [sent, setSent] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<string | null>(null);
  const startSession = useStartOwnerSession();
  const googleSignIn = useSignInWithGoogleMutation();
  const apply = useApplyAsOwnerMutation();
  const requestCode = useRequestSignupCodeMutation();
  const verifyCode = useVerifySignupCodeMutation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const youForm = useForm<YouForm>({
    resolver: zodResolver(google ? youSchema : youSchema.extend({ password: ownerPasswordSchema })),
    defaultValues: { fullName: '', mobile: '', email: '', password: '', acceptedTerms: false },
    mode: 'onTouched',
  });
  const placeForm = useForm<PlaceForm>({
    resolver: zodResolver(placeSchema),
    defaultValues: { placeName: '', city: '', facebookPage: '' },
    mode: 'onTouched',
  });

  const youValues = youForm.watch();
  const placeValues = placeForm.watch();
  const draftValues = useMemo<SignupDraft>(
    () => ({
      you: {
        fullName: youValues.fullName,
        mobile: youValues.mobile,
        email: youValues.email,
        acceptedTerms: youValues.acceptedTerms,
      },
      place: placeValues,
    }),
    [youValues.fullName, youValues.mobile, youValues.email, youValues.acceptedTerms, placeValues],
  );
  const draft = useFormDraft<SignupDraft>({
    key: 'signup',
    values: draftValues,
    dirty: youForm.formState.isDirty || placeForm.formState.isDirty,
    parse: (raw) => {
      const parsed = draftSchema.safeParse(raw);
      if (!parsed.success) return null;
      return {
        you: {
          fullName: parsed.data.you.fullName ?? '',
          mobile: parsed.data.you.mobile ?? '',
          email: parsed.data.you.email ?? '',
          acceptedTerms: parsed.data.you.acceptedTerms ?? false,
        },
        place: parsed.data.place,
      };
    },
  });

  // Moving between steps puts focus on the step's heading for keyboard and screen-reader users.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step, sent]);

  // Someone opened ?step=2 or 3 directly without the earlier answers: start from step 1.
  useEffect(() => {
    if (step > 1 && !youForm.formState.isValid && !google && youForm.getValues('email') === '') {
      void navigate({ to: '/signup', search: {}, replace: true });
    }
  }, [step, google, navigate, youForm]);

  function goTo(next: SignupStep) {
    void navigate({ to: '/signup', search: next === 1 ? {} : { step: next } });
  }

  async function onGoogle(credential: string) {
    setTopError(null);
    try {
      const result = await googleSignIn.mutateAsync({ credential });
      if (result.kind === 'signed_in') {
        await startSession(result);
        return;
      }
      setGoogle({ credential, email: result.email });
      youForm.reset({
        fullName: result.fullName,
        email: result.email,
        mobile: youForm.getValues('mobile'),
        password: '',
        acceptedTerms: youForm.getValues('acceptedTerms'),
      });
    } catch (caught) {
      setTopError(extractAppError(caught).message);
    }
  }

  async function sendApplication() {
    const you = youForm.getValues();
    const place = placeForm.getValues();
    const common = {
      fullName: you.fullName,
      mobile: you.mobile,
      rents: place.rents,
      unitCountBand: place.unitCountBand,
      propertyCountBand: place.propertyCountBand,
      city: place.city.trim(),
      facebookPage: place.facebookPage.trim() ? place.facebookPage.trim() : null,
      placeName: place.placeName.trim(),
    };
    const result = await apply.mutateAsync(
      google
        ? { method: 'google', credential: google.credential, ...common }
        : { method: 'password', email: you.email, password: you.password, ...common },
    );
    draft.clear();
    await startSession(result, { go: false });
    setSent(true);
  }

  if (sent) return <ApplicationSent />;

  const title =
    step === 1 ? 'Apply as an owner' : step === 2 ? 'Tell us about your place' : 'Check your email';

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <SellPanel />
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <StepHeader step={step} google={google !== null} />
        <div className="space-y-1">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-2xl font-semibold outline-none"
          >
            {title}
          </h1>
          {step === 1 ? (
            <p className="text-sm text-muted-foreground">It takes about 2 minutes.</p>
          ) : null}
        </div>

        {draft.saved && step === 1 ? (
          <DraftNotice
            onKeep={() => {
              const saved = draft.keep();
              if (!saved) return;
              youForm.reset({ ...saved.you, password: '' }, { keepDefaultValues: true });
              const place = saved.place;
              if (place.placeName !== undefined) placeForm.setValue('placeName', place.placeName);
              if (place.city !== undefined) placeForm.setValue('city', place.city);
              if (place.facebookPage !== undefined)
                placeForm.setValue('facebookPage', place.facebookPage);
              if (place.rents !== undefined) placeForm.setValue('rents', place.rents);
              if (place.unitCountBand !== undefined)
                placeForm.setValue('unitCountBand', place.unitCountBand);
              if (place.propertyCountBand !== undefined)
                placeForm.setValue('propertyCountBand', place.propertyCountBand);
            }}
            onDiscard={draft.discard}
          />
        ) : null}

        {topError ? (
          <Alert variant="destructive">
            <AlertDescription>{topError}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={youForm.handleSubmit(() => goTo(2))}
          >
            {google ? (
              <p className="rounded-lg bg-primary-tint px-3 py-2 text-sm text-foreground">
                Signing up with Google as {google.email}.
              </p>
            ) : (
              <>
                <DemoGoogleButton
                  onCredential={(credential) => void onGoogle(credential)}
                  disabled={googleSignIn.isPending}
                />
                <div
                  className="flex items-center gap-3 text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            <Field data-invalid={youForm.formState.errors.fullName ? true : undefined}>
              <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
              <Input
                id="signup-name"
                autoComplete="name"
                enterKeyHint="next"
                aria-invalid={youForm.formState.errors.fullName ? true : undefined}
                {...youForm.register('fullName')}
              />
              <FieldError>{youForm.formState.errors.fullName?.message}</FieldError>
            </Field>
            <Field data-invalid={youForm.formState.errors.mobile ? true : undefined}>
              <FieldLabel htmlFor="signup-mobile">Mobile number</FieldLabel>
              <Controller
                control={youForm.control}
                name="mobile"
                render={({ field, fieldState }) => (
                  <PhoneInput
                    id="signup-mobile"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    enterKeyHint="next"
                    invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldDescription>We text you only about your account.</FieldDescription>
              <FieldError>{youForm.formState.errors.mobile?.message}</FieldError>
            </Field>
            {google ? null : (
              <>
                <Field data-invalid={youForm.formState.errors.email ? true : undefined}>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    id="signup-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    enterKeyHint="next"
                    aria-invalid={youForm.formState.errors.email ? true : undefined}
                    {...youForm.register('email')}
                  />
                  <FieldError>{youForm.formState.errors.email?.message}</FieldError>
                </Field>
                <Field data-invalid={youForm.formState.errors.password ? true : undefined}>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <PasswordInput
                    id="signup-password"
                    autoComplete="new-password"
                    enterKeyHint="next"
                    rules="At least 8 characters."
                    invalid={youForm.formState.errors.password !== undefined}
                    {...youForm.register('password')}
                  />
                  <FieldError>{youForm.formState.errors.password?.message}</FieldError>
                </Field>
              </>
            )}
            <Controller
              control={youForm.control}
              name="acceptedTerms"
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid ? true : undefined}
                >
                  <Checkbox
                    id="signup-terms"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-invalid={fieldState.invalid ? true : undefined}
                  />
                  <FieldLabel htmlFor="signup-terms" className="font-normal">
                    I agree to the terms and the privacy notice
                  </FieldLabel>
                </Field>
              )}
            />
            <FieldError>{youForm.formState.errors.acceptedTerms?.message}</FieldError>
            <Button type="submit" className="min-h-11">
              Continue to your place
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-hover underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </form>
        ) : null}

        {step === 2 ? (
          <form
            noValidate
            className="flex flex-col gap-5"
            onSubmit={placeForm.handleSubmit(async () => {
              setTopError(null);
              if (google) {
                try {
                  await sendApplication();
                } catch (caught) {
                  const applied = applyAppErrorToForm(caught, placeForm, {
                    knownFields: [
                      'placeName',
                      'rents',
                      'unitCountBand',
                      'propertyCountBand',
                      'city',
                      'facebookPage',
                    ],
                  });
                  setTopError(applied.topError);
                }
                return;
              }
              await requestCode
                .mutateAsync({ email: youForm.getValues('email') })
                .catch(() => null);
              setResendAt(new Date(Date.now() + 30_000).toISOString());
              goTo(3);
            })}
          >
            <Field data-invalid={placeForm.formState.errors.placeName ? true : undefined}>
              <FieldLabel htmlFor="signup-place">Place name</FieldLabel>
              <Input
                id="signup-place"
                autoComplete="organization"
                placeholder="e.g. Ulap Suites"
                aria-invalid={placeForm.formState.errors.placeName ? true : undefined}
                {...placeForm.register('placeName')}
              />
              <FieldError>{placeForm.formState.errors.placeName?.message}</FieldError>
            </Field>
            <Field data-invalid={placeForm.formState.errors.rents ? true : undefined}>
              <FieldLabel id="signup-rents-label">What you rent</FieldLabel>
              <Controller
                control={placeForm.control}
                name="rents"
                render={({ field, fieldState }) => (
                  <RadioCards
                    aria-labelledby="signup-rents-label"
                    options={RENT_OPTIONS}
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError>
                {placeForm.formState.errors.rents ? 'Pick what you rent.' : null}
              </FieldError>
            </Field>
            <Field data-invalid={placeForm.formState.errors.unitCountBand ? true : undefined}>
              <FieldLabel id="signup-units-label">How many units or beds</FieldLabel>
              <Controller
                control={placeForm.control}
                name="unitCountBand"
                render={({ field, fieldState }) => (
                  <RadioCards
                    aria-labelledby="signup-units-label"
                    columns={4}
                    options={UNIT_OPTIONS}
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError>
                {placeForm.formState.errors.unitCountBand ? 'Pick how many.' : null}
              </FieldError>
            </Field>
            <Field data-invalid={placeForm.formState.errors.propertyCountBand ? true : undefined}>
              <FieldLabel id="signup-props-label">How many properties</FieldLabel>
              <Controller
                control={placeForm.control}
                name="propertyCountBand"
                render={({ field, fieldState }) => (
                  <RadioCards
                    aria-labelledby="signup-props-label"
                    columns={3}
                    options={PROPERTY_OPTIONS}
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                )}
              />
              <FieldError>
                {placeForm.formState.errors.propertyCountBand ? 'Pick how many.' : null}
              </FieldError>
            </Field>
            <Field data-invalid={placeForm.formState.errors.city ? true : undefined}>
              <FieldLabel htmlFor="signup-city">Town or city</FieldLabel>
              <Input
                id="signup-city"
                autoComplete="address-level2"
                placeholder="e.g. Tagaytay"
                aria-invalid={placeForm.formState.errors.city ? true : undefined}
                {...placeForm.register('city')}
              />
              <FieldError>{placeForm.formState.errors.city?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-facebook">Facebook page link (optional)</FieldLabel>
              <Input
                id="signup-facebook"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                placeholder="facebook.com/yourplace"
                {...placeForm.register('facebookPage')}
              />
              <FieldDescription>Helps us check you faster.</FieldDescription>
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => goTo(1)}>
                <ArrowLeftIcon aria-hidden="true" />
                Back
              </Button>
              {google ? (
                <AsyncButton
                  type="submit"
                  className="min-h-11 flex-1"
                  state={apply.isPending ? 'busy' : 'idle'}
                  busyLabel="Sending…"
                >
                  Send application
                </AsyncButton>
              ) : (
                <AsyncButton
                  type="submit"
                  className="min-h-11 flex-1"
                  state={requestCode.isPending ? 'busy' : 'idle'}
                  busyLabel="Sending code…"
                >
                  Continue to email code
                </AsyncButton>
              )}
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setCodeError(null);
              setTopError(null);
              if (!/^\d{6}$/.test(code)) {
                setCodeError('Enter the 6-digit code from your email.');
                return;
              }
              void (async () => {
                try {
                  await verifyCode.mutateAsync({ email: youForm.getValues('email'), code });
                } catch (caught) {
                  setCodeError(extractAppError(caught).message);
                  return;
                }
                try {
                  await sendApplication();
                } catch (caught) {
                  const error = extractAppError(caught);
                  if (error.details?.reason === 'email_taken') {
                    youForm.setError('email', { type: 'server', message: error.message });
                    goTo(1);
                    return;
                  }
                  setTopError(error.message);
                }
              })();
            }}
          >
            <OtpResend
              id="signup-code"
              value={code}
              onChange={setCode}
              label="Code"
              sentLine={
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-foreground">{youForm.getValues('email')}</span>.
                </>
              }
              hint="Check your spam folder if you don't see it."
              resendAt={resendAt}
              resending={requestCode.isPending}
              resendLabel="Send a new code"
              resendInLabel={(seconds) => `Send a new code in ${seconds} s`}
              onResend={() => {
                void requestCode
                  .mutateAsync({ email: youForm.getValues('email') })
                  .then(() => setResendAt(new Date(Date.now() + 30_000).toISOString()));
              }}
              error={codeError}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => goTo(2)}>
                <ArrowLeftIcon aria-hidden="true" />
                Back
              </Button>
              <AsyncButton
                type="submit"
                className="min-h-11 flex-1"
                state={verifyCode.isPending || apply.isPending ? 'busy' : 'idle'}
                busyLabel="Sending…"
              >
                Send application
              </AsyncButton>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
