import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { isDemoId } from '../ids/index.js';
import { BOOKING_LIFECYCLE, canMove } from '../lifecycles/index.js';
import type { BookingLifecycleActor } from '../lifecycles/index.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../lists/index.js';
import type { BookingStatus } from '../lists/index.js';
import { quoteStay } from '../pricing/quoteStay.js';
import {
  accountCountersRow,
  accountFeaturesRow,
  accountMembersRow,
  accountsRow,
  amenitiesRow,
  auditLogsRow,
  bookingEventsRow,
  bookingGuestsRow,
  bookingLinesRow,
  bookingsRow,
  customerConsentsRow,
  customersRow,
  dataExportsRow,
  featureFlagsRow,
  filesRow,
  houseRulesRow,
  idempotencyKeysRow,
  jobRunsRow,
  listingPhotosRow,
  messagesRow,
  metaAttributionRow,
  metaCapiDeliveriesRow,
  metaEventSwitchesRow,
  metaPixelsRow,
  notificationsOutboxRow,
  pageReportsRow,
  paymentAccountsRow,
  paymentProofsRow,
  paymentsRow,
  plansRow,
  platformAdminsRow,
  profilesRow,
  propertiesRow,
  propertyPagesRow,
  pushSubscriptionsRow,
  rateOverridesRow,
  savedRepliesRow,
  stayReviewsRow,
  subscriptionPaymentsRow,
  subscriptionsRow,
  threadsRow,
  unitAmenitiesRow,
  unitFeesRow,
  unitLeaseTermsRow,
  unitOccupancyRow,
  unitStayTermsRow,
  unitsRow,
  weekdayRatesRow,
} from '../schemas/tables/index.js';
import { addDays, fixedClock, systemClock } from '../time/index.js';
import {
  DEMO_MEDIA_MANIFEST,
  DEMO_PACKS,
  QA_EIGHTY_CHAR_EMOJI_ENYE_NAME,
  resolveDemoWorld,
} from './index.js';
import type { DemoPack, DemoWorld } from './index.js';

const GOLDEN_CLOCK_ISO = '2026-12-10T10:00:00+08:00';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function assertWorldInvariants(world: DemoWorld): void {
  const tableValidators: readonly [keyof DemoWorld, { parse: (row: unknown) => unknown }][] = [
    ['profiles', profilesRow],
    ['platform_admins', platformAdminsRow],
    ['plans', plansRow],
    ['feature_flags', featureFlagsRow],
    ['accounts', accountsRow],
    ['account_members', accountMembersRow],
    ['subscriptions', subscriptionsRow],
    ['account_features', accountFeaturesRow],
    ['account_counters', accountCountersRow],
    ['idempotency_keys', idempotencyKeysRow],
    ['audit_logs', auditLogsRow],
    ['job_runs', jobRunsRow],
    ['files', filesRow],
    ['subscription_payments', subscriptionPaymentsRow],
    ['data_exports', dataExportsRow],
    ['properties', propertiesRow],
    ['property_pages', propertyPagesRow],
    ['units', unitsRow],
    ['unit_stay_terms', unitStayTermsRow],
    ['unit_lease_terms', unitLeaseTermsRow],
    ['listing_photos', listingPhotosRow],
    ['amenities', amenitiesRow],
    ['unit_amenities', unitAmenitiesRow],
    ['house_rules', houseRulesRow],
    ['payment_accounts', paymentAccountsRow],
    ['page_reports', pageReportsRow],
    ['weekday_rates', weekdayRatesRow],
    ['rate_overrides', rateOverridesRow],
    ['unit_fees', unitFeesRow],
    ['customers', customersRow],
    ['customer_consents', customerConsentsRow],
    ['unit_occupancy', unitOccupancyRow],
    ['bookings', bookingsRow],
    ['booking_lines', bookingLinesRow],
    ['booking_events', bookingEventsRow],
    ['booking_guests', bookingGuestsRow],
    ['stay_reviews', stayReviewsRow],
    ['payments', paymentsRow],
    ['payment_proofs', paymentProofsRow],
    ['threads', threadsRow],
    ['messages', messagesRow],
    ['saved_replies', savedRepliesRow],
    ['push_subscriptions', pushSubscriptionsRow],
    ['notifications_outbox', notificationsOutboxRow],
    ['meta_pixels', metaPixelsRow],
    ['meta_event_switches', metaEventSwitchesRow],
    ['meta_attribution', metaAttributionRow],
    ['meta_capi_deliveries', metaCapiDeliveriesRow],
  ];

  expect(tableValidators).toHaveLength(48);

  const seenIds = new Set<string>();
  for (const [tableName, schema] of tableValidators) {
    const rows = world[tableName];
    for (const row of rows) {
      schema.parse(row);
      if ('id' in row && typeof row.id === 'string') {
        expect(isDemoId(row.id)).toBe(true);
        expect(seenIds.has(row.id)).toBe(false);
        seenIds.add(row.id);
      }
    }
  }

  // Index rows by id for foreign-key & same-account checks
  const accountsById = new Map(world.accounts.map((r) => [r.id, r]));
  const profilesById = new Map(world.profiles.map((r) => [r.id, r]));
  const plansById = new Map(world.plans.map((r) => [r.id, r]));
  const propertiesById = new Map(world.properties.map((r) => [r.id, r]));
  const unitsById = new Map(world.units.map((r) => [r.id, r]));
  const filesById = new Map(world.files.map((r) => [r.id, r]));
  const amenitiesById = new Map(world.amenities.map((r) => [r.id, r]));
  const customersById = new Map(world.customers.map((r) => [r.id, r]));
  const occupanciesById = new Map(world.unit_occupancy.map((r) => [r.id, r]));
  const bookingsById = new Map(world.bookings.map((r) => [r.id, r]));
  const paymentsById = new Map(world.payments.map((r) => [r.id, r]));
  const threadsById = new Map(world.threads.map((r) => [r.id, r]));
  const subscriptionsById = new Map(world.subscriptions.map((r) => [r.id, r]));

  // Demo accounts, emails, and sample payment accounts
  for (const account of world.accounts) {
    expect(account.is_demo).toBe(true);
    expect(
      account.contact_email.endsWith('@example.com') ||
        account.contact_email.endsWith('@demo.invalid'),
    ).toBe(true);
    expect(
      account.notify_email.endsWith('@example.com') ||
        account.notify_email.endsWith('@demo.invalid'),
    ).toBe(true);
  }

  for (const customer of world.customers) {
    expect(accountsById.has(customer.account_id)).toBe(true);
    if (customer.profile_id !== null) {
      expect(profilesById.has(customer.profile_id)).toBe(true);
    }
    expect(
      customer.email.endsWith('@example.com') || customer.email.endsWith('@demo.invalid'),
    ).toBe(true);
  }

  for (const outbox of world.notifications_outbox) {
    if (outbox.to_email !== null) {
      expect(
        outbox.to_email.endsWith('@example.com') || outbox.to_email.endsWith('@demo.invalid'),
      ).toBe(true);
    }
  }

  for (const paymentAccount of world.payment_accounts) {
    expect(accountsById.has(paymentAccount.account_id)).toBe(true);
    expect(paymentAccount.is_sample).toBe(true);
    expect(paymentAccount.account_name.startsWith('SAMPLE')).toBe(true);
  }

  // Foreign key & owner isolation checks
  for (const member of world.account_members) {
    expect(accountsById.has(member.account_id)).toBe(true);
    expect(profilesById.has(member.profile_id)).toBe(true);
  }

  for (const sub of world.subscriptions) {
    expect(accountsById.has(sub.account_id)).toBe(true);
    expect(plansById.has(sub.plan_id)).toBe(true);
  }

  for (const subPay of world.subscription_payments) {
    const sub = subscriptionsById.get(subPay.subscription_id);
    expect(sub?.account_id).toBe(subPay.account_id);
    const file = filesById.get(subPay.proof_file_id);
    expect(file?.account_id).toBe(subPay.account_id);
  }

  for (const prop of world.properties) {
    expect(accountsById.has(prop.account_id)).toBe(true);
    if (prop.logo_file_id !== null) {
      expect(filesById.get(prop.logo_file_id)?.account_id).toBe(prop.account_id);
    }
  }

  for (const page of world.property_pages) {
    const prop = propertiesById.get(page.property_id);
    expect(prop?.account_id).toBe(page.account_id);
  }

  for (const unit of world.units) {
    const prop = propertiesById.get(unit.property_id);
    expect(prop?.account_id).toBe(unit.account_id);
  }

  for (const stayTerm of world.unit_stay_terms) {
    const unit = unitsById.get(stayTerm.unit_id);
    expect(unit?.account_id).toBe(stayTerm.account_id);
    expect(unit?.mode).toBe('short_stay');
  }

  for (const leaseTerm of world.unit_lease_terms) {
    const unit = unitsById.get(leaseTerm.unit_id);
    expect(unit?.account_id).toBe(leaseTerm.account_id);
    expect(unit?.mode).toBe('long_term');
  }

  // Manifest paths check for all listing_photos
  const manifestPaths = new Set<string>();
  for (const entry of DEMO_MEDIA_MANIFEST) {
    for (const rel of entry.files) {
      manifestPaths.add(`/demo-media/${entry.brand}/${rel}`);
    }
  }

  for (const photo of world.listing_photos) {
    const prop = propertiesById.get(photo.property_id);
    expect(prop?.account_id).toBe(photo.account_id);
    if (photo.unit_id !== null) {
      expect(unitsById.get(photo.unit_id)?.account_id).toBe(photo.account_id);
    }
    const file = filesById.get(photo.file_id);
    expect(file?.account_id).toBe(photo.account_id);
    expect(file !== undefined && manifestPaths.has(file.path)).toBe(true);
  }

  for (const ua of world.unit_amenities) {
    expect(unitsById.get(ua.unit_id)?.account_id).toBe(ua.account_id);
    const amenity = amenitiesById.get(ua.amenity_id);
    expect(amenity !== undefined).toBe(true);
    expect(amenity?.account_id === null || amenity?.account_id === ua.account_id).toBe(true);
  }

  // Imitates the database exclusion constraint:
  // `exclude using gist (unit_id with =, during with &&) where (active)`
  // The real rule lives in PostgreSQL on `public.unit_occupancy`.
  const activeByUnit = new Map<string, typeof world.unit_occupancy>();
  let overlapCount = 0;
  for (const occ of world.unit_occupancy) {
    expect(unitsById.get(occ.unit_id)?.account_id).toBe(occ.account_id);
    if (!occ.active) {
      continue;
    }
    const existing = activeByUnit.get(occ.unit_id) ?? [];
    const occEnd = occ.during.end ?? '9999-12-31';
    for (const other of existing) {
      const otherEnd = other.during.end ?? '9999-12-31';
      if (occ.during.start < otherEnd && other.during.start < occEnd) {
        overlapCount += 1;
      }
    }
    existing.push(occ);
    activeByUnit.set(occ.unit_id, existing);
  }
  expect(overlapCount).toBe(0);

  // Pre-group child rows by unit_id / booking_id so checks run in O(N)
  const stayTermsByUnitId = new Map(world.unit_stay_terms.map((t) => [t.unit_id, t]));
  const weekdayRatesByUnitId = new Map<string, typeof world.weekday_rates>();
  for (const r of world.weekday_rates) {
    const arr = weekdayRatesByUnitId.get(r.unit_id) ?? [];
    arr.push(r);
    weekdayRatesByUnitId.set(r.unit_id, arr);
  }
  const rateOverridesByUnitId = new Map<string, typeof world.rate_overrides>();
  for (const r of world.rate_overrides) {
    const arr = rateOverridesByUnitId.get(r.unit_id) ?? [];
    arr.push(r);
    rateOverridesByUnitId.set(r.unit_id, arr);
  }
  const feesByUnitId = new Map<string, typeof world.unit_fees>();
  for (const f of world.unit_fees) {
    const arr = feesByUnitId.get(f.unit_id) ?? [];
    arr.push(f);
    feesByUnitId.set(f.unit_id, arr);
  }
  const linesByBookingId = new Map<string, typeof world.booking_lines>();
  for (const l of world.booking_lines) {
    const arr = linesByBookingId.get(l.booking_id) ?? [];
    arr.push(l);
    linesByBookingId.set(l.booking_id, arr);
  }
  const eventsByBookingId = new Map<string, typeof world.booking_events>();
  for (const e of world.booking_events) {
    const arr = eventsByBookingId.get(e.booking_id) ?? [];
    arr.push(e);
    eventsByBookingId.set(e.booking_id, arr);
  }
  const paymentsByBookingId = new Map<string, typeof world.payments>();
  for (const p of world.payments) {
    const arr = paymentsByBookingId.get(p.booking_id) ?? [];
    arr.push(p);
    paymentsByBookingId.set(p.booking_id, arr);
  }

  // Booking totals, quoteStay match, lifecycle moves, and payment balances
  for (const booking of world.bookings) {
    const unit = unitsById.get(booking.unit_id);
    const prop = propertiesById.get(booking.property_id);
    const cust = customersById.get(booking.customer_id);
    const occ = occupanciesById.get(booking.occupancy_id);
    const stayTerms = stayTermsByUnitId.get(booking.unit_id);

    expect(unit?.account_id).toBe(booking.account_id);
    expect(prop?.account_id).toBe(booking.account_id);
    expect(cust?.account_id).toBe(booking.account_id);
    expect(occ?.account_id).toBe(booking.account_id);
    expect(stayTerms).toBeDefined();

    if (!unit || !occ || !stayTerms) {
      continue;
    }

    const checkIn = occ.during.start;
    const checkOut = addDays(checkIn, booking.nights);
    expect(occ.during.end).toBe(addDays(checkOut, stayTerms.prep_nights));

    const lines = [...(linesByBookingId.get(booking.id) ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const lineSum = lines.reduce((sum, l) => sum + l.amount_centavos, 0);
    expect(lineSum).toBe(booking.total_centavos);

    const quoteOutcome = quoteStay({
      terms: {
        base_nightly_centavos: stayTerms.base_nightly_centavos,
        base_guests: stayTerms.base_guests,
        min_nights: stayTerms.min_nights,
        max_nights: stayTerms.max_nights,
        weekly_discount_percent: stayTerms.weekly_discount_percent,
        monthly_discount_percent: stayTerms.monthly_discount_percent,
        down_payment_percent: stayTerms.down_payment_percent,
        advance_notice_days: stayTerms.advance_notice_days,
        booking_window_days: stayTerms.booking_window_days,
        max_guests: unit.max_guests,
      },
      weekdayRates: weekdayRatesByUnitId.get(unit.id) ?? [],
      rateOverrides: rateOverridesByUnitId.get(unit.id) ?? [],
      fees: feesByUnitId.get(unit.id) ?? [],
      checkIn,
      checkOut,
      adults: booking.adults,
      children: booking.children,
      today: addDays(checkIn, -Math.max(stayTerms.advance_notice_days + 1, 2)),
    });

    expect(quoteOutcome.ok).toBe(true);
    if (quoteOutcome.ok) {
      expect(booking.total_centavos).toBe(quoteOutcome.data.total_centavos);
      expect(booking.required_centavos).toBe(quoteOutcome.data.required_centavos);
      expect(
        lines.map((l) => ({
          kind: l.kind,
          label: l.label,
          stay_date: l.stay_date,
          quantity: l.quantity,
          unit_centavos: l.unit_centavos,
          amount_centavos: l.amount_centavos,
          sort_order: l.sort_order,
        })),
      ).toEqual(quoteOutcome.data.lines);
    }

    // Verify lifecycle transitions in booking_events
    const events = eventsByBookingId.get(booking.id) ?? [];
    expect(events.length).toBeGreaterThan(0);
    let currentState: BookingStatus | null = null;
    for (const evt of events) {
      expect(evt.account_id).toBe(booking.account_id);
      if (evt.to_status !== null) {
        expect(evt.from_status).toBe(currentState);
        const actor: BookingLifecycleActor = evt.actor_kind === 'staff' ? 'owner' : evt.actor_kind;
        expect(canMove(BOOKING_LIFECYCLE, evt.from_status, evt.to_status, actor)).toBe(true);
        currentState = evt.to_status;
      }
    }
    expect(currentState).toBe(booking.status);

    // Verify approved payments match booking requirements
    const bookingPayments = paymentsByBookingId.get(booking.id) ?? [];
    const approvedSum = bookingPayments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.kind === 'refund' ? -p.amount_centavos : p.amount_centavos), 0);

    if (booking.status === 'confirmed' || booking.status === 'checked_in') {
      expect(approvedSum).toBeGreaterThanOrEqual(booking.required_centavos);
    }
    if (booking.status === 'completed') {
      expect(approvedSum).toBe(booking.total_centavos);
    }
  }

  for (const proof of world.payment_proofs) {
    const pay = paymentsById.get(proof.payment_id);
    const file = filesById.get(proof.file_id);
    expect(pay?.account_id).toBe(proof.account_id);
    expect(file?.account_id).toBe(proof.account_id);
  }

  for (const thread of world.threads) {
    if (thread.booking_id !== null) {
      expect(bookingsById.get(thread.booking_id)?.account_id).toBe(thread.account_id);
    }
  }

  for (const msg of world.messages) {
    expect(threadsById.get(msg.thread_id)?.account_id).toBe(msg.account_id);
    if (msg.payment_id !== null) {
      expect(paymentsById.get(msg.payment_id)?.account_id).toBe(msg.account_id);
    }
  }

  // Gapless booking_no and receipt_no per account
  for (const account of world.accounts) {
    const acctBookings = world.bookings
      .filter((b) => b.account_id === account.id)
      .map((b) => b.booking_no)
      .sort((a, b) => a - b);
    expect(acctBookings).toEqual(
      Array.from({ length: acctBookings.length }, (_, index) => index + 1),
    );

    const acctReceipts = world.payments
      .filter((p) => p.account_id === account.id && p.receipt_no !== null)
      .map((p) => p.receipt_no ?? 0)
      .sort((a, b) => a - b);
    expect(acctReceipts).toEqual(
      Array.from({ length: acctReceipts.length }, (_, index) => index + 1),
    );

    const bookingCounter = world.account_counters.find(
      (c) => c.account_id === account.id && c.kind === 'booking',
    );
    if (bookingCounter) {
      expect(bookingCounter.last_value).toBe(acctBookings.length);
    }
    const receiptCounter = world.account_counters.find(
      (c) => c.account_id === account.id && c.kind === 'receipt',
    );
    if (receiptCounter) {
      expect(receiptCounter.last_value).toBe(acctReceipts.length);
    }
  }
}

describe('demo world invariants', () => {
  it('matches docs/demo-media-manifest.csv row-for-row so manifest.ts can never drift', () => {
    const csvPath = path.join(repoRoot, 'docs/demo-media-manifest.csv');
    const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
    const parsedFromCsv = lines.slice(1).map((line) => {
      const [brand, folder, name, sourceSize, files, pickedFrom, heroDescription, altText] =
        parseCsvLine(line);
      return {
        brand,
        folder,
        name,
        sourceSize,
        files: (files ?? '').split(';'),
        pickedFrom,
        heroDescription,
        altText,
      };
    });

    expect(DEMO_MEDIA_MANIFEST).toEqual(parsedFromCsv);
  });

  describe.each(DEMO_PACKS)('pack %s', (pack: DemoPack) => {
    it(
      'satisfies all invariants at the golden clock (2026-12-10T10:00:00+08:00)',
      { timeout: 30_000 },
      () => {
        const world = resolveDemoWorld({ pack, clock: fixedClock(GOLDEN_CLOCK_ISO) });
        assertWorldInvariants(world);
      },
    );

    it("satisfies all invariants at today's real clock", { timeout: 30_000 }, () => {
      const world = resolveDemoWorld({ pack, clock: systemClock });
      assertWorldInvariants(world);
    });
  });

  it(
    'covers all QA edge cases in the qa pack and ~400 bookings in the busy pack',
    { timeout: 30_000 },
    () => {
      const qaWorld = resolveDemoWorld({ pack: 'qa', clock: fixedClock(GOLDEN_CLOCK_ISO) });

      const bookingStatuses = new Set(qaWorld.bookings.map((b) => b.status));
      for (const status of BOOKING_STATUSES) {
        expect(bookingStatuses.has(status)).toBe(true);
      }

      const paymentStatuses = new Set(qaWorld.payments.map((p) => p.status));
      for (const status of PAYMENT_STATUSES) {
        expect(paymentStatuses.has(status)).toBe(true);
      }

      // Reused reference number after rejection
      const reusedRefPayments = qaWorld.payments.filter((p) => p.reference_norm === 'QAREF777888');
      expect(reusedRefPayments).toHaveLength(2);

      // 80-character name with emoji and ñ
      expect([...QA_EIGHTY_CHAR_EMOJI_ENYE_NAME].length).toBeLessThanOrEqual(80);
      expect(QA_EIGHTY_CHAR_EMOJI_ENYE_NAME.length).toBe(80);
      expect(qaWorld.customers.some((c) => c.full_name === QA_EIGHTY_CHAR_EMOJI_ENYE_NAME)).toBe(
        true,
      );

      // RA 9653 lease term above 1 month advance or 2 months deposit
      expect(
        qaWorld.unit_lease_terms.some((t) => t.advance_months > 1 && t.deposit_months > 2),
      ).toBe(true);

      // Busy pack has 400 bookings and 150 customers, identical across runs
      const busy1 = resolveDemoWorld({ pack: 'busy', clock: fixedClock(GOLDEN_CLOCK_ISO) });
      const busy2 = resolveDemoWorld({ pack: 'busy', clock: fixedClock(GOLDEN_CLOCK_ISO) });
      expect(busy1.bookings).toHaveLength(400);
      expect(busy1.customers).toHaveLength(150);
      expect(busy1).toEqual(busy2);
    },
  );
});
