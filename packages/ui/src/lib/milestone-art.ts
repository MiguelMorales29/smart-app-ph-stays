/** Fluent Emoji 3D pictures (MIT, Microsoft) made by `pnpm --filter @smartapp/tooling art` (D54). */
export const MILESTONE_ART_KEYS = [
  'welcome',
  'no_units',
  'no_payment_accounts',
  'waiting_approval',
  'needs_changes',
  'code_sent',
  'live',
  'offline',
  'error',
  'not_found',
] as const;

export type MilestoneArtKey = (typeof MILESTONE_ART_KEYS)[number];

/** Public path of a milestone picture in the dashboard (apps/dashboard/public/art). */
export function milestoneArtSrc(key: MilestoneArtKey): string {
  return `/art/${key}.webp`;
}
