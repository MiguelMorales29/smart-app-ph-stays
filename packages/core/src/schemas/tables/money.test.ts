import { describe, expect, it } from 'vitest';

import { paymentProofsRow, paymentsRow } from './money.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const id3 = 'dec0de00-0000-4000-8000-000000000003';
const ts = '2026-12-10T10:00:00+08:00';

describe('money table schemas', () => {
  it('validates paymentsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      customer_id: id3,
      booking_id: id1,
      bill_id: null,
      kind: 'payment',
      amount_centavos: 285000,
      method: 'gcash',
      reference_no: '1234 5678',
      reference_norm: '12345678',
      paid_on: '2026-12-10',
      status: 'approved',
      submitted_by: 'customer',
      reviewed_by: id2,
      reviewed_at: ts,
      reject_reason: null,
      receipt_no: 1,
      wallet_checked: true,
      created_at: ts,
      updated_at: ts,
    };
    expect(paymentsRow.safeParse(valid).success).toBe(true);
    expect(paymentsRow.safeParse({ ...valid, bill_id: id2 }).success).toBe(false);
    expect(
      paymentsRow.safeParse({ ...valid, reference_no: null, reference_norm: null }).success,
    ).toBe(false);
    expect(paymentsRow.safeParse({ ...valid, wallet_checked: false }).success).toBe(false);
  });

  it('validates paymentProofsRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      payment_id: id3,
      file_id: id1,
      sort_order: 0,
      created_at: ts,
    };
    expect(paymentProofsRow.safeParse(valid).success).toBe(true);
    expect(paymentProofsRow.safeParse({ ...valid, sort_order: -1 }).success).toBe(false);
    expect(paymentProofsRow.safeParse({ ...valid, sort_order: 3 }).success).toBe(false);
    expect(paymentProofsRow.safeParse({ ...valid, file_id: 'bad' }).success).toBe(false);
  });
});
