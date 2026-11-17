import { describe, expect, it } from 'vitest';

import { customerConsentsRow, customersRow } from './customers.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('customers table schemas', () => {
  it('validates customersRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      profile_id: null,
      full_name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      mobile: '+639171112233',
      status: 'active',
      owner_note: 'Repeat guest',
      anonymised_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(customersRow.safeParse(valid).success).toBe(true);
    expect(customersRow.safeParse({ ...valid, email: 'Juan@Example.com' }).success).toBe(false);
    expect(customersRow.safeParse({ ...valid, mobile: '0917 111 2233' }).success).toBe(false);
    expect(customersRow.safeParse({ ...valid, status: 'suspended' }).success).toBe(false);
  });

  it('validates customerConsentsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      customer_id: id3,
      kind: 'privacy_notice',
      granted: true,
      source: 'booking_form',
      notice_version: '2026-11',
      created_at: ts,
    };
    expect(customerConsentsRow.safeParse(valid).success).toBe(true);
    expect(customerConsentsRow.safeParse({ ...valid, kind: 'cookies' }).success).toBe(false);
    expect(customerConsentsRow.safeParse({ ...valid, source: 'footer' }).success).toBe(false);
    expect(customerConsentsRow.safeParse({ ...valid, notice_version: '' }).success).toBe(false);
  });
});
