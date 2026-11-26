import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../errors/index.js';
import {
  OPERATION_ACCESS_LEVELS,
  WAVE1_FEATURE_IDS,
  operationAccessSchema,
  operations,
  wave1FeatureIdSchema,
} from './index.js';

describe('operation contract', () => {
  it('validates access levels and wave 1 feature IDs (with BK-10 excluded per D30)', () => {
    for (const access of OPERATION_ACCESS_LEVELS) {
      expect(operationAccessSchema.parse(access)).toBe(access);
    }
    for (const featureId of WAVE1_FEATURE_IDS) {
      expect(wave1FeatureIdSchema.parse(featureId)).toBe(featureId);
    }
    expect(wave1FeatureIdSchema.safeParse('BK-10').success).toBe(false);
    expect('createInquiry' in operations).toBe(false);
  });

  it('ensures every operation entry matches its key and has valid access, errors, and featureIds', () => {
    const entries = Object.entries(operations);
    expect(entries.length).toBe(92);

    for (const [key, spec] of entries) {
      expect(spec.name).toBe(key);
      expect(spec.access.length).toBeGreaterThan(0);
      expect(spec.featureIds.length).toBeGreaterThan(0);

      for (const access of spec.access) {
        expect(OPERATION_ACCESS_LEVELS).toContain(access);
      }
      for (const error of spec.errors) {
        expect(ERROR_CODES).toContain(error);
      }
      for (const featureId of spec.featureIds) {
        expect(WAVE1_FEATURE_IDS).toContain(featureId);
      }

      if (spec.idempotent) {
        const parsedEmpty = spec.input.safeParse({});
        expect(parsedEmpty.success).toBe(false);
      }
    }
  });

  it('requires expectedTotal and idempotencyKey on createBookingHold and enforces multi-role access lists', () => {
    expect(operations.getThread.access).toEqual(['guest_token', 'member']);
    expect(operations.postMessage.access).toEqual(['guest_token', 'member', 'owner']);
    expect(operations.submitPayment.access).toEqual(['guest_token', 'member']);
    expect(operations.cancelBooking.access).toEqual(['guest_token', 'member', 'owner']);
    expect(operations.submitGuestList.access).toEqual(['guest_token', 'member']);
    expect(operations.submitReview.access).toEqual(['guest_token', 'member']);
    expect(operations.joinAsMember.access).toEqual(['public']);

    const validHoldInput = {
      idempotencyKey: 'idem-hold-001',
      unitId: 'dec0de00-0000-4000-8000-000000000001',
      checkIn: '2026-12-14',
      checkOut: '2026-12-16',
      adults: 2,
      children: 0,
      expectedTotal: 550000,
      customer: {
        full_name: 'Juan Dela Cruz',
        email: 'juan@example.com',
        mobile: '+639171112233',
      },
      guestNote: null,
      consents: [
        {
          kind: 'privacy_notice',
          granted: true,
          noticeVersion: '2026-11',
        },
      ],
    };

    expect(operations.createBookingHold.input.safeParse(validHoldInput).success).toBe(true);
    expect(
      operations.createBookingHold.input.safeParse({
        ...validHoldInput,
        expectedTotal: undefined,
      }).success,
    ).toBe(false);
    expect(
      operations.createBookingHold.input.safeParse({
        ...validHoldInput,
        idempotencyKey: 'short',
      }).success,
    ).toBe(false);

    // Phase 4 discriminated union on applyAsOwner & plain string on changeSlug
    expect(
      operations.applyAsOwner.input.safeParse({
        method: 'google',
        idempotencyKey: 'idem-apply-google-1',
        fullName: 'Liza Morales',
        credential: 'demo-google:liza@example.com:Liza Morales',
        mobile: '0917 555 0199',
        rents: 'staycation',
        unitCountBand: '2_5',
        propertyCountBand: '1',
        city: 'Tagaytay City',
        facebookPage: null,
      }).success,
    ).toBe(true);
    expect(
      operations.changeSlug.input.safeParse({
        idempotencyKey: 'idem-slug-1',
        accountId: 'dec0de00-0000-4000-8000-000000000001',
        propertyId: 'dec0de00-0000-4000-8000-000000000002',
        newSlug: 'admin',
      }).success,
    ).toBe(true);
  });
});
