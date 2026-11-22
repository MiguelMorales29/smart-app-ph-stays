import {
  DEMO_IDS,
  MAX_UPLOAD_SIZE_BYTES,
  centavos,
  readErrorDetails,
  words,
  type AppError,
  type Result,
} from '@smartapp/core';
import { describe, expect, it } from 'vitest';

import { DEMO_OWNER_PASSWORD, DEMO_PASSWORD_CODE } from '../mocks/owner-handlers.js';
import type { Session } from '../source.js';
import type { MakeContractSource } from './index.js';

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
const PENDING_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.people.extraAccounts.pendingAccount,
  profileId: DEMO_IDS.people.owners.pending,
};
const PAUSED_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.people.extraAccounts.pausedAccount,
  profileId: DEMO_IDS.people.owners.paused,
};
const TITA_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.titaLornaDorm.account,
  profileId: DEMO_IDS.people.owners.titaLornaDorm,
};
const ILAW_OWNER_SESSION: Session = {
  role: 'owner',
  accountId: DEMO_IDS.ilawResidences.account,
  profileId: DEMO_IDS.people.owners.ilawResidences,
};
const SUPER_ADMIN_SESSION: Session = {
  role: 'super_admin',
  profileId: DEMO_IDS.platform.superAdminProfile,
};

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

export function runOwnerP4ContractTests(makeSource: MakeContractSource): void {
  describe('Phase 4 owner contract (D45–D60)', () => {
    it('20. bad input returns not_allowed with invalid_input and fields, never throws (D45)', async () => {
      const { source } = await makeSource();

      const badSignIn = assertErr(
        await source.signIn({ email: 'not-an-email', password: '' }, GUEST_SESSION),
      );
      expect(badSignIn.code).toBe('not_allowed');
      const details = readErrorDetails(badSignIn);
      expect(details.reason).toBe('invalid_input');
      expect(details.fields['email']).toBeTruthy();
      expect(details.fields['password']).toBeTruthy();
    });

    it('21. applyAsOwner (password and Google), email_taken, and idempotent replay', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p4-apply');

      const pwKey = nextKey();
      const pwInput = {
        method: 'password' as const,
        idempotencyKey: pwKey,
        fullName: 'Elena Cruz',
        email: 'elena.cruz@example.com',
        mobile: '0917 555 0101',
        password: 'secure-password-123',
        rents: 'staycation' as const,
        unitCountBand: '2_5' as const,
        propertyCountBand: '1' as const,
        city: 'Tagaytay City',
        facebookPage: 'https://facebook.com/elenastays',
      };
      const applied = assertOk(await source.applyAsOwner(pwInput, GUEST_SESSION));
      expect(applied.account.status).toBe('pending');
      expect(applied.account.contact_mobile).toBe('+639175550101');
      expect(applied.application.sign_up_method).toBe('password');

      // Idempotent replay gives same result
      const replayed = assertOk(await source.applyAsOwner(pwInput, GUEST_SESSION));
      expect(replayed.account.id).toBe(applied.account.id);

      // Duplicate email returns email_taken
      const dupErr = assertErr(
        await source.applyAsOwner({ ...pwInput, idempotencyKey: nextKey() }, GUEST_SESSION),
      );
      expect(dupErr.code).toBe('not_allowed');
      expect(readErrorDetails(dupErr).reason).toBe('email_taken');

      // Google application with demo credential
      const gApplied = assertOk(
        await source.applyAsOwner(
          {
            method: 'google',
            idempotencyKey: nextKey(),
            fullName: 'Marco Dizon',
            credential: 'demo-google:marco.dizon@example.com:Marco Dizon',
            mobile: '9175550102',
            rents: 'bed_spaces',
            unitCountBand: '21_plus',
            propertyCountBand: '2_3',
            city: 'Manila',
            facebookPage: null,
          },
          GUEST_SESSION,
        ),
      );
      expect(gApplied.account.contact_email).toBe('marco.dizon@example.com');
      expect(gApplied.application.sign_up_method).toBe('google');
    });

    it('22. signIn generic error, 5-failure 15-minute lockout, signInWithGoogle, requestPasswordCode, resetPassword (5 wrong codes expire)', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('p4-auth');

      const unknownErr = assertErr(
        await source.signIn(
          { email: 'nobody@example.com', password: DEMO_OWNER_PASSWORD },
          GUEST_SESSION,
        ),
      );
      const wrongPwErr = assertErr(
        await source.signIn(
          { email: 'owner.ulap-suites@demo.invalid', password: 'wrong-password' },
          GUEST_SESSION,
        ),
      );
      expect(unknownErr.code).toBe('not_allowed');
      expect(wrongPwErr.code).toBe('not_allowed');
      expect(wrongPwErr.message).toBe(unknownErr.message);

      // 4 more failed attempts -> 5 total -> locked for 15 minutes
      for (let i = 0; i < 4; i += 1) {
        assertErr(
          await source.signIn(
            { email: 'owner.ulap-suites@demo.invalid', password: 'wrong-password' },
            GUEST_SESSION,
          ),
        );
      }

      // Even correct password fails during lockout
      const lockedErr = assertErr(
        await source.signIn(
          { email: 'owner.ulap-suites@demo.invalid', password: DEMO_OWNER_PASSWORD },
          GUEST_SESSION,
        ),
      );
      expect(lockedErr.code).toBe('not_allowed');

      // After 16 minutes, lockout lifts and sign-in succeeds
      await advanceMinutes(16);
      const signedIn = assertOk(
        await source.signIn(
          { email: 'owner.ulap-suites@demo.invalid', password: DEMO_OWNER_PASSWORD },
          GUEST_SESSION,
        ),
      );
      expect(signedIn.session.accountId).toBe(DEMO_IDS.ulapSuites.account);

      // Google sign-in: known demo owner signs in, unknown returns needs_application
      const gSignedIn = assertOk(
        await source.signInWithGoogle(
          { credential: 'demo-google:owner.ulap-suites@demo.invalid:Mara Villanueva' },
          GUEST_SESSION,
        ),
      );
      expect(gSignedIn.kind).toBe('signed_in');

      const gNeedsApp = assertOk(
        await source.signInWithGoogle(
          { credential: 'demo-google:brand.new@example.com:Brand New Owner' },
          GUEST_SESSION,
        ),
      );
      expect(gNeedsApp).toEqual({
        kind: 'needs_application',
        email: 'brand.new@example.com',
        fullName: 'Brand New Owner',
      });

      // requestPasswordCode always succeeds (known and unknown) and is idempotent
      const reqKey = nextKey();
      const req1 = assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: reqKey, email: 'owner.ulap-suites@demo.invalid' },
          GUEST_SESSION,
        ),
      );
      const req1Replay = assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: reqKey, email: 'owner.ulap-suites@demo.invalid' },
          GUEST_SESSION,
        ),
      );
      expect(req1).toEqual({ queued: true });
      expect(req1Replay).toEqual(req1);

      const reqUnknown = assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: nextKey(), email: 'does.not.exist@example.com' },
          GUEST_SESSION,
        ),
      );
      expect(reqUnknown).toEqual({ queued: true });

      // 5 wrong codes expire the active code
      for (let i = 0; i < 5; i += 1) {
        const badCodeErr = assertErr(
          await source.resetPassword(
            {
              idempotencyKey: nextKey(),
              email: 'owner.ulap-suites@demo.invalid',
              code: '000000',
              newPassword: 'new-password-456',
            },
            GUEST_SESSION,
          ),
        );
        expect(badCodeErr.code).toBe('not_allowed');
      }

      // Now even the right code fails because the code expired after 5 wrong tries
      const expiredAfter5 = assertErr(
        await source.resetPassword(
          {
            idempotencyKey: nextKey(),
            email: 'owner.ulap-suites@demo.invalid',
            code: DEMO_PASSWORD_CODE,
            newPassword: 'new-password-456',
          },
          GUEST_SESSION,
        ),
      );
      expect(expiredAfter5.code).toBe('not_allowed');

      // Request a fresh code and reset successfully + idempotent replay
      assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: nextKey(), email: 'owner.ulap-suites@demo.invalid' },
          GUEST_SESSION,
        ),
      );
      const resetKey = nextKey();
      const resetOk = assertOk(
        await source.resetPassword(
          {
            idempotencyKey: resetKey,
            email: 'owner.ulap-suites@demo.invalid',
            code: DEMO_PASSWORD_CODE,
            newPassword: 'new-password-456',
          },
          GUEST_SESSION,
        ),
      );
      expect(resetOk).toEqual({ reset: true });
      const resetReplay = assertOk(
        await source.resetPassword(
          {
            idempotencyKey: resetKey,
            email: 'owner.ulap-suites@demo.invalid',
            code: DEMO_PASSWORD_CODE,
            newPassword: 'new-password-456',
          },
          GUEST_SESSION,
        ),
      );
      expect(resetReplay).toEqual(resetOk);

      assertOk(
        await source.signIn(
          { email: 'owner.ulap-suites@demo.invalid', password: 'new-password-456' },
          GUEST_SESSION,
        ),
      );
    });

    it('22b. requestSignupCode is repeat-safe and verifySignupCode accepts only the code, 5 wrong tries end it', async () => {
      const { source } = await makeSource();
      const plans = assertOk(await source.listPlans({}, GUEST_SESSION));
      expect(plans.length).toBeGreaterThan(0);
      expect(plans.every((plan) => plan.price_centavos > 0)).toBe(true);
      const nextKey = createKeyMaker('p4-signup-code');
      const key = nextKey();
      const sent = assertOk(
        await source.requestSignupCode(
          { idempotencyKey: key, email: 'new.owner@example.com' },
          GUEST_SESSION,
        ),
      );
      expect(sent).toEqual({ queued: true });
      expect(
        assertOk(
          await source.requestSignupCode(
            { idempotencyKey: key, email: 'new.owner@example.com' },
            GUEST_SESSION,
          ),
        ),
      ).toEqual(sent);

      const badFormat = assertErr(
        await source.verifySignupCode(
          { email: 'new.owner@example.com', code: '12' },
          GUEST_SESSION,
        ),
      );
      expect(badFormat.code).toBe('not_allowed');

      for (let i = 0; i < 4; i += 1) {
        assertErr(
          await source.verifySignupCode(
            { email: 'new.owner@example.com', code: '000000' },
            GUEST_SESSION,
          ),
        );
      }
      expect(
        assertOk(
          await source.verifySignupCode(
            { email: 'new.owner@example.com', code: DEMO_PASSWORD_CODE },
            GUEST_SESSION,
          ),
        ),
      ).toEqual({ verified: true });

      assertOk(
        await source.requestSignupCode(
          { idempotencyKey: nextKey(), email: 'other@example.com' },
          GUEST_SESSION,
        ),
      );
      for (let i = 0; i < 5; i += 1) {
        assertErr(
          await source.verifySignupCode(
            { email: 'other@example.com', code: '000000' },
            GUEST_SESSION,
          ),
        );
      }
      assertErr(
        await source.verifySignupCode(
          { email: 'other@example.com', code: DEMO_PASSWORD_CODE },
          GUEST_SESSION,
        ),
      );
    });

    it('23. getMyAccount, getSetupChecklist, pending owner can save but cannot publish, getOwnerProperty, saveProperty, checkSlug, changeSlug', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('p4-prop');

      const myAccount = assertOk(
        await source.getMyAccount({ accountId: DEMO_IDS.ulapSuites.account }, ULAP_OWNER_SESSION),
      );
      expect(myAccount.account.id).toBe(DEMO_IDS.ulapSuites.account);
      expect(myAccount.application).not.toBeNull();
      expect(myAccount.properties.length).toBeGreaterThanOrEqual(1);

      // Cross-account isolation
      expect(
        assertErr(
          await source.getMyAccount(
            { accountId: DEMO_IDS.ulapSuites.account },
            BAHAY_OWNER_SESSION,
          ),
        ).code,
      ).toBe('not_allowed');

      // Pending owner checklist has can_publish=false and publish step waiting
      const pendingChecklist = assertOk(
        await source.getSetupChecklist(
          { accountId: DEMO_IDS.people.extraAccounts.pendingAccount, propertyId: null },
          PENDING_OWNER_SESSION,
        ),
      );
      expect(pendingChecklist.can_publish).toBe(false);
      expect(pendingChecklist.account_status).toBe('pending');
      expect(pendingChecklist.items.find((i) => i.key === 'publish')?.status).toBe('waiting');

      // Pending owner can save a property (create), then cannot publish
      const createPropKey = nextKey();
      const pendingPropInput = {
        idempotencyKey: createPropKey,
        accountId: DEMO_IDS.people.extraAccounts.pendingAccount,
        propertyId: null,
        expectedUpdatedAt: null,
        name: 'Pinecrest Cabin Baguio',
        slug: 'pinecrest-cabin',
        tagline: 'Cozy pine retreat',
        description: 'Quiet cabin in Baguio City.',
        addressLine: '12 Pine St',
        barangay: 'Camp 7',
        city: 'Baguio City',
        province: 'Benguet',
        region: 'CAR',
        latitude: 16.4023,
        longitude: 120.596,
        mapUrl: null,
        showExactLocation: false,
        contact: {
          phone: '+639170000105',
          messenger: null,
          facebook: null,
          instagram: null,
          tiktok: null,
          viber: null,
          whatsapp: null,
          google_review_url: null,
        },
        privacyContact: 'owner.pending@demo.invalid',
        logoFileId: null,
      };
      const createdProp = assertOk(
        await source.saveProperty(pendingPropInput, PENDING_OWNER_SESSION),
      );
      expect(createdProp.slug).toBe('pinecrest-cabin');
      const replayedProp = assertOk(
        await source.saveProperty(pendingPropInput, PENDING_OWNER_SESSION),
      );
      expect(replayedProp.id).toBe(createdProp.id);

      const loadedPendingProp = assertOk(
        await source.getOwnerProperty(
          { accountId: DEMO_IDS.people.extraAccounts.pendingAccount, propertyId: createdProp.id },
          PENDING_OWNER_SESSION,
        ),
      );
      expect(loadedPendingProp?.property.id).toBe(createdProp.id);

      // Pending owner publishing is refused (D47, D57)
      const pubPendingErr = assertErr(
        await source.publishPropertyPage(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.people.extraAccounts.pendingAccount,
            propertyId: createdProp.id,
            expectedVersion: 0,
          },
          PENDING_OWNER_SESSION,
        ),
      );
      expect(pubPendingErr.code).toBe('not_allowed');

      // checkSlug statuses + suggestions
      expect(
        assertOk(
          await source.checkSlug(
            {
              accountId: DEMO_IDS.ulapSuites.account,
              slug: 'fresh-tagaytay-stay',
              excludePropertyId: null,
            },
            ULAP_OWNER_SESSION,
          ),
        ).status,
      ).toBe('available');
      const takenCheck = assertOk(
        await source.checkSlug(
          {
            accountId: DEMO_IDS.ulapSuites.account,
            slug: 'bahay-batis',
            excludePropertyId: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(takenCheck.status).toBe('taken');
      expect(takenCheck.suggestions.length).toBeGreaterThan(0);

      const reservedCheck = assertOk(
        await source.checkSlug(
          { accountId: DEMO_IDS.ulapSuites.account, slug: 'admin', excludePropertyId: null },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(reservedCheck.status).toBe('reserved');
      expect(reservedCheck.suggestions.length).toBeGreaterThan(0);

      expect(
        assertOk(
          await source.checkSlug(
            { accountId: DEMO_IDS.ulapSuites.account, slug: 'A!', excludePropertyId: null },
            ULAP_OWNER_SESSION,
          ),
        ).status,
      ).toBe('invalid');

      // changeSlug errors: invalid_input, slug_reserved, slug_taken, and slug_change_limit after 3 changes
      expect(
        readErrorDetails(
          assertErr(
            await source.changeSlug(
              {
                idempotencyKey: nextKey(),
                accountId: DEMO_IDS.ulapSuites.account,
                propertyId: DEMO_IDS.ulapSuites.property,
                newSlug: 'NOPE!',
              },
              ULAP_OWNER_SESSION,
            ),
          ),
        ).reason,
      ).toBe('invalid_input');

      expect(
        readErrorDetails(
          assertErr(
            await source.changeSlug(
              {
                idempotencyKey: nextKey(),
                accountId: DEMO_IDS.ulapSuites.account,
                propertyId: DEMO_IDS.ulapSuites.property,
                newSlug: 'admin',
              },
              ULAP_OWNER_SESSION,
            ),
          ),
        ).reason,
      ).toBe('slug_reserved');

      expect(
        readErrorDetails(
          assertErr(
            await source.changeSlug(
              {
                idempotencyKey: nextKey(),
                accountId: DEMO_IDS.ulapSuites.account,
                propertyId: DEMO_IDS.ulapSuites.property,
                newSlug: 'bahay-batis',
              },
              ULAP_OWNER_SESSION,
            ),
          ),
        ).reason,
      ).toBe('slug_taken');

      for (const nextSlug of ['ulap-suites-1', 'ulap-suites-2', 'ulap-suites-3']) {
        assertOk(
          await source.changeSlug(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              propertyId: DEMO_IDS.ulapSuites.property,
              newSlug: nextSlug,
            },
            ULAP_OWNER_SESSION,
          ),
        );
      }

      const limitErr = assertErr(
        await source.changeSlug(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            newSlug: 'ulap-suites-4',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(limitErr).reason).toBe('slug_change_limit');

      // Stale updated_at on saveProperty returns changed_elsewhere
      await advanceMinutes(1);
      const stalePropErr = assertErr(
        await source.saveProperty(
          {
            ...pendingPropInput,
            idempotencyKey: nextKey(),
            propertyId: createdProp.id,
            expectedUpdatedAt: '2026-01-01T00:00:00+08:00',
          },
          PENDING_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(stalePropErr).reason).toBe('changed_elsewhere');

      // Cross-account saveProperty refused
      expect(
        assertErr(
          await source.saveProperty(
            { ...pendingPropInput, idempotencyKey: nextKey() },
            BAHAY_OWNER_SESSION,
          ),
        ).code,
      ).toBe('not_allowed');
    });

    it('24. units, bed spaces, unit_limit, setUnitStatus (unit_not_ready), reorderUnits, archiveUnit, listAmenities, saveUnitPrices', async () => {
      const { source, advanceMinutes } = await makeSource();
      const nextKey = createKeyMaker('p4-units');

      const amenities = assertOk(
        await source.listAmenities({ accountId: DEMO_IDS.ulapSuites.account }, ULAP_OWNER_SESSION),
      );
      expect(amenities.length).toBeGreaterThan(0);

      const initialUnits = assertOk(
        await source.listOwnerUnits(
          {
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            includeArchived: false,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(initialUnits).toHaveLength(2);

      // Save a new draft unit without photos or price
      const saveUnitKey = nextKey();
      const newUnitInput = {
        idempotencyKey: saveUnitKey,
        accountId: DEMO_IDS.ulapSuites.account,
        propertyId: DEMO_IDS.ulapSuites.property,
        unitId: null,
        expectedUpdatedAt: null,
        name: 'Cloud Loft',
        slug: 'cloud-loft',
        mode: 'short_stay' as const,
        unitType: 'entire_place' as const,
        groupLabel: null,
        description: 'Bright corner loft.',
        maxGuests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        floorAreaSqm: 28,
        arrivalInfo: null,
        amenityIds: [DEMO_IDS.amenities.wifi],
        stayTerms: null,
        leaseTerms: null,
      };
      const createdUnit = assertOk(await source.saveUnit(newUnitInput, ULAP_OWNER_SESSION));
      expect(createdUnit.unit.status).toBe('draft');
      const replayedUnit = assertOk(await source.saveUnit(newUnitInput, ULAP_OWNER_SESSION));
      expect(replayedUnit.unit.id).toBe(createdUnit.unit.id);

      const fetchedUnit = assertOk(
        await source.getOwnerUnit(
          { accountId: DEMO_IDS.ulapSuites.account, unitId: createdUnit.unit.id },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(fetchedUnit.unit.id).toBe(createdUnit.unit.id);

      // Listing unit without photos and price returns invalid_move + unit_not_ready + missing: ['photos', 'price']
      const notReadyBoth = assertErr(
        await source.setUnitStatus(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: createdUnit.unit.id,
            status: 'listed',
            expectedUpdatedAt: createdUnit.unit.updated_at,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(notReadyBoth.code).toBe('invalid_move');
      expect(readErrorDetails(notReadyBoth).reason).toBe('unit_not_ready');
      expect(readErrorDetails(notReadyBoth).missing).toEqual(['photos', 'price']);

      // Add prices via saveUnitPrices (base, weekday, override, fee in one save)
      const savePricesKey = nextKey();
      const pricesInput = {
        idempotencyKey: savePricesKey,
        accountId: DEMO_IDS.ulapSuites.account,
        unitId: createdUnit.unit.id,
        expectedUpdatedAt: null,
        baseNightlyCentavos: centavos(300_000),
        baseGuests: 2,
        minNights: 1,
        maxNights: 14,
        prepNights: 0,
        weeklyDiscountPercent: 10,
        monthlyDiscountPercent: 20,
        downPaymentPercent: 30,
        holdMinutes: 60,
        advanceNoticeDays: 0,
        bookingWindowDays: 365,
        weekdayRates: [
          { iso_weekday: 5, nightly_centavos: centavos(360_000) },
          { iso_weekday: 6, nightly_centavos: centavos(360_000) },
        ],
        rateOverrides: [
          {
            during: { start: '2026-12-24', end: '2026-12-27' },
            nightly_centavos: centavos(450_000),
            label: 'Christmas',
          },
        ],
        fees: [
          {
            code: 'cleaning' as const,
            label: 'Cleaning fee',
            amount_centavos: centavos(50_000),
            basis: 'per_stay' as const,
            is_active: true,
          },
        ],
      };
      const savedPrices = assertOk(await source.saveUnitPrices(pricesInput, ULAP_OWNER_SESSION));
      expect(savedPrices.weekdayRates).toHaveLength(2);
      expect(savedPrices.rateOverrides).toHaveLength(1);
      expect(savedPrices.fees).toHaveLength(1);
      const replayedPrices = assertOk(await source.saveUnitPrices(pricesInput, ULAP_OWNER_SESSION));
      expect(replayedPrices.stayTerms.unit_id).toBe(savedPrices.stayTerms.unit_id);

      // Still missing photos (< 3)
      const notReadyPhotos = assertErr(
        await source.setUnitStatus(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: createdUnit.unit.id,
            status: 'listed',
            expectedUpdatedAt: createdUnit.unit.updated_at,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(notReadyPhotos.code).toBe('invalid_move');
      expect(readErrorDetails(notReadyPhotos).missing).toEqual(['photos']);

      // Upload + confirm 3 photos and attach to unit
      const photoFileIds: string[] = [];
      for (let i = 1; i <= 3; i += 1) {
        const req = assertOk(
          await source.requestUpload(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              purpose: 'unit_photo',
              mime: 'image/webp',
              sizeBytes: 120_000,
              width: 1600,
              height: 1200,
              filename: `cloud-loft-${i}.webp`,
            },
            ULAP_OWNER_SESSION,
          ),
        );
        const confirmed = assertOk(
          await source.confirmUpload(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              fileId: req.file.id,
              width: 1600,
              height: 1200,
              usedByTable: 'listing_photos',
              usedById: createdUnit.unit.id,
            },
            ULAP_OWNER_SESSION,
          ),
        );
        photoFileIds.push(confirmed.id);
      }

      const savedPhotos = assertOk(
        await source.saveListingPhotos(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            unitId: createdUnit.unit.id,
            photos: photoFileIds.map((fileId, idx) => ({
              fileId,
              altText: `Cloud Loft view ${idx + 1}`,
            })),
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(savedPhotos).toHaveLength(3);

      // Now listing succeeds!
      await advanceMinutes(1);
      const listed = assertOk(
        await source.setUnitStatus(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: createdUnit.unit.id,
            status: 'listed',
            expectedUpdatedAt: createdUnit.unit.updated_at,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(listed.status).toBe('listed');

      // Reorder units
      const reordered = assertOk(
        await source.reorderUnits(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            unitIds: [
              createdUnit.unit.id,
              DEMO_IDS.ulapSuites.units.studioFog,
              DEMO_IDS.ulapSuites.units.taalView1br,
            ],
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(reordered[0]?.id).toBe(createdUnit.unit.id);

      // Ulap Suites currently has 3 active units (limit = 5). Bulk-creating 2 bed spaces reaches 5.
      const bedsKey = nextKey();
      const beds = assertOk(
        await source.createBedSpaces(
          {
            idempotencyKey: bedsKey,
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            groupLabel: 'Attic Room',
            namePrefix: 'Bed',
            count: 2,
            startNumber: 1,
            mode: 'long_term',
            bathrooms: 1,
            description: 'Shared attic room.',
            amenityIds: [DEMO_IDS.amenities.wifi],
            monthlyRentCentavos: centavos(450_000),
            baseNightlyCentavos: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(beds).toHaveLength(2);
      expect(beds[0]?.group_label).toBe('Attic Room');

      // Now at 5/5 active units -> creating 1 more returns unit_limit with { limit: 5, used: 5 }
      const limitErr = assertErr(
        await source.saveUnit(
          { ...newUnitInput, idempotencyKey: nextKey(), slug: 'sixth-unit', name: 'Sixth Unit' },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(limitErr.code).toBe('not_allowed');
      expect(readErrorDetails(limitErr)).toMatchObject({
        reason: 'unit_limit',
        limit: 5,
        used: 5,
      });

      // Archive Cloud Loft -> now 4/5 -> restore comes back unlisted
      const archived = assertOk(
        await source.archiveUnit(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: createdUnit.unit.id,
            archived: true,
            expectedUpdatedAt: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(archived.archived_at).not.toBeNull();

      const restored = assertOk(
        await source.archiveUnit(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: createdUnit.unit.id,
            archived: false,
            expectedUpdatedAt: archived.updated_at,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(restored.archived_at).toBeNull();
      expect(restored.status).toBe('unlisted');

      // Cross-account unit check
      expect(
        assertErr(
          await source.getOwnerUnit(
            { accountId: DEMO_IDS.ulapSuites.account, unitId: createdUnit.unit.id },
            BAHAY_OWNER_SESSION,
          ),
        ).code,
      ).toBe('not_allowed');
    });

    it('25. uploads (not_image, file_too_large, storage_full) and listing photo limits', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p4-upload');

      // Non-image rejected
      const notImageErr = assertErr(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            purpose: 'unit_photo',
            mime: 'application/pdf',
            sizeBytes: 50_000,
            width: null,
            height: null,
            filename: 'brochure.pdf',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(notImageErr).reason).toBe('not_image');

      // > 15 MB rejected
      const tooLargeErr = assertErr(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            purpose: 'unit_photo',
            mime: 'image/jpeg',
            sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
            width: 4000,
            height: 3000,
            filename: 'huge.jpg',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(tooLargeErr).reason).toBe('file_too_large');

      // Storage full (paused QA account is at 100% of 10 MB plan)
      const fullErr = assertErr(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.people.extraAccounts.pausedAccount,
            purpose: 'property_photo',
            mime: 'image/jpeg',
            sizeBytes: 100_000,
            width: 1200,
            height: 900,
            filename: 'extra.jpg',
          },
          PAUSED_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(fullErr).reason).toBe('storage_full');

      // Confirming an already-confirmed file fails with invalid_move
      const req = assertOk(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            purpose: 'property_photo',
            mime: 'image/png',
            sizeBytes: 100_000,
            width: 1200,
            height: 900,
            filename: 'lobby.png',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      assertOk(
        await source.confirmUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            fileId: req.file.id,
            width: 1200,
            height: 900,
            usedByTable: 'listing_photos',
            usedById: DEMO_IDS.ulapSuites.property,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(
        assertErr(
          await source.confirmUpload(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              fileId: req.file.id,
              width: 1200,
              height: 900,
              usedByTable: 'listing_photos',
              usedById: DEMO_IDS.ulapSuites.property,
            },
            ULAP_OWNER_SESSION,
          ),
        ).code,
      ).toBe('invalid_move');

      // More than 10 property photos rejected
      const tooManyPropPhotos = assertErr(
        await source.saveListingPhotos(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            unitId: null,
            photos: Array.from({ length: 11 }, (_, idx) => ({
              fileId: req.file.id,
              altText: `Photo ${idx + 1}`,
            })),
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(tooManyPropPhotos).reason).toBe('invalid_input');
    });

    it('26. payment accounts: password gate (wrong_password), bank_limit (max 3), last_payment_method, reorder', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p4-pay');

      const existing = assertOk(
        await source.listPaymentAccounts(
          { accountId: DEMO_IDS.ulapSuites.account },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(existing).toHaveLength(2); // 1 gcash, 1 bpi bank

      // Wrong password rejected with wrong_password
      const wrongPwErr = assertErr(
        await source.savePaymentAccount(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountId: null,
            expectedUpdatedAt: null,
            password: 'not-my-password',
            method: 'maya',
            bank: null,
            bankName: null,
            accountName: 'Mara Villanueva',
            accountNumber: '0917 000 0199',
            qrFileId: null,
            instructions: null,
            isActive: true,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(wrongPwErr).reason).toBe('wrong_password');

      // Add 2 more banks (total 3 banks) -> succeeds; 4th bank returns bank_limit
      for (const bank of ['bdo', 'unionbank'] as const) {
        assertOk(
          await source.savePaymentAccount(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              paymentAccountId: null,
              expectedUpdatedAt: null,
              password: DEMO_OWNER_PASSWORD,
              method: 'bank',
              bank,
              bankName: null,
              accountName: 'Mara Villanueva',
              accountNumber: '0012-3456-7890',
              qrFileId: null,
              instructions: null,
              isActive: false,
            },
            ULAP_OWNER_SESSION,
          ),
        );
      }

      const bankLimitErr = assertErr(
        await source.savePaymentAccount(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountId: null,
            expectedUpdatedAt: null,
            password: DEMO_OWNER_PASSWORD,
            method: 'bank',
            bank: 'metrobank',
            bankName: null,
            accountName: 'Mara Villanueva',
            accountNumber: '0012-3456-7890',
            qrFileId: null,
            instructions: null,
            isActive: false,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(bankLimitErr).reason).toBe('bank_limit');

      // Turn off one active account -> OK; turning off the last active account -> last_payment_method
      const firstId = existing[0]?.id ?? '';
      const secondId = existing[1]?.id ?? '';
      assertOk(
        await source.setPaymentAccountActive(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountId: firstId,
            isActive: false,
            password: DEMO_OWNER_PASSWORD,
            expectedUpdatedAt: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );

      const lastMethodErr = assertErr(
        await source.setPaymentAccountActive(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountId: secondId,
            isActive: false,
            password: DEMO_OWNER_PASSWORD,
            expectedUpdatedAt: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(lastMethodErr).reason).toBe('last_payment_method');

      // Reorder payment accounts
      const reordered = assertOk(
        await source.reorderPaymentAccounts(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountIds: [secondId, firstId],
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(reordered[0]?.id).toBe(secondId);

      // Cross-account refused
      expect(
        assertErr(
          await source.listPaymentAccounts(
            { accountId: DEMO_IDS.ulapSuites.account },
            BAHAY_OWNER_SESSION,
          ),
        ).code,
      ).toBe('not_allowed');
    });

    it('27. settings: savePolicies, saveHours, updateProfile, changePassword (5 wrong codes), signOutEverywhere, requestAccountDeletion', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p4-settings');

      const policies = assertOk(
        await source.savePolicies(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedUpdatedAt: null,
            checkinTime: '14:00',
            checkoutTime: '12:00',
            cancellationPreset: 'firm',
            cancellationNote: null,
            rebookMinDays: 7,
            rebookWithinMonths: 6,
            guestIdsRequired: true,
            guestListDueHours: 24,
            arrivalInfo: 'Updated lobby instructions.',
            privacyContact: 'owner.ulap-suites@demo.invalid',
            houseRules: ['No smoking indoors', 'Quiet hours start at 10 PM'],
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(policies.property.cancellation_preset).toBe('firm');
      expect(policies.houseRules).toHaveLength(2);

      // Overlapping hours rejected
      const overlapErr = assertErr(
        await source.saveHours(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedUpdatedAt: policies.property.updated_at,
            replyHours: {
              mon: [
                { start: '09:00', end: '14:00' },
                { start: '13:00', end: '18:00' },
              ],
              tue: [],
              wed: [],
              thu: [],
              fri: [],
              sat: [],
              sun: [],
              closed_dates: [],
            },
            viewingHours: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(readErrorDetails(overlapErr).reason).toBe('invalid_input');

      // Valid hours succeed
      const savedHours = assertOk(
        await source.saveHours(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedUpdatedAt: policies.property.updated_at,
            replyHours: {
              mon: [{ start: '08:00', end: '20:00' }],
              tue: [],
              wed: [],
              thu: [],
              fri: [],
              sat: [],
              sun: [],
              closed_dates: ['2026-12-25'],
            },
            viewingHours: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(savedHours.reply_hours?.closed_dates).toEqual(['2026-12-25']);

      // updateProfile with DiceBear preset avatar
      const updatedProfile = assertOk(
        await source.updateProfile(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            expectedUpdatedAt: null,
            fullName: 'Mara V. Santos',
            avatar: { kind: 'preset', preset_id: 'notionists-mara' },
            notifyEmail: 'owner.ulap-suites@demo.invalid',
            notify: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(updatedProfile.profile.full_name).toBe('Mara V. Santos');

      // setProfilePicture: face, custom, and uploaded profile photo
      const withFace = assertOk(
        await source.setProfilePicture(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            expectedUpdatedAt: updatedProfile.profile.updated_at,
            avatar: { kind: 'face', style: 'soft', face: 4, theme: 'mint' },
            photoFileId: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(withFace.profile.avatar).toEqual({
        kind: 'face',
        style: 'soft',
        face: 4,
        theme: 'mint',
      });
      expect(withFace.profile.photo_file_id).toBeNull();
      expect(withFace.photoUrl).toBeNull();

      const photoSlot = assertOk(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            purpose: 'profile_photo',
            mime: 'image/webp',
            sizeBytes: 18_432,
            width: 256,
            height: 256,
            filename: 'profile.webp',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      assertOk(
        await source.confirmUpload(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            fileId: photoSlot.file.id,
            width: 256,
            height: 256,
            usedByTable: 'profiles',
            usedById: withFace.profile.id,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      const withPhoto = assertOk(
        await source.setProfilePicture(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            expectedUpdatedAt: withFace.profile.updated_at,
            avatar: { kind: 'photo', file_id: photoSlot.file.id },
            photoFileId: photoSlot.file.id,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(withPhoto.profile.photo_file_id).toBe(photoSlot.file.id);
      expect(withPhoto.photoUrl).toContain(photoSlot.file.id);

      // changePassword: 5 wrong codes expire the code, then fresh code succeeds
      assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: nextKey(), email: 'owner.ulap-suites@demo.invalid' },
          GUEST_SESSION,
        ),
      );
      for (let i = 0; i < 5; i += 1) {
        assertErr(
          await source.changePassword(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              code: '999999',
              newPassword: 'another-strong-password',
            },
            ULAP_OWNER_SESSION,
          ),
        );
      }
      assertErr(
        await source.changePassword(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            code: DEMO_PASSWORD_CODE,
            newPassword: 'another-strong-password',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      assertOk(
        await source.requestPasswordCode(
          { idempotencyKey: nextKey(), email: 'owner.ulap-suites@demo.invalid' },
          GUEST_SESSION,
        ),
      );
      const changed = assertOk(
        await source.changePassword(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            code: DEMO_PASSWORD_CODE,
            newPassword: 'another-strong-password',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(changed).toEqual({ changed: true });

      // signOutEverywhere
      const signedOut = assertOk(
        await source.signOutEverywhere(
          { idempotencyKey: nextKey(), accountId: DEMO_IDS.ulapSuites.account },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(signedOut.signedOutAt).toBeTruthy();

      // requestAccountDeletion: request (7 days), duplicate refused, cancel, duplicate cancel refused
      const delReq = assertOk(
        await source.requestAccountDeletion(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            action: 'request',
            reason: 'Closing the condo.',
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(delReq.status).toBe('scheduled');
      expect(delReq.scheduled_for).not.toBeNull();
      const diffDays =
        (Date.parse(delReq.scheduled_for ?? '') - Date.parse(delReq.requested_at ?? '')) /
        (24 * 3_600_000);
      expect(diffDays).toBe(7);

      expect(
        assertErr(
          await source.requestAccountDeletion(
            {
              idempotencyKey: nextKey(),
              accountId: DEMO_IDS.ulapSuites.account,
              action: 'request',
              reason: null,
            },
            ULAP_OWNER_SESSION,
          ),
        ).code,
      ).toBe('invalid_move');

      const delCancel = assertOk(
        await source.requestAccountDeletion(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            action: 'cancel',
            reason: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(delCancel.status).toBe('none');

      // Cross-account settings refused
      expect(
        assertErr(
          await source.signOutEverywhere(
            { idempotencyKey: nextKey(), accountId: DEMO_IDS.ulapSuites.account },
            BAHAY_OWNER_SESSION,
          ),
        ).code,
      ).toBe('not_allowed');
    });

    it('28. P5-1 public pages: getProperty (host, trust, page_media, price_from, lease_terms, paused contact-only) and getPublicUnit', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p5-public');

      // 1. Short-stay property (Ulap Suites) includes host, trust, page_media, and price_from on unit cards
      const ulapProp = assertOk(await source.getProperty({ slug: 'ulap-suites' }, GUEST_SESSION));
      expect(ulapProp.host.display_name).toBe('Marco Villanueva');
      expect(ulapProp.host.languages).toEqual(['Tagalog', 'English']);
      expect(ulapProp.host.hosting_since).toBeGreaterThanOrEqual(2020);
      expect(ulapProp.trust.is_verified).toBe(true);
      expect(ulapProp.trust.payment_accounts_changed_recently).toBe(false);
      expect(ulapProp.page_media.logo?.url).toContain('/demo-media/');
      expect(ulapProp.page_media.hero_cover?.url).toContain('/demo-media/');
      expect(ulapProp.page_media.hero_photos.length).toBeGreaterThanOrEqual(2);
      expect(ulapProp.page_media.banners).toHaveLength(3);
      expect(ulapProp.page?.published?.look.announcement?.text).toBeTruthy();
      expect(ulapProp.page?.published?.faq).toHaveLength(6);
      expect(ulapProp.units.every((u) => u.price_from !== null && u.price_from > 0)).toBe(true);

      // 2. Long-term property (Tita Lorna's Dorm) has no banners/announcement/faq in published and has lease_terms on unit cards
      const titaProp = assertOk(
        await source.getProperty({ slug: 'tita-lorna-dorm' }, GUEST_SESSION),
      );
      expect(titaProp.page?.published?.look.banners).toEqual([]);
      expect(titaProp.page?.published?.look.announcement).toBeNull();
      expect(titaProp.page?.published?.faq).toEqual([]);
      expect(titaProp.units.length).toBeGreaterThan(0);
      expect(titaProp.units.every((u) => u.lease_terms !== null && u.price_from === null)).toBe(
        true,
      );

      // 3. Paused account (Casa Soriano) returns contact details only (PA-09)
      const pausedProp = assertOk(
        await source.getProperty({ slug: 'casa-soriano-paused' }, GUEST_SESSION),
      );
      expect(pausedProp.account.is_paused).toBe(true);
      expect(pausedProp.property.contact.phone).toBeTruthy();
      expect(pausedProp.units).toEqual([]);
      expect(pausedProp.photos).toEqual([]);
      expect(pausedProp.amenities).toEqual([]);
      expect(pausedProp.house_rules).toEqual([]);
      expect(pausedProp.reviews).toEqual({
        average_stars: null,
        review_count: 0,
        recent_reviews: [],
      });

      // 4. getPublicUnit for short-stay unit (studio-fog)
      const studioUnit = assertOk(
        await source.getPublicUnit({ slug: 'ulap-suites', unitSlug: 'studio-fog' }, GUEST_SESSION),
      );
      expect(studioUnit.unit.slug).toBe('studio-fog');
      expect(studioUnit.photos.length).toBeGreaterThanOrEqual(3);
      expect(studioUnit.photos[0]?.url).toContain('/demo-media/');
      expect(studioUnit.amenities.length).toBeGreaterThan(0);
      expect(studioUnit.house_rules.length).toBeGreaterThan(0);
      expect(studioUnit.price_from).toBe(centavos(260_000));
      expect(studioUnit.lease_terms).toBeNull();
      expect(studioUnit.property.cancellation_copy.label.length).toBeGreaterThan(0);
      expect(studioUnit.property.cancellation_copy.summary.length).toBeGreaterThan(0);
      expect(studioUnit.property.checkin_time).toBe('14:00');
      expect(studioUnit.property.checkout_time).toBe('12:00');
      expect(studioUnit.stay_terms?.min_nights).toBe(2);
      expect(studioUnit.page.published.look.brandColor).toBeTruthy();

      // 5. getPublicUnit for long-term unit (room-2a-bed-1)
      const bedUnit = assertOk(
        await source.getPublicUnit(
          { slug: 'tita-lorna-dorm', unitSlug: 'room-2a-bed-1' },
          GUEST_SESSION,
        ),
      );
      expect(bedUnit.unit.mode).toBe('long_term');
      expect(bedUnit.price_from).toBeNull();
      expect(bedUnit.lease_terms?.monthly_rent_centavos).toBeGreaterThan(0);
      expect(bedUnit.lease_terms?.inclusions?.length).toBeGreaterThan(0);

      // 6. getPublicUnit returns not_found for unknown unit, paused property, unpublished property, hidden/draft/archived unit
      expect(
        assertErr(
          await source.getPublicUnit(
            { slug: 'ulap-suites', unitSlug: 'no-such-unit' },
            GUEST_SESSION,
          ),
        ).code,
      ).toBe('not_found');
      expect(
        assertErr(
          await source.getPublicUnit(
            { slug: 'casa-soriano-paused', unitSlug: 'garden-casita' },
            GUEST_SESSION,
          ),
        ).code,
      ).toBe('not_found');
      expect(
        assertErr(
          await source.getPublicUnit(
            { slug: 'patio-verde-unpublished', unitSlug: 'patio-studio' },
            GUEST_SESSION,
          ),
        ).code,
      ).toBe('not_found');

      // Hide studio-fog -> getPublicUnit returns not_found
      assertOk(
        await source.setUnitStatus(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            unitId: DEMO_IDS.ulapSuites.units.studioFog,
            status: 'unlisted',
            expectedUpdatedAt: null,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(
        assertErr(
          await source.getPublicUnit(
            { slug: 'ulap-suites', unitSlug: 'studio-fog' },
            GUEST_SESSION,
          ),
        ).code,
      ).toBe('not_found');

      // Editing a payment account flips trust.payment_accounts_changed_recently to true
      assertOk(
        await source.savePaymentAccount(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            paymentAccountId: DEMO_IDS.ulapSuites.paymentAccounts.gcash,
            expectedUpdatedAt: null,
            password: DEMO_OWNER_PASSWORD,
            method: 'gcash',
            bank: null,
            bankName: null,
            accountName: 'Marco Villanueva',
            accountNumber: '0917 801 1101',
            qrFileId: null,
            instructions: 'Updated GCash note.',
            isActive: true,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      const ulapAfterPayEdit = assertOk(
        await source.getProperty({ slug: 'ulap-suites' }, GUEST_SESSION),
      );
      expect(ulapAfterPayEdit.trust.payment_accounts_changed_recently).toBe(true);
    });

    it('29. P5-1 page editor: getPageEditor, getPageChanges, savePageDraft (with conflict), discardPageDraft, publishPropertyPage (with blockers)', async () => {
      const { source } = await makeSource();
      const nextKey = createKeyMaker('p5-editor');

      // 1. All 5 demo properties with pages start with 1-3 draft differences (draft_rev = 2)
      for (const [accountId, session] of [
        [DEMO_IDS.ulapSuites.account, ULAP_OWNER_SESSION],
        [DEMO_IDS.bahayBatis.account, BAHAY_OWNER_SESSION],
        [DEMO_IDS.ilawResidences.account, ILAW_OWNER_SESSION],
        [DEMO_IDS.titaLornaDorm.account, TITA_OWNER_SESSION],
        [DEMO_IDS.people.extraAccounts.pausedAccount, PAUSED_OWNER_SESSION],
      ] as const) {
        const changes = assertOk(
          await source.getPageChanges({ accountId, propertyId: null }, session),
        );
        expect(changes.length).toBeGreaterThanOrEqual(1);
        expect(changes.length).toBeLessThanOrEqual(3);
      }

      // 2. getPageEditor returns draft, published, draft_rev, version, and preview built from draft
      const editor = assertOk(
        await source.getPageEditor(
          { accountId: DEMO_IDS.ulapSuites.account, propertyId: null },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(editor.property_id).toBe(DEMO_IDS.ulapSuites.property);
      expect(editor.draft_rev).toBe(2);
      expect(editor.version).toBe(1);
      expect(editor.preview.property.tagline).toBe(editor.draft.tagline);
      expect(editor.draft.tagline).not.toBe(editor.published?.tagline);

      // 3. savePageDraft increments draft_rev, is idempotent, and rejects stale expectedDraftRev with invalid_move + changed_elsewhere + newer draft in details
      const editedDraft = {
        ...editor.draft,
        tagline: 'Fresh ridge mornings in Tagaytay.',
      };
      const saveKey = nextKey();
      const saved1 = assertOk(
        await source.savePageDraft(
          {
            idempotencyKey: saveKey,
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedDraftRev: 2,
            draft: editedDraft,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(saved1.draft_rev).toBe(3);

      // Idempotent replay
      const replayedSave = assertOk(
        await source.savePageDraft(
          {
            idempotencyKey: saveKey,
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedDraftRev: 2,
            draft: editedDraft,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(replayedSave.draft_rev).toBe(3);

      // Stale expectedDraftRev -> invalid_move + changed_elsewhere + { draft, draft_rev, draft_updated_at }
      const conflictErr = assertErr(
        await source.savePageDraft(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedDraftRev: 2,
            draft: { ...editedDraft, tagline: 'Stale tab edit' },
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(conflictErr.code).toBe('invalid_move');
      expect(conflictErr.message).toBe(words.errorReasons.changed_elsewhere);
      expect(words.editor.draftConflict).toBe(
        'Someone saved a newer version. Load the newer one or keep yours.',
      );
      const conflictDetails = readErrorDetails(conflictErr);
      expect(conflictDetails.reason).toBe('changed_elsewhere');
      expect(conflictDetails.draft_rev).toBe(3);
      expect(conflictDetails.draft).toMatchObject({
        tagline: 'Fresh ridge mornings in Tagaytay.',
      });
      expect(conflictDetails.draft_updated_at).toBe(saved1.draft_updated_at);

      // 4. discardPageDraft copies published back to draft and increments draft_rev -> getPageChanges becomes []
      const discarded = assertOk(
        await source.discardPageDraft(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(discarded.draft_rev).toBe(4);
      expect(discarded.draft).toEqual(editor.published);

      const changesAfterDiscard = assertOk(
        await source.getPageChanges(
          { accountId: DEMO_IDS.ulapSuites.account, propertyId: DEMO_IDS.ulapSuites.property },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(changesAfterDiscard).toEqual([]);

      // 5. Cover photo fallback on Ulap Suites: when draft.hero.cover and seo.sharePictureFile are null,
      // page_media.hero_cover and share_picture fall back to the first property photo, and publish succeeds.
      const noCoverDraft = {
        ...discarded.draft,
        hero: { cover: null, photos: [] },
        seo: { ...discarded.draft.seo, sharePictureFile: null },
      };
      const savedNoCover = assertOk(
        await source.savePageDraft(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedDraftRev: discarded.draft_rev,
            draft: noCoverDraft,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      const editorAfterNoCover = assertOk(
        await source.getPageEditor(
          { accountId: DEMO_IDS.ulapSuites.account, propertyId: DEMO_IDS.ulapSuites.property },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(editorAfterNoCover.preview.page_media.hero_cover?.url).toContain('/demo-media/');
      expect(editorAfterNoCover.preview.page_media.share_picture?.file_id).toBe(
        editorAfterNoCover.preview.page_media.hero_cover?.file_id,
      );

      // 6. Restore cover photo + new tagline, then publishPropertyPage succeeds and increments version
      assertOk(
        await source.savePageDraft(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedDraftRev: savedNoCover.draft_rev,
            draft: editedDraft,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      const published = assertOk(
        await source.publishPropertyPage(
          {
            idempotencyKey: nextKey(),
            accountId: DEMO_IDS.ulapSuites.account,
            propertyId: DEMO_IDS.ulapSuites.property,
            expectedVersion: editor.version,
          },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(published.version).toBe(editor.version + 1);
      expect(published.published?.tagline).toBe('Fresh ridge mornings in Tagaytay.');

      const changesAfterPublish = assertOk(
        await source.getPageChanges(
          { accountId: DEMO_IDS.ulapSuites.account, propertyId: DEMO_IDS.ulapSuites.property },
          ULAP_OWNER_SESSION,
        ),
      );
      expect(changesAfterPublish).toEqual([]);

      // 7. Onboarding owner with no hero cover: blocked before any photo exists, then with one unit photo and no hero cover can publish
      const applied = assertOk(
        await source.applyAsOwner(
          {
            method: 'password',
            idempotencyKey: nextKey(),
            fullName: 'Liza Navarro',
            email: 'liza.navarro@example.com',
            mobile: '0917 555 0909',
            password: 'secure-password-123',
            placeName: 'Liza Ridge Stay',
            rents: 'staycation',
            unitCountBand: '1',
            propertyCountBand: '1',
            city: 'Tagaytay City',
            facebookPage: null,
          },
          GUEST_SESSION,
        ),
      );
      assertOk(
        await source.approveAccount(
          { idempotencyKey: nextKey(), accountId: applied.account.id },
          SUPER_ADMIN_SESSION,
        ),
      );
      const newOwnerSession: Session = {
        role: 'owner',
        accountId: applied.account.id,
        profileId: applied.profile.id,
      };
      const newProp = assertOk(
        await source.saveProperty(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            propertyId: null,
            expectedUpdatedAt: null,
            name: 'Liza Ridge Stay',
            slug: 'liza-ridge-stay',
            tagline: 'Quiet ridge weekend cabin',
            description: 'One cozy cabin in Tagaytay.',
            addressLine: '18 Ridge Road',
            barangay: 'Maharlika East',
            city: 'Tagaytay City',
            province: 'Cavite',
            region: 'CALABARZON',
            latitude: null,
            longitude: null,
            mapUrl: null,
            showExactLocation: false,
            contact: {
              phone: '+639175550909',
              messenger: null,
              facebook: null,
              instagram: null,
              tiktok: null,
              viber: null,
              whatsapp: null,
              google_review_url: null,
            },
            privacyContact: 'liza.navarro@example.com',
            logoFileId: null,
          },
          newOwnerSession,
        ),
      );
      const newUnit = assertOk(
        await source.saveUnit(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            propertyId: newProp.id,
            unitId: null,
            expectedUpdatedAt: null,
            slug: 'pine-cabin',
            name: 'Pine Cabin',
            mode: 'short_stay',
            unitType: 'entire_place',
            groupLabel: null,
            description: 'Cozy pine cabin.',
            maxGuests: 2,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            floorAreaSqm: 28,
            arrivalInfo: null,
            amenityIds: [],
            stayTerms: null,
            leaseTerms: null,
          },
          newOwnerSession,
        ),
      );

      // Before any photo exists (no hero.cover, no property photo, no unit photo), publishPropertyPage blocks with no_cover_photo
      const blockedEmpty = assertErr(
        await source.publishPropertyPage(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            propertyId: newProp.id,
            expectedVersion: 0,
          },
          newOwnerSession,
        ),
      );
      expect(blockedEmpty.code).toBe('invalid_move');
      expect(blockedEmpty.details?.['blocker']).toBe('no_cover_photo');

      // Upload and save ONE unit photo (no hero.cover set)
      const uploadReq = assertOk(
        await source.requestUpload(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            purpose: 'unit_photo',
            mime: 'image/webp',
            sizeBytes: 110_000,
            width: 1600,
            height: 1200,
            filename: 'pine-cabin-1.webp',
          },
          newOwnerSession,
        ),
      );
      const confirmedPhoto = assertOk(
        await source.confirmUpload(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            fileId: uploadReq.file.id,
            width: 1600,
            height: 1200,
            usedByTable: 'listing_photos',
            usedById: newUnit.unit.id,
          },
          newOwnerSession,
        ),
      );
      assertOk(
        await source.saveListingPhotos(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            propertyId: newProp.id,
            unitId: newUnit.unit.id,
            photos: [{ fileId: confirmedPhoto.id, altText: 'Pine Cabin front deck' }],
          },
          newOwnerSession,
        ),
      );

      // Now publishPropertyPage succeeds using the unit photo as cover fallback!
      const onboardingPublished = assertOk(
        await source.publishPropertyPage(
          {
            idempotencyKey: nextKey(),
            accountId: applied.account.id,
            propertyId: newProp.id,
            expectedVersion: 0,
          },
          newOwnerSession,
        ),
      );
      expect(onboardingPublished.version).toBe(1);
      expect(onboardingPublished.published?.hero.cover).toBeNull();

      const liveOnboardingProp = assertOk(
        await source.getProperty({ slug: 'liza-ridge-stay' }, GUEST_SESSION),
      );
      expect(liveOnboardingProp.page_media.hero_cover?.file_id).toBe(confirmedPhoto.id);
      expect(liveOnboardingProp.page_media.share_picture?.file_id).toBe(confirmedPhoto.id);
    });
  });
}
