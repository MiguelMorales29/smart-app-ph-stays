import { z } from 'zod';

export const FEE_KINDS = ['cleaning', 'extra_guest', 'other'] as const;
export const feeKindSchema = z.enum(FEE_KINDS);
export type FeeKind = z.infer<typeof feeKindSchema>;

export const FEE_BASES = ['per_stay', 'per_night', 'per_extra_guest_per_night'] as const;
export const feeBasisSchema = z.enum(FEE_BASES);
export type FeeBasis = z.infer<typeof feeBasisSchema>;
