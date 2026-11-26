import { DEMO_IDS, calendarDate, quoteStay, type AppError, type Result } from '@smartapp/core';
import { describe, expect, it } from 'vitest';

import type { DataSource, Session } from '../source.js';
import { runOwnerP4ContractTests } from './owner-p4.js';

export interface ContractHarness {
  readonly source: DataSource;
  /**
   * Advances the adapter's clock by the given number of minutes.
   * In memory mode this moves the injected Manila clock; in Phase 11 it
   * advances the test clock / expiry timestamps on the seeded dev database.
   */
  readonly advanceMinutes: (minutes: number) => Promise<void> | void;
}

export type MakeContractSource = () => Promise<ContractHarness> | ContractHarness;

const GOLDEN_TODAY = calendarDate('2026-12-10');

const GUEST_SESSION: Session = { role: 'guest' };
const ULAP_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.ulapSuites.account,
  profileId: DEMO_IDS.people.owners.ulapSuites,
};
const BAHAY_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.bahayBatis.account,
  profileId: DEMO_IDS.people.owners.bahayBatis,
};
const ADMIN_SESSION: Session = {
  role: 'super_admin',
  profileId: DEMO_IDS.platform.superAdminProfile,
};
const SYSTEM_SESSION: Session = { role: 'system' };

function assertOk<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(`Expected ok result, got error ${result.error.code}: ${result.error.message}`);
  }
  return result.data;
}

function assertErr<T>(result: Result<T>): AppError {
  if (result.ok) {
    throw new Error(`Expected error result, got ok: ${JSON.stringify(result.data)}`);
  }
  return result.error;
}

function createKeyMaker(prefix: string): () => string {
  let seq = 0;
  return () => {
    seq += 1;
    return `idem-${prefix}-${String(seq).padStart(4, '0')}`;
  };
}

async function createHoldOnDates(params: {
  readonly source: DataSource;
  readonly unitId: string;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly adults: number;
  readonly children: number;
  readonly email: string;
  readonly fullName: string;
  readonly idempotencyKey: string;
}) {
  const quote = assertOk(
    await params.source.quoteStay(
      {
        unitId: params.unitId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children,
      },
      GUEST_SESSION,
    ),
  );

  const hold = assertOk(
    await params.source.createBookingHold(
      {
        idempotencyKey: params.idempotencyKey,
        unitId: params.unitId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children,
        expectedTotal: quote.total_centavos,
        customer: {
          full_name: params.fullName,
          email: params.email,
          mobile: '09170009901',
        },
        guestNote: null,
        consents: [
          {
            kind: 'privacy_notice',
            granted: true,
            noticeVersion: '2026-11',
          },
        ],
      },
      GUEST_SESSION,
    ),
  );

  return { quote, hold };
}

async function getExistingUlapProofFileId(source: DataSource): Promise<string> {
  const payments = assertOk(
    await source.listPaymentsToReview(
      { accountId: DEMO_IDS.ulapSuites.account, status: null },
      ULAP_OWNER_SESSION,
    ),
  );
  for (const item of payments) {
    const fileId = item.proof_file_ids[0];
    if (fileId) return fileId;
  }
  throw new Error('Expected at least one existing Ulap payment proof file in QA pack.');
}

/**
 * Shared DataSource contract suite.
 * Runs against the memory adapter in Phase 2 (`memory.contract.test.ts`),
 * and against the HTTP adapter and seeded development database in Phase 11.
 */
export function runContractTests(makeSource: MakeContractSource): void {
  describe('DataSource contract (QA pack @ 2026-12-10 Manila)', () => {
    it('01. quote matches golden pricing rules and unit-rule refusals', async () => {
      const { source } = await makeSource();

      // Bahay Batis Buong Bahay: 1 weeknight (Dec 15 -> Dec 16), 15 adults = 16,000 + 1,000 cleaning
      const weeknight = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.bahayBatis.units.buongBahay,
            checkIn: '2026-12-15',
            checkOut: '2026-12-16',
            adults: 15,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(weeknight.nights_subtotal_centavos).toBe(1_600_000);
      expect(weeknight.fees_subtotal_centavos).toBe(100_000);
      expect(weeknight.total_centavos).toBe(1_700_000);
      expect(weeknight.required_centavos).toBe(850_000);

      // 2 weekend nights (Fri Dec 18 -> Sun Dec 20): 18,000 * 2 + 1,000 cleaning = 3,700,000
      const weekend = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.bahayBatis.units.buongBahay,
            checkIn: '2026-12-18',
            checkOut: '2026-12-20',
            adults: 15,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(weekend.nights_subtotal_centavos).toBe(3_600_000);
      expect(weekend.total_centavos).toBe(3_700_000);

      // Crossing into Christmas override (Wed Dec 23 -> Sun Dec 27):
      // Dec 23 base (1,600,000) + Dec 24..26 inside Dec 24..Jan 2 override (2,200,000 * 3) + 100,000 cleaning
      const crossing = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.bahayBatis.units.buongBahay,
            checkIn: '2026-12-23',
            checkOut: '2026-12-27',
            adults: 15,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(crossing.nights_subtotal_centavos).toBe(8_200_000);
      expect(crossing.total_centavos).toBe(8_300_000);

      // 7 nights (2027-01-11 -> 2027-01-18) with 18 guests (3 extra): weekly discount applies to nights only
      const sevenNights = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.bahayBatis.units.buongBahay,
            checkIn: '2027-01-11',
            checkOut: '2027-01-18',
            adults: 16,
            children: 2,
          },
          GUEST_SESSION,
        ),
      );
      // 5 weeknights * 1,600,000 + 2 weekend * 1,800,000 = 11,600,000; 10% discount = 1,160,000
      // Fees: 100,000 cleaning + (3 extra * 7 nights * 50,000 = 1,050,000) = 1,150,000
      expect(sevenNights.nights_subtotal_centavos).toBe(11_600_000);
      expect(sevenNights.discount_centavos).toBe(1_160_000);
      expect(sevenNights.fees_subtotal_centavos).toBe(1_150_000);
      expect(sevenNights.total_centavos).toBe(11_590_000);

      // Studio Fog (min_nights=2, max_nights=14, max_guests=2) matches core quoteStay & refusals
      const prop = assertOk(await source.getProperty({ slug: 'ulap-suites' }, GUEST_SESSION));
      const studio = prop.units.find((u) => u.id === DEMO_IDS.ulapSuites.units.studioFog);
      expect(studio?.stay_terms).not.toBeNull();
      const cal = assertOk(
        await source.getUnitCalendar(
          { unitId: DEMO_IDS.ulapSuites.units.studioFog },
          GUEST_SESSION,
        ),
      );
      const studio14 = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-12',
            checkOut: '2027-01-26',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      if (studio?.stay_terms) {
        const directQuote = quoteStay({
          terms: {
            base_nightly_centavos: studio.stay_terms.base_nightly_centavos,
            base_guests: studio.stay_terms.base_guests,
            min_nights: studio.stay_terms.min_nights,
            max_nights: studio.stay_terms.max_nights,
            weekly_discount_percent: studio.stay_terms.weekly_discount_percent,
            monthly_discount_percent: studio.stay_terms.monthly_discount_percent,
            down_payment_percent: studio.stay_terms.down_payment_percent,
            down_payment_kind: studio.stay_terms.down_payment_kind,
            down_payment_centavos: studio.stay_terms.down_payment_centavos,
            advance_notice_days: studio.stay_terms.advance_notice_days,
            booking_window_days: studio.stay_terms.booking_window_days,
            max_guests: studio.max_guests,
          },
          weekdayRates: cal.weekday_rates,
          rateOverrides: cal.rate_overrides,
          fees: [],
          checkIn: calendarDate('2027-01-12'),
          checkOut: calendarDate('2027-01-26'),
          adults: 2,
          children: 0,
          today: GOLDEN_TODAY,
        });
        expect(directQuote.ok).toBe(true);
        if (directQuote.ok) {
          expect(studio14).toEqual(directQuote.data);
        }
      }

      const tooShortErr = assertErr(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-12',
            checkOut: '2027-01-13',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(tooShortErr.code).toBe('not_allowed');
      expect(tooShortErr.details).toEqual({ reason: 'min_nights' });

      const tooLongErr = assertErr(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-12',
            checkOut: '2027-01-27',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(tooLongErr.code).toBe('not_allowed');
      expect(tooLongErr.details).toEqual({ reason: 'max_nights' });

      const tooManyGuestsErr = assertErr(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-12',
            checkOut: '2027-01-14',
            adults: 3,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(tooManyGuestsErr.code).toBe('not_allowed');
      expect(tooManyGuestsErr.details).toEqual({ reason: 'too_many_guests' });
    });

    it('02. hold appears on unit calendar and owner calendar timeline', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('02');

      const { hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-01-15',
        checkOut: '2027-01-17',
        adults: 2,
        children: 0,
        email: 'hold.calendar@example.com',
        fullName: 'Paolo Villanueva',
        idempotencyKey: nextKey(),
      });

      const cal = assertOk(
        await source.getUnitCalendar(
          { unitId: DEMO_IDS.ulapSuites.units.studioFog },
          GUEST_SESSION,
        ),
      );
      expect(cal.taken_ranges).toContainEqual({ start: '2027-01-15', end: '2027-01-17' });

      const timeline = assertOk(
        await source.getCalendarTimeline(
          {
            accountId: DEMO_IDS.ulapSuites.account,
            range: { start: '2027-01-10', end: '2027-01-25' },
          },
          ULAP_OWNER_SESSION,
        ),
      );
      const studioTimeline = timeline.units.find(
        (u) => u.id === DEMO_IDS.ulapSuites.units.studioFog,
      );
      expect(studioTimeline?.items).toContainEqual(
        expect.objectContaining({
          booking_id: hold.bookingId,
          booking_status: 'held',
          kind: 'hold',
          during: { start: '2027-01-15', end: '2027-01-17' },
        }),
      );
    });

    it('03. overlapping hold gives dates_taken; checkout day succeeds; prep_nights blocks checkout day', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('03');

      // Quote the overlapping dates first (simulates two guests quoting free dates before Guest 1 holds)
      const quoteOverlap = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-16',
            checkOut: '2027-01-19',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );

      await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-01-15',
        checkOut: '2027-01-18',
        adults: 2,
        children: 0,
        email: 'first.guest@example.com',
        fullName: 'First Guest',
        idempotencyKey: nextKey(),
      });

      // Overlap attempt fails quoteStay / createBookingHold with dates_taken
      const overlapQuoteErr = assertErr(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-16',
            checkOut: '2027-01-19',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );
      expect(overlapQuoteErr.code).toBe('dates_taken');

      const overlapHoldErr = assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-16',
            checkOut: '2027-01-19',
            adults: 2,
            children: 0,
            expectedTotal: quoteOverlap.total_centavos,
            customer: {
              full_name: 'Overlap Guest',
              email: 'overlap.guest@example.com',
              mobile: '09170009902',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );
      expect(overlapHoldErr.code).toBe('dates_taken');

      // Adjacent checkout day on Studio Fog (prep_nights = 0) succeeds
      const checkoutSameDay = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-01-18',
        checkOut: '2027-01-20',
        adults: 2,
        children: 0,
        email: 'checkout.day@example.com',
        fullName: 'Checkout Day Guest',
        idempotencyKey: nextKey(),
      });
      expect(checkoutSameDay.hold.bookingNo).toBeGreaterThan(0);

      // 1BR Taal View has prep_nights = 1 in QA: quote before first hold, then hold 2027-01-15 -> 2027-01-17
      const prepTargetQuote = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.taalView1br,
            checkIn: '2027-01-17',
            checkOut: '2027-01-19',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );

      await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.taalView1br,
        checkIn: '2027-01-15',
        checkOut: '2027-01-17',
        adults: 2,
        children: 0,
        email: 'prep.first@example.com',
        fullName: 'Prep First',
        idempotencyKey: nextKey(),
      });

      const prepBlockedErr = assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.taalView1br,
            checkIn: '2027-01-17',
            checkOut: '2027-01-19',
            adults: 2,
            children: 0,
            expectedTotal: prepTargetQuote.total_centavos,
            customer: {
              full_name: 'Prep Blocked',
              email: 'prep.blocked@example.com',
              mobile: '09170009903',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );
      expect(prepBlockedErr.code).toBe('dates_taken');

      // Starting on 2027-01-18 (after the 1 prep night) succeeds
      const afterPrep = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.taalView1br,
        checkIn: '2027-01-18',
        checkOut: '2027-01-20',
        adults: 2,
        children: 0,
        email: 'after.prep@example.com',
        fullName: 'After Prep',
        idempotencyKey: nextKey(),
      });
      expect(afterPrep.hold.bookingId).toBeTruthy();
    });

    it('04. third unpaid hold for same customer and owner gives hold_limit', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('04');

      // Maricel Ouano already has 2 active unpaid holds on Ulap Suites in QA pack.
      const quote = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.taalView1br,
            checkIn: '2027-01-20',
            checkOut: '2027-01-22',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );

      const thirdHoldErr = assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.taalView1br,
            checkIn: '2027-01-20',
            checkOut: '2027-01-22',
            adults: 2,
            children: 0,
            expectedTotal: quote.total_centavos,
            customer: {
              full_name: 'Maricel Ouano',
              email: 'maricel.ouano@example.com',
              mobile: '09170000210',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );
      expect(thirdHoldErr.code).toBe('hold_limit');

      // Same customer can still hold on another owner (Bahay Batis)
      const otherOwnerHold = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.bahayBatis.units.buongBahay,
        checkIn: '2027-01-20',
        checkOut: '2027-01-22',
        adults: 10,
        children: 0,
        email: 'maricel.ouano@example.com',
        fullName: 'Maricel Ouano',
        idempotencyKey: nextKey(),
      });
      expect(otherOwnerHold.hold.bookingNo).toBeGreaterThan(0);
    });

    it('05. hold expires after hold_minutes when clock moves on and dates become free again', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('05');

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-01-20',
        checkOut: '2027-01-22',
        adults: 2,
        children: 0,
        email: 'expiring.guest@example.com',
        fullName: 'Expiring Guest',
        idempotencyKey: nextKey(),
      });

      await advanceMinutes(30);
      const stillBlocked = assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-01-20',
            checkOut: '2027-01-22',
            adults: 2,
            children: 0,
            expectedTotal: quote.total_centavos,
            customer: {
              full_name: 'Early Retry',
              email: 'early.retry@example.com',
              mobile: '09170009905',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );
      expect(stillBlocked.code).toBe('dates_taken');

      // Advance past the 60-minute hold window (total +61 min)
      await advanceMinutes(31);
      const expiredRes = assertOk(await source.expireHolds({}, SYSTEM_SESSION));
      expect(expiredRes.expiredCount).toBeGreaterThanOrEqual(1);

      const calAfter = assertOk(
        await source.getUnitCalendar(
          { unitId: DEMO_IDS.ulapSuites.units.studioFog },
          GUEST_SESSION,
        ),
      );
      expect(calAfter.taken_ranges).not.toContainEqual({
        start: '2027-01-20',
        end: '2027-01-22',
      });

      const threadAfter = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          { role: 'guest', threadToken: hold.threadToken },
        ),
      );
      expect(threadAfter.booking.status).toBe('expired');

      // Same dates can now be held again
      const rebooked = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-01-20',
        checkOut: '2027-01-22',
        adults: 2,
        children: 0,
        email: 'new.guest@example.com',
        fullName: 'New Guest',
        idempotencyKey: nextKey(),
      });
      expect(rebooked.hold.bookingId).not.toBe(hold.bookingId);
    });

    it('06. proof extends hold to 72 hours and reused reference per account and method gives reference_used', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('06');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-01',
        checkOut: '2027-02-03',
        adults: 2,
        children: 0,
        email: 'proof.guest@example.com',
        fullName: 'Proof Guest',
        idempotencyKey: nextKey(),
      });

      const beforeExpiryMs = Date.parse(hold.expiresAt ?? '');
      const guestSession: Session = { role: 'guest', threadToken: hold.threadToken };

      assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'GCASH-1122-3344',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );

      const threadAfter = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(threadAfter.booking.status).toBe('in_review');
      const extendedExpiryMs = Date.parse(threadAfter.booking.hold_expires_at ?? '');
      // 72 hours minus 60 min hold is +71 hours more than initial hold expiry
      expect(extendedExpiryMs - beforeExpiryMs).toBe(71 * 3_600_000);

      // Hold survives past original 60 minutes (e.g. +12 hours)
      await advanceMinutes(12 * 60);
      assertOk(await source.expireHolds({}, SYSTEM_SESSION));
      const threadStillAlive = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(threadStillAlive.booking.status).toBe('in_review');

      // Reusing normalised reference ('gcash 1122 3344' === 'GCASH11223344') on same account/method fails
      const second = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.taalView1br,
        checkIn: '2027-02-05',
        checkOut: '2027-02-07',
        adults: 2,
        children: 0,
        email: 'dup.ref@example.com',
        fullName: 'Dup Ref Guest',
        idempotencyKey: nextKey(),
      });
      const dupErr = assertErr(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: second.hold.bookingId,
            threadToken: second.hold.threadToken,
            amountCentavos: second.quote.required_centavos,
            method: 'gcash',
            referenceNo: 'gcash 1122 3344',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          { role: 'guest', threadToken: second.hold.threadToken },
        ),
      );
      expect(dupErr.code).toBe('reference_used');
    });

    it('07. approval without wallet_checked is refused with not_allowed { reason: "wallet_not_checked" } (D33)', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('07');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-08',
        checkOut: '2027-02-10',
        adults: 2,
        children: 0,
        email: 'wallet.check@example.com',
        fullName: 'Wallet Check',
        idempotencyKey: nextKey(),
      });

      const payment = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'WALLETCHK001',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          { role: 'guest', threadToken: hold.threadToken },
        ),
      );

      const refuseErr = assertErr(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: payment.id,
            decision: 'approved',
            walletChecked: false,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(refuseErr.code).toBe('not_allowed');
      expect(refuseErr.details).toEqual({ reason: 'wallet_not_checked' });

      const detail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(detail.booking.status).toBe('in_review');
      expect(detail.paid_centavos).toBe(0);
    });

    it('08. approval confirms booking, assigns receipt_no, reveals arrival info, and balance equals sum of approvals', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('08');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-11',
        checkOut: '2027-02-13',
        adults: 2,
        children: 0,
        email: 'approve.confirm@example.com',
        fullName: 'Approve Confirm',
        idempotencyKey: nextKey(),
      });

      const guestSession: Session = { role: 'guest', threadToken: hold.threadToken };

      // Before confirmation, arrival_info must be hidden
      const beforeThread = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(beforeThread.booking.property_arrival_info).toBeNull();
      expect(beforeThread.booking.unit_arrival_info).toBeNull();

      const dpPayment = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'maya',
            referenceNo: 'MAYA-APPROVE-01',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );

      const approved = assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: dpPayment.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(approved.status).toBe('approved');
      expect(approved.receipt_no).not.toBeNull();

      const afterDetail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(afterDetail.booking.status).toBe('confirmed');
      expect(afterDetail.occupancy.kind).toBe('booking');
      expect(afterDetail.occupancy.expires_at).toBeNull();
      expect(afterDetail.paid_centavos).toBe(quote.required_centavos);
      expect(afterDetail.balance_centavos).toBe(quote.total_centavos - quote.required_centavos);

      // Arrival info now visible to guest
      const afterThread = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(afterThread.booking.unit_arrival_info).not.toBeNull();

      // Owner records remaining cash balance
      const remaining = quote.total_centavos - quote.required_centavos;
      assertOk(
        await source.recordOwnerPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            bookingId: hold.bookingId,
            kind: 'payment',
            amountCentavos: remaining,
            method: 'cash',
            referenceNo: null,
            paidOn: GOLDEN_TODAY,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      const settledDetail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(settledDetail.paid_centavos).toBe(quote.total_centavos);
      expect(settledDetail.balance_centavos).toBe(0);
    });

    it('09. double approval with a new idempotencyKey gives invalid_move and counts nothing twice', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('09');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-14',
        checkOut: '2027-02-16',
        adults: 2,
        children: 0,
        email: 'double.approve@example.com',
        fullName: 'Double Approve',
        idempotencyKey: nextKey(),
      });

      const payment = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'DOUBLEAPP001',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          { role: 'guest', threadToken: hold.threadToken },
        ),
      );

      const first = assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: payment.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      const secondErr = assertErr(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: payment.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(secondErr.code).toBe('invalid_move');

      const detail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(detail.paid_centavos).toBe(quote.required_centavos);
      expect(detail.payments).toHaveLength(1);
      expect(detail.payments[0]?.receipt_no).toBe(first.receipt_no);
    });

    it('10. stale expectedTotal gives price_changed and writes nothing', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('10');

      const quote = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-02-17',
            checkOut: '2027-02-19',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );

      const staleErr = assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-02-17',
            checkOut: '2027-02-19',
            adults: 2,
            children: 0,
            expectedTotal: quote.total_centavos - 10_000,
            customer: {
              full_name: 'Stale Total Guest',
              email: 'stale.total@example.com',
              mobile: '09170009910',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );
      expect(staleErr.code).toBe('price_changed');

      const cal = assertOk(
        await source.getUnitCalendar(
          { unitId: DEMO_IDS.ulapSuites.units.studioFog },
          GUEST_SESSION,
        ),
      );
      expect(cal.taken_ranges).not.toContainEqual({
        start: '2027-02-17',
        end: '2027-02-19',
      });
    });

    it('11. same idempotencyKey twice creates one booking and returns the exact same output', async () => {
      const { source } = await makeSource();
      const sameKey = 'idem-same-key-0011';

      const beforeList = assertOk(
        await source.listBookings(
          { accountId: DEMO_IDS.ulapSuites.account, status: null },
          ULAP_OWNER_SESSION,
        ),
      );

      const quote = assertOk(
        await source.quoteStay(
          {
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-02-20',
            checkOut: '2027-02-22',
            adults: 2,
            children: 0,
          },
          GUEST_SESSION,
        ),
      );

      const payload = {
        idempotencyKey: sameKey,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-20',
        checkOut: '2027-02-22',
        adults: 2,
        children: 0,
        expectedTotal: quote.total_centavos,
        customer: {
          full_name: 'Idempotent Guest',
          email: 'idem.guest@example.com',
          mobile: '09170009911',
        },
        guestNote: null,
        consents: [{ kind: 'privacy_notice' as const, granted: true, noticeVersion: '2026-11' }],
      };

      const first = assertOk(await source.createBookingHold(payload, GUEST_SESSION));
      const second = assertOk(await source.createBookingHold(payload, GUEST_SESSION));
      expect(second).toEqual(first);

      const afterList = assertOk(
        await source.listBookings(
          { accountId: DEMO_IDS.ulapSuites.account, status: null },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(afterList.length).toBe(beforeList.length + 1);
    });

    it('12. cross-owner read gives not_found and guest token opens only its own thread', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('12');

      const holdA = (
        await createHoldOnDates({
          source,
          unitId: DEMO_IDS.ulapSuites.units.studioFog,
          checkIn: '2027-02-22',
          checkOut: '2027-02-24',
          adults: 2,
          children: 0,
          email: 'guest.alpha@example.com',
          fullName: 'Guest Alpha',
          idempotencyKey: nextKey(),
        })
      ).hold;

      const holdB = (
        await createHoldOnDates({
          source,
          unitId: DEMO_IDS.ulapSuites.units.studioFog,
          checkIn: '2027-02-24',
          checkOut: '2027-02-26',
          adults: 2,
          children: 0,
          email: 'guest.beta@example.com',
          fullName: 'Guest Beta',
          idempotencyKey: nextKey(),
        })
      ).hold;

      // Bahay Batis owner cannot see Ulap Suites booking
      const crossOwnerErr = assertErr(
        await source.getBooking(
          { accountId: DEMO_IDS.bahayBatis.account, bookingId: holdA.bookingId },
          BAHAY_OWNER_SESSION,
        ),
      );
      expect(crossOwnerErr.code).toBe('not_found');

      // Guest Alpha's token opens Alpha's thread
      const ownThread = assertOk(
        await source.getThread(
          { threadToken: holdA.threadToken, threadId: holdA.threadId },
          { role: 'guest', threadToken: holdA.threadToken },
        ),
      );
      expect(ownThread.thread.id).toBe(holdA.threadId);

      // Guest Alpha's token cannot open Beta's thread
      const otherThreadByIdErr = assertErr(
        await source.getThread(
          { threadToken: holdA.threadToken, threadId: holdB.threadId },
          { role: 'guest', threadToken: holdA.threadToken },
        ),
      );
      expect(otherThreadByIdErr.code).toBe('not_found');

      const tokenMismatchErr = assertErr(
        await source.getThread(
          { threadToken: holdB.threadToken, threadId: holdB.threadId },
          { role: 'guest', threadToken: holdA.threadToken },
        ),
      );
      expect(tokenMismatchErr.code).toBe('not_found');
    });

    it('13. caller without required role access gets not_allowed', async () => {
      const { source } = await makeSource();

      expect(
        assertErr(await source.ownerHome({ accountId: DEMO_IDS.ulapSuites.account }, GUEST_SESSION))
          .code,
      ).toBe('not_allowed');

      expect(
        assertErr(await source.getThread({ threadToken: null, threadId: null }, GUEST_SESSION))
          .code,
      ).toBe('not_allowed');

      expect(
        assertErr(await source.listOwnerAccounts({ status: null }, ULAP_OWNER_SESSION)).code,
      ).toBe('not_allowed');

      expect(assertErr(await source.expireHolds({}, ULAP_OWNER_SESSION)).code).toBe('not_allowed');

      expect(
        assertErr(
          await source.ownerHome({ accountId: DEMO_IDS.ulapSuites.account }, BAHAY_OWNER_SESSION),
        ).code,
      ).toBe('not_allowed');

      const adminList = assertOk(await source.listOwnerAccounts({ status: null }, ADMIN_SESSION));
      expect(adminList.length).toBeGreaterThan(0);
    });

    it('14. cancelling completed booking gives invalid_move; cancelling held booking frees dates', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('14');

      const completed = assertOk(
        await source.listBookings(
          { accountId: DEMO_IDS.ulapSuites.account, status: 'completed' },
          ULAP_OWNER_SESSION,
        ),
      );
      const completedBooking = completed[0];
      expect(completedBooking).toBeDefined();
      if (completedBooking) {
        const cancelCompletedErr = assertErr(
          await source.cancelBooking(
            {
              idempotencyKey: nextKey(),
              bookingId: completedBooking.id,
              threadToken: null,
              cancelledBy: 'owner',
              reason: 'Cannot cancel completed stay.',
            },
            ULAP_OWNER_SESSION,
          ),
        );
        expect(cancelCompletedErr.code).toBe('invalid_move');
      }

      const { hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-26',
        checkOut: '2027-02-28',
        adults: 2,
        children: 0,
        email: 'cancel.free@example.com',
        fullName: 'Cancel Free',
        idempotencyKey: nextKey(),
      });

      const cancelled = assertOk(
        await source.cancelBooking(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            cancelledBy: 'customer',
            reason: 'Plans changed.',
          },
          { role: 'guest', threadToken: hold.threadToken },
        ),
      );
      expect(cancelled.status).toBe('cancelled');

      // Re-booking those exact dates now succeeds
      const reheld = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-02-26',
        checkOut: '2027-02-28',
        adults: 2,
        children: 0,
        email: 'rebook.after.cancel@example.com',
        fullName: 'Rebook Guest',
        idempotencyKey: nextKey(),
      });
      expect(reheld.hold.bookingId).not.toBe(hold.bookingId);
    });

    it('15. booking_no and receipt_no stay gapless after failed calls', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('15');
      const proofFileId = await getExistingUlapProofFileId(source);

      const beforeBookings = assertOk(
        await source.listBookings(
          { accountId: DEMO_IDS.ulapSuites.account, status: null },
          ULAP_OWNER_SESSION,
        ),
      );
      const maxBookingNoBefore = Math.max(...beforeBookings.map((b) => b.booking_no));

      const beforePayments = assertOk(
        await source.listPaymentsToReview(
          { accountId: DEMO_IDS.ulapSuites.account, status: null },
          ULAP_OWNER_SESSION,
        ),
      );
      const receiptNosBefore = beforePayments
        .map((p) => p.receipt_no)
        .filter((n): n is number => n !== null);
      const maxReceiptBefore = Math.max(...receiptNosBefore);

      // Failed hold calls (price_changed, dates_taken, hold_limit)
      assertErr(
        await source.createBookingHold(
          {
            idempotencyKey: nextKey(),
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-03-01',
            checkOut: '2027-03-03',
            adults: 2,
            children: 0,
            expectedTotal: 100,
            customer: {
              full_name: 'Fail Gap Check',
              email: 'gap.fail@example.com',
              mobile: '09170009915',
            },
            guestNote: null,
            consents: [{ kind: 'privacy_notice', granted: true, noticeVersion: '2026-11' }],
          },
          GUEST_SESSION,
        ),
      );

      // Valid hold should receive maxBookingNoBefore + 1
      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-03-01',
        checkOut: '2027-03-03',
        adults: 2,
        children: 0,
        email: 'gap.pass@example.com',
        fullName: 'Gap Pass',
        idempotencyKey: nextKey(),
      });
      expect(hold.bookingNo).toBe(maxBookingNoBefore + 1);

      const payment = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'GAPLESS001',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          { role: 'guest', threadToken: hold.threadToken },
        ),
      );

      // Failed approval (wallet_not_checked) must not consume a receipt_no
      assertErr(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: payment.id,
            decision: 'approved',
            walletChecked: false,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      // Next valid approval receives maxReceiptBefore + 1
      const approved = assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: payment.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(approved.receipt_no).toBe(maxReceiptBefore + 1);
    });

    it('16. findMyBooking answers identically for known and unknown emails', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('16');

      const known = assertOk(
        await source.findMyBooking(
          {
            idempotencyKey: nextKey(),
            propertySlug: 'ulap-suites',
            email: 'bea.santos@example.com',
          },
          GUEST_SESSION,
        ),
      );
      const unknown = assertOk(
        await source.findMyBooking(
          {
            idempotencyKey: nextKey(),
            propertySlug: 'ulap-suites',
            email: 'never.booked.before@example.com',
          },
          GUEST_SESSION,
        ),
      );
      expect(known).toEqual({ queued: true });
      expect(unknown).toEqual(known);
    });

    it('17. rejected proof frees reference, moves booking back to held, and restarts hold clock at hold_minutes', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('17');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-03-04',
        checkOut: '2027-03-06',
        adults: 2,
        children: 0,
        email: 'reject.retest@example.com',
        fullName: 'Reject Retest',
        idempotencyKey: nextKey(),
      });
      const guestSession: Session = { role: 'guest', threadToken: hold.threadToken };

      const firstPay = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'REJ-REF-909',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );

      // Advance 120 minutes while in_review (would have expired initial 60m hold, still inside 72h review window)
      await advanceMinutes(120);

      const rejected = assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: firstPay.id,
            decision: 'rejected',
            walletChecked: false,
            rejectReason: 'Reference digits cut off in screenshot.',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(rejected.status).toBe('rejected');

      const threadAfterReject = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(threadAfterReject.booking.status).toBe('held');
      const restartedExpiryMs = Date.parse(threadAfterReject.booking.hold_expires_at ?? '');
      const goldenPlus180MinMs = new Date('2026-12-10T10:00:00+08:00').getTime() + 180 * 60_000;
      // 120m elapsed + 60m restarted hold_minutes = +180m from start
      expect(restartedExpiryMs).toBe(goldenPlus180MinMs);

      // Reusing exact same reference number succeeds now that previous submission was rejected
      const resent = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'REJ-REF-909',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );
      expect(resent.status).toBe('submitted');
    });

    it('18. reversePayment recalculates paid_centavos and balance_centavos and keeps both payment lines visible', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('18');
      const proofFileId = await getExistingUlapProofFileId(source);

      const { quote, hold } = await createHoldOnDates({
        source,
        unitId: DEMO_IDS.ulapSuites.units.studioFog,
        checkIn: '2027-03-07',
        checkOut: '2027-03-09',
        adults: 2,
        children: 0,
        email: 'reverse.pay@example.com',
        fullName: 'Reverse Pay',
        idempotencyKey: nextKey(),
      });
      const guestSession: Session = { role: 'guest', threadToken: hold.threadToken };

      const pay1 = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'REVPAY1001',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );

      assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: pay1.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      // Reverse the approved payment
      const reversed = assertOk(
        await source.reversePayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: pay1.id,
            reason: 'Matched to the wrong deposit in GCash.',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(reversed.status).toBe('reversed');

      const afterReverse = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(afterReverse.paid_centavos).toBe(0);
      expect(afterReverse.balance_centavos).toBe(quote.total_centavos);

      // Replacement payment approved
      const pay2 = assertOk(
        await source.submitPayment(
          {
            idempotencyKey: nextKey(),
            bookingId: hold.bookingId,
            threadToken: hold.threadToken,
            amountCentavos: quote.required_centavos,
            method: 'gcash',
            referenceNo: 'REVPAY1002',
            paidOn: GOLDEN_TODAY,
            proofFileIds: [proofFileId],
          },
          guestSession,
        ),
      );
      assertOk(
        await source.reviewPayment(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentId: pay2.id,
            decision: 'approved',
            walletChecked: true,
            rejectReason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      const finalBooking = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: hold.bookingId },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(finalBooking.paid_centavos).toBe(quote.required_centavos);
      expect(finalBooking.balance_centavos).toBe(quote.total_centavos - quote.required_centavos);
      expect(finalBooking.payments.map((p) => p.status)).toEqual(['reversed', 'approved']);

      const finalThread = assertOk(
        await source.getThread(
          { threadToken: hold.threadToken, threadId: hold.threadId },
          guestSession,
        ),
      );
      expect(finalThread.payments.map((p) => p.status)).toEqual(['reversed', 'approved']);
      expect(finalThread.booking.paid_centavos).toBe(quote.required_centavos);
      expect(finalThread.booking.balance_centavos).toBe(
        quote.total_centavos - quote.required_centavos,
      );
    });

    it('19. changeBookingDates onto taken dates gives dates_taken; onto free dates moves the same occupancy row', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('19');

      const bookingA = assertOk(
        await source.createManualBooking(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-03-10',
            checkOut: '2027-03-12',
            adults: 2,
            children: 0,
            customer: {
              full_name: 'Move Guest A',
              email: 'move.a@example.com',
              mobile: '09170009919',
            },
            sourceNote: 'Move test A',
            guestNote: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      assertOk(
        await source.createManualBooking(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            checkIn: '2027-03-15',
            checkOut: '2027-03-17',
            adults: 2,
            children: 0,
            customer: {
              full_name: 'Move Guest B',
              email: 'move.b@example.com',
              mobile: '09170009920',
            },
            sourceNote: 'Blocking stay B',
            guestNote: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      const beforeDetail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: bookingA.id },
          ULAP_OWNER_SESSION,
        ),
      );

      // Moving onto taken dates refuses with dates_taken
      const takenErr = assertErr(
        await source.changeBookingDates(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            bookingId: bookingA.id,
            checkIn: '2027-03-15',
            checkOut: '2027-03-17',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(takenErr.code).toBe('dates_taken');

      // Moving onto free dates updates the SAME occupancy row in place and recalculates nights/lines
      const moved = assertOk(
        await source.changeBookingDates(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            bookingId: bookingA.id,
            checkIn: '2027-03-20',
            checkOut: '2027-03-23',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(moved.nights).toBe(3);

      const afterDetail = assertOk(
        await source.getBooking(
          { accountId: DEMO_IDS.ulapSuites.account, bookingId: bookingA.id },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(afterDetail.occupancy.id).toBe(beforeDetail.occupancy.id);
      expect(afterDetail.occupancy.during).toEqual({ start: '2027-03-20', end: '2027-03-23' });
      expect(afterDetail.lines.filter((l) => l.kind === 'night')).toHaveLength(3);

      // Old dates (2027-03-10 -> 2027-03-12) are free again
      const oldDatesCal = assertOk(
        await source.getUnitCalendar(
          { unitId: DEMO_IDS.ulapSuites.units.studioFog },
          GUEST_SESSION,
        ),
      );
      expect(oldDatesCal.taken_ranges).not.toContainEqual({
        start: '2027-03-10',
        end: '2027-03-12',
      });
    });
  });

  runOwnerP4ContractTests(makeSource);
}
