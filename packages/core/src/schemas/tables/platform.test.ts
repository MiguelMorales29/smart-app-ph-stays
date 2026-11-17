import { describe, expect, it } from 'vitest';

import {
  accountCountersRow,
  accountFeaturesRow,
  accountMembersRow,
  accountsRow,
  auditLogsRow,
  dataExportsRow,
  featureFlagsRow,
  idempotencyKeysRow,
  jobRunsRow,
  pageReportsRow,
  plansRow,
  platformAdminsRow,
  profilesRow,
  subscriptionPaymentsRow,
  subscriptionsRow,
} from './platform.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('platform table schemas', () => {
  it('validates profilesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      full_name: 'Maria Santos',
      avatar: { kind: 'initials', text: 'MS' },
      created_at: ts,
      updated_at: ts,
    };
    expect(profilesRow.safeParse(valid).success).toBe(true);
    expect(profilesRow.safeParse({ ...valid, full_name: '' }).success).toBe(false);
    expect(profilesRow.safeParse({ ...valid, avatar: { kind: 'initials', text: 'ABCD' } }).success).toBe(
      false,
    );
    expect(profilesRow.safeParse({ ...valid, created_at: '2026-12-10' }).success).toBe(false);
  });

  it('validates platformAdminsRow and rejects 3 broken rows', () => {
    const valid = { profile_id: id1, created_by: null, created_at: ts };
    expect(platformAdminsRow.safeParse(valid).success).toBe(true);
    expect(platformAdminsRow.safeParse({ ...valid, profile_id: 'bad' }).success).toBe(false);
    expect(platformAdminsRow.safeParse({ ...valid, created_by: 'bad' }).success).toBe(false);
    expect(platformAdminsRow.safeParse({ ...valid, created_at: 'bad' }).success).toBe(false);
  });

  it('validates accountsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      name: 'Bahay Batis',
      status: 'active',
      is_demo: true,
      contact_email: 'owner@example.com',
      contact_mobile: '+639171234567',
      notify_email: 'owner@example.com',
      timezone: 'Asia/Manila',
      currency: 'PHP',
      approved_at: ts,
      approved_by: id2,
      verified_at: null,
      verified_by: null,
      verification_note: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(accountsRow.safeParse(valid).success).toBe(true);
    expect(accountsRow.safeParse({ ...valid, contact_email: 'not-an-email' }).success).toBe(false);
    expect(accountsRow.safeParse({ ...valid, contact_mobile: '0917-123-4567' }).success).toBe(
      false,
    );
    expect(accountsRow.safeParse({ ...valid, currency: 'PESO' }).success).toBe(false);
  });

  it('validates accountMembersRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      profile_id: id3,
      role: 'owner',
      status: 'active',
      notify: {
        new_booking: true,
        payment_to_check: true,
        storage_80: true,
        storage_full: true,
        plan_due: true,
        send_to: null,
      },
      created_at: ts,
      updated_at: ts,
    };
    expect(accountMembersRow.safeParse(valid).success).toBe(true);
    expect(accountMembersRow.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
    expect(accountMembersRow.safeParse({ ...valid, status: 'pending' }).success).toBe(false);
    expect(
      accountMembersRow.safeParse({
        ...valid,
        notify: { ...valid.notify, send_to: 'invalid' },
      }).success,
    ).toBe(false);
  });

  it('validates plansRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      code: 'standard',
      name: 'Standard Plan',
      price_centavos: 59900,
      included_units: 5,
      extra_unit_centavos: 10000,
      storage_bytes: 2_147_483_648,
      trial_days: 14,
      is_active: true,
      created_at: ts,
      updated_at: ts,
    };
    expect(plansRow.safeParse(valid).success).toBe(true);
    expect(plansRow.safeParse({ ...valid, price_centavos: 0 }).success).toBe(false);
    expect(plansRow.safeParse({ ...valid, included_units: 0 }).success).toBe(false);
    expect(plansRow.safeParse({ ...valid, extra_unit_centavos: -100 }).success).toBe(false);
  });

  it('validates subscriptionsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      plan_id: id3,
      status: 'trial',
      trial_ends_on: '2026-12-24',
      paid_through: null,
      extra_units: 0,
      paused_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(subscriptionsRow.safeParse(valid).success).toBe(true);
    expect(subscriptionsRow.safeParse({ ...valid, status: 'expired' }).success).toBe(false);
    expect(subscriptionsRow.safeParse({ ...valid, trial_ends_on: '2026-02-30' }).success).toBe(
      false,
    );
    expect(subscriptionsRow.safeParse({ ...valid, extra_units: -1 }).success).toBe(false);
  });

  it('validates subscriptionPaymentsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      subscription_id: id3,
      months: 1,
      amount_centavos: 59900,
      method: 'gcash',
      reference_no: 'REF123456',
      proof_file_id: id1,
      status: 'approved',
      reviewed_by: id2,
      reviewed_at: ts,
      reject_reason: null,
      covers_from: '2026-12-10',
      covers_to: '2027-01-10',
      created_at: ts,
      updated_at: ts,
    };
    expect(subscriptionPaymentsRow.safeParse(valid).success).toBe(true);
    expect(subscriptionPaymentsRow.safeParse({ ...valid, months: 2 }).success).toBe(false);
    expect(
      subscriptionPaymentsRow.safeParse({ ...valid, status: 'rejected', reject_reason: null })
        .success,
    ).toBe(false);
    expect(
      subscriptionPaymentsRow.safeParse({ ...valid, status: 'approved', covers_to: null }).success,
    ).toBe(false);
  });

  it('validates featureFlagsRow and accountFeaturesRow and rejects 3 broken rows each', () => {
    const flag = {
      key: 'loyalty',
      description: 'Stamp and point rewards',
      default_enabled: false,
      created_at: ts,
      updated_at: ts,
    };
    expect(featureFlagsRow.safeParse(flag).success).toBe(true);
    expect(featureFlagsRow.safeParse({ ...flag, key: '' }).success).toBe(false);
    expect(featureFlagsRow.safeParse({ ...flag, description: '' }).success).toBe(false);
    expect(featureFlagsRow.safeParse({ ...flag, created_at: 'bad' }).success).toBe(false);

    const acctFeature = {
      account_id: id1,
      flag_key: 'loyalty',
      enabled: true,
      set_by: id2,
      set_at: ts,
    };
    expect(accountFeaturesRow.safeParse(acctFeature).success).toBe(true);
    expect(accountFeaturesRow.safeParse({ ...acctFeature, account_id: 'bad' }).success).toBe(false);
    expect(accountFeaturesRow.safeParse({ ...acctFeature, flag_key: '' }).success).toBe(false);
    expect(accountFeaturesRow.safeParse({ ...acctFeature, set_at: 'bad' }).success).toBe(false);
  });

  it('validates accountCountersRow and idempotencyKeysRow and rejects 3 broken rows each', () => {
    const counter = {
      account_id: id1,
      kind: 'booking',
      last_value: 12,
      updated_at: ts,
    };
    expect(accountCountersRow.safeParse(counter).success).toBe(true);
    expect(accountCountersRow.safeParse({ ...counter, kind: 'unknown' }).success).toBe(false);
    expect(accountCountersRow.safeParse({ ...counter, last_value: -1 }).success).toBe(false);
    expect(accountCountersRow.safeParse({ ...counter, updated_at: 'bad' }).success).toBe(false);

    const idem = {
      id: id1,
      scope: 'booking.create',
      key: 'key-123',
      account_id: id2,
      request_hash: 'abc123',
      response_status: 200,
      response_body: { ok: true },
      expires_at: ts,
      created_at: ts,
    };
    expect(idempotencyKeysRow.safeParse(idem).success).toBe(true);
    expect(idempotencyKeysRow.safeParse({ ...idem, response_status: 99 }).success).toBe(false);
    expect(idempotencyKeysRow.safeParse({ ...idem, scope: '' }).success).toBe(false);
    expect(idempotencyKeysRow.safeParse({ ...idem, key: '' }).success).toBe(false);
  });

  it('validates auditLogsRow, jobRunsRow, dataExportsRow and pageReportsRow and rejects 3 broken rows each', () => {
    const audit = {
      id: id1,
      account_id: id2,
      actor_kind: 'owner',
      actor_profile_id: id3,
      action: 'payment.approve',
      entity_table: 'payments',
      entity_id: id1,
      detail: { receipt_no: 1 },
      created_at: ts,
    };
    expect(auditLogsRow.safeParse(audit).success).toBe(true);
    expect(auditLogsRow.safeParse({ ...audit, actor_kind: 'guest' }).success).toBe(false);
    expect(auditLogsRow.safeParse({ ...audit, action: '' }).success).toBe(false);
    expect(auditLogsRow.safeParse({ ...audit, entity_id: 'bad' }).success).toBe(false);

    const job = {
      id: id1,
      job: 'expire_holds',
      started_at: ts,
      finished_at: ts,
      status: 'ok',
      rows_affected: 2,
      error: null,
      created_at: ts,
    };
    expect(jobRunsRow.safeParse(job).success).toBe(true);
    expect(jobRunsRow.safeParse({ ...job, status: 'done' }).success).toBe(false);
    expect(jobRunsRow.safeParse({ ...job, rows_affected: -1 }).success).toBe(false);
    expect(jobRunsRow.safeParse({ ...job, job: '' }).success).toBe(false);

    const exp = {
      id: id1,
      account_id: id2,
      range: 'this_month',
      parts: ['bookings', 'payments'],
      status: 'ready',
      file_id: id3,
      expires_at: ts,
      created_by: id1,
      created_at: ts,
    };
    expect(dataExportsRow.safeParse(exp).success).toBe(true);
    expect(dataExportsRow.safeParse({ ...exp, parts: [] }).success).toBe(false);
    expect(dataExportsRow.safeParse({ ...exp, range: 'all_time' }).success).toBe(false);
    expect(dataExportsRow.safeParse({ ...exp, status: 'done' }).success).toBe(false);

    const report = {
      id: id1,
      property_id: id2,
      reason: 'scam_attempt',
      details: 'Payment account looked suspicious',
      reporter_email: null,
      status: 'new',
      created_at: ts,
      closed_at: null,
      closed_by: null,
    };
    expect(pageReportsRow.safeParse(report).success).toBe(true);
    expect(pageReportsRow.safeParse({ ...report, reason: 'spam' }).success).toBe(false);
    expect(pageReportsRow.safeParse({ ...report, details: '' }).success).toBe(false);
    expect(pageReportsRow.safeParse({ ...report, reporter_email: 'bad' }).success).toBe(false);
  });
});
