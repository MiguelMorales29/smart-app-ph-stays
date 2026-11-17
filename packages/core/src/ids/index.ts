import { z } from 'zod';

export const DEMO_ID_PREFIX = 'dec0de' as const;

export const uuidSchema = z.uuid();

export type Uuid = z.infer<typeof uuidSchema>;

export function isDemoId(id: string): boolean {
  return uuidSchema.safeParse(id).success && id.toLowerCase().startsWith(DEMO_ID_PREFIX);
}
