import { z } from 'zod';

import { accountMembersRow, accountsRow, profilesRow } from '../schemas/tables/index.js';

export const profileFormSchema = z
  .object(profilesRow.shape)
  .pick({
    full_name: true,
    avatar: true,
  })
  .extend({
    notify_email: accountsRow.shape.notify_email,
    notify: accountMembersRow.shape.notify,
  });

export type ProfileForm = z.infer<typeof profileFormSchema>;
