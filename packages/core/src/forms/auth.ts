import { z } from 'zod';

import {
  accountsRow,
  ownerApplicationsRow,
  profilesRow,
} from '../schemas/tables/index.js';
import { checkPasswordConfirmation, phMobileInputSchema } from './rules.js';

export const ownerPasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters for your password.')
  .max(128, 'Password is too long.');

export const sixDigitCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Enter the 6-digit code sent to your email.');

const applyStep1Base = z.object({
  full_name: profilesRow.shape.full_name,
  mobile: phMobileInputSchema,
});

export const applyStep1PasswordFormSchema = applyStep1Base.extend({
  method: z.literal('password'),
  email: accountsRow.shape.contact_email,
  password: ownerPasswordSchema,
});
export type ApplyStep1PasswordForm = z.infer<typeof applyStep1PasswordFormSchema>;

export const applyStep1GoogleFormSchema = applyStep1Base.extend({
  method: z.literal('google'),
  credential: z.string().min(1).max(4096),
});
export type ApplyStep1GoogleForm = z.infer<typeof applyStep1GoogleFormSchema>;

export const applyStep1FormSchema = z.discriminatedUnion('method', [
  applyStep1PasswordFormSchema,
  applyStep1GoogleFormSchema,
]);
export type ApplyStep1Form = z.infer<typeof applyStep1FormSchema>;

export const applyStep2FormSchema = z.object(ownerApplicationsRow.shape).pick({
  rents: true,
  unit_count_band: true,
  property_count_band: true,
});
export type ApplyStep2Form = z.infer<typeof applyStep2FormSchema>;

export const applyStep3FormSchema = z
  .object(ownerApplicationsRow.shape)
  .pick({
    city: true,
    facebook_page: true,
  })
  .extend({
    accepted_terms: z.literal(true, {
      error: 'Agree to the terms to send your application.',
    }),
  });
export type ApplyStep3Form = z.infer<typeof applyStep3FormSchema>;

export const signInFormSchema = z.object({
  email: accountsRow.shape.contact_email,
  password: z.string().min(1, 'Enter your password.').max(128),
});
export type SignInForm = z.infer<typeof signInFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    email: accountsRow.shape.contact_email,
    code: sixDigitCodeSchema,
    newPassword: ownerPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.').max(128),
  })
  .superRefine(checkPasswordConfirmation);
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

export const changePasswordFormSchema = z
  .object({
    code: sixDigitCodeSchema,
    newPassword: ownerPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.').max(128),
  })
  .superRefine(checkPasswordConfirmation);
export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;
