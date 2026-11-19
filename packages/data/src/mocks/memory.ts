import {
  BOOKING_LIFECYCLE,
  DEMO_IDS,
  PAYMENT_LIFECYCLE,
  SUBSCRIPTION_LIFECYCLE,
  addDays,
  appError,
  canMove,
  err,
  manilaToday,
  nightsBetween,
  ok,
  operations,
  reasonError,
  resolveDemoWorld,
  systemClock,
  words,
  type AppError,
  type BookingEventsRow,
  type Clock,
  type DemoPack,
  type ErrorCode,
  type MetaCapiDeliveriesRow,
  type MessagesRow,
  type NotificationsOutboxRow,
  type OperationName,
  type PageReportsRow,
  type Result,
} from '@smartapp/core';
import type { z } from 'zod';

import type { MediaConfig } from '../media.js';
import {
  createValidatedDataSource,
  hasOperationAccess,
  type DataSource,
  type OperationParsedInput,
  type ParsedDataSourceHandlers,
  type Session,
} from '../source.js';
import {
  DemoIdAllocator,
  addHoursIso,
  addMinutesIso,
  buildAdminOwnerAccounts,
  buildBookingDetailView,
  buildBookingsBoard,
  buildInboxThreads,
  buildOwnerHomeCounts,
  buildPaymentsToReview,
  buildPropertyView,
  buildUnitCalendarView,
  buildCalendarTimeline,
  buildThreadView,
  calculatePaidAndBalance,
  countActiveUnpaidHoldsForCustomer,
  ensureProofFilesExist,
  generateThreadToken,
  hasActiveOccupancyOverlap,
  isAccountOperational,
  nextAccountCounter,
  normalizePaymentReference,
  nowIsoFromClock,
  quoteForUnit,
  releaseExpiredHolds,
  resolveThreadAccess,
  sha256Hex,
  toFailAppError,
} from './helpers.js';
import {
  checkUnitLimitForAccount,
  createMemoryAuthState,
  createOwnerHandlers,
  recordSlugChangeTimestamp,
  validateSlugChangeInMemory,
} from './owner-handlers.js';

export interface MemorySourceOptions {
  readonly pack: DemoPack;
  readonly clock?: Clock;
  readonly storefrontOrigin?: string;
  readonly latencyMs?: number;
  readonly failWith?: ErrorCode | AppError;
  readonly validateOutput?: boolean;
}

interface StoredIdempotencyEntry {
  readonly scope: string;
  readonly key: string;
  readonly accountId: string | null;
  readonly requestHash: string;
  readonly expiresAtMs: number;
  readonly data: unknown;
}

/**
 * Creates an in-memory `DataSource` seeded from `resolveDemoWorld({ pack, clock })`
 * that imitates PostgreSQL constraints, lifecycles, counters, and row-level isolation.
 */
export function createMemorySource(options: MemorySourceOptions): DataSource {
  const clock = options.clock ?? systemClock;
  const mediaConfig: MediaConfig = {
    mode: 'memory',
    storefrontOrigin: options.storefrontOrigin ?? '',
  };
  const world = resolveDemoWorld({ pack: options.pack, clock });
  const ids = new DemoIdAllocator();
  const idempotencyCache = new Map<string, StoredIdempotencyEntry>();
  const auth = createMemoryAuthState(world, clock);

  async function beforeCall<K extends OperationName>(
    opName: K,
    session: Session,
  ): Promise<Result<void>> {
    if (options.latencyMs !== undefined && options.latencyMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, options.latencyMs);
      });
    }

    if (options.failWith !== undefined) {
      return err(toFailAppError(options.failWith));
    }

    if (!hasOperationAccess(session, operations[opName].access)) {
      return err(appError('not_allowed'));
    }

    return ok(undefined);
  }

  function requireOwnerAccountMatch(session: Session, accountId: string): Result<string> {
    if (session.role === 'owner') {
      if (session.accountId !== accountId) {
        return err(appError('not_allowed'));
      }
      return ok(session.accountId);
    }
    return err(appError('not_allowed'));
  }

  async function runIdempotent<K extends OperationName, T>(
    scope: K,
    key: string,
    accountId: string | null,
    payload: unknown,
    outputSchema: z.ZodType<T>,
    action: () => Promise<Result<T>>,
  ): Promise<Result<T>> {
    const cacheKey = `${scope}:${key}`;
    const requestHash = await sha256Hex(JSON.stringify(payload));
    const nowMs = clock.now().getTime();
    const existing = idempotencyCache.get(cacheKey);

    if (existing && existing.expiresAtMs > nowMs) {
      if (existing.requestHash !== requestHash) {
        return err(appError('not_allowed', 'Idempotency key reused with a different request.'));
      }
      return ok(outputSchema.parse(existing.data));
    }

    const result = await action();
    // Only committed (successful) writes persist an idempotency record,
    // imitating PostgreSQL transaction rollback on raised errors.
    if (result.ok) {
      const expiresAtIso = addHoursIso(clock, 48);
      idempotencyCache.set(cacheKey, {
        scope,
        key,
        accountId,
        requestHash,
        expiresAtMs: Date.parse(expiresAtIso),
        data: result.data,
      });
      world.idempotency_keys.push({
        id: ids.next('0020'),
        scope,
        key,
        account_id: accountId,
        request_hash: requestHash,
        response_status: 200,
        response_body: { ok: true },
        expires_at: expiresAtIso,
        created_at: nowIsoFromClock(clock),
      });
    }

    return result;
  }

  const handlers: ParsedDataSourceHandlers = {
    async getProperty(input, session) {
      const guard = await beforeCall('getProperty', session);
      if (!guard.ok) return guard;
      return buildPropertyView(world, input.slug, mediaConfig);
    },

    async getUnitCalendar(input, session) {
      const guard = await beforeCall('getUnitCalendar', session);
      if (!guard.ok) return guard;

      // Imitates PostgreSQL clearing stale holds on the unit before returning calendar availability.
      releaseExpiredHolds(world, clock, ids, input.unitId);
      return buildUnitCalendarView(world, input.unitId, clock);
    },

    async quoteStay(input, session) {
      const guard = await beforeCall('quoteStay', session);
      if (!guard.ok) return guard;

      releaseExpiredHolds(world, clock, ids, input.unitId);

      const unit = world.units.find((u) => u.id === input.unitId && u.status === 'listed');
      if (!unit) return err(appError('not_found'));
      const property = world.properties.find(
        (p) => p.id === unit.property_id && p.status === 'published',
      );
      if (!property) return err(appError('not_found'));

      const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id);
      if (!stayTerms) return err(appError('not_allowed'));

      const quote = quoteForUnit({
        world,
        unit,
        stayTerms,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        adults: input.adults,
        children: input.children,
        today: manilaToday(clock),
      });
      if (!quote.ok) {
        return err(
          appError('not_allowed', 'Stay dates or guest count do not meet unit rules.', {
            reason: quote.reason,
          }),
        );
      }

      const rangeEnd = addDays(input.checkOut, stayTerms.prep_nights);
      if (hasActiveOccupancyOverlap(world, unit.id, input.checkIn, rangeEnd)) {
        return err(appError('dates_taken'));
      }

      return ok(quote.data);
    },

    async createBookingHold(input, session) {
      const guard = await beforeCall('createBookingHold', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'createBookingHold',
        input.idempotencyKey,
        null,
        input,
        operations.createBookingHold.output,
        async () => {
          const unit = world.units.find((u) => u.id === input.unitId && u.status === 'listed');
          if (!unit || unit.mode !== 'short_stay') {
            return err(appError('not_found'));
          }

          const property = world.properties.find(
            (p) => p.id === unit.property_id && p.status === 'published',
          );
          if (!property) {
            return err(appError('not_found'));
          }

          if (!isAccountOperational(world, property.account_id)) {
            return err(appError('not_allowed'));
          }

          const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id);
          if (!stayTerms) {
            return err(appError('not_allowed'));
          }

          // Imitates SQL clearing expired holds before checking overlap or hold_limit.
          releaseExpiredHolds(world, clock, ids);

          const normalizedEmail = input.customer.email.toLowerCase();
          const existingCustomerIdx = world.customers.findIndex(
            (c) => c.account_id === property.account_id && c.email === normalizedEmail,
          );
          const existingCustomer =
            existingCustomerIdx !== -1 ? world.customers[existingCustomerIdx] : undefined;

          if (existingCustomer) {
            if (existingCustomer.status === 'blocked') {
              return err(appError('not_allowed', 'This guest is blocked from booking here.'));
            }
            if (
              countActiveUnpaidHoldsForCustomer(world, property.account_id, existingCustomer.id) >=
              2
            ) {
              return err(appError('hold_limit'));
            }
          }

          const quote = quoteForUnit({
            world,
            unit,
            stayTerms,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: input.adults,
            children: input.children,
            today: manilaToday(clock),
          });
          if (!quote.ok) {
            return err(
              appError('not_allowed', 'Stay dates or guest count do not meet unit rules.', {
                reason: quote.reason,
              }),
            );
          }

          if (quote.data.total_centavos !== input.expectedTotal) {
            return err(appError('price_changed'));
          }

          const occupancyEnd = addDays(input.checkOut, stayTerms.prep_nights);
          // Imitates `exclude using gist (unit_id with =, during with &&) where (active)`.
          if (hasActiveOccupancyOverlap(world, unit.id, input.checkIn, occupancyEnd)) {
            return err(appError('dates_taken'));
          }

          const nowIso = nowIsoFromClock(clock);
          let customerId: string;
          let customerProfileId: string | null = null;
          if (existingCustomer && existingCustomerIdx !== -1) {
            customerId = existingCustomer.id;
            customerProfileId = existingCustomer.profile_id;
            if (existingCustomer.anonymised_at === null) {
              world.customers[existingCustomerIdx] = {
                ...existingCustomer,
                full_name: input.customer.full_name,
                mobile: input.customer.mobile,
                updated_at: nowIso,
              };
            }
          } else {
            customerId = ids.next('0010');
            world.customers.push({
              id: customerId,
              account_id: property.account_id,
              profile_id: null,
              full_name: input.customer.full_name,
              email: normalizedEmail,
              mobile: input.customer.mobile,
              status: 'active',
              owner_note: null,
              anonymised_at: null,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          for (const consent of input.consents) {
            world.customer_consents.push({
              id: ids.next('0011'),
              account_id: property.account_id,
              customer_id: customerId,
              kind: consent.kind,
              granted: consent.granted,
              source: 'booking_form',
              notice_version: consent.noticeVersion,
              created_at: nowIso,
            });
          }

          if (!canMove(BOOKING_LIFECYCLE, null, 'held', 'customer')) {
            return err(appError('invalid_move'));
          }

          const expiresAt = addMinutesIso(clock, stayTerms.hold_minutes);
          const occupancyId = ids.next('0012');
          world.unit_occupancy.push({
            id: occupancyId,
            account_id: property.account_id,
            unit_id: unit.id,
            during: { start: input.checkIn, end: occupancyEnd },
            buffer_nights: stayTerms.prep_nights,
            kind: 'hold',
            active: true,
            expires_at: expiresAt,
            note: null,
            created_by: null,
            created_at: nowIso,
            updated_at: nowIso,
            released_at: null,
          });

          // Allocated only after all validations succeed so booking_no has zero gaps.
          const bookingNo = nextAccountCounter(world, property.account_id, 'booking', nowIso);
          const bookingId = ids.next('0013');
          world.bookings.push({
            id: bookingId,
            account_id: property.account_id,
            property_id: property.id,
            unit_id: unit.id,
            customer_id: customerId,
            occupancy_id: occupancyId,
            booking_no: bookingNo,
            status: 'held',
            source: 'direct',
            source_note: null,
            adults: input.adults,
            children: input.children,
            nights: quote.data.nights,
            total_centavos: quote.data.total_centavos,
            required_centavos: quote.data.required_centavos,
            guest_note: input.guestNote,
            reward_claim_id: null,
            confirmed_at: null,
            checked_in_at: null,
            checked_out_at: null,
            cancelled_at: null,
            cancelled_by: null,
            cancel_reason: null,
            vehicle_plate: null,
            guest_list_submitted_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          for (const line of quote.data.lines) {
            world.booking_lines.push({
              id: ids.next('0014'),
              account_id: property.account_id,
              booking_id: bookingId,
              kind: line.kind,
              label: line.label,
              stay_date: line.stay_date,
              quantity: line.quantity,
              unit_centavos: line.unit_centavos,
              amount_centavos: line.amount_centavos,
              sort_order: line.sort_order,
              created_at: nowIso,
            });
          }

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: property.account_id,
            booking_id: bookingId,
            type: 'created',
            from_status: null,
            to_status: 'held',
            actor_kind: 'customer',
            actor_profile_id: customerProfileId,
            detail: {},
            created_at: nowIso,
          });

          const threadToken = generateThreadToken();
          const tokenHash = await sha256Hex(threadToken);
          const threadId = ids.next('001a');
          world.threads.push({
            id: threadId,
            account_id: property.account_id,
            customer_id: customerId,
            booking_id: bookingId,
            inquiry_id: null,
            lease_id: null,
            token_hash: tokenHash,
            status: 'open',
            closed_at: null,
            last_message_at: nowIso,
            customer_read_at: nowIso,
            owner_read_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          world.messages.push({
            id: ids.next('001b'),
            account_id: property.account_id,
            thread_id: threadId,
            sender_kind: 'customer',
            sender_profile_id: customerProfileId,
            kind: 'text',
            body:
              input.guestNote ??
              `Hold placed for ${unit.name} (${input.checkIn} to ${input.checkOut}).`,
            payment_id: null,
            file_id: null,
            hidden_at: null,
            hidden_by: null,
            created_at: nowIso,
          });

          world.notifications_outbox.push({
            id: ids.next('001c'),
            account_id: property.account_id,
            channel: 'email',
            template: 'booking.held',
            customer_id: customerId,
            profile_id: null,
            to_email: normalizedEmail,
            payload: { booking_id: bookingId, thread_id: threadId },
            dedupe_key: `booking.held:${bookingId}`,
            status: 'pending',
            attempts: 0,
            next_attempt_at: nowIso,
            last_error: null,
            sent_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          return ok({
            bookingId,
            bookingNo,
            threadId,
            threadToken,
            expiresAt,
          });
        },
      );
    },

    async getThread(input, session) {
      const guard = await beforeCall('getThread', session);
      if (!guard.ok) return guard;

      releaseExpiredHolds(world, clock, ids);

      const resolved = await resolveThreadAccess({
        world,
        session,
        inputThreadToken: input.threadToken,
        ...(input.threadId !== null ? { targetThreadId: input.threadId } : {}),
      });
      if (!resolved.ok) return resolved;

      return buildThreadView({
        world,
        threadIndex: resolved.data.threadIndex,
        bookingIndex: resolved.data.bookingIndex,
        clock,
        mediaConfig,
      });
    },

    async postMessage(input, session) {
      const guard = await beforeCall('postMessage', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'postMessage',
        input.idempotencyKey,
        session.role === 'owner' ? session.accountId : null,
        input,
        operations.postMessage.output,
        async () => {
          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: input.threadToken,
            targetThreadId: input.threadId,
          });
          if (!resolved.ok) return resolved;

          const thread = world.threads[resolved.data.threadIndex];
          if (!thread) return err(appError('not_found'));
          if (thread.status === 'closed') {
            return err(appError('not_allowed', 'This conversation is closed.'));
          }

          if (input.fileId !== null) {
            const file = world.files.find(
              (f) => f.id === input.fileId && f.account_id === thread.account_id,
            );
            if (!file) return err(appError('not_found'));
          }

          const nowIso = nowIsoFromClock(clock);
          const senderKind: 'owner' | 'customer' = session.role === 'owner' ? 'owner' : 'customer';
          const senderProfileId =
            session.role === 'owner'
              ? session.profileId
              : (world.customers.find((c) => c.id === thread.customer_id)?.profile_id ?? null);

          const messageRow: MessagesRow = {
            id: ids.next('001b'),
            account_id: thread.account_id,
            thread_id: thread.id,
            sender_kind: senderKind,
            sender_profile_id: senderProfileId,
            kind: 'text',
            body: input.body,
            payment_id: null,
            file_id: input.fileId,
            hidden_at: null,
            hidden_by: null,
            created_at: nowIso,
          };
          world.messages.push(messageRow);

          world.threads[resolved.data.threadIndex] = {
            ...thread,
            last_message_at: nowIso,
            customer_read_at: senderKind === 'customer' ? nowIso : thread.customer_read_at,
            owner_read_at: senderKind === 'owner' ? nowIso : thread.owner_read_at,
            updated_at: nowIso,
          };

          return ok(messageRow);
        },
      );
    },

    async submitPayment(input, session) {
      const guard = await beforeCall('submitPayment', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'submitPayment',
        input.idempotencyKey,
        null,
        input,
        operations.submitPayment.output,
        async () => {
          releaseExpiredHolds(world, clock, ids);

          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: input.threadToken,
            targetBookingId: input.bookingId,
          });
          if (!resolved.ok) return resolved;

          if (resolved.data.bookingIndex === null) {
            return err(appError('not_found'));
          }

          const booking = world.bookings[resolved.data.bookingIndex];
          const thread = world.threads[resolved.data.threadIndex];
          if (!booking || !thread) return err(appError('not_found'));

          const occIdx = world.unit_occupancy.findIndex((o) => o.id === booking.occupancy_id);
          const occ = occIdx !== -1 ? world.unit_occupancy[occIdx] : undefined;
          if (!occ) return err(appError('not_found'));

          if (
            booking.status === 'cancelled' ||
            booking.status === 'expired' ||
            booking.status === 'completed'
          ) {
            return err(appError('invalid_move'));
          }

          if (
            booking.status === 'held' &&
            !canMove(BOOKING_LIFECYCLE, 'held', 'in_review', 'customer')
          ) {
            return err(appError('invalid_move'));
          }

          if (!canMove(PAYMENT_LIFECYCLE, null, 'submitted', 'customer')) {
            return err(appError('invalid_move'));
          }

          let referenceNorm: string | null = null;
          if (input.referenceNo !== null) {
            const norm = normalizePaymentReference(input.referenceNo);
            if (norm.length === 0) {
              return err(
                appError('not_allowed', 'Payment reference must include letters or digits.'),
              );
            }
            referenceNorm = norm;

            // Imitates partial unique index `(account_id, method, reference_norm) where status in ('submitted', 'approved')`.
            const duplicate = world.payments.some(
              (p) =>
                p.account_id === booking.account_id &&
                p.method === input.method &&
                p.reference_norm === referenceNorm &&
                (p.status === 'submitted' || p.status === 'approved'),
            );
            if (duplicate) {
              return err(appError('reference_used'));
            }
          } else if (input.method !== 'cash' && input.method !== 'other') {
            return err(appError('not_allowed', 'Reference number is required for this method.'));
          }

          const nowIso = nowIsoFromClock(clock);
          const paymentId = ids.next('0018');
          const filesResult = ensureProofFilesExist({
            world,
            accountId: booking.account_id,
            customerId: booking.customer_id,
            fileIds: input.proofFileIds,
            paymentId,
            nowIso,
          });
          if (!filesResult.ok) return filesResult;

          const paymentRow = {
            id: paymentId,
            account_id: booking.account_id,
            customer_id: booking.customer_id,
            booking_id: booking.id,
            bill_id: null,
            kind: 'payment' as const,
            amount_centavos: input.amountCentavos,
            method: input.method,
            reference_no: input.referenceNo,
            reference_norm: referenceNorm,
            paid_on: input.paidOn,
            status: 'submitted' as const,
            submitted_by: 'customer' as const,
            reviewed_by: null,
            reviewed_at: null,
            reject_reason: null,
            receipt_no: null,
            wallet_checked: false,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.payments.push(paymentRow);

          input.proofFileIds.forEach((fileId, idx) => {
            world.payment_proofs.push({
              id: ids.next('0019'),
              account_id: booking.account_id,
              payment_id: paymentId,
              file_id: fileId,
              sort_order: idx,
              created_at: nowIso,
            });
          });

          // Proof extends active hold to 72 hours so owner has time to verify in their wallet.
          if (booking.status === 'held' || booking.status === 'in_review') {
            const extendedExpiry = addHoursIso(clock, 72);
            world.unit_occupancy[occIdx] = {
              ...occ,
              expires_at: extendedExpiry,
              updated_at: nowIso,
            };
          }

          if (booking.status === 'held') {
            world.bookings[resolved.data.bookingIndex] = {
              ...booking,
              status: 'in_review',
              updated_at: nowIso,
            };
          }

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'proof_submitted',
            from_status: booking.status,
            to_status: booking.status === 'held' ? 'in_review' : booking.status,
            actor_kind: 'customer',
            actor_profile_id: null,
            detail: { payment_id: paymentId, amount_centavos: input.amountCentavos },
            created_at: nowIso,
          });

          world.messages.push({
            id: ids.next('001b'),
            account_id: booking.account_id,
            thread_id: thread.id,
            sender_kind: 'customer',
            sender_profile_id: null,
            kind: 'payment',
            body: `Uploaded payment proof for ${input.method}.`,
            payment_id: paymentId,
            file_id: null,
            hidden_at: null,
            hidden_by: null,
            created_at: nowIso,
          });

          world.threads[resolved.data.threadIndex] = {
            ...thread,
            last_message_at: nowIso,
            customer_read_at: nowIso,
            updated_at: nowIso,
          };

          return ok(paymentRow);
        },
      );
    },

    async findMyBooking(input, session) {
      const guard = await beforeCall('findMyBooking', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'findMyBooking',
        input.idempotencyKey,
        null,
        input,
        operations.findMyBooking.output,
        async () => {
          const prop = world.properties.find(
            (p) => p.slug === input.propertySlug && p.status === 'published',
          );
          if (prop) {
            const normalizedEmail = input.email.toLowerCase();
            const customer = world.customers.find(
              (c) => c.account_id === prop.account_id && c.email === normalizedEmail,
            );
            if (customer) {
              const nowIso = nowIsoFromClock(clock);
              world.notifications_outbox.push({
                id: ids.next('001c'),
                account_id: prop.account_id,
                channel: 'email',
                template: 'booking.find_link',
                customer_id: customer.id,
                profile_id: null,
                to_email: normalizedEmail,
                payload: { property_id: prop.id },
                dedupe_key: `find_link:${prop.id}:${input.idempotencyKey}`,
                status: 'pending',
                attempts: 0,
                next_attempt_at: nowIso,
                last_error: null,
                sent_at: null,
                created_at: nowIso,
                updated_at: nowIso,
              });
            }
          }

          // Identical answer whether email is known or unknown so callers cannot enumerate guests.
          return ok({ queued: true });
        },
      );
    },

    async cancelBooking(input, session) {
      const guard = await beforeCall('cancelBooking', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'cancelBooking',
        input.idempotencyKey,
        session.role === 'owner' ? session.accountId : null,
        input,
        operations.cancelBooking.output,
        async () => {
          releaseExpiredHolds(world, clock, ids);

          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: input.threadToken,
            targetBookingId: input.bookingId,
          });
          if (!resolved.ok) return resolved;

          if (resolved.data.bookingIndex === null) {
            return err(appError('not_found'));
          }

          const booking = world.bookings[resolved.data.bookingIndex];
          if (!booking) return err(appError('not_found'));

          const actor = session.role === 'owner' ? 'owner' : 'customer';
          if (session.role !== 'owner' && input.cancelledBy !== 'customer') {
            return err(appError('not_allowed'));
          }

          if (!canMove(BOOKING_LIFECYCLE, booking.status, 'cancelled', actor)) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const occIdx = world.unit_occupancy.findIndex((o) => o.id === booking.occupancy_id);
          const occ = occIdx !== -1 ? world.unit_occupancy[occIdx] : undefined;
          if (occ && occ.active) {
            world.unit_occupancy[occIdx] = {
              ...occ,
              active: false,
              released_at: nowIso,
              updated_at: nowIso,
            };
          }

          const updated = {
            ...booking,
            status: 'cancelled' as const,
            cancelled_at: nowIso,
            cancelled_by: input.cancelledBy,
            cancel_reason: input.reason,
            updated_at: nowIso,
          };
          world.bookings[resolved.data.bookingIndex] = updated;

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'cancelled',
            from_status: booking.status,
            to_status: 'cancelled',
            actor_kind: actor,
            actor_profile_id: session.role === 'owner' ? session.profileId : null,
            detail: input.reason ? { reason: input.reason } : {},
            created_at: nowIso,
          });

          return ok(updated);
        },
      );
    },

    async ownerHome(input, session) {
      const guard = await beforeCall('ownerHome', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      releaseExpiredHolds(world, clock, ids);
      return buildOwnerHomeCounts(world, acctCheck.data, clock);
    },

    async listBookings(input, session) {
      const guard = await beforeCall('listBookings', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      releaseExpiredHolds(world, clock, ids);
      return buildBookingsBoard(world, acctCheck.data, input.status);
    },

    async getBooking(input, session) {
      const guard = await beforeCall('getBooking', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      releaseExpiredHolds(world, clock, ids);
      return buildBookingDetailView(world, acctCheck.data, input.bookingId);
    },

    async reviewPayment(input, session) {
      const guard = await beforeCall('reviewPayment', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'reviewPayment',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.reviewPayment.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const payIdx = world.payments.findIndex(
            (p) => p.id === input.paymentId && p.account_id === acctCheck.data,
          );
          if (payIdx === -1) return err(appError('not_found'));
          const payment = world.payments[payIdx];
          if (!payment || payment.booking_id === null) return err(appError('not_found'));

          if (!canMove(PAYMENT_LIFECYCLE, payment.status, input.decision, 'owner')) {
            return err(appError('invalid_move'));
          }

          const bookingIdx = world.bookings.findIndex((b) => b.id === payment.booking_id);
          const booking = bookingIdx !== -1 ? world.bookings[bookingIdx] : undefined;
          if (!booking) return err(appError('not_found'));

          const occIdx = world.unit_occupancy.findIndex((o) => o.id === booking.occupancy_id);
          const occ = occIdx !== -1 ? world.unit_occupancy[occIdx] : undefined;
          const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === booking.unit_id);
          if (!occ || !stayTerms) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);

          if (input.decision === 'approved') {
            // D33: require wallet_checked = true for GCash, Maya, and bank payments.
            if (
              (payment.method === 'gcash' ||
                payment.method === 'maya' ||
                payment.method === 'bank') &&
              !input.walletChecked
            ) {
              return err(
                appError('not_allowed', 'Check your own GCash, Maya or bank history first.', {
                  reason: 'wallet_not_checked',
                }),
              );
            }

            // Receipt counter increments only after all validation passes.
            const receiptNo = nextAccountCounter(world, acctCheck.data, 'receipt', nowIso);
            const updatedPayment = {
              ...payment,
              status: 'approved' as const,
              receipt_no: receiptNo,
              wallet_checked: input.walletChecked,
              reviewed_by: session.profileId,
              reviewed_at: nowIso,
              reject_reason: null,
              updated_at: nowIso,
            };
            world.payments[payIdx] = updatedPayment;

            const { paidCentavos } = calculatePaidAndBalance(world, booking);
            world.booking_events.push({
              id: ids.next('0015'),
              account_id: booking.account_id,
              booking_id: booking.id,
              type: 'payment_approved',
              from_status: null,
              to_status: null,
              actor_kind: 'owner',
              actor_profile_id: session.profileId,
              detail: {
                payment_id: payment.id,
                receipt_no: receiptNo,
                amount_centavos: payment.amount_centavos,
              },
              created_at: nowIso,
            });

            if (
              (booking.status === 'in_review' || booking.status === 'held') &&
              paidCentavos >= booking.required_centavos
            ) {
              if (
                booking.status === 'in_review' &&
                !canMove(BOOKING_LIFECYCLE, 'in_review', 'confirmed', 'owner')
              ) {
                return err(appError('invalid_move'));
              }

              world.bookings[bookingIdx] = {
                ...booking,
                status: 'confirmed',
                confirmed_at: nowIso,
                updated_at: nowIso,
              };
              world.unit_occupancy[occIdx] = {
                ...occ,
                kind: 'booking',
                expires_at: null,
                updated_at: nowIso,
              };
              world.booking_events.push({
                id: ids.next('0015'),
                account_id: booking.account_id,
                booking_id: booking.id,
                type: 'confirmed',
                from_status: booking.status,
                to_status: 'confirmed',
                actor_kind: 'owner',
                actor_profile_id: session.profileId,
                detail: {},
                created_at: nowIso,
              });
            }

            world.audit_logs.push({
              id: ids.next('001d'),
              account_id: acctCheck.data,
              actor_kind: 'owner',
              actor_profile_id: session.profileId,
              action: 'payment.approve',
              entity_table: 'payments',
              entity_id: payment.id,
              detail: { receipt_no: receiptNo },
              created_at: nowIso,
            });

            return ok(updatedPayment);
          }

          if (input.rejectReason === null || input.rejectReason.trim().length === 0) {
            return err(appError('not_allowed', 'A rejection reason is required.'));
          }

          const rejectedPayment = {
            ...payment,
            status: 'rejected' as const,
            reject_reason: input.rejectReason,
            reviewed_by: session.profileId,
            reviewed_at: nowIso,
            updated_at: nowIso,
          };
          world.payments[payIdx] = rejectedPayment;

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'payment_rejected',
            from_status: null,
            to_status: null,
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            detail: { payment_id: payment.id, reason: input.rejectReason },
            created_at: nowIso,
          });

          const hasOtherSubmitted = world.payments.some(
            (p) => p.booking_id === booking.id && p.status === 'submitted',
          );
          if (booking.status === 'in_review' && !hasOtherSubmitted) {
            if (!canMove(BOOKING_LIFECYCLE, 'in_review', 'held', 'owner')) {
              return err(appError('invalid_move'));
            }
            const restartedExpiry = addMinutesIso(clock, stayTerms.hold_minutes);
            world.bookings[bookingIdx] = {
              ...booking,
              status: 'held',
              updated_at: nowIso,
            };
            world.unit_occupancy[occIdx] = {
              ...occ,
              expires_at: restartedExpiry,
              updated_at: nowIso,
            };
            world.booking_events.push({
              id: ids.next('0015'),
              account_id: booking.account_id,
              booking_id: booking.id,
              type: 'note',
              from_status: 'in_review',
              to_status: 'held',
              actor_kind: 'owner',
              actor_profile_id: session.profileId,
              detail: { note: 'Proof rejected; hold clock restarted.' },
              created_at: nowIso,
            });
          }

          return ok(rejectedPayment);
        },
      );
    },

    async recordOwnerPayment(input, session) {
      const guard = await beforeCall('recordOwnerPayment', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'recordOwnerPayment',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.recordOwnerPayment.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const bookingIdx = world.bookings.findIndex(
            (b) => b.id === input.bookingId && b.account_id === acctCheck.data,
          );
          if (bookingIdx === -1) return err(appError('not_found'));
          const booking = world.bookings[bookingIdx];
          if (!booking) return err(appError('not_found'));

          if (input.kind === 'payment') {
            if (booking.status === 'cancelled' || booking.status === 'expired') {
              return err(appError('invalid_move'));
            }
          } else {
            const { paidCentavos } = calculatePaidAndBalance(world, booking);
            if (input.amountCentavos > paidCentavos) {
              return err(appError('invalid_move', 'Refund cannot exceed paid amount.'));
            }
          }

          if (!canMove(PAYMENT_LIFECYCLE, null, 'approved', 'owner')) {
            return err(appError('invalid_move'));
          }

          let referenceNorm: string | null = null;
          if (input.referenceNo !== null) {
            const norm = normalizePaymentReference(input.referenceNo);
            if (norm.length === 0) {
              return err(appError('not_allowed'));
            }
            referenceNorm = norm;
            const duplicate = world.payments.some(
              (p) =>
                p.account_id === acctCheck.data &&
                p.method === input.method &&
                p.reference_norm === referenceNorm &&
                (p.status === 'submitted' || p.status === 'approved'),
            );
            if (duplicate) return err(appError('reference_used'));
          } else if (input.method !== 'cash' && input.method !== 'other') {
            return err(appError('not_allowed'));
          }

          const nowIso = nowIsoFromClock(clock);
          const receiptNo = nextAccountCounter(world, acctCheck.data, 'receipt', nowIso);
          const paymentId = ids.next('0018');
          const requiresWalletCheck =
            input.method === 'gcash' || input.method === 'maya' || input.method === 'bank';

          const paymentRow = {
            id: paymentId,
            account_id: acctCheck.data,
            customer_id: booking.customer_id,
            booking_id: booking.id,
            bill_id: null,
            kind: input.kind,
            amount_centavos: input.amountCentavos,
            method: input.method,
            reference_no: input.referenceNo,
            reference_norm: referenceNorm,
            paid_on: input.paidOn,
            status: 'approved' as const,
            submitted_by: 'owner' as const,
            reviewed_by: session.profileId,
            reviewed_at: nowIso,
            reject_reason: null,
            receipt_no: receiptNo,
            wallet_checked: requiresWalletCheck,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.payments.push(paymentRow);

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: acctCheck.data,
            booking_id: booking.id,
            type: 'payment_approved',
            from_status: null,
            to_status: null,
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            detail: { payment_id: paymentId, kind: input.kind, receipt_no: receiptNo },
            created_at: nowIso,
          });

          if (input.kind === 'payment' && booking.status === 'in_review') {
            const { paidCentavos } = calculatePaidAndBalance(world, booking);
            if (
              paidCentavos >= booking.required_centavos &&
              canMove(BOOKING_LIFECYCLE, 'in_review', 'confirmed', 'owner')
            ) {
              const occIdx = world.unit_occupancy.findIndex((o) => o.id === booking.occupancy_id);
              const occ = occIdx !== -1 ? world.unit_occupancy[occIdx] : undefined;
              world.bookings[bookingIdx] = {
                ...booking,
                status: 'confirmed',
                confirmed_at: nowIso,
                updated_at: nowIso,
              };
              if (occ) {
                world.unit_occupancy[occIdx] = {
                  ...occ,
                  kind: 'booking',
                  expires_at: null,
                  updated_at: nowIso,
                };
              }
              world.booking_events.push({
                id: ids.next('0015'),
                account_id: acctCheck.data,
                booking_id: booking.id,
                type: 'confirmed',
                from_status: 'in_review',
                to_status: 'confirmed',
                actor_kind: 'owner',
                actor_profile_id: session.profileId,
                detail: {},
                created_at: nowIso,
              });
            }
          }

          return ok(paymentRow);
        },
      );
    },

    async setBlock(input, session) {
      const guard = await beforeCall('setBlock', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'setBlock',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.setBlock.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const unit = world.units.find(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (!unit) return err(appError('not_found'));

          releaseExpiredHolds(world, clock, ids, unit.id);

          if (hasActiveOccupancyOverlap(world, unit.id, input.during.start, input.during.end)) {
            return err(appError('dates_taken'));
          }

          const nowIso = nowIsoFromClock(clock);
          const occRow = {
            id: ids.next('0012'),
            account_id: acctCheck.data,
            unit_id: unit.id,
            during: input.during,
            buffer_nights: 0,
            kind: 'block' as const,
            active: true,
            expires_at: null,
            note: input.note,
            created_by: session.profileId,
            created_at: nowIso,
            updated_at: nowIso,
            released_at: null,
          };
          world.unit_occupancy.push(occRow);
          return ok(occRow);
        },
      );
    },

    async releaseBlock(input, session) {
      const guard = await beforeCall('releaseBlock', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'releaseBlock',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.releaseBlock.output,
        async () => {
          const occIdx = world.unit_occupancy.findIndex(
            (o) => o.id === input.occupancyId && o.account_id === acctCheck.data,
          );
          if (occIdx === -1) return err(appError('not_found'));
          const occ = world.unit_occupancy[occIdx];
          if (!occ) return err(appError('not_found'));
          if (occ.kind !== 'block') {
            return err(appError('not_allowed', 'Only owner blocks can be released directly.'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...occ,
            active: false,
            released_at: nowIso,
            updated_at: nowIso,
          };
          world.unit_occupancy[occIdx] = updated;
          return ok(updated);
        },
      );
    },

    async createManualBooking(input, session) {
      const guard = await beforeCall('createManualBooking', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'createManualBooking',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.createManualBooking.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const unit = world.units.find(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (!unit) return err(appError('not_found'));

          const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id);
          if (!stayTerms) return err(appError('not_allowed'));

          releaseExpiredHolds(world, clock, ids, unit.id);

          const today = manilaToday(clock);
          const quoteToday = input.checkIn < today ? input.checkIn : today;
          const quote = quoteForUnit({
            world,
            unit,
            stayTerms,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: input.adults,
            children: input.children,
            today: quoteToday,
          });
          if (!quote.ok) {
            return err(
              appError('not_allowed', 'Stay dates or guest count do not meet unit rules.', {
                reason: quote.reason,
              }),
            );
          }

          const occupancyEnd = addDays(input.checkOut, stayTerms.prep_nights);
          if (hasActiveOccupancyOverlap(world, unit.id, input.checkIn, occupancyEnd)) {
            return err(appError('dates_taken'));
          }

          if (!canMove(BOOKING_LIFECYCLE, null, 'confirmed', 'owner')) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const normalizedEmail = input.customer.email.toLowerCase();
          let customer = world.customers.find(
            (c) => c.account_id === acctCheck.data && c.email === normalizedEmail,
          );
          if (!customer) {
            customer = {
              id: ids.next('0010'),
              account_id: acctCheck.data,
              profile_id: null,
              full_name: input.customer.full_name,
              email: normalizedEmail,
              mobile: input.customer.mobile,
              status: 'active',
              owner_note: null,
              anonymised_at: null,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.customers.push(customer);
          }

          const occupancyId = ids.next('0012');
          world.unit_occupancy.push({
            id: occupancyId,
            account_id: acctCheck.data,
            unit_id: unit.id,
            during: { start: input.checkIn, end: occupancyEnd },
            buffer_nights: stayTerms.prep_nights,
            kind: 'booking',
            active: true,
            expires_at: null,
            note: null,
            created_by: session.profileId,
            created_at: nowIso,
            updated_at: nowIso,
            released_at: null,
          });

          const bookingNo = nextAccountCounter(world, acctCheck.data, 'booking', nowIso);
          const bookingId = ids.next('0013');
          const bookingRow = {
            id: bookingId,
            account_id: acctCheck.data,
            property_id: unit.property_id,
            unit_id: unit.id,
            customer_id: customer.id,
            occupancy_id: occupancyId,
            booking_no: bookingNo,
            status: 'confirmed' as const,
            source: 'manual' as const,
            source_note: input.sourceNote,
            adults: input.adults,
            children: input.children,
            nights: quote.data.nights,
            total_centavos: quote.data.total_centavos,
            required_centavos: quote.data.required_centavos,
            guest_note: input.guestNote,
            reward_claim_id: null,
            confirmed_at: nowIso,
            checked_in_at: null,
            checked_out_at: null,
            cancelled_at: null,
            cancelled_by: null,
            cancel_reason: null,
            vehicle_plate: null,
            guest_list_submitted_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.bookings.push(bookingRow);

          for (const line of quote.data.lines) {
            world.booking_lines.push({
              id: ids.next('0014'),
              account_id: acctCheck.data,
              booking_id: bookingId,
              kind: line.kind,
              label: line.label,
              stay_date: line.stay_date,
              quantity: line.quantity,
              unit_centavos: line.unit_centavos,
              amount_centavos: line.amount_centavos,
              sort_order: line.sort_order,
              created_at: nowIso,
            });
          }

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: acctCheck.data,
            booking_id: bookingId,
            type: 'confirmed',
            from_status: null,
            to_status: 'confirmed',
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            detail: {},
            created_at: nowIso,
          });

          const threadToken = generateThreadToken();
          const tokenHash = await sha256Hex(threadToken);
          const threadId = ids.next('001a');
          world.threads.push({
            id: threadId,
            account_id: acctCheck.data,
            customer_id: customer.id,
            booking_id: bookingId,
            inquiry_id: null,
            lease_id: null,
            token_hash: tokenHash,
            status: 'open',
            closed_at: null,
            last_message_at: nowIso,
            customer_read_at: null,
            owner_read_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso,
          });

          return ok(bookingRow);
        },
      );
    },

    async changeBookingDates(input, session) {
      const guard = await beforeCall('changeBookingDates', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'changeBookingDates',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.changeBookingDates.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const bookingIdx = world.bookings.findIndex(
            (b) => b.id === input.bookingId && b.account_id === acctCheck.data,
          );
          if (bookingIdx === -1) return err(appError('not_found'));
          const booking = world.bookings[bookingIdx];
          if (!booking) return err(appError('not_found'));

          if (
            booking.status === 'completed' ||
            booking.status === 'cancelled' ||
            booking.status === 'expired'
          ) {
            return err(appError('invalid_move'));
          }

          const unit = world.units.find((u) => u.id === booking.unit_id);
          const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === booking.unit_id);
          const occIdx = world.unit_occupancy.findIndex((o) => o.id === booking.occupancy_id);
          const occ = occIdx !== -1 ? world.unit_occupancy[occIdx] : undefined;
          if (!unit || !stayTerms || !occ || !occ.active) return err(appError('not_found'));

          releaseExpiredHolds(world, clock, ids, unit.id);

          const today = manilaToday(clock);
          const quoteToday =
            input.checkIn < today
              ? addDays(input.checkIn, -Math.max(stayTerms.advance_notice_days, 1))
              : addDays(today, -stayTerms.advance_notice_days);

          const quote = quoteForUnit({
            world,
            unit,
            stayTerms,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: booking.adults,
            children: booking.children,
            today: quoteToday,
          });
          if (!quote.ok) {
            return err(
              appError('not_allowed', 'New dates do not meet unit stay rules.', {
                reason: quote.reason,
              }),
            );
          }

          const newOccupancyEnd = addDays(input.checkOut, stayTerms.prep_nights);
          // Imitates Postgres excluding the booking's own occupancy row while updating `during`.
          if (hasActiveOccupancyOverlap(world, unit.id, input.checkIn, newOccupancyEnd, occ.id)) {
            return err(appError('dates_taken'));
          }

          const nowIso = nowIsoFromClock(clock);
          world.unit_occupancy[occIdx] = {
            ...occ,
            during: { start: input.checkIn, end: newOccupancyEnd },
            updated_at: nowIso,
          };

          for (let i = world.booking_lines.length - 1; i >= 0; i -= 1) {
            if (world.booking_lines[i]?.booking_id === booking.id) {
              world.booking_lines.splice(i, 1);
            }
          }
          for (const line of quote.data.lines) {
            world.booking_lines.push({
              id: ids.next('0014'),
              account_id: booking.account_id,
              booking_id: booking.id,
              kind: line.kind,
              label: line.label,
              stay_date: line.stay_date,
              quantity: line.quantity,
              unit_centavos: line.unit_centavos,
              amount_centavos: line.amount_centavos,
              sort_order: line.sort_order,
              created_at: nowIso,
            });
          }

          const updatedBooking = {
            ...booking,
            nights: quote.data.nights,
            total_centavos: quote.data.total_centavos,
            required_centavos: quote.data.required_centavos,
            updated_at: nowIso,
          };
          world.bookings[bookingIdx] = updatedBooking;

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'dates_changed',
            from_status: null,
            to_status: null,
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            detail: { check_in: input.checkIn, check_out: input.checkOut },
            created_at: nowIso,
          });

          return ok(updatedBooking);
        },
      );
    },

    async listThreads(input, session) {
      const guard = await beforeCall('listThreads', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return buildInboxThreads(world, acctCheck.data, input.unreadOnly);
    },

    async listOwnerAccounts(input, session) {
      const guard = await beforeCall('listOwnerAccounts', session);
      if (!guard.ok) return guard;
      return buildAdminOwnerAccounts(world, input.status, clock);
    },

    async approveAccount(input, session) {
      const guard = await beforeCall('approveAccount', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'approveAccount',
        input.idempotencyKey,
        input.accountId,
        input,
        operations.approveAccount.output,
        async () => {
          if (session.role !== 'super_admin') return err(appError('not_allowed'));

          const acctIdx = world.accounts.findIndex((a) => a.id === input.accountId);
          if (acctIdx === -1) return err(appError('not_found'));
          const account = world.accounts[acctIdx];
          if (!account) return err(appError('not_found'));

          if (account.status !== 'pending') {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const today = manilaToday(clock);
          const updated = {
            ...account,
            status: 'active' as const,
            approved_at: nowIso,
            approved_by: session.profileId,
            updated_at: nowIso,
          };
          world.accounts[acctIdx] = updated;

          const hasSub = world.subscriptions.some((s) => s.account_id === account.id);
          if (!hasSub && canMove(SUBSCRIPTION_LIFECYCLE, null, 'trial', 'super_admin')) {
            const plan = world.plans.find((p) => p.code === 'standard') ?? world.plans[0];
            if (plan) {
              world.subscriptions.push({
                id: ids.next('000d'),
                account_id: account.id,
                plan_id: plan.id,
                status: 'trial',
                trial_ends_on: addDays(today, plan.trial_days),
                paid_through: null,
                extra_units: 0,
                paused_at: null,
                created_at: nowIso,
                updated_at: nowIso,
              });
            }
          }

          return ok(updated);
        },
      );
    },

    async expireHolds(_input, session) {
      const guard = await beforeCall('expireHolds', session);
      if (!guard.ok) return guard;

      const expiredCount = releaseExpiredHolds(world, clock, ids);
      return ok({ expiredCount });
    },

    async reversePayment(input, session) {
      const guard = await beforeCall('reversePayment', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'reversePayment',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.reversePayment.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const payIdx = world.payments.findIndex(
            (p) => p.id === input.paymentId && p.account_id === acctCheck.data,
          );
          if (payIdx === -1) return err(appError('not_found'));
          const payment = world.payments[payIdx];
          if (!payment || payment.booking_id === null) return err(appError('not_found'));

          if (!canMove(PAYMENT_LIFECYCLE, payment.status, 'reversed', 'owner')) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...payment,
            status: 'reversed' as const,
            reject_reason: input.reason,
            updated_at: nowIso,
          };
          world.payments[payIdx] = updated;

          const bookingIdx = world.bookings.findIndex((b) => b.id === payment.booking_id);
          const booking = bookingIdx !== -1 ? world.bookings[bookingIdx] : undefined;
          if (booking) {
            world.booking_events.push({
              id: ids.next('0015'),
              account_id: booking.account_id,
              booking_id: booking.id,
              type: 'note',
              from_status: null,
              to_status: null,
              actor_kind: 'owner',
              actor_profile_id: session.profileId,
              detail: { action: 'payment.reverse', payment_id: payment.id, reason: input.reason },
              created_at: nowIso,
            });
          }

          world.audit_logs.push({
            id: ids.next('001d'),
            account_id: acctCheck.data,
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            action: 'payment.reverse',
            entity_table: 'payments',
            entity_id: payment.id,
            detail: { reason: input.reason },
            created_at: nowIso,
          });

          return ok(updated);
        },
      );
    },

    async markCheckedIn(input, session) {
      const guard = await beforeCall('markCheckedIn', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'markCheckedIn',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.markCheckedIn.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const bookingIdx = world.bookings.findIndex(
            (b) => b.id === input.bookingId && b.account_id === acctCheck.data,
          );
          if (bookingIdx === -1) return err(appError('not_found'));
          const booking = world.bookings[bookingIdx];
          if (!booking) return err(appError('not_found'));

          if (!canMove(BOOKING_LIFECYCLE, booking.status, 'checked_in', 'owner')) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...booking,
            status: 'checked_in' as const,
            checked_in_at: nowIso,
            updated_at: nowIso,
          };
          world.bookings[bookingIdx] = updated;

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'checked_in',
            from_status: booking.status,
            to_status: 'checked_in',
            actor_kind: 'owner',
            actor_profile_id: session.profileId,
            detail: {},
            created_at: nowIso,
          });

          return ok(updated);
        },
      );
    },

    async completeBooking(input, session) {
      const guard = await beforeCall('completeBooking', session);
      if (!guard.ok) return guard;
      if (session.role === 'owner' && session.accountId !== input.accountId) {
        return err(appError('not_allowed'));
      }

      return runIdempotent(
        'completeBooking',
        input.idempotencyKey,
        input.accountId,
        input,
        operations.completeBooking.output,
        async () => {
          const bookingIdx = world.bookings.findIndex(
            (b) => b.id === input.bookingId && b.account_id === input.accountId,
          );
          if (bookingIdx === -1) return err(appError('not_found'));
          const booking = world.bookings[bookingIdx];
          if (!booking) return err(appError('not_found'));

          const actor = session.role === 'system' ? 'system' : 'owner';
          if (!canMove(BOOKING_LIFECYCLE, booking.status, 'completed', actor)) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...booking,
            status: 'completed' as const,
            checked_out_at: nowIso,
            updated_at: nowIso,
          };
          world.bookings[bookingIdx] = updated;

          world.booking_events.push({
            id: ids.next('0015'),
            account_id: booking.account_id,
            booking_id: booking.id,
            type: 'completed',
            from_status: booking.status,
            to_status: 'completed',
            actor_kind: actor,
            actor_profile_id: session.role === 'owner' ? session.profileId : null,
            detail: {},
            created_at: nowIso,
          });

          return ok(updated);
        },
      );
    },

    async submitGuestList(input, session) {
      const guard = await beforeCall('submitGuestList', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'submitGuestList',
        input.idempotencyKey,
        null,
        input,
        operations.submitGuestList.output,
        async () => {
          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: input.threadToken,
            targetBookingId: input.bookingId,
          });
          if (!resolved.ok) return resolved;

          if (resolved.data.bookingIndex === null) {
            return err(appError('not_found'));
          }
          const booking = world.bookings[resolved.data.bookingIndex];
          if (!booking) return err(appError('not_found'));

          if (booking.guest_list_submitted_at !== null) {
            return err(
              appError('not_allowed', 'Guest list has already been submitted and locked.'),
            );
          }

          if (input.guests.length > booking.adults + booking.children) {
            return err(appError('not_allowed', 'Guest list exceeds booking headcount.'));
          }

          const nowIso = nowIsoFromClock(clock);
          for (const g of input.guests) {
            if (g.id_file_id === null) continue;
            const existingFile = world.files.find((f) => f.id === g.id_file_id);
            if (existingFile) {
              if (existingFile.account_id !== booking.account_id) {
                return err(appError('not_found'));
              }
            } else {
              world.files.push({
                id: g.id_file_id,
                account_id: booking.account_id,
                bucket: 'documents',
                path: `${booking.account_id}/guest-ids/${g.id_file_id}.webp`,
                purpose: 'guest_id',
                mime: 'image/webp',
                size_bytes: 64_000,
                width: 800,
                height: 600,
                uploaded_by_kind: 'customer',
                customer_id: booking.customer_id,
                uploaded_by_profile: null,
                used_by_table: 'booking_guests',
                used_by_id: booking.id,
                status: 'ready',
                confirmed_at: nowIso,
                delete_after: null,
                deleted_at: null,
                created_at: nowIso,
                updated_at: nowIso,
              });
            }
          }

          const createdGuests = input.guests.map((g) => {
            const row = {
              id: ids.next('0016'),
              account_id: booking.account_id,
              booking_id: booking.id,
              full_name: g.full_name,
              is_minor: g.is_minor,
              id_file_id: g.id_file_id,
              sort_order: g.sort_order,
              created_at: nowIso,
              updated_at: nowIso,
            };
            world.booking_guests.push(row);
            return row;
          });

          world.bookings[resolved.data.bookingIndex] = {
            ...booking,
            vehicle_plate: input.vehiclePlate,
            guest_list_submitted_at: nowIso,
            updated_at: nowIso,
          };

          return ok(createdGuests);
        },
      );
    },

    async rotateThreadLink(input, session) {
      const guard = await beforeCall('rotateThreadLink', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'rotateThreadLink',
        input.idempotencyKey,
        session.role === 'owner' ? session.accountId : null,
        input,
        operations.rotateThreadLink.output,
        async () => {
          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: null,
            targetThreadId: input.threadId,
          });
          if (!resolved.ok) return resolved;

          const thread = world.threads[resolved.data.threadIndex];
          if (!thread) return err(appError('not_found'));

          const newToken = generateThreadToken();
          const newHash = await sha256Hex(newToken);
          const nowIso = nowIsoFromClock(clock);

          world.threads[resolved.data.threadIndex] = {
            ...thread,
            token_hash: newHash,
            updated_at: nowIso,
          };

          return ok({
            threadId: thread.id,
            threadToken: newToken,
          });
        },
      );
    },

    async publishPropertyPage(input, session) {
      const guard = await beforeCall('publishPropertyPage', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'publishPropertyPage',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.publishPropertyPage.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          // Imitates DB rule (D47, D57): pending owners can save everything but cannot publish.
          const account = world.accounts.find((a) => a.id === acctCheck.data);
          if (!account || account.status !== 'active') {
            return err(
              appError('not_allowed', 'Your account is waiting for approval before you can publish.'),
            );
          }

          const pageIdx = world.property_pages.findIndex(
            (pg) => pg.property_id === input.propertyId && pg.account_id === acctCheck.data,
          );
          if (pageIdx === -1) return err(appError('not_found'));
          const page = world.property_pages[pageIdx];
          if (!page) return err(appError('not_found'));

          if (page.version !== input.expectedVersion) {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...page,
            published: page.draft,
            version: page.version + 1,
            published_at: nowIso,
            published_by: session.profileId,
            updated_at: nowIso,
          };
          world.property_pages[pageIdx] = updated;

          // D57: properties.status = 'published' decides whether the public page shows.
          const propIdx = world.properties.findIndex((p) => p.id === input.propertyId);
          const prop = propIdx !== -1 ? world.properties[propIdx] : undefined;
          if (prop) {
            world.properties[propIdx] = {
              ...prop,
              status: 'published',
              published_at: prop.published_at ?? nowIso,
              updated_at: nowIso,
            };
          }

          return ok(updated);
        },
      );
    },

    async changeSlug(input, session) {
      const guard = await beforeCall('changeSlug', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'changeSlug',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.changeSlug.output,
        async () => {
          const propIdx = world.properties.findIndex(
            (p) => p.id === input.propertyId && p.account_id === acctCheck.data,
          );
          if (propIdx === -1) return err(appError('not_found'));
          const prop = world.properties[propIdx];
          if (!prop) return err(appError('not_found'));

          if (prop.slug === input.newSlug) {
            return err(
              reasonError('not_allowed', 'slug_taken', {
                fields: { newSlug: words.errorReasons.slug_taken },
              }),
            );
          }

          const slugCheck = validateSlugChangeInMemory({
            world,
            auth,
            clock,
            rawSlug: input.newSlug,
            fieldName: 'newSlug',
            existingProperty: prop,
          });
          if (!slugCheck.ok) return slugCheck;

          recordSlugChangeTimestamp(auth, clock, prop.id);
          const oldSlugs = [...prop.old_slugs, prop.slug];
          const nowIso = nowIsoFromClock(clock);
          world.properties[propIdx] = {
            ...prop,
            slug: slugCheck.data,
            old_slugs: oldSlugs,
            updated_at: nowIso,
          };

          return ok({
            slug: slugCheck.data,
            oldSlugs,
          });
        },
      );
    },

    async submitReview(input, session) {
      const guard = await beforeCall('submitReview', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'submitReview',
        input.idempotencyKey,
        null,
        input,
        operations.submitReview.output,
        async () => {
          const resolved = await resolveThreadAccess({
            world,
            session,
            inputThreadToken: input.threadToken,
            targetBookingId: input.bookingId,
          });
          if (!resolved.ok) return resolved;

          if (resolved.data.bookingIndex === null) {
            return err(appError('not_found'));
          }
          const booking = world.bookings[resolved.data.bookingIndex];
          if (!booking) return err(appError('not_found'));

          if (booking.status !== 'completed') {
            return err(appError('invalid_move'));
          }

          const alreadyReviewed = world.stay_reviews.some((r) => r.booking_id === booking.id);
          if (alreadyReviewed) {
            return err(appError('invalid_move', 'This stay has already been reviewed.'));
          }

          const property = world.properties.find((p) => p.id === booking.property_id);
          const nowIso = nowIsoFromClock(clock);
          const review = {
            id: ids.next('0017'),
            account_id: booking.account_id,
            booking_id: booking.id,
            customer_id: booking.customer_id,
            stars: input.stars,
            note: input.note,
            note_hidden: false,
            created_at: nowIso,
          };
          world.stay_reviews.push(review);

          return ok({
            review,
            googleReviewUrl: property?.contact.google_review_url ?? null,
          });
        },
      );
    },

    async createExport(input, session) {
      const guard = await beforeCall('createExport', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'createExport',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.createExport.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const hasPreparing = world.data_exports.some(
            (e) => e.account_id === acctCheck.data && e.status === 'preparing',
          );
          if (hasPreparing) {
            return err(appError('not_allowed', 'An export is already preparing.'));
          }

          const nowIso = nowIsoFromClock(clock);
          const exportId = ids.next('0021');
          const fileId = ids.next('0006');
          world.files.push({
            id: fileId,
            account_id: acctCheck.data,
            bucket: 'documents',
            path: `${acctCheck.data}/exports/${exportId}.zip`,
            purpose: 'data_export',
            mime: 'application/zip',
            size_bytes: 24_000,
            width: null,
            height: null,
            uploaded_by_kind: 'system',
            customer_id: null,
            uploaded_by_profile: null,
            used_by_table: 'data_exports',
            used_by_id: exportId,
            status: 'ready',
            confirmed_at: nowIso,
            delete_after: addHoursIso(clock, 24),
            deleted_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          });

          const row = {
            id: exportId,
            account_id: acctCheck.data,
            range: input.range,
            parts: input.parts,
            status: 'ready' as const,
            file_id: fileId,
            expires_at: addHoursIso(clock, 24),
            created_by: session.profileId,
            created_at: nowIso,
          };
          world.data_exports.push(row);
          return ok(row);
        },
      );
    },

    async reportPage(input, session) {
      const guard = await beforeCall('reportPage', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'reportPage',
        input.idempotencyKey,
        null,
        input,
        operations.reportPage.output,
        async () => {
          const prop = world.properties.find(
            (p) => p.id === input.propertyId && p.status === 'published',
          );
          if (!prop) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);
          const reportRow: PageReportsRow = {
            id: ids.next('0022'),
            property_id: prop.id,
            reason: input.reason,
            details: input.details,
            reporter_email: input.reporterEmail,
            status: 'new',
            created_at: nowIso,
            closed_at: null,
            closed_by: null,
          };
          world.page_reports.push(reportRow);
          return ok(reportRow);
        },
      );
    },

    async duplicateUnit(input, session) {
      const guard = await beforeCall('duplicateUnit', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'duplicateUnit',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.duplicateUnit.output,
        async () => {
          const sourceUnit = world.units.find(
            (u) => u.id === input.unitId && u.account_id === acctCheck.data,
          );
          if (!sourceUnit) return err(appError('not_found'));

          const limitCheck = checkUnitLimitForAccount(world, acctCheck.data, 1);
          if (!limitCheck.ok) return limitCheck;

          const nowIso = nowIsoFromClock(clock);
          const newUnitId = ids.next('0005');
          const copyCount = world.units.filter(
            (u) => u.property_id === sourceUnit.property_id,
          ).length;
          const copySlug = `${sourceUnit.slug.slice(0, 32)}-copy-${copyCount + 1}`;
          const clonedUnit = {
            ...sourceUnit,
            id: newUnitId,
            slug: copySlug,
            name: `${sourceUnit.name.slice(0, 72)} (Copy)`,
            status: 'unlisted' as const,
            sort_order: copyCount,
            archived_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          };
          world.units.push(clonedUnit);

          const stayTerm = world.unit_stay_terms.find((t) => t.unit_id === sourceUnit.id);
          if (stayTerm) {
            world.unit_stay_terms.push({
              ...stayTerm,
              unit_id: newUnitId,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          return ok(clonedUnit);
        },
      );
    },

    async hideMessage(input, session) {
      const guard = await beforeCall('hideMessage', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'hideMessage',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.hideMessage.output,
        async () => {
          if (session.role !== 'owner') return err(appError('not_allowed'));

          const msgIdx = world.messages.findIndex(
            (m) => m.id === input.messageId && m.account_id === acctCheck.data,
          );
          if (msgIdx === -1) return err(appError('not_found'));
          const msg = world.messages[msgIdx];
          if (!msg) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...msg,
            hidden_at: nowIso,
            hidden_by: session.profileId,
          };
          world.messages[msgIdx] = updated;
          return ok(updated);
        },
      );
    },

    async closeThread(input, session) {
      const guard = await beforeCall('closeThread', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'closeThread',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.closeThread.output,
        async () => {
          const threadIdx = world.threads.findIndex(
            (t) => t.id === input.threadId && t.account_id === acctCheck.data,
          );
          if (threadIdx === -1) return err(appError('not_found'));
          const thread = world.threads[threadIdx];
          if (!thread) return err(appError('not_found'));

          if (thread.status === 'closed') {
            return err(appError('invalid_move'));
          }

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...thread,
            status: 'closed' as const,
            closed_at: nowIso,
            updated_at: nowIso,
          };
          world.threads[threadIdx] = updated;
          return ok(updated);
        },
      );
    },

    async blockCustomer(input, session) {
      const guard = await beforeCall('blockCustomer', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return runIdempotent(
        'blockCustomer',
        input.idempotencyKey,
        acctCheck.data,
        input,
        operations.blockCustomer.output,
        async () => {
          const custIdx = world.customers.findIndex(
            (c) => c.id === input.customerId && c.account_id === acctCheck.data,
          );
          if (custIdx === -1) return err(appError('not_found'));
          const cust = world.customers[custIdx];
          if (!cust) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...cust,
            status: 'blocked' as const,
            updated_at: nowIso,
          };
          world.customers[custIdx] = updated;
          return ok(updated);
        },
      );
    },

    async joinAsMember(input, session) {
      const guard = await beforeCall('joinAsMember', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'joinAsMember',
        input.idempotencyKey,
        input.accountId,
        input,
        operations.joinAsMember.output,
        async () => {
          const account = world.accounts.find((a) => a.id === input.accountId);
          if (!account) return err(appError('not_found'));

          const normalizedEmail = input.email.toLowerCase();
          const custIdx = world.customers.findIndex(
            (c) => c.account_id === account.id && c.email === normalizedEmail,
          );
          if (custIdx === -1) return err(appError('not_found'));
          const customer = world.customers[custIdx];
          if (!customer) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);
          let profileId = customer.profile_id;
          if (profileId === null) {
            profileId = ids.next('0002');
            world.profiles.push({
              id: profileId,
              full_name: customer.full_name,
              avatar: null,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          const updated = {
            ...customer,
            profile_id: profileId,
            updated_at: nowIso,
          };
          world.customers[custIdx] = updated;
          return ok(updated);
        },
      );
    },

    async reviewPlanPayment(input, session) {
      const guard = await beforeCall('reviewPlanPayment', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'reviewPlanPayment',
        input.idempotencyKey,
        null,
        input,
        operations.reviewPlanPayment.output,
        async () => {
          if (session.role !== 'super_admin') return err(appError('not_allowed'));

          const spIdx = world.subscription_payments.findIndex(
            (sp) => sp.id === input.subscriptionPaymentId,
          );
          if (spIdx === -1) return err(appError('not_found'));
          const sp = world.subscription_payments[spIdx];
          if (!sp) return err(appError('not_found'));
          if (sp.status !== 'submitted') return err(appError('invalid_move'));

          const nowIso = nowIsoFromClock(clock);
          const today = manilaToday(clock);
          if (input.decision === 'rejected') {
            if (input.rejectReason === null || input.rejectReason.trim().length === 0) {
              return err(appError('not_allowed'));
            }
            const rejected = {
              ...sp,
              status: 'rejected' as const,
              reject_reason: input.rejectReason,
              reviewed_by: session.profileId,
              reviewed_at: nowIso,
              updated_at: nowIso,
            };
            world.subscription_payments[spIdx] = rejected;
            return ok(rejected);
          }

          const coversFrom = today;
          const coversTo = addDays(today, sp.months * 30);
          const approved = {
            ...sp,
            status: 'approved' as const,
            reviewed_by: session.profileId,
            reviewed_at: nowIso,
            reject_reason: null,
            covers_from: coversFrom,
            covers_to: coversTo,
            updated_at: nowIso,
          };
          world.subscription_payments[spIdx] = approved;

          const subIdx = world.subscriptions.findIndex((s) => s.id === sp.subscription_id);
          const sub = subIdx !== -1 ? world.subscriptions[subIdx] : undefined;
          if (
            sub &&
            (sub.status === 'active' ||
              canMove(SUBSCRIPTION_LIFECYCLE, sub.status, 'active', 'super_admin'))
          ) {
            world.subscriptions[subIdx] = {
              ...sub,
              status: 'active',
              paid_through: coversTo,
              paused_at: null,
              updated_at: nowIso,
            };
          }

          return ok(approved);
        },
      );
    },

    async pauseLateAccounts(_input, session) {
      const guard = await beforeCall('pauseLateAccounts', session);
      if (!guard.ok) return guard;

      const today = manilaToday(clock);
      const nowIso = nowIsoFromClock(clock);
      let pausedCount = 0;

      for (let i = 0; i < world.subscriptions.length; i += 1) {
        const sub = world.subscriptions[i];
        if (!sub) continue;
        const account = world.accounts.find((a) => a.id === sub.account_id);
        // D18: demo accounts are never billed or paused automatically.
        if (account?.is_demo) continue;

        const graceExpired =
          (sub.status === 'trial' &&
            sub.trial_ends_on !== null &&
            nightsBetween(sub.trial_ends_on, today) > 7) ||
          (sub.status === 'active' &&
            sub.paid_through !== null &&
            nightsBetween(sub.paid_through, today) > 7);

        if (graceExpired && canMove(SUBSCRIPTION_LIFECYCLE, sub.status, 'paused', 'system')) {
          world.subscriptions[i] = {
            ...sub,
            status: 'paused',
            paused_at: nowIso,
            updated_at: nowIso,
          };
          pausedCount += 1;
        }
      }

      return ok({ pausedCount });
    },

    async claimOutboxBatch(input, session) {
      const guard = await beforeCall('claimOutboxBatch', session);
      if (!guard.ok) return guard;

      const nowMs = clock.now().getTime();
      const nowIso = new Date(nowMs).toISOString();
      const claimed: NotificationsOutboxRow[] = [];

      for (let i = 0; i < world.notifications_outbox.length; i += 1) {
        if (claimed.length >= input.limit) break;
        const item = world.notifications_outbox[i];
        if (!item || item.status !== 'pending' || Date.parse(item.next_attempt_at) > nowMs) {
          continue;
        }
        const updated = {
          ...item,
          status: 'sending' as const,
          attempts: item.attempts + 1,
          updated_at: nowIso,
        };
        world.notifications_outbox[i] = updated;
        claimed.push(updated);
      }

      return ok(claimed);
    },

    async finishOutboxItem(input, session) {
      const guard = await beforeCall('finishOutboxItem', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'finishOutboxItem',
        input.idempotencyKey,
        null,
        input,
        operations.finishOutboxItem.output,
        async () => {
          const idx = world.notifications_outbox.findIndex((o) => o.id === input.outboxId);
          if (idx === -1) return err(appError('not_found'));
          const item = world.notifications_outbox[idx];
          if (!item) return err(appError('not_found'));

          const nowIso = nowIsoFromClock(clock);
          const updated = {
            ...item,
            status: input.succeeded ? ('sent' as const) : ('failed' as const),
            sent_at: input.succeeded ? nowIso : item.sent_at,
            last_error: input.lastError,
            updated_at: nowIso,
          };
          world.notifications_outbox[idx] = updated;
          return ok(updated);
        },
      );
    },

    async queueMetaEvent(input, session) {
      const guard = await beforeCall('queueMetaEvent', session);
      if (!guard.ok) return guard;

      return runIdempotent(
        'queueMetaEvent',
        input.idempotencyKey,
        input.accountId,
        input,
        operations.queueMetaEvent.output,
        async () => {
          const account = world.accounts.find((a) => a.id === input.accountId);
          if (!account) return err(appError('not_found'));

          // D18: demo accounts never send Meta CAPI events.
          if (account.is_demo) return ok(null);

          const pixel = world.meta_pixels.find((p) => p.scope === 'platform');
          if (!pixel || pixel.status === 'off') return ok(null);

          const nowIso = nowIsoFromClock(clock);
          const row: MetaCapiDeliveriesRow = {
            id: ids.next('0033'),
            pixel_ref: pixel.id,
            event_name: input.eventName,
            event_id: ids.next('0034'),
            account_id: account.id,
            entity_type: input.entityType,
            entity_id: input.entityId,
            event_time: nowIso,
            payload: {},
            is_test: pixel.status === 'test',
            status: 'pending',
            attempts: 0,
            next_attempt_at: nowIso,
            claim_token: null,
            claimed_at: null,
            http_status: null,
            events_received: null,
            fbtrace_id: null,
            last_error: null,
            created_at: nowIso,
            sent_at: null,
            triggered_by: input.triggeredBy,
            action_source: input.eventName === 'CompleteRegistration' ? 'website' : 'other',
            time_clamped: false,
          };
          world.meta_capi_deliveries.push(row);
          return ok(row);
        },
      );
    },

    async claimMetaDeliveries(input, session) {
      const guard = await beforeCall('claimMetaDeliveries', session);
      if (!guard.ok) return guard;

      const nowMs = clock.now().getTime();
      const nowIso = new Date(nowMs).toISOString();
      const claimed: MetaCapiDeliveriesRow[] = [];

      for (let i = 0; i < world.meta_capi_deliveries.length; i += 1) {
        if (claimed.length >= input.limit) break;
        const item = world.meta_capi_deliveries[i];
        if (!item || item.status !== 'pending' || Date.parse(item.next_attempt_at) > nowMs) {
          continue;
        }
        const updated: MetaCapiDeliveriesRow = {
          ...item,
          status: 'sending',
          attempts: item.attempts + 1,
          claim_token: ids.next('0035'),
          claimed_at: nowIso,
        };
        world.meta_capi_deliveries[i] = updated;
        claimed.push(updated);
      }

      return ok(claimed);
    },

    async listPaymentsToReview(input, session) {
      const guard = await beforeCall('listPaymentsToReview', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      return buildPaymentsToReview(world, acctCheck.data, input.status);
    },

    async getCalendarTimeline(input, session) {
      const guard = await beforeCall('getCalendarTimeline', session);
      if (!guard.ok) return guard;
      const acctCheck = requireOwnerAccountMatch(session, input.accountId);
      if (!acctCheck.ok) return acctCheck;

      releaseExpiredHolds(world, clock, ids);
      return buildCalendarTimeline(world, acctCheck.data, input.range);
    },

    ...createOwnerHandlers({
      world,
      clock,
      ids,
      mediaConfig,
      auth,
      beforeCall,
      requireOwnerAccountMatch,
      runIdempotent,
    }),
  } satisfies ParsedDataSourceHandlers;

  return createValidatedDataSource(handlers, {
    validateOutput: options.validateOutput ?? true,
  });
}

export type { OperationParsedInput, BookingEventsRow };
export const QA_SUPER_ADMIN_ID = DEMO_IDS.platform.superAdminProfile;
