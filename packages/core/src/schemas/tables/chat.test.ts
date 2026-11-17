import { describe, expect, it } from 'vitest';

import { messagesRow, savedRepliesRow, threadsRow } from './chat.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';
const sha256 = 'a'.repeat(64);

describe('chat table schemas', () => {
  it('validates threadsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      customer_id: id3,
      booking_id: id1,
      inquiry_id: null,
      lease_id: null,
      token_hash: sha256,
      status: 'open',
      closed_at: null,
      last_message_at: ts,
      customer_read_at: ts,
      owner_read_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(threadsRow.safeParse(valid).success).toBe(true);
    expect(threadsRow.safeParse({ ...valid, booking_id: null }).success).toBe(false);
    expect(threadsRow.safeParse({ ...valid, inquiry_id: id2 }).success).toBe(false);
    expect(threadsRow.safeParse({ ...valid, token_hash: 'short' }).success).toBe(false);
  });

  it('validates messagesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      thread_id: id3,
      sender_kind: 'customer',
      sender_profile_id: null,
      kind: 'text',
      body: 'Hello, can we check in at 2 pm?',
      payment_id: null,
      file_id: null,
      hidden_at: null,
      hidden_by: null,
      created_at: ts,
    };
    expect(messagesRow.safeParse(valid).success).toBe(true);
    expect(messagesRow.safeParse({ ...valid, body: '' }).success).toBe(false);
    expect(messagesRow.safeParse({ ...valid, kind: 'payment', payment_id: null }).success).toBe(
      false,
    );
    expect(messagesRow.safeParse({ ...valid, payment_id: id1 }).success).toBe(false);
  });

  it('validates savedRepliesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      title: 'Directions & Wi-Fi',
      body: 'Hi {guest_name}, check-in is on {checkin_date}.',
      sort_order: 0,
      created_at: ts,
      updated_at: ts,
    };
    expect(savedRepliesRow.safeParse(valid).success).toBe(true);
    expect(savedRepliesRow.safeParse({ ...valid, title: '' }).success).toBe(false);
    expect(savedRepliesRow.safeParse({ ...valid, title: 'x'.repeat(41) }).success).toBe(false);
    expect(savedRepliesRow.safeParse({ ...valid, body: '' }).success).toBe(false);
  });
});
