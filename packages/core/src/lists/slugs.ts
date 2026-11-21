import { z } from 'zod';

export const RESERVED_SLUGS = [
  'account',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'book',
  'bookings',
  'calendar',
  'demo',
  'demo-media',
  'editor',
  'favicon',
  'find',
  'guests',
  'health',
  'help',
  'home',
  'host',
  'inbox',
  'inquire',
  'install',
  'join',
  'kit',
  'login',
  'logout',
  'manifest',
  'onboarding',
  'owner',
  'payments',
  'privacy',
  'public',
  'reports',
  'rewards',
  'robots',
  'settings',
  'signup',
  'smartapp',
  'sitemap',
  'static',
  'stay',
  'stays',
  't',
  'tenants',
  'units',
  'www',
] as const;

export const reservedSlugSchema = z.enum(RESERVED_SLUGS);
export type ReservedSlug = z.infer<typeof reservedSlugSchema>;

const reservedSlugSet: ReadonlySet<string> = new Set(RESERVED_SLUGS);

export function isReservedSlug(slug: string): boolean {
  return reservedSlugSet.has(slug);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const unitSlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(SLUG_PATTERN, 'Slug must use lower-case letters, digits and single hyphens.');

export const propertySlugSchema = unitSlugSchema.refine((slug) => !isReservedSlug(slug), {
  message: 'Slug is a reserved word.',
});
