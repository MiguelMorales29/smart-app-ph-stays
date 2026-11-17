import { describe, expect, it } from 'vitest';

import {
  bookingEventsRow,
  bookingGuestsRow,
  bookingLinesRow,
  bookingsRow,
  stayReviewsRow,
  unitOccupancyRow,
} from './stays.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('stays table schemas', () => {
  it('validates unitOccupancyRow and rejects 3 broken rows', () => {
    const validHold = {
      id: id1,
      account_id: id2,
      unit_id: id3,
      during: { start: '2026-12-15', end: '2026-12-17' },
      buffer_nights: 0,
      kind: 'hold',
      active: true,
      expires_at: ts,
      note: null,
      created_by: null,
      created_at: ts,
      updated_at: ts,
      released_at: null,
    };
    expect(unitOccupancyRow.safeParse(validHold).success).toBe(true);
    expect(
      unitOccupancyRow.safeParse({
        ...validHold,
        kind: 'lease',
        expires_at: null,
        during: { start: '2026-12-15', end: null },
      }).success,
    ).toBe(true);
    expect(unitOccupancyRow.safeParse({ ...validHold, expires_at: null }).success).toBe(false);
    expect(
      unitOccupancyRow.safeParse({ ...validHold, active: false, released_at: null }).success,
    ).toBe(false);
    expect(
      unitOccupancyRow.safeParse({
        ...validHold,
        during: { start: '2026-12-15', end: null },
      }).success,
    ).toBe(false);
  });

  it('validates bookingsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      property_id: id3,
      unit_id: id1,
      customer_id: id2,
      occupancy_id: id3,
      booking_no: 1,
      status: 'held',
      source: 'direct',
      source_note: null,
      adults: 2,
      children: 1,
      nights: 2,
      total_centavos: 570000,
      required_centavos: 285000,
      guest_note: null,
      reward_claim_id: null,
      confirmed_at: null,
      checked_in_at: null,
      checked_out_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      vehicle_plate: 'ABC 1234',
      guest_list_submitted_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(bookingsRow.safeParse(valid).success).toBe(true);
    expect(bookingsRow.safeParse({ ...valid, adults: 0 }).success).toBe(false);
    expect(bookingsRow.safeParse({ ...valid, required_centavos: 600000 }).success).toBe(false);
    expect(bookingsRow.safeParse({ ...valid, vehicle_plate: 'X'.repeat(16) }).success).toBe(false);
  });

  it('validates bookingLinesRow (including negative discount lines) and rejects 3 broken rows', () => {
    const nightLine = {
      id: id1,
      account_id: id2,
      booking_id: id3,
      kind: 'night',
      label: 'Night of 2026-12-15',
      stay_date: '2026-12-15',
      quantity: 1,
      unit_centavos: 260000,
      amount_centavos: 260000,
      sort_order: 0,
      created_at: ts,
    };
    const discountLine = {
      ...nightLine,
      kind: 'discount',
      label: 'Weekly discount (10%)',
      stay_date: null,
      unit_centavos: 182000,
      amount_centavos: -182000,
    };
    expect(bookingLinesRow.safeParse(nightLine).success).toBe(true);
    expect(bookingLinesRow.safeParse(discountLine).success).toBe(true);
    expect(bookingLinesRow.safeParse({ ...nightLine, stay_date: null }).success).toBe(false);
    expect(bookingLinesRow.safeParse({ ...nightLine, amount_centavos: -260000 }).success).toBe(
      false,
    );
    expect(bookingLinesRow.safeParse({ ...discountLine, amount_centavos: 182000 }).success).toBe(
      false,
    );
  });

  it('validates bookingEventsRow, bookingGuestsRow and stayReviewsRow and rejects 3 broken rows each', () => {
    const evt = {
      id: id1,
      account_id: id2,
      booking_id: id3,
      type: 'created',
      from_status: null,
      to_status: 'held',
      actor_kind: 'customer',
      actor_profile_id: null,
      detail: {},
      created_at: ts,
    };
    expect(bookingEventsRow.safeParse(evt).success).toBe(true);
    expect(bookingEventsRow.safeParse({ ...evt, type: 'deleted' }).success).toBe(false);
    expect(bookingEventsRow.safeParse({ ...evt, actor_kind: 'admin' }).success).toBe(false);
    expect(bookingEventsRow.safeParse({ ...evt, to_status: 'unknown' }).success).toBe(false);

    const guest = {
      id: id1,
      account_id: id2,
      booking_id: id3,
      full_name: 'Juan Dela Cruz',
      is_minor: false,
      id_file_id: id1,
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(bookingGuestsRow.safeParse(guest).success).toBe(true);
    expect(bookingGuestsRow.safeParse({ ...guest, full_name: '' }).success).toBe(false);
    expect(bookingGuestsRow.safeParse({ ...guest, sort_order: -1 }).success).toBe(false);
    expect(bookingGuestsRow.safeParse({ ...guest, id_file_id: 'bad' }).success).toBe(false);

    const review = {
      id: id1,
      account_id: id2,
      booking_id: id3,
      customer_id: id1,
      stars: 5,
      note: 'Super clean and relaxing!',
      note_hidden: false,
      created_at: ts,
    };
    expect(stayReviewsRow.safeParse(review).success).toBe(true);
    expect(stayReviewsRow.safeParse({ ...review, stars: 0 }).success).toBe(false);
    expect(stayReviewsRow.safeParse({ ...review, stars: 6 }).success).toBe(false);
    expect(stayReviewsRow.safeParse({ ...review, note: 'x'.repeat(301) }).success).toBe(false);
  });
});
