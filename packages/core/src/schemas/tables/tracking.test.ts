import { describe, expect, it } from 'vitest';

import {
  metaAttributionRow,
  metaCapiDeliveriesRow,
  metaEventSwitchesRow,
  metaPixelsRow,
} from './tracking.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('tracking table schemas', () => {
  it('validates metaPixelsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      scope: 'platform',
      account_id: null,
      property_id: null,
      pixel_id: '123456789012345',
      status: 'test',
      test_event_code: 'TEST12345',
      api_version: 'v27.0',
      created_at: ts,
      updated_at: ts,
      updated_by: id2,
    };
    expect(metaPixelsRow.safeParse(valid).success).toBe(true);
    expect(metaPixelsRow.safeParse({ ...valid, pixel_id: 'abc123' }).success).toBe(false);
    expect(metaPixelsRow.safeParse({ ...valid, test_event_code: null }).success).toBe(false);
    expect(metaPixelsRow.safeParse({ ...valid, status: 'live' }).success).toBe(false);
  });

  it('validates metaEventSwitchesRow and rejects 3 broken rows', () => {
    const valid = {
      pixel_ref: id1,
      event_name: 'CompleteRegistration',
      browser_enabled: true,
      server_enabled: true,
      updated_at: ts,
    };
    expect(metaEventSwitchesRow.safeParse(valid).success).toBe(true);
    expect(
      metaEventSwitchesRow.safeParse({
        ...valid,
        event_name: 'Purchase',
        browser_enabled: true,
      }).success,
    ).toBe(false);
    expect(
      metaEventSwitchesRow.safeParse({
        ...valid,
        event_name: 'PageView',
        server_enabled: true,
      }).success,
    ).toBe(false);
    expect(metaEventSwitchesRow.safeParse({ ...valid, event_name: 'Lead' }).success).toBe(false);
  });

  it('validates metaAttributionRow and metaCapiDeliveriesRow and rejects 3 broken rows each', () => {
    const attr = {
      account_id: id1,
      ads_consent: true,
      consent_at: ts,
      fbp: 'fb.1.1700000000000.1234567890',
      fbc: null,
      client_ip: '203.177.12.34',
      user_agent: 'Mozilla/5.0',
      captured_at: ts,
      refreshed_at: ts,
    };
    expect(metaAttributionRow.safeParse(attr).success).toBe(true);
    expect(metaAttributionRow.safeParse({ ...attr, account_id: 'bad' }).success).toBe(false);
    expect(metaAttributionRow.safeParse({ ...attr, fbp: 'x'.repeat(257) }).success).toBe(false);
    expect(metaAttributionRow.safeParse({ ...attr, captured_at: 'bad' }).success).toBe(false);

    const delivery = {
      id: id1,
      pixel_ref: id2,
      event_name: 'Purchase',
      event_id: `Purchase:${id3}`,
      account_id: id1,
      entity_type: 'subscription_payments',
      entity_id: id3,
      event_time: ts,
      payload: { event_name: 'Purchase' },
      is_test: false,
      status: 'sent',
      attempts: 1,
      next_attempt_at: ts,
      claim_token: null,
      claimed_at: null,
      http_status: 200,
      events_received: 1,
      fbtrace_id: 'trace-123',
      last_error: null,
      created_at: ts,
      sent_at: ts,
      triggered_by: 'super_admin',
      action_source: 'other',
      time_clamped: false,
    };
    expect(metaCapiDeliveriesRow.safeParse(delivery).success).toBe(true);
    expect(metaCapiDeliveriesRow.safeParse({ ...delivery, entity_type: 'bookings' }).success).toBe(
      false,
    );
    expect(metaCapiDeliveriesRow.safeParse({ ...delivery, http_status: 99 }).success).toBe(false);
    expect(metaCapiDeliveriesRow.safeParse({ ...delivery, triggered_by: 'customer' }).success).toBe(
      false,
    );
  });
});
