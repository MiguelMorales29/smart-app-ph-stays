import { z } from 'zod';

import { isValidBankAccount, isValidPhMobile, isValidWalletMobile } from '../inputs/index.js';
import type { Bank, CancellationPreset, PaymentAccountMethod } from '../lists/index.js';
import type { WeeklyHours } from '../schemas/tables/common.js';

export const phMobileInputSchema = z.string().refine(isValidPhMobile, {
  message: 'Enter a valid Philippine mobile number such as 0917 123 4567.',
});

export function checkLatLngPair(
  data: { readonly latitude: number | null; readonly longitude: number | null },
  ctx: z.RefinementCtx,
): void {
  if ((data.latitude === null) !== (data.longitude === null)) {
    const missingField = data.latitude === null ? 'latitude' : 'longitude';
    ctx.addIssue({
      code: 'custom',
      path: [missingField],
      message: 'Set both latitude and longitude, or leave both empty.',
    });
  }
}

export function checkCustomCancellationNote(
  data: {
    readonly cancellation_preset: CancellationPreset;
    readonly cancellation_note: string | null;
  },
  ctx: z.RefinementCtx,
): void {
  if (
    data.cancellation_preset === 'custom' &&
    (data.cancellation_note === null || data.cancellation_note.trim().length === 0)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['cancellation_note'],
      message: 'Describe your custom cancellation policy.',
    });
  }
}

export function checkMinMaxNights(
  data: { readonly min_nights: number; readonly max_nights: number },
  ctx: z.RefinementCtx,
): void {
  if (data.max_nights < data.min_nights) {
    ctx.addIssue({
      code: 'custom',
      path: ['max_nights'],
      message: 'Maximum nights must be at least the minimum nights.',
    });
  }
}

export function checkBankFields(
  data: {
    readonly method: PaymentAccountMethod;
    readonly bank: Bank | null;
    readonly bank_name: string | null;
    readonly account_number: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (data.method === 'bank' && data.bank === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['bank'],
      message: 'Choose a bank.',
    });
  }

  if (data.method !== 'bank' && data.bank !== null) {
    ctx.addIssue({
      code: 'custom',
      path: ['bank'],
      message: 'Bank applies only to bank transfer accounts.',
    });
  }

  if (data.bank === 'other' && (data.bank_name === null || data.bank_name.trim().length === 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['bank_name'],
      message: 'Enter the bank name.',
    });
  }

  if (data.method === 'gcash' || data.method === 'maya') {
    if (!isValidWalletMobile(data.account_number)) {
      ctx.addIssue({
        code: 'custom',
        path: ['account_number'],
        message: 'Enter a valid 11-digit Philippine mobile number.',
      });
    }
  } else if (data.method === 'bank') {
    if (!isValidBankAccount(data.account_number)) {
      ctx.addIssue({
        code: 'custom',
        path: ['account_number'],
        message: 'Enter 8 to 20 digits for the bank account number.',
      });
    }
  }
}

export function checkPasswordConfirmation(
  data: { readonly newPassword: string; readonly confirmPassword: string },
  ctx: z.RefinementCtx,
): void {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    });
  }
}

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function checkNonOverlappingWeeklyHours(
  hours: WeeklyHours | null,
  fieldName: string,
  ctx: z.RefinementCtx,
): void {
  if (hours === null) return;

  for (const day of WEEKDAYS) {
    const ranges = [...hours[day]].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < ranges.length; i += 1) {
      const prev = ranges[i - 1];
      const curr = ranges[i];
      if (prev && curr && curr.start < prev.end) {
        ctx.addIssue({
          code: 'custom',
          path: [fieldName, day],
          message: 'Time ranges on the same day cannot overlap.',
        });
        break;
      }
    }
  }
}
