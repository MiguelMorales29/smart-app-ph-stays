import { describe, expect, it } from 'vitest';
import { cancellationRefund } from './cancellation.js';

const paid = { paidCentavos: 300_000, downPaymentCentavos: 150_000 };

describe('cancellationRefund', () => {
  it('flexible: everything 1+ day before, nothing on the day', () => {
    expect(cancellationRefund('flexible', { ...paid, daysBeforeCheckIn: 1 }).refundCentavos).toBe(
      300_000,
    );
    expect(cancellationRefund('flexible', { ...paid, daysBeforeCheckIn: 0 }).refundCentavos).toBe(
      0,
    );
  });
  it('moderate: everything 5+ days before, half after', () => {
    expect(cancellationRefund('moderate', { ...paid, daysBeforeCheckIn: 5 }).refundCentavos).toBe(
      300_000,
    );
    expect(cancellationRefund('moderate', { ...paid, daysBeforeCheckIn: 3 }).refundCentavos).toBe(
      150_000,
    );
  });
  it('firm: everything 30+, half 7-29, nothing under 7', () => {
    expect(cancellationRefund('firm', { ...paid, daysBeforeCheckIn: 30 }).refundCentavos).toBe(
      300_000,
    );
    expect(cancellationRefund('firm', { ...paid, daysBeforeCheckIn: 7 }).refundCentavos).toBe(
      150_000,
    );
    expect(cancellationRefund('firm', { ...paid, daysBeforeCheckIn: 6 }).refundCentavos).toBe(0);
  });
  it('dp_rebook keeps the down payment and allows one date change', () => {
    expect(cancellationRefund('dp_rebook', { ...paid, daysBeforeCheckIn: 3 })).toEqual({
      refundCentavos: 150_000,
      canRebook: true,
    });
  });
  it('non_refundable returns nothing', () => {
    expect(
      cancellationRefund('non_refundable', { ...paid, daysBeforeCheckIn: 60 }).refundCentavos,
    ).toBe(0);
  });
});
