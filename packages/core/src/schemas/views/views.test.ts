import { describe, expect, it } from 'vitest';

import {
  SUBSCRIPTION_DERIVED_STATES,
  adminOwnerItemViewSchema,
  bookingBoardItemViewSchema,
  calendarTimelineViewSchema,
  inboxThreadItemViewSchema,
  ownerHomeCountsViewSchema,
  paymentReviewItemViewSchema,
  propertyViewSchema,
  stayQuoteViewSchema,
  subscriptionDerivedStateSchema,
  threadViewSchema,
  unitCalendarViewSchema,
} from './index.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('view schemas', () => {
  it('validates propertyViewSchema, unitCalendarViewSchema, stayQuoteViewSchema and threadViewSchema', () => {
    const propertyView = {
      property: {
        id: id1,
        account_id: id2,
        slug: 'bahay-batis',
        name: 'Bahay Batis',
        tagline: 'Hot spring villa',
        description: null,
        address_line: '12 Batis Road',
        barangay: 'Pansol',
        city: 'Calamba',
        province: 'Laguna',
        region: 'CALABARZON',
        country: 'PH',
        latitude: null,
        longitude: null,
        map_url: null,
        checkin_time: '14:00',
        checkout_time: '12:00',
        cancellation_preset: 'flexible',
        cancellation_note: null,
        privacy_contact: 'privacy@bahaybatis.ph',
        logo_file_id: null,
        rebook_min_days: 7,
        rebook_within_months: 6,
        guest_ids_required: false,
        guest_list_due_hours: 48,
        contact: {
          phone: '+639171234567',
          messenger: null,
          facebook: null,
          instagram: null,
          tiktok: null,
          viber: null,
          whatsapp: null,
          google_review_url: null,
        },
        show_exact_location: false,
        reply_hours: null,
        viewing_hours: null,
      },
      page: { version: 1, published: null },
      account: { is_demo: true, is_verified: true, is_paused: false },
      host: {
        display_name: 'Jun Mercado',
        photo: null,
        languages: ['Tagalog', 'English'],
        hosting_since: 2026,
        reply_time: 'Usually replies within an hour',
      },
      trust: {
        is_verified: true,
        payment_accounts_changed_recently: false,
      },
      page_media: {
        logo: null,
        hero_cover: null,
        hero_photos: [],
        banners: [],
        host_photo: null,
        share_picture: null,
      },
      units: [],
      photos: [],
      amenities: [],
      house_rules: [],
      reviews: { average_stars: 4.9, review_count: 5, recent_reviews: [] },
    };
    expect(propertyViewSchema.safeParse(propertyView).success).toBe(true);

    const calView = {
      unit_id: id1,
      window_start: '2026-12-10',
      window_end: '2027-12-10',
      taken_ranges: [{ start: '2026-12-24', end: '2026-12-26' }],
      weekday_rates: [{ iso_weekday: 5, nightly_centavos: 320000 }],
      rate_overrides: [],
    };
    expect(unitCalendarViewSchema.safeParse(calView).success).toBe(true);

    const quoteView = {
      check_in: '2026-12-14',
      check_out: '2026-12-16',
      nights: 2,
      adults: 2,
      children: 0,
      lines: [
        {
          kind: 'night',
          label: 'Night of 2026-12-14',
          stay_date: '2026-12-14',
          quantity: 1,
          unit_centavos: 250000,
          amount_centavos: 250000,
          sort_order: 0,
        },
      ],
      nights_subtotal_centavos: 250000,
      discount_centavos: 0,
      fees_subtotal_centavos: 0,
      total_centavos: 250000,
      required_centavos: 125000,
    };
    expect(stayQuoteViewSchema.safeParse(quoteView).success).toBe(true);

    const threadView = {
      thread: {
        id: id1,
        status: 'open',
        closed_at: null,
        last_message_at: ts,
        customer_read_at: ts,
        owner_read_at: null,
      },
      property: {
        id: id1,
        slug: 'bahay-batis',
        name: 'Bahay Batis',
        checkin_time: '14:00',
        checkout_time: '12:00',
        cancellation_preset: 'flexible',
        cancellation_note: null,
        guest_ids_required: false,
        guest_list_due_hours: 48,
      },
      unit: { id: id2, slug: 'buong-bahay', name: 'Buong Bahay' },
      customer: {
        id: id3,
        full_name: 'Juan Dela Cruz',
        email: 'juan@example.com',
        mobile: '+639171112233',
      },
      booking: {
        id: id1,
        property_id: id1,
        unit_id: id2,
        booking_no: 1,
        status: 'held',
        adults: 2,
        children: 0,
        nights: 2,
        total_centavos: 550000,
        required_centavos: 275000,
        guest_note: null,
        confirmed_at: null,
        checked_in_at: null,
        checked_out_at: null,
        cancelled_at: null,
        cancelled_by: null,
        cancel_reason: null,
        vehicle_plate: null,
        guest_list_submitted_at: null,
        created_at: ts,
        check_in: '2026-12-14',
        check_out: '2026-12-16',
        hold_expires_at: ts,
        paid_centavos: 0,
        balance_centavos: 550000,
        property_arrival_info: null,
        unit_arrival_info: null,
        lines: [],
      },
      messages: [],
      payments: [],
      payment_accounts: [],
    };
    expect(threadViewSchema.safeParse(threadView).success).toBe(true);
    expect(
      threadViewSchema.safeParse({
        ...threadView,
        booking: { ...threadView.booking, property_arrival_info: 'Secret door code' },
      }).success,
    ).toBe(false);
  });

  it('validates owner and admin view schemas', () => {
    expect(
      ownerHomeCountsViewSchema.safeParse({
        arrivals_today: 2,
        departures_today: 1,
        proofs_to_check: 3,
        holds_expiring_soon: 1,
        unread_threads: 4,
      }).success,
    ).toBe(true);

    expect(
      bookingBoardItemViewSchema.safeParse({
        id: id1,
        property_id: id2,
        unit_id: id3,
        customer_id: id1,
        booking_no: 10,
        status: 'in_review',
        source: 'direct',
        adults: 4,
        children: 0,
        nights: 2,
        total_centavos: 690000,
        required_centavos: 345000,
        created_at: ts,
        unit_name: 'Buong Bahay',
        customer_name: 'Juan Dela Cruz',
        check_in: '2026-12-14',
        check_out: '2026-12-16',
        hold_expires_at: ts,
        paid_centavos: 0,
        balance_centavos: 690000,
      }).success,
    ).toBe(true);

    expect(
      paymentReviewItemViewSchema.safeParse({
        id: id1,
        booking_id: id2,
        customer_id: id3,
        kind: 'payment',
        amount_centavos: 345000,
        method: 'gcash',
        reference_no: '987654321',
        paid_on: '2026-12-10',
        status: 'submitted',
        submitted_by: 'customer',
        reject_reason: null,
        receipt_no: null,
        wallet_checked: false,
        created_at: ts,
        booking_no: 10,
        unit_name: 'Buong Bahay',
        customer_name: 'Juan Dela Cruz',
        proof_file_ids: [id1],
      }).success,
    ).toBe(true);

    expect(
      inboxThreadItemViewSchema.safeParse({
        id: id1,
        booking_id: id2,
        customer_id: id3,
        status: 'open',
        last_message_at: ts,
        customer_read_at: ts,
        owner_read_at: null,
        created_at: ts,
        customer_name: 'Juan Dela Cruz',
        unit_name: 'Buong Bahay',
        booking_no: 10,
        booking_status: 'in_review',
        last_message_preview: 'Sent GCash proof!',
        unread_for_owner: true,
      }).success,
    ).toBe(true);

    expect(
      calendarTimelineViewSchema.safeParse({
        range: { start: '2026-12-01', end: '2026-12-31' },
        units: [
          {
            id: id1,
            property_id: id2,
            slug: 'buong-bahay',
            name: 'Buong Bahay',
            mode: 'short_stay',
            unit_type: 'entire_place',
            status: 'listed',
            sort_order: 0,
            items: [],
          },
        ],
      }).success,
    ).toBe(true);

    for (const derived of SUBSCRIPTION_DERIVED_STATES) {
      expect(subscriptionDerivedStateSchema.parse(derived)).toBe(derived);
    }

    expect(
      adminOwnerItemViewSchema.safeParse({
        id: id1,
        name: 'Bahay Batis',
        status: 'active',
        is_demo: true,
        contact_email: 'owner@bahaybatis.ph',
        contact_mobile: '+639171234567',
        approved_at: ts,
        verified_at: ts,
        created_at: ts,
        subscription_status: 'active',
        subscription_derived_state: 'active',
        trial_ends_on: '2026-12-24',
        paid_through: '2027-01-24',
        extra_units: 0,
        unit_count: 3,
        bookings_last_30_days: 12,
        storage_used_bytes: 50_000_000,
        storage_limit_bytes: 2_147_483_648,
        pending_plan_payments: 0,
      }).success,
    ).toBe(true);
  });
});
