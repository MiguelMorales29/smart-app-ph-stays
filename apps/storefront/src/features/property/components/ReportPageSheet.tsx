'use client';

import type { PageReportReason } from '@smartapp/core';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { RadioGroup, RadioGroupItem } from '@smartapp/ui/components/radio-group';
import { Spinner } from '@smartapp/ui/components/spinner';
import { Textarea } from '@smartapp/ui/components/textarea';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { CheckCircle2Icon } from 'lucide-react';
import { useState } from 'react';

import { loadStorefrontClient } from '@/lib/storefront-client';

type ReportChoice = Extract<
  PageReportReason,
  'fake_page' | 'wrong_payment_account' | 'scam_attempt'
>;

const REPORT_REASONS: readonly {
  readonly value: ReportChoice;
  readonly label: string;
  readonly hint: string;
}[] = [
  {
    value: 'fake_page',
    label: 'Fake page',
    hint: 'This page is copying another resort, condo or owner.',
  },
  {
    value: 'wrong_payment_account',
    label: 'Wrong payment account',
    hint: 'Someone asked you to pay an account that does not match.',
  },
  {
    value: 'scam_attempt',
    label: 'Scam attempt',
    hint: 'Suspicious messages, pressure to pay fast, or misleading claims.',
  },
];

function isReportChoice(value: string): value is ReportChoice {
  return value === 'fake_page' || value === 'wrong_payment_account' || value === 'scam_attempt';
}

function makeIdempotencyKey(propertyId: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `report-${propertyId.slice(0, 8)}-${random}`;
}

export interface ReportPageSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly propertyId: string;
  readonly propertyName: string;
}

/**
 * Report this page sheet (PA-11): three reasons + note + optional email, calling `reportPage`.
 * Built on `AppSheet` so phones get a bottom drawer with grabber/Close/pinned footer and desktop
 * gets a dialog.
 */
export function ReportPageSheet({
  open,
  onOpenChange,
  propertyId,
  propertyName,
}: ReportPageSheetProps) {
  const [reason, setReason] = useState<ReportChoice>('fake_page');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      // Clear transient state after close transition so content never snaps while closing (Pattern Guide §2).
      window.setTimeout(() => {
        setFieldError(null);
        setSubmitError(null);
        setSubmitted(false);
        setDetails('');
        setEmail('');
        setReason('fake_page');
      }, 320);
    }
  }

  async function handleSubmit() {
    const trimmedDetails = details.trim();
    if (!trimmedDetails) {
      setFieldError('Tell us briefly what happened so our team can check.');
      return;
    }
    if (trimmedDetails.length > 500) {
      setFieldError('Keep your note to 500 characters or less.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError('Enter a valid email address, or leave it blank.');
      return;
    }

    setFieldError(null);
    setSubmitError(null);
    setSubmitting(true);

    try {
      const client = await loadStorefrontClient(window.location.search);
      const res = await client.source.reportPage(
        {
          idempotencyKey: makeIdempotencyKey(propertyId),
          propertyId,
          reason,
          details: trimmedDetails,
          reporterEmail: trimmedEmail ? trimmedEmail : null,
        },
        client.session,
      );

      if (!res.ok) {
        setSubmitError(
          res.error.details?.offline === true
            ? 'You appear to be offline. Reconnect and try sending your report again.'
            : `${res.error.message} (${res.error.code})`,
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError('Could not send your report right now. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Report this page"
      description={`Tell Smart App PH if something looks wrong on ${propertyName}.`}
      height="full"
      size="md"
      footer={
        submitted ? (
          <Button type="button" onClick={() => handleOpenChange(false)} className="min-h-12">
            Done
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              data-sheet-cancel=""
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="min-h-12"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="min-h-12 gap-2"
            >
              {submitting ? <Spinner className="size-4" /> : null}
              {submitting ? 'Sending report…' : 'Send report'}
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-tint text-success">
            <CheckCircle2Icon aria-hidden="true" className="size-6" />
          </span>
          <p className="font-heading text-lg font-semibold">Report sent</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thank you. Our team will review this page and take action if needed.
          </p>
        </div>
      ) : (
        <div className="space-y-5 py-1">
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-medium text-foreground">What is the problem?</legend>
            <RadioGroup
              value={reason}
              onValueChange={(nextValue) => {
                if (typeof nextValue === 'string' && isReportChoice(nextValue)) {
                  setReason(nextValue);
                }
              }}
              className="space-y-2"
            >
              {REPORT_REASONS.map((option) => {
                const inputId = `report-reason-${option.value}`;
                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors duration-fast has-data-checked:border-primary has-data-checked:bg-primary-tint/50"
                  >
                    <RadioGroupItem id={inputId} value={option.value} className="mt-0.5" />
                    <span className="space-y-0.5 text-sm">
                      <span className="block font-medium text-foreground">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <Field data-invalid={Boolean(fieldError) || undefined}>
            <FieldLabel htmlFor="report-details">Note</FieldLabel>
            <Textarea
              id="report-details"
              rows={4}
              maxLength={500}
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="Share what happened, such as a mismatched GCash name or link."
            />
            <FieldDescription>Up to 500 characters. Sent only to Smart App PH.</FieldDescription>
            {fieldError ? <FieldError>{fieldError}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="report-email">Your email (optional)</FieldLabel>
            <Input
              id="report-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <FieldDescription>Only if you want us to follow up with you.</FieldDescription>
          </Field>

          {submitError ? (
            <p
              role="alert"
              className="rounded-lg bg-danger-tint px-3.5 py-2.5 text-sm text-foreground"
            >
              {submitError}
            </p>
          ) : null}
        </div>
      )}
    </AppSheet>
  );
}
