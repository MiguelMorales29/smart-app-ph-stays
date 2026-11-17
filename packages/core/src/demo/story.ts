import { BOOKING_LIFECYCLE, PAYMENT_LIFECYCLE, canMove } from '../lifecycles/index.js';
import type { BookingLifecycleActor } from '../lifecycles/index.js';
import type { BookingCancelledBy, BookingStatus, ThreadStatus } from '../lists/index.js';
import { centavos } from '../money/index.js';
import type { Centavos } from '../money/index.js';
import { quoteStay } from '../pricing/quoteStay.js';
import type {
  AuditLogsRow,
  BookingEventsRow,
  BookingGuestsRow,
  BookingLinesRow,
  BookingsRow,
  CustomersRow,
  FilesRow,
  MessagesRow,
  NotificationsOutboxRow,
  PaymentProofsRow,
  PaymentsRow,
  StayReviewsRow,
  ThreadsRow,
  UnitOccupancyRow,
} from '../schemas/tables/index.js';
import { addDays, manilaWallTime } from '../time/index.js';
import type { CalendarDate, Clock } from '../time/index.js';
import type { BrandBundle } from './brands/shared.js';
import { makeDemoUuid } from './ids.js';

export interface StayReviewSpec {
  readonly stars: 1 | 2 | 3 | 4 | 5;
  readonly note: string;
  readonly hidden?: boolean;
}

export interface StayStorySpec {
  readonly unitId: string;
  readonly customer: CustomersRow;
  readonly checkInOffset: number;
  readonly nights: number;
  readonly adults: number;
  readonly children?: number;
  readonly status: BookingStatus;
  readonly source?: 'direct' | 'manual';
  readonly sourceNote?: string | null;
  readonly paid?: 'none' | 'down' | 'full' | 'down_plus_cash_balance';
  readonly paymentScenario?: 'normal' | 'rejected_then_resent' | 'approved_then_reversed';
  readonly referenceOverride?: string;
  readonly cancelledBy?: BookingCancelledBy;
  readonly cancelReason?: string;
  readonly guestNote?: string | null;
  readonly vehiclePlate?: string | null;
  readonly guestListSubmitted?: boolean;
  readonly threadStatus?: ThreadStatus;
  readonly hideLastMessage?: boolean;
  readonly review?: StayReviewSpec;
}

export interface AccountStoryData {
  readonly occupancies: UnitOccupancyRow[];
  readonly bookings: BookingsRow[];
  readonly bookingLines: BookingLinesRow[];
  readonly bookingEvents: BookingEventsRow[];
  readonly bookingGuests: BookingGuestsRow[];
  readonly stayReviews: StayReviewsRow[];
  readonly payments: PaymentsRow[];
  readonly paymentProofs: PaymentProofsRow[];
  readonly files: FilesRow[];
  readonly threads: ThreadsRow[];
  readonly messages: MessagesRow[];
  readonly outbox: NotificationsOutboxRow[];
  readonly auditLogs: AuditLogsRow[];
  readonly lastBookingNo: number;
  readonly lastReceiptNo: number;
}

function normalizeReference(ref: string): string {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function makeDeterministicTokenHash(groupHex: string, threadSeq: number): string {
  const prefix = groupHex.padStart(2, '0').slice(-2).toLowerCase();
  const hexSeq = threadSeq.toString(16).padStart(14, '0').slice(-14).toLowerCase();
  return `${prefix}${hexSeq}${'a1b2c3d4e5f60718'.repeat(3)}`;
}

export class AccountStoryBuilder {
  private readonly brand: BrandBundle;
  private readonly today: CalendarDate;
  private readonly nowIso: string;
  private readonly nowMs: number;
  private readonly groupHex: string;

  private bookingNo = 0;
  private receiptNo = 0;
  private occupancySeq = 1;
  private lineSeq = 1;
  private eventSeq = 1;
  private guestSeq = 1;
  private reviewSeq = 1;
  private paymentSeq = 1;
  private proofSeq = 1;
  private fileSeq = 500;
  private threadSeq = 1;
  private messageSeq = 1;
  private outboxSeq = 1;
  private auditSeq = 1;

  public readonly occupancies: UnitOccupancyRow[] = [];
  public readonly bookings: BookingsRow[] = [];
  public readonly bookingLines: BookingLinesRow[] = [];
  public readonly bookingEvents: BookingEventsRow[] = [];
  public readonly bookingGuests: BookingGuestsRow[] = [];
  public readonly stayReviews: StayReviewsRow[] = [];
  public readonly payments: PaymentsRow[] = [];
  public readonly paymentProofs: PaymentProofsRow[] = [];
  public readonly files: FilesRow[] = [];
  public readonly threads: ThreadsRow[] = [];
  public readonly messages: MessagesRow[] = [];
  public readonly outbox: NotificationsOutboxRow[] = [];
  public readonly auditLogs: AuditLogsRow[] = [];

  public constructor(
    brand: BrandBundle,
    today: CalendarDate,
    clock: Clock,
    groupHexOverride?: string,
  ) {
    this.brand = brand;
    this.today = today;
    const now = clock.now();
    this.nowIso = now.toISOString();
    this.nowMs = now.getTime();
    this.groupHex = groupHexOverride ?? brand.groupHex;
  }

  public addOwnerBlock(params: {
    readonly unitId: string;
    readonly startOffset: number;
    readonly nights: number;
    readonly note: string;
    readonly active?: boolean;
  }): UnitOccupancyRow {
    const start = addDays(this.today, params.startOffset);
    const end = addDays(start, params.nights);
    const createdAt = manilaWallTime(addDays(this.today, -5), '10:00').toISOString();
    const active = params.active ?? true;
    const occupancyId = makeDemoUuid(this.groupHex, '0012', this.occupancySeq);
    this.occupancySeq += 1;

    const row: UnitOccupancyRow = {
      id: occupancyId,
      account_id: this.brand.account.id,
      unit_id: params.unitId,
      during: { start, end },
      buffer_nights: 0,
      kind: 'block',
      active,
      expires_at: null,
      note: params.note,
      created_by: this.brand.member.profile_id,
      created_at: createdAt,
      updated_at: createdAt,
      released_at: active ? null : this.nowIso,
    };
    this.occupancies.push(row);
    return row;
  }

  public stay(spec: StayStorySpec): BookingsRow {
    const unit = this.brand.units.find((u) => u.id === spec.unitId);
    const stayTerms = this.brand.stayTerms.find((t) => t.unit_id === spec.unitId);
    if (!unit || !stayTerms) {
      throw new Error(`Short-stay unit ${spec.unitId} not found in brand ${this.brand.slug}`);
    }

    const checkIn = addDays(this.today, spec.checkInOffset);
    const checkOut = addDays(checkIn, spec.nights);
    const children = spec.children ?? 0;
    const source = spec.source ?? 'direct';

    const quoteReferenceDay = addDays(checkIn, -Math.max(stayTerms.advance_notice_days + 1, 2));
    const quoteOutcome = quoteStay({
      terms: {
        base_nightly_centavos: stayTerms.base_nightly_centavos,
        base_guests: stayTerms.base_guests,
        min_nights: stayTerms.min_nights,
        max_nights: stayTerms.max_nights,
        weekly_discount_percent: stayTerms.weekly_discount_percent,
        monthly_discount_percent: stayTerms.monthly_discount_percent,
        down_payment_percent: stayTerms.down_payment_percent,
        advance_notice_days: stayTerms.advance_notice_days,
        booking_window_days: stayTerms.booking_window_days,
        max_guests: unit.max_guests,
      },
      weekdayRates: this.brand.weekdayRates.filter((r) => r.unit_id === unit.id),
      rateOverrides: this.brand.rateOverrides.filter((r) => r.unit_id === unit.id),
      fees: this.brand.unitFees.filter((f) => f.unit_id === unit.id),
      checkIn,
      checkOut,
      adults: spec.adults,
      children,
      today: quoteReferenceDay,
    });

    if (!quoteOutcome.ok) {
      throw new Error(
        `quoteStay refused demo stay on ${unit.slug} (${checkIn} -> ${checkOut}): ${quoteOutcome.reason}`,
      );
    }

    const quote = quoteOutcome.data;
    this.bookingNo += 1;
    const currentBookingNo = this.bookingNo;
    const bookingId = makeDemoUuid(this.groupHex, '0013', currentBookingNo);
    const occupancyId = makeDemoUuid(this.groupHex, '0012', this.occupancySeq);
    this.occupancySeq += 1;

    const createdOffset = Math.min(spec.checkInOffset - 3, -1);
    const createdDay = addDays(this.today, createdOffset);
    const createdAt = manilaWallTime(createdDay, '10:15').toISOString();

    const isHoldStatus = spec.status === 'held' || spec.status === 'in_review';
    const isActiveOccupancy = spec.status !== 'cancelled' && spec.status !== 'expired';
    const holdExpiresAt =
      spec.status === 'held'
        ? new Date(this.nowMs + stayTerms.hold_minutes * 60_000).toISOString()
        : spec.status === 'in_review'
          ? new Date(this.nowMs + 72 * 3_600_000).toISOString()
          : null;

    const occupancyEnd = addDays(checkOut, stayTerms.prep_nights);
    const occupancyRow: UnitOccupancyRow = {
      id: occupancyId,
      account_id: this.brand.account.id,
      unit_id: unit.id,
      during: { start: checkIn, end: occupancyEnd },
      buffer_nights: stayTerms.prep_nights,
      kind: isHoldStatus ? 'hold' : 'booking',
      active: isActiveOccupancy,
      expires_at: isHoldStatus ? holdExpiresAt : null,
      note: null,
      created_by: source === 'manual' ? this.brand.member.profile_id : null,
      created_at: createdAt,
      updated_at: createdAt,
      released_at: isActiveOccupancy
        ? null
        : manilaWallTime(addDays(createdDay, 1), '11:00').toISOString(),
    };
    this.occupancies.push(occupancyRow);

    const confirmedAt =
      spec.status === 'confirmed' || spec.status === 'checked_in' || spec.status === 'completed'
        ? manilaWallTime(addDays(createdDay, 1), '11:30').toISOString()
        : null;
    const checkedInAt =
      spec.status === 'checked_in' || spec.status === 'completed'
        ? manilaWallTime(checkIn, '14:10').toISOString()
        : null;
    const checkedOutAt =
      spec.status === 'completed' ? manilaWallTime(checkOut, '11:50').toISOString() : null;
    const cancelledAt =
      spec.status === 'cancelled'
        ? manilaWallTime(addDays(createdDay, 1), '16:00').toISOString()
        : null;
    const cancelledBy: BookingCancelledBy | null =
      spec.status === 'cancelled' ? (spec.cancelledBy ?? 'customer') : null;

    const shouldSubmitGuestList =
      spec.guestListSubmitted ??
      (this.brand.property.guest_ids_required &&
        (spec.status === 'confirmed' ||
          spec.status === 'checked_in' ||
          spec.status === 'completed'));

    const guestListSubmittedAt = shouldSubmitGuestList
      ? manilaWallTime(addDays(checkIn, -2), '18:00').toISOString()
      : null;

    const bookingRow: BookingsRow = {
      id: bookingId,
      account_id: this.brand.account.id,
      property_id: this.brand.property.id,
      unit_id: unit.id,
      customer_id: spec.customer.id,
      occupancy_id: occupancyId,
      booking_no: currentBookingNo,
      status: spec.status,
      source,
      source_note: spec.sourceNote ?? (source === 'manual' ? 'Phone / walk-in reservation' : null),
      adults: spec.adults,
      children,
      nights: spec.nights,
      total_centavos: quote.total_centavos,
      required_centavos: quote.required_centavos,
      guest_note: spec.guestNote ?? null,
      reward_claim_id: null,
      confirmed_at: confirmedAt,
      checked_in_at: checkedInAt,
      checked_out_at: checkedOutAt,
      cancelled_at: cancelledAt,
      cancelled_by: cancelledBy,
      cancel_reason:
        spec.status === 'cancelled'
          ? (spec.cancelReason ?? 'Schedule change requested by guest.')
          : null,
      vehicle_plate: spec.vehiclePlate ?? null,
      guest_list_submitted_at: guestListSubmittedAt,
      created_at: createdAt,
      updated_at: checkedOutAt ?? checkedInAt ?? confirmedAt ?? cancelledAt ?? createdAt,
    };
    this.bookings.push(bookingRow);

    for (const line of quote.lines) {
      const lineId = makeDemoUuid(this.groupHex, '0014', this.lineSeq);
      this.lineSeq += 1;
      this.bookingLines.push({
        id: lineId,
        account_id: this.brand.account.id,
        booking_id: bookingId,
        kind: line.kind,
        label: line.label,
        stay_date: line.stay_date,
        quantity: line.quantity,
        unit_centavos: line.unit_centavos,
        amount_centavos: line.amount_centavos,
        sort_order: line.sort_order,
        created_at: createdAt,
      });
    }

    const paidMode =
      spec.paid ??
      (spec.status === 'held' || spec.status === 'expired' || spec.status === 'cancelled'
        ? 'none'
        : spec.status === 'in_review'
          ? 'down'
          : spec.status === 'completed' || spec.status === 'checked_in'
            ? 'full'
            : 'down');

    const scenario = spec.paymentScenario ?? 'normal';
    const createdPaymentIds: string[] = [];

    if (paidMode !== 'none') {
      const primaryAmount: Centavos =
        paidMode === 'full' ? quote.total_centavos : quote.required_centavos;
      const baseRef =
        spec.referenceOverride ??
        `${this.brand.slug.slice(0, 4).toUpperCase()}900${String(currentBookingNo).padStart(4, '0')}`;

      if (scenario === 'rejected_then_resent') {
        this.addProofPayment({
          bookingId,
          customerId: spec.customer.id,
          amountCentavos: primaryAmount,
          referenceNo: baseRef,
          paidOn: createdDay,
          status: 'rejected',
          rejectReason: 'Reference number did not match our GCash transaction history.',
          createdAt,
        });

        const secondStatus = spec.status === 'in_review' ? 'submitted' : 'approved';
        const secondPayment = this.addProofPayment({
          bookingId,
          customerId: spec.customer.id,
          amountCentavos: primaryAmount,
          referenceNo: baseRef,
          paidOn: addDays(createdDay, 1),
          status: secondStatus,
          rejectReason: null,
          createdAt: manilaWallTime(addDays(createdDay, 1), '09:00').toISOString(),
        });
        createdPaymentIds.push(secondPayment.id);
      } else if (scenario === 'approved_then_reversed') {
        this.addProofPayment({
          bookingId,
          customerId: spec.customer.id,
          amountCentavos: primaryAmount,
          referenceNo: `${baseRef}A`,
          paidOn: createdDay,
          status: 'reversed',
          rejectReason: 'Approved on wrong booking by mistake; reversed and re-entered.',
          createdAt,
        });

        const replacement = this.addProofPayment({
          bookingId,
          customerId: spec.customer.id,
          amountCentavos: primaryAmount,
          referenceNo: `${baseRef}B`,
          paidOn: addDays(createdDay, 1),
          status: 'approved',
          rejectReason: null,
          createdAt: manilaWallTime(addDays(createdDay, 1), '09:30').toISOString(),
        });
        createdPaymentIds.push(replacement.id);
      } else {
        const payStatus = spec.status === 'in_review' ? 'submitted' : 'approved';
        const firstPayment = this.addProofPayment({
          bookingId,
          customerId: spec.customer.id,
          amountCentavos: primaryAmount,
          referenceNo: baseRef,
          paidOn: createdDay,
          status: payStatus,
          rejectReason: null,
          createdAt,
        });
        createdPaymentIds.push(firstPayment.id);

        if (paidMode === 'down_plus_cash_balance' && payStatus === 'approved') {
          const remaining = centavos(quote.total_centavos - primaryAmount);
          if (remaining > 0) {
            const cashPayment = this.addOwnerCashPayment({
              bookingId,
              customerId: spec.customer.id,
              amountCentavos: remaining,
              paidOn: checkIn,
              createdAt: manilaWallTime(checkIn, '14:15').toISOString(),
            });
            createdPaymentIds.push(cashPayment.id);
          }
        }
      }
    }

    this.appendLifecycleEvents({
      bookingId,
      source,
      targetStatus: spec.status,
      cancelledBy: cancelledBy ?? 'customer',
      paymentScenario: scenario,
      createdAt,
      confirmedAt,
      checkedInAt,
      checkedOutAt,
      cancelledAt,
    });

    if (shouldSubmitGuestList) {
      const bookerGuestId = makeDemoUuid(this.groupHex, '0016', this.guestSeq);
      this.guestSeq += 1;
      const idFileId = makeDemoUuid(this.groupHex, '0006', this.fileSeq);
      this.fileSeq += 1;

      this.files.push({
        id: idFileId,
        account_id: this.brand.account.id,
        bucket: 'documents',
        path: `${this.brand.account.id}/guest-ids/${idFileId}.webp`,
        purpose: 'guest_id',
        mime: 'image/webp',
        size_bytes: 68_000,
        width: 800,
        height: 600,
        uploaded_by_kind: 'customer',
        customer_id: spec.customer.id,
        uploaded_by_profile: spec.customer.profile_id,
        used_by_table: 'booking_guests',
        used_by_id: bookerGuestId,
        status: 'ready',
        confirmed_at: guestListSubmittedAt ?? createdAt,
        delete_after: manilaWallTime(addDays(checkOut, 7), '12:00').toISOString(),
        deleted_at: null,
        created_at: guestListSubmittedAt ?? createdAt,
        updated_at: guestListSubmittedAt ?? createdAt,
      });

      this.bookingGuests.push({
        id: bookerGuestId,
        account_id: this.brand.account.id,
        booking_id: bookingId,
        full_name: spec.customer.full_name,
        is_minor: false,
        id_file_id: idFileId,
        sort_order: 0,
        created_at: guestListSubmittedAt ?? createdAt,
        updated_at: guestListSubmittedAt ?? createdAt,
      });

      if (spec.adults >= 2) {
        const companionId = makeDemoUuid(this.groupHex, '0016', this.guestSeq);
        this.guestSeq += 1;
        this.bookingGuests.push({
          id: companionId,
          account_id: this.brand.account.id,
          booking_id: bookingId,
          full_name: `${spec.customer.full_name.split(' ')[0]} Companion`,
          is_minor: false,
          id_file_id: null,
          sort_order: 1,
          created_at: guestListSubmittedAt ?? createdAt,
          updated_at: guestListSubmittedAt ?? createdAt,
        });
      }
    }

    if (spec.review && spec.status === 'completed') {
      const reviewId = makeDemoUuid(this.groupHex, '0017', this.reviewSeq);
      this.reviewSeq += 1;
      this.stayReviews.push({
        id: reviewId,
        account_id: this.brand.account.id,
        booking_id: bookingId,
        customer_id: spec.customer.id,
        stars: spec.review.stars,
        note: spec.review.note,
        note_hidden: spec.review.hidden ?? false,
        created_at: manilaWallTime(addDays(checkOut, 1), '15:00').toISOString(),
      });
    }

    const threadId = makeDemoUuid(this.groupHex, '001a', this.threadSeq);
    const tokenHash = makeDeterministicTokenHash(this.groupHex, this.threadSeq);
    this.threadSeq += 1;
    const threadStatus = spec.threadStatus ?? 'open';
    const lastMessageAt = confirmedAt ?? createdAt;

    this.threads.push({
      id: threadId,
      account_id: this.brand.account.id,
      customer_id: spec.customer.id,
      booking_id: bookingId,
      inquiry_id: null,
      lease_id: null,
      token_hash: tokenHash,
      status: threadStatus,
      closed_at:
        threadStatus === 'closed'
          ? manilaWallTime(addDays(checkOut, 1), '18:00').toISOString()
          : null,
      last_message_at: lastMessageAt,
      customer_read_at: lastMessageAt,
      owner_read_at: spec.status === 'in_review' ? null : lastMessageAt,
      created_at: createdAt,
      updated_at: lastMessageAt,
    });

    this.addMessage({
      threadId,
      senderKind: 'customer',
      senderProfileId: spec.customer.profile_id,
      kind: 'text',
      body: `Hi po! Nag-book po kami sa ${unit.name} (${checkIn} to ${checkOut}) for ${spec.adults + children} pax. Salamat po!`,
      paymentId: null,
      hidden: false,
      createdAt,
    });

    for (const paymentId of createdPaymentIds) {
      this.addMessage({
        threadId,
        senderKind: 'customer',
        senderProfileId: spec.customer.profile_id,
        kind: 'payment',
        body: 'Nag-upload po ako ng payment proof screenshot.',
        paymentId,
        hidden: false,
        createdAt: confirmedAt ?? createdAt,
      });
    }

    if (confirmedAt !== null) {
      this.addMessage({
        threadId,
        senderKind: 'owner',
        senderProfileId: this.brand.member.profile_id,
        kind: 'text',
        body: `Confirmed na po ang booking ninyo sa ${unit.name}, ${spec.customer.full_name}! See you on ${checkIn} (2:00 pm check-in).`,
        paymentId: null,
        hidden: spec.hideLastMessage ?? false,
        createdAt: confirmedAt,
      });
    }

    const outboxId = makeDemoUuid(this.groupHex, '001c', this.outboxSeq);
    this.outboxSeq += 1;
    this.outbox.push({
      id: outboxId,
      account_id: this.brand.account.id,
      channel: 'email',
      template: confirmedAt !== null ? 'booking.confirmed' : 'booking.held',
      customer_id: spec.customer.id,
      profile_id: null,
      to_email: spec.customer.email,
      payload: { booking_id: bookingId, thread_id: threadId },
      dedupe_key: `${confirmedAt !== null ? 'booking.confirmed' : 'booking.held'}:${bookingId}:customer`,
      status: 'sent',
      attempts: 1,
      next_attempt_at: createdAt,
      last_error: null,
      sent_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    });

    return bookingRow;
  }

  private addProofPayment(params: {
    readonly bookingId: string;
    readonly customerId: string;
    readonly amountCentavos: Centavos;
    readonly referenceNo: string;
    readonly paidOn: CalendarDate;
    readonly status: 'submitted' | 'approved' | 'rejected' | 'reversed';
    readonly rejectReason: string | null;
    readonly createdAt: string;
  }): PaymentsRow {
    if (!canMove(PAYMENT_LIFECYCLE, null, 'submitted', 'customer')) {
      throw new Error('Lifecycle refused null -> submitted payment move');
    }
    if (
      params.status === 'approved' &&
      !canMove(PAYMENT_LIFECYCLE, 'submitted', 'approved', 'owner')
    ) {
      throw new Error('Lifecycle refused submitted -> approved payment move');
    }
    if (
      params.status === 'rejected' &&
      !canMove(PAYMENT_LIFECYCLE, 'submitted', 'rejected', 'owner')
    ) {
      throw new Error('Lifecycle refused submitted -> rejected payment move');
    }
    if (
      params.status === 'reversed' &&
      (!canMove(PAYMENT_LIFECYCLE, 'submitted', 'approved', 'owner') ||
        !canMove(PAYMENT_LIFECYCLE, 'approved', 'reversed', 'owner'))
    ) {
      throw new Error('Lifecycle refused submitted -> approved -> reversed payment move');
    }

    const paymentId = makeDemoUuid(this.groupHex, '0018', this.paymentSeq);
    this.paymentSeq += 1;

    const assignedReceiptNo =
      params.status === 'approved' || params.status === 'reversed' ? ++this.receiptNo : null;

    const paymentRow: PaymentsRow = {
      id: paymentId,
      account_id: this.brand.account.id,
      customer_id: params.customerId,
      booking_id: params.bookingId,
      bill_id: null,
      kind: 'payment',
      amount_centavos: params.amountCentavos,
      method: 'gcash',
      reference_no: params.referenceNo,
      reference_norm: normalizeReference(params.referenceNo),
      paid_on: params.paidOn,
      status: params.status,
      submitted_by: 'customer',
      reviewed_by: params.status === 'submitted' ? null : this.brand.member.profile_id,
      reviewed_at: params.status === 'submitted' ? null : params.createdAt,
      reject_reason: params.rejectReason,
      receipt_no: assignedReceiptNo,
      wallet_checked: params.status === 'approved' || params.status === 'reversed',
      created_at: params.createdAt,
      updated_at: params.createdAt,
    };
    this.payments.push(paymentRow);

    const proofFileId = makeDemoUuid(this.groupHex, '0006', this.fileSeq);
    this.fileSeq += 1;
    const proofId = makeDemoUuid(this.groupHex, '0019', this.proofSeq);
    this.proofSeq += 1;

    this.files.push({
      id: proofFileId,
      account_id: this.brand.account.id,
      bucket: 'payment-proofs',
      path: `${this.brand.account.id}/proofs/${proofFileId}.webp`,
      purpose: 'proof',
      mime: 'image/webp',
      size_bytes: 112_000,
      width: 720,
      height: 1280,
      uploaded_by_kind: 'customer',
      customer_id: params.customerId,
      uploaded_by_profile: null,
      used_by_table: 'payment_proofs',
      used_by_id: proofId,
      status: 'ready',
      confirmed_at: params.createdAt,
      delete_after:
        params.status === 'approved'
          ? manilaWallTime(addDays(params.paidOn, 30), '12:00').toISOString()
          : null,
      deleted_at: null,
      created_at: params.createdAt,
      updated_at: params.createdAt,
    });

    this.paymentProofs.push({
      id: proofId,
      account_id: this.brand.account.id,
      payment_id: paymentId,
      file_id: proofFileId,
      sort_order: 0,
      created_at: params.createdAt,
    });

    if (params.status === 'approved') {
      const auditId = makeDemoUuid(this.groupHex, '001d', this.auditSeq);
      this.auditSeq += 1;
      this.auditLogs.push({
        id: auditId,
        account_id: this.brand.account.id,
        actor_kind: 'owner',
        actor_profile_id: this.brand.member.profile_id,
        action: 'payment.approve',
        entity_table: 'payments',
        entity_id: paymentId,
        detail: { receipt_no: assignedReceiptNo, amount_centavos: params.amountCentavos },
        created_at: params.createdAt,
      });
    }

    return paymentRow;
  }

  private addOwnerCashPayment(params: {
    readonly bookingId: string;
    readonly customerId: string;
    readonly amountCentavos: Centavos;
    readonly paidOn: CalendarDate;
    readonly createdAt: string;
  }): PaymentsRow {
    if (!canMove(PAYMENT_LIFECYCLE, null, 'approved', 'owner')) {
      throw new Error('Lifecycle refused null -> approved owner cash payment move');
    }

    const paymentId = makeDemoUuid(this.groupHex, '0018', this.paymentSeq);
    this.paymentSeq += 1;
    const assignedReceiptNo = ++this.receiptNo;

    const paymentRow: PaymentsRow = {
      id: paymentId,
      account_id: this.brand.account.id,
      customer_id: params.customerId,
      booking_id: params.bookingId,
      bill_id: null,
      kind: 'payment',
      amount_centavos: params.amountCentavos,
      method: 'cash',
      reference_no: null,
      reference_norm: null,
      paid_on: params.paidOn,
      status: 'approved',
      submitted_by: 'owner',
      reviewed_by: this.brand.member.profile_id,
      reviewed_at: params.createdAt,
      reject_reason: null,
      receipt_no: assignedReceiptNo,
      wallet_checked: false,
      created_at: params.createdAt,
      updated_at: params.createdAt,
    };
    this.payments.push(paymentRow);

    const auditId = makeDemoUuid(this.groupHex, '001d', this.auditSeq);
    this.auditSeq += 1;
    this.auditLogs.push({
      id: auditId,
      account_id: this.brand.account.id,
      actor_kind: 'owner',
      actor_profile_id: this.brand.member.profile_id,
      action: 'payment.record_cash',
      entity_table: 'payments',
      entity_id: paymentId,
      detail: { receipt_no: assignedReceiptNo, amount_centavos: params.amountCentavos },
      created_at: params.createdAt,
    });

    return paymentRow;
  }

  private addMessage(params: {
    readonly threadId: string;
    readonly senderKind: 'customer' | 'owner' | 'system';
    readonly senderProfileId: string | null;
    readonly kind: 'text' | 'event' | 'payment';
    readonly body: string;
    readonly paymentId: string | null;
    readonly hidden: boolean;
    readonly createdAt: string;
  }): void {
    const messageId = makeDemoUuid(this.groupHex, '001b', this.messageSeq);
    this.messageSeq += 1;
    this.messages.push({
      id: messageId,
      account_id: this.brand.account.id,
      thread_id: params.threadId,
      sender_kind: params.senderKind,
      sender_profile_id: params.senderProfileId,
      kind: params.kind,
      body: params.body,
      payment_id: params.paymentId,
      file_id: null,
      hidden_at: params.hidden ? params.createdAt : null,
      hidden_by: params.hidden ? this.brand.member.profile_id : null,
      created_at: params.createdAt,
    });
  }

  private appendLifecycleEvents(params: {
    readonly bookingId: string;
    readonly source: 'direct' | 'manual';
    readonly targetStatus: BookingStatus;
    readonly cancelledBy: BookingCancelledBy;
    readonly paymentScenario: 'normal' | 'rejected_then_resent' | 'approved_then_reversed';
    readonly createdAt: string;
    readonly confirmedAt: string | null;
    readonly checkedInAt: string | null;
    readonly checkedOutAt: string | null;
    readonly cancelledAt: string | null;
  }): void {
    const pushStep = (
      type: BookingEventsRow['type'],
      fromStatus: BookingStatus | null,
      toStatus: BookingStatus,
      actor: BookingLifecycleActor,
      at: string,
    ): void => {
      if (!canMove(BOOKING_LIFECYCLE, fromStatus, toStatus, actor)) {
        throw new Error(
          `Invalid booking lifecycle move ${fromStatus ?? '(new)'} -> ${toStatus} by ${actor}`,
        );
      }
      const eventId = makeDemoUuid(this.groupHex, '0015', this.eventSeq);
      this.eventSeq += 1;
      this.bookingEvents.push({
        id: eventId,
        account_id: this.brand.account.id,
        booking_id: params.bookingId,
        type,
        from_status: fromStatus,
        to_status: toStatus,
        actor_kind: actor,
        actor_profile_id: actor === 'owner' ? this.brand.member.profile_id : null,
        detail: {},
        created_at: at,
      });
    };

    if (params.source === 'manual') {
      pushStep('created', null, 'confirmed', 'owner', params.createdAt);
      if (params.targetStatus === 'checked_in') {
        pushStep(
          'checked_in',
          'confirmed',
          'checked_in',
          'owner',
          params.checkedInAt ?? params.createdAt,
        );
      } else if (params.targetStatus === 'completed') {
        pushStep(
          'checked_in',
          'confirmed',
          'checked_in',
          'owner',
          params.checkedInAt ?? params.createdAt,
        );
        pushStep(
          'completed',
          'checked_in',
          'completed',
          'owner',
          params.checkedOutAt ?? params.createdAt,
        );
      } else if (params.targetStatus === 'cancelled') {
        const cancelActor: BookingLifecycleActor =
          params.cancelledBy === 'system' ? 'owner' : params.cancelledBy;
        pushStep(
          'cancelled',
          'confirmed',
          'cancelled',
          cancelActor,
          params.cancelledAt ?? params.createdAt,
        );
      }
      return;
    }

    pushStep('created', null, 'held', 'customer', params.createdAt);

    if (params.targetStatus === 'held') {
      return;
    }

    if (params.targetStatus === 'expired') {
      pushStep('expired', 'held', 'expired', 'system', params.createdAt);
      return;
    }

    if (params.targetStatus === 'cancelled') {
      const cancelActor: BookingLifecycleActor =
        params.cancelledBy === 'system' ? 'customer' : params.cancelledBy;
      pushStep(
        'cancelled',
        'held',
        'cancelled',
        cancelActor,
        params.cancelledAt ?? params.createdAt,
      );
      return;
    }

    if (params.paymentScenario === 'rejected_then_resent') {
      pushStep('proof_submitted', 'held', 'in_review', 'customer', params.createdAt);
      pushStep('payment_rejected', 'in_review', 'held', 'owner', params.createdAt);
    }

    pushStep('proof_submitted', 'held', 'in_review', 'customer', params.createdAt);

    if (params.targetStatus === 'in_review') {
      return;
    }

    pushStep(
      'confirmed',
      'in_review',
      'confirmed',
      'owner',
      params.confirmedAt ?? params.createdAt,
    );

    if (params.targetStatus === 'confirmed') {
      return;
    }

    if (params.targetStatus === 'checked_in') {
      pushStep(
        'checked_in',
        'confirmed',
        'checked_in',
        'owner',
        params.checkedInAt ?? params.createdAt,
      );
      return;
    }

    if (params.targetStatus === 'completed') {
      pushStep(
        'checked_in',
        'confirmed',
        'checked_in',
        'owner',
        params.checkedInAt ?? params.createdAt,
      );
      pushStep(
        'completed',
        'checked_in',
        'completed',
        'owner',
        params.checkedOutAt ?? params.createdAt,
      );
    }
  }

  public build(): AccountStoryData {
    return {
      occupancies: this.occupancies,
      bookings: this.bookings,
      bookingLines: this.bookingLines,
      bookingEvents: this.bookingEvents,
      bookingGuests: this.bookingGuests,
      stayReviews: this.stayReviews,
      payments: this.payments,
      paymentProofs: this.paymentProofs,
      files: this.files,
      threads: this.threads,
      messages: this.messages,
      outbox: this.outbox,
      auditLogs: this.auditLogs,
      lastBookingNo: this.bookingNo,
      lastReceiptNo: this.receiptNo,
    };
  }
}
