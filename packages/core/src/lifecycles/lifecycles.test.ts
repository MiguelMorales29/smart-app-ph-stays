import { describe, expect, it } from 'vitest';

import { BOOKING_STATUSES } from '../lists/bookings.js';
import type { BookingStatus } from '../lists/bookings.js';
import { PAYMENT_STATUSES } from '../lists/payments.js';
import type { PaymentStatus } from '../lists/payments.js';
import { SUBSCRIPTION_STATUSES } from '../lists/platform.js';
import type { SubscriptionStatus } from '../lists/platform.js';
import {
  BOOKING_LIFECYCLE,
  PAYMENT_LIFECYCLE,
  SUBSCRIPTION_LIFECYCLE,
  canMove,
  nextStates,
} from './index.js';
import type {
  BookingLifecycleActor,
  LifecycleMachine,
  PaymentLifecycleActor,
  SubscriptionLifecycleActor,
} from './index.js';

function assertUniqueMoves<S extends string, A extends string>(
  machine: LifecycleMachine<S, A>,
): void {
  const keys = machine.map((move) => `${move.from ?? '(new)'}->${move.to}@${move.by}`);
  expect(new Set(keys).size).toBe(keys.length);
}

describe('lifecycles', () => {
  describe('BOOKING_LIFECYCLE', () => {
    const allowedMoves: readonly [BookingStatus | null, BookingStatus, BookingLifecycleActor][] = [
      [null, 'held', 'customer'],
      [null, 'confirmed', 'owner'],
      ['held', 'in_review', 'customer'],
      ['in_review', 'confirmed', 'owner'],
      ['in_review', 'held', 'owner'],
      ['held', 'expired', 'system'],
      ['in_review', 'expired', 'system'],
      ['held', 'cancelled', 'customer'],
      ['held', 'cancelled', 'owner'],
      ['in_review', 'cancelled', 'customer'],
      ['in_review', 'cancelled', 'owner'],
      ['confirmed', 'cancelled', 'customer'],
      ['confirmed', 'cancelled', 'owner'],
      ['confirmed', 'checked_in', 'owner'],
      ['confirmed', 'completed', 'owner'],
      ['confirmed', 'completed', 'system'],
      ['checked_in', 'completed', 'owner'],
      ['checked_in', 'completed', 'system'],
    ];

    it('contains no duplicate move rows and matches the exact expected move count', () => {
      assertUniqueMoves(BOOKING_LIFECYCLE);
      expect(BOOKING_LIFECYCLE).toHaveLength(allowedMoves.length);
    });

    it.each(allowedMoves)('allows %s -> %s by %s', (from, to, actor) => {
      expect(canMove(BOOKING_LIFECYCLE, from, to, actor)).toBe(true);
    });

    const refusedMoves: readonly [BookingStatus | null, BookingStatus, BookingLifecycleActor][] = [
      [null, 'confirmed', 'customer'],
      [null, 'held', 'owner'],
      ['held', 'confirmed', 'owner'],
      ['held', 'in_review', 'owner'],
      ['in_review', 'confirmed', 'customer'],
      ['in_review', 'checked_in', 'owner'],
      ['confirmed', 'held', 'owner'],
      ['confirmed', 'checked_in', 'customer'],
      ['checked_in', 'cancelled', 'owner'],
      ['checked_in', 'completed', 'customer'],
      ['completed', 'cancelled', 'owner'],
      ['cancelled', 'confirmed', 'owner'],
      ['expired', 'held', 'system'],
    ];

    it.each(refusedMoves)('refuses %s -> %s by %s', (from, to, actor) => {
      expect(canMove(BOOKING_LIFECYCLE, from, to, actor)).toBe(false);
    });

    it('computes nextStates for every booking state with and without actor filter', () => {
      expect(nextStates(BOOKING_LIFECYCLE, null)).toEqual(['held', 'confirmed']);
      expect(nextStates(BOOKING_LIFECYCLE, null, 'customer')).toEqual(['held']);
      expect(nextStates(BOOKING_LIFECYCLE, 'held')).toEqual(['in_review', 'expired', 'cancelled']);
      expect(nextStates(BOOKING_LIFECYCLE, 'held', 'system')).toEqual(['expired']);
      expect(nextStates(BOOKING_LIFECYCLE, 'in_review', 'owner')).toEqual([
        'confirmed',
        'held',
        'cancelled',
      ]);
      expect(nextStates(BOOKING_LIFECYCLE, 'confirmed', 'customer')).toEqual(['cancelled']);
      expect(nextStates(BOOKING_LIFECYCLE, 'checked_in')).toEqual(['completed']);
      expect(nextStates(BOOKING_LIFECYCLE, 'completed')).toEqual([]);
      expect(nextStates(BOOKING_LIFECYCLE, 'cancelled')).toEqual([]);
      expect(nextStates(BOOKING_LIFECYCLE, 'expired')).toEqual([]);

      for (const status of BOOKING_STATUSES) {
        for (const target of nextStates(BOOKING_LIFECYCLE, status)) {
          expect(BOOKING_STATUSES).toContain(target);
        }
      }
    });
  });

  describe('PAYMENT_LIFECYCLE', () => {
    const allowedMoves: readonly [PaymentStatus | null, PaymentStatus, PaymentLifecycleActor][] = [
      [null, 'submitted', 'customer'],
      [null, 'approved', 'owner'],
      ['submitted', 'approved', 'owner'],
      ['submitted', 'rejected', 'owner'],
      ['approved', 'reversed', 'owner'],
    ];

    it('contains no duplicate move rows and matches the exact expected move count', () => {
      assertUniqueMoves(PAYMENT_LIFECYCLE);
      expect(PAYMENT_LIFECYCLE).toHaveLength(allowedMoves.length);
    });

    it.each(allowedMoves)('allows %s -> %s by %s', (from, to, actor) => {
      expect(canMove(PAYMENT_LIFECYCLE, from, to, actor)).toBe(true);
    });

    const refusedMoves: readonly [PaymentStatus | null, PaymentStatus, PaymentLifecycleActor][] = [
      [null, 'approved', 'customer'],
      [null, 'submitted', 'owner'],
      ['submitted', 'approved', 'customer'],
      ['submitted', 'reversed', 'owner'],
      ['approved', 'rejected', 'owner'],
      ['approved', 'reversed', 'customer'],
      ['rejected', 'approved', 'owner'],
      ['reversed', 'approved', 'owner'],
    ];

    it.each(refusedMoves)('refuses %s -> %s by %s', (from, to, actor) => {
      expect(canMove(PAYMENT_LIFECYCLE, from, to, actor)).toBe(false);
    });

    it('computes nextStates for every payment state', () => {
      expect(nextStates(PAYMENT_LIFECYCLE, null)).toEqual(['submitted', 'approved']);
      expect(nextStates(PAYMENT_LIFECYCLE, 'submitted', 'owner')).toEqual(['approved', 'rejected']);
      expect(nextStates(PAYMENT_LIFECYCLE, 'submitted', 'customer')).toEqual([]);
      expect(nextStates(PAYMENT_LIFECYCLE, 'approved', 'owner')).toEqual(['reversed']);
      expect(nextStates(PAYMENT_LIFECYCLE, 'rejected')).toEqual([]);
      expect(nextStates(PAYMENT_LIFECYCLE, 'reversed')).toEqual([]);

      for (const status of PAYMENT_STATUSES) {
        for (const target of nextStates(PAYMENT_LIFECYCLE, status)) {
          expect(PAYMENT_STATUSES).toContain(target);
        }
      }
    });
  });

  describe('SUBSCRIPTION_LIFECYCLE', () => {
    const allowedMoves: readonly [
      SubscriptionStatus | null,
      SubscriptionStatus,
      SubscriptionLifecycleActor,
    ][] = [
      [null, 'trial', 'super_admin'],
      ['trial', 'active', 'super_admin'],
      ['trial', 'paused', 'system'],
      ['active', 'paused', 'system'],
      ['paused', 'active', 'super_admin'],
      ['trial', 'cancelled', 'owner'],
      ['trial', 'cancelled', 'super_admin'],
      ['active', 'cancelled', 'owner'],
      ['active', 'cancelled', 'super_admin'],
      ['paused', 'cancelled', 'owner'],
      ['paused', 'cancelled', 'super_admin'],
    ];

    it('contains no duplicate move rows and matches the exact expected move count', () => {
      assertUniqueMoves(SUBSCRIPTION_LIFECYCLE);
      expect(SUBSCRIPTION_LIFECYCLE).toHaveLength(allowedMoves.length);
    });

    it.each(allowedMoves)('allows %s -> %s by %s', (from, to, actor) => {
      expect(canMove(SUBSCRIPTION_LIFECYCLE, from, to, actor)).toBe(true);
    });

    const refusedMoves: readonly [
      SubscriptionStatus | null,
      SubscriptionStatus,
      SubscriptionLifecycleActor,
    ][] = [
      [null, 'trial', 'owner'],
      [null, 'active', 'super_admin'],
      ['trial', 'active', 'owner'],
      ['trial', 'paused', 'owner'],
      ['active', 'trial', 'super_admin'],
      ['active', 'paused', 'owner'],
      ['paused', 'trial', 'super_admin'],
      ['paused', 'active', 'owner'],
      ['cancelled', 'active', 'super_admin'],
      ['cancelled', 'trial', 'super_admin'],
    ];

    it.each(refusedMoves)('refuses %s -> %s by %s', (from, to, actor) => {
      expect(canMove(SUBSCRIPTION_LIFECYCLE, from, to, actor)).toBe(false);
    });

    it('computes nextStates for every subscription state', () => {
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, null)).toEqual(['trial']);
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, 'trial')).toEqual([
        'active',
        'paused',
        'cancelled',
      ]);
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, 'trial', 'system')).toEqual(['paused']);
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, 'active', 'owner')).toEqual(['cancelled']);
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, 'paused', 'super_admin')).toEqual([
        'active',
        'cancelled',
      ]);
      expect(nextStates(SUBSCRIPTION_LIFECYCLE, 'cancelled')).toEqual([]);

      for (const status of SUBSCRIPTION_STATUSES) {
        for (const target of nextStates(SUBSCRIPTION_LIFECYCLE, status)) {
          expect(SUBSCRIPTION_STATUSES).toContain(target);
        }
      }
    });
  });
});
