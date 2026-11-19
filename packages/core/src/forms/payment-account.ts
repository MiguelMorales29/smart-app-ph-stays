import { z } from 'zod';

import { paymentAccountsRow } from '../schemas/tables/index.js';
import { checkBankFields } from './rules.js';

export const paymentAccountFormSchema = z
  .object(paymentAccountsRow.shape)
  .pick({
    method: true,
    bank: true,
    bank_name: true,
    account_name: true,
    account_number: true,
    qr_file_id: true,
    instructions: true,
    is_active: true,
  })
  .extend({
    password: z.string().min(1, 'Enter your password to confirm this change.').max(128),
  })
  .superRefine(checkBankFields);

export type PaymentAccountForm = z.infer<typeof paymentAccountFormSchema>;
