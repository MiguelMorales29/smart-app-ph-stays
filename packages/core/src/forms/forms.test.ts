import { describe, expect, it } from 'vitest';

import {
  applyStep1FormSchema,
  applyStep2FormSchema,
  applyStep3FormSchema,
  bedSpacesFormSchema,
  changePasswordFormSchema,
  hoursFormSchema,
  paymentAccountFormSchema,
  policiesFormSchema,
  profileFormSchema,
  propertyFormSchema,
  resetPasswordFormSchema,
  signInFormSchema,
  unitFormSchema,
  unitPricesFormSchema,
} from './index.js';

const uuid1 = 'dec0de00-0000-4000-8000-000000000001';

describe('Phase 4 form schemas', () => {
  it('validates applyStep1FormSchema for both password and google methods', () => {
    const pw = {
      method: 'password',
      full_name: 'Mara Villanueva',
      email: 'mara@example.com',
      mobile: '0917 123 4567',
      password: 'strong-password-1',
    };
    expect(applyStep1FormSchema.safeParse(pw).success).toBe(true);
    expect(applyStep1FormSchema.safeParse({ ...pw, password: 'short' }).success).toBe(false);
    expect(applyStep1FormSchema.safeParse({ ...pw, mobile: '12345' }).success).toBe(false);

    const google = {
      method: 'google',
      full_name: 'Mara Villanueva',
      mobile: '+639171234567',
      credential: 'demo-google:mara@example.com:Mara Villanueva',
    };
    expect(applyStep1FormSchema.safeParse(google).success).toBe(true);
    expect(applyStep1FormSchema.safeParse({ ...google, credential: '' }).success).toBe(false);
  });

  it('validates applyStep2FormSchema and applyStep3FormSchema', () => {
    const step2 = {
      rents: 'bed_spaces',
      unit_count_band: '21_plus',
      property_count_band: '2_3',
    };
    expect(applyStep2FormSchema.safeParse(step2).success).toBe(true);
    expect(applyStep2FormSchema.safeParse({ ...step2, unit_count_band: '16_plus' }).success).toBe(
      false,
    );

    const step3 = {
      city: 'Tagaytay City',
      facebook_page: 'https://facebook.com/ulapsuites',
      accepted_terms: true,
    };
    expect(applyStep3FormSchema.safeParse(step3).success).toBe(true);
    expect(applyStep3FormSchema.safeParse({ ...step3, facebook_page: null }).success).toBe(true);
    expect(applyStep3FormSchema.safeParse({ ...step3, accepted_terms: false }).success).toBe(false);
  });

  it('validates signInFormSchema, resetPasswordFormSchema, and changePasswordFormSchema', () => {
    expect(
      signInFormSchema.safeParse({ email: 'owner@example.com', password: 'secret' }).success,
    ).toBe(true);
    expect(signInFormSchema.safeParse({ email: 'not-email', password: '' }).success).toBe(false);

    const reset = {
      email: 'owner@example.com',
      code: '123456',
      newPassword: 'new-password-99',
      confirmPassword: 'new-password-99',
    };
    expect(resetPasswordFormSchema.safeParse(reset).success).toBe(true);
    expect(
      resetPasswordFormSchema.safeParse({ ...reset, confirmPassword: 'different' }).success,
    ).toBe(false);
    expect(resetPasswordFormSchema.safeParse({ ...reset, code: '12345' }).success).toBe(false);

    const change = {
      code: '654321',
      newPassword: 'new-password-99',
      confirmPassword: 'new-password-99',
    };
    expect(changePasswordFormSchema.safeParse(change).success).toBe(true);
    expect(
      changePasswordFormSchema.safeParse({ ...change, confirmPassword: 'mismatch' }).success,
    ).toBe(false);
  });

  it('validates propertyFormSchema and its lat/lng cross-field rule', () => {
    const valid = {
      name: 'Ulap Suites',
      slug: 'ulap-suites',
      tagline: 'Weekend above the clouds',
      description: 'Cozy Tagaytay condo',
      address_line: 'Aguinaldo Highway',
      barangay: 'Maharlika East',
      city: 'Tagaytay City',
      province: 'Cavite',
      region: 'CALABARZON',
      latitude: 14.1153,
      longitude: 120.9621,
      map_url: 'https://maps.google.com/?q=14.1153,120.9621',
      show_exact_location: false,
      contact: {
        phone: '+639170000101',
        messenger: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        viber: null,
        whatsapp: null,
        google_review_url: null,
      },
      privacy_contact: 'owner@example.com',
      logo_file_id: null,
    };
    expect(propertyFormSchema.safeParse(valid).success).toBe(true);
    expect(propertyFormSchema.safeParse({ ...valid, latitude: null, longitude: null }).success).toBe(
      true,
    );
    expect(propertyFormSchema.safeParse({ ...valid, longitude: null }).success).toBe(false);
  });

  it('validates unitFormSchema and bedSpacesFormSchema', () => {
    const unit = {
      name: 'Studio Fog',
      slug: 'studio-fog',
      mode: 'short_stay',
      unit_type: 'entire_place',
      group_label: null,
      description: 'Cozy studio',
      max_guests: 2,
      bedrooms: 0,
      beds: 1,
      bathrooms: 1,
      floor_area_sqm: 24,
      arrival_info: null,
      amenity_ids: [uuid1],
    };
    expect(unitFormSchema.safeParse(unit).success).toBe(true);
    expect(unitFormSchema.safeParse({ ...unit, max_guests: 0 }).success).toBe(false);

    const beds = {
      group_label: 'Room 2A',
      name_prefix: 'Bed',
      count: 4,
      start_number: 1,
      mode: 'long_term',
      bathrooms: 2,
      description: 'Air-conditioned ladies room',
      amenity_ids: [uuid1],
      monthly_rent_centavos: 480_000,
      base_nightly_centavos: null,
    };
    expect(bedSpacesFormSchema.safeParse(beds).success).toBe(true);
    expect(bedSpacesFormSchema.safeParse({ ...beds, monthly_rent_centavos: null }).success).toBe(
      false,
    );
    expect(bedSpacesFormSchema.safeParse({ ...beds, count: 21 }).success).toBe(false);
  });

  it('validates unitPricesFormSchema including min/max nights and unique weekdays', () => {
    const prices = {
      base_nightly_centavos: 260_000,
      base_guests: 2,
      min_nights: 2,
      max_nights: 14,
      prep_nights: 0,
      weekly_discount_percent: 10,
      monthly_discount_percent: 20,
      down_payment_percent: 30,
      hold_minutes: 60,
      advance_notice_days: 0,
      booking_window_days: 365,
      weekday_rates: [
        { iso_weekday: 5, nightly_centavos: 320_000 },
        { iso_weekday: 6, nightly_centavos: 320_000 },
      ],
      rate_overrides: [
        {
          during: { start: '2026-12-24', end: '2026-12-27' },
          nightly_centavos: 450_000,
          label: 'Christmas',
        },
      ],
      fees: [
        {
          code: 'cleaning',
          label: 'Cleaning fee',
          amount_centavos: 50_000,
          basis: 'per_stay',
          is_active: true,
        },
      ],
    };
    expect(unitPricesFormSchema.safeParse(prices).success).toBe(true);
    expect(
      unitPricesFormSchema.safeParse({ ...prices, min_nights: 10, max_nights: 5 }).success,
    ).toBe(false);
    expect(
      unitPricesFormSchema.safeParse({
        ...prices,
        weekday_rates: [
          { iso_weekday: 5, nightly_centavos: 320_000 },
          { iso_weekday: 5, nightly_centavos: 350_000 },
        ],
      }).success,
    ).toBe(false);
  });

  it('validates paymentAccountFormSchema for gcash, maya, and bank methods', () => {
    const gcash = {
      method: 'gcash',
      bank: null,
      bank_name: null,
      account_name: 'Mara Villanueva',
      account_number: '0917 123 4567',
      qr_file_id: null,
      instructions: null,
      is_active: true,
      password: 'owner-password',
    };
    expect(paymentAccountFormSchema.safeParse(gcash).success).toBe(true);
    expect(paymentAccountFormSchema.safeParse({ ...gcash, account_number: '12345678' }).success).toBe(
      false,
    );

    const bank = {
      method: 'bank',
      bank: 'bpi',
      bank_name: null,
      account_name: 'Mara Villanueva',
      account_number: '0012-3456-7890',
      qr_file_id: null,
      instructions: 'Send via InstaPay',
      is_active: true,
      password: 'owner-password',
    };
    expect(paymentAccountFormSchema.safeParse(bank).success).toBe(true);
    expect(paymentAccountFormSchema.safeParse({ ...bank, bank: null }).success).toBe(false);
    expect(paymentAccountFormSchema.safeParse({ ...bank, bank: 'other', bank_name: null }).success).toBe(
      false,
    );
    expect(paymentAccountFormSchema.safeParse({ ...bank, account_number: '1234567' }).success).toBe(
      false,
    );
  });

  it('validates policiesFormSchema, hoursFormSchema, and profileFormSchema', () => {
    const policies = {
      checkin_time: '14:00',
      checkout_time: '12:00',
      cancellation_preset: 'moderate',
      cancellation_note: null,
      rebook_min_days: 7,
      rebook_within_months: 6,
      guest_ids_required: true,
      guest_list_due_hours: 48,
      arrival_info: 'Lobby check-in',
      privacy_contact: 'owner@example.com',
      house_rules: ['No smoking indoors'],
    };
    expect(policiesFormSchema.safeParse(policies).success).toBe(true);
    expect(
      policiesFormSchema.safeParse({
        ...policies,
        cancellation_preset: 'custom',
        cancellation_note: null,
      }).success,
    ).toBe(false);

    const emptyWeek = {
      mon: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
      closed_dates: ['2026-12-25'],
    };
    expect(
      hoursFormSchema.safeParse({ reply_hours: emptyWeek, viewing_hours: null }).success,
    ).toBe(true);
    expect(
      hoursFormSchema.safeParse({
        reply_hours: {
          ...emptyWeek,
          mon: [
            { start: '09:00', end: '14:00' },
            { start: '13:00', end: '18:00' },
          ],
        },
        viewing_hours: null,
      }).success,
    ).toBe(false);

    const profile = {
      full_name: 'Mara Villanueva',
      avatar: { kind: 'preset', preset_id: 'notionists-mara' },
      notify_email: 'owner@example.com',
      notify: {
        new_booking: true,
        payment_to_check: true,
        storage_80: true,
        storage_full: true,
        plan_due: true,
        send_to: null,
      },
    };
    expect(profileFormSchema.safeParse(profile).success).toBe(true);
    expect(profileFormSchema.safeParse({ ...profile, full_name: '' }).success).toBe(false);
  });
});
