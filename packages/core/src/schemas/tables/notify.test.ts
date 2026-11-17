import { describe, expect, it } from 'vitest';

import { notificationsOutboxRow, pushSubscriptionsRow } from './notify.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('notify table schemas', () => {
  it('validates pushSubscriptionsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      audience: 'customer',
      customer_id: id3,
      profile_id: null,
      property_id: id1,
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls',
      auth_key: 'tBHItJI5svbpez7KI4CCXg',
      last_success_at: null,
      revoked_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(pushSubscriptionsRow.safeParse(valid).success).toBe(true);
    expect(pushSubscriptionsRow.safeParse({ ...valid, customer_id: null }).success).toBe(false);
    expect(pushSubscriptionsRow.safeParse({ ...valid, profile_id: id1 }).success).toBe(false);
    expect(pushSubscriptionsRow.safeParse({ ...valid, endpoint: 'not-a-url' }).success).toBe(false);
  });

  it('validates notificationsOutboxRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      channel: 'email',
      template: 'booking.confirmed',
      customer_id: id3,
      profile_id: null,
      to_email: 'guest@example.com',
      payload: { booking_id: id1 },
      dedupe_key: `booking.confirmed:${id1}:customer`,
      status: 'pending',
      attempts: 0,
      next_attempt_at: ts,
      last_error: null,
      sent_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(notificationsOutboxRow.safeParse(valid).success).toBe(true);
    expect(notificationsOutboxRow.safeParse({ ...valid, channel: 'sms' }).success).toBe(false);
    expect(notificationsOutboxRow.safeParse({ ...valid, attempts: -1 }).success).toBe(false);
    expect(notificationsOutboxRow.safeParse({ ...valid, to_email: 'bad-email' }).success).toBe(
      false,
    );
  });
});
