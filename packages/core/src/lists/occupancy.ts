import { z } from 'zod';

export const OCCUPANCY_KINDS = ['hold', 'booking', 'block', 'lease'] as const;
export const occupancyKindSchema = z.enum(OCCUPANCY_KINDS);
export type OccupancyKind = z.infer<typeof occupancyKindSchema>;
