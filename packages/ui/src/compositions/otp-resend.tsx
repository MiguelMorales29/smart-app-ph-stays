'use client';

import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldLabel } from '@smartapp/ui/components/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@smartapp/ui/components/input-otp';
import { cn } from 'cn';
import { RefreshCwIcon } from 'lucide-react';
import { useSyncExternalStore, type ReactNode, type Ref } from 'react';

const LENGTH = 6;

export interface OtpResendProps {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Called once all 6 digits are entered or pasted. */
  readonly onComplete?: ((value: string) => void) | undefined;
  readonly label: string;
  /** e.g. "We sent a 6-digit code to owner@example.com." */
  readonly sentLine: ReactNode;
  readonly hint: string;
  /** ISO timestamp when Resend unlocks; null means ready now. */
  readonly resendAt: string | null;
  readonly onResend: () => void;
  readonly resendLabel?: string | undefined;
  readonly resendInLabel?: ((seconds: number) => string) | undefined;
  readonly resending?: boolean | undefined;
  readonly error?: string | null | undefined;
  readonly disabled?: boolean | undefined;
  readonly inputRef?: Ref<HTMLInputElement> | undefined;
  readonly className?: string | undefined;
}

function subscribeSeconds(listener: () => void): () => void {
  const timer = setInterval(listener, 1000);
  return () => clearInterval(timer);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function secondsLeft(resendAt: string | null, now: number): number {
  if (!resendAt || now === 0) return 0;
  return Math.max(0, Math.floor(new Date(resendAt).getTime() / 1000) - now);
}

/**
 * 6-digit email verification code field with a timed Resend button (ported from food app).
 */
export function OtpResend({
  id,
  value,
  onChange,
  onComplete,
  label,
  sentLine,
  hint,
  resendAt,
  onResend,
  resendLabel = 'Resend code',
  resendInLabel = (seconds) => `Resend in ${seconds} s`,
  resending = false,
  error,
  disabled = false,
  inputRef,
  className,
}: OtpResendProps) {
  const now = useSyncExternalStore(subscribeSeconds, nowSeconds, () => 0);
  const left = secondsLeft(resendAt, now);

  const errorId = `${id}-error`;

  return (
    <Field data-invalid={error ? 'true' : undefined} className={cn('gap-3', className)}>
      <div className="flex flex-col gap-1 text-sm">
        <p>{sentLine}</p>
        <FieldDescription>{hint}</FieldDescription>
      </div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputOTP
        id={id}
        {...(inputRef ? { ref: inputRef } : {})}
        maxLength={LENGTH}
        value={value}
        onChange={onChange}
        {...(onComplete ? { onComplete } : {})}
        inputMode="numeric"
        pattern="^[0-9]+$"
        autoComplete="one-time-code"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        containerClassName="w-full justify-center"
      >
        <InputOTPGroup className="w-full justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: LENGTH }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              aria-invalid={Boolean(error)}
              className="h-12 max-w-12 min-w-0 flex-1 rounded-xl border text-xl font-semibold first:rounded-xl last:rounded-xl sm:h-13 sm:max-w-13"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error ? (
        <p id={errorId} role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        onClick={onResend}
        disabled={left > 0 || resending || disabled}
        className="h-11 gap-2 self-center rounded-full px-4"
      >
        <RefreshCwIcon aria-hidden="true" className={cn('size-4', resending && 'animate-spin')} />
        <span className="tabular">{left > 0 ? resendInLabel(left) : resendLabel}</span>
      </Button>
    </Field>
  );
}
