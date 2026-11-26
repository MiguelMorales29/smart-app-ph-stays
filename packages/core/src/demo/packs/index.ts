import { z } from 'zod';

import { addDays, eachNight, manilaToday, nightsBetween } from '../../time/index.js';
import type { Clock } from '../../time/index.js';
import { buildBusyPack } from './busy.js';
import { buildEmptyPack } from './empty.js';
import { buildMarketingPack } from './marketing.js';
import { QA_EIGHTY_CHAR_EMOJI_ENYE_NAME, buildQaPack } from './qa.js';
import type { DemoWorld } from './shared.js';

export { QA_EIGHTY_CHAR_EMOJI_ENYE_NAME };
export type { DemoWorld } from './shared.js';

export const DEMO_PACKS = ['marketing', 'qa', 'empty', 'busy'] as const;
export const demoPackSchema = z.enum(DEMO_PACKS);
export type DemoPack = z.infer<typeof demoPackSchema>;

export interface ResolveDemoWorldOptions {
  readonly pack: DemoPack;
  readonly clock: Clock;
}

export function resolveDemoWorld(options: ResolveDemoWorldOptions): DemoWorld {
  const validPack = demoPackSchema.parse(options.pack);
  switch (validPack) {
    case 'marketing':
      return buildMarketingPack(options.clock);
    case 'qa':
      return buildQaPack(options.clock);
    case 'empty':
      return buildEmptyPack(options.clock);
    case 'busy':
      return buildBusyPack(options.clock);
  }
}

export interface UnitNext30OccupancySummary {
  readonly propertySlug: string;
  readonly unitSlug: string;
  readonly unitName: string;
  readonly occupiedNights: number;
  readonly totalNights: number;
  readonly occupancyPercent: number;
}

export interface DemoWorldSummary {
  readonly pack: DemoPack;
  readonly today: string;
  readonly tableCounts: Readonly<Record<keyof DemoWorld, number>>;
  readonly shortStayOccupancyNext30Days: readonly UnitNext30OccupancySummary[];
}

export function summarizeDemoWorld(
  world: DemoWorld,
  pack: DemoPack,
  clock: Clock,
): DemoWorldSummary {
  const today = manilaToday(clock);
  const windowEnd = addDays(today, 30);
  const windowNights = eachNight(today, windowEnd);

  const tableCounts = {
    profiles: world.profiles.length,
    platform_admins: world.platform_admins.length,
    plans: world.plans.length,
    feature_flags: world.feature_flags.length,
    accounts: world.accounts.length,
    account_members: world.account_members.length,
    owner_applications: world.owner_applications.length,
    subscriptions: world.subscriptions.length,
    account_features: world.account_features.length,
    account_counters: world.account_counters.length,
    idempotency_keys: world.idempotency_keys.length,
    audit_logs: world.audit_logs.length,
    job_runs: world.job_runs.length,
    files: world.files.length,
    subscription_payments: world.subscription_payments.length,
    data_exports: world.data_exports.length,
    properties: world.properties.length,
    property_pages: world.property_pages.length,
    rooms: world.rooms.length,
    units: world.units.length,
    unit_stay_terms: world.unit_stay_terms.length,
    unit_lease_terms: world.unit_lease_terms.length,
    listing_photos: world.listing_photos.length,
    amenities: world.amenities.length,
    unit_amenities: world.unit_amenities.length,
    property_amenities: world.property_amenities.length,
    house_rules: world.house_rules.length,
    payment_accounts: world.payment_accounts.length,
    page_reports: world.page_reports.length,
    weekday_rates: world.weekday_rates.length,
    rate_overrides: world.rate_overrides.length,
    unit_fees: world.unit_fees.length,
    customers: world.customers.length,
    customer_consents: world.customer_consents.length,
    unit_occupancy: world.unit_occupancy.length,
    bookings: world.bookings.length,
    booking_lines: world.booking_lines.length,
    booking_events: world.booking_events.length,
    booking_guests: world.booking_guests.length,
    stay_reviews: world.stay_reviews.length,
    payments: world.payments.length,
    payment_proofs: world.payment_proofs.length,
    threads: world.threads.length,
    messages: world.messages.length,
    saved_replies: world.saved_replies.length,
    push_subscriptions: world.push_subscriptions.length,
    notifications_outbox: world.notifications_outbox.length,
    meta_pixels: world.meta_pixels.length,
    meta_event_switches: world.meta_event_switches.length,
    meta_attribution: world.meta_attribution.length,
    meta_capi_deliveries: world.meta_capi_deliveries.length,
  };

  const shortStayUnits = world.units.filter((u) => u.mode === 'short_stay');
  const shortStayOccupancyNext30Days: UnitNext30OccupancySummary[] = shortStayUnits.map((unit) => {
    const property = world.properties.find((p) => p.id === unit.property_id);
    const activeRows = world.unit_occupancy.filter((o) => o.unit_id === unit.id && o.active);

    let occupiedNights = 0;
    for (const night of windowNights) {
      const isTaken = activeRows.some(
        (occ) =>
          nightsBetween(occ.during.start, night) >= 0 &&
          (occ.during.end === null || nightsBetween(night, occ.during.end) > 0),
      );
      if (isTaken) {
        occupiedNights += 1;
      }
    }

    return {
      propertySlug: property?.slug ?? 'unknown',
      unitSlug: unit.slug,
      unitName: unit.name,
      occupiedNights,
      totalNights: windowNights.length,
      occupancyPercent: Math.round((occupiedNights / windowNights.length) * 1000) / 10,
    };
  });

  return {
    pack,
    today,
    tableCounts,
    shortStayOccupancyNext30Days,
  };
}
