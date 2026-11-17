import {
  DEMO_IDS,
  addDays,
  appError,
  centavos,
  err,
  makeDemoUuid,
  manilaToday,
  nightsBetween,
  quoteStay,
  type AdminOwnerItemView,
  type AppError,
  type BookingBoardItemView,
  type BookingDetailView,
  type BookingsRow,
  type CalendarDate,
  type CalendarTimelineView,
  type Clock,
  type DemoWorld,
  type ErrorCode,
  type InboxThreadItemView,
  type PaymentReviewItemView,
  type PaymentsRow,
  type PropertyView,
  type Result,
  type SubscriptionDerivedState,
  type ThreadView,
  type UnitCalendarView,
  type UnitStayTermsRow,
  type UnitsRow,
} from '@smartapp/core';

import { mediaUrl, type MediaConfig } from '../media.js';
import type { Session } from '../source.js';

export type BookingBoardItem = BookingBoardItemView;

const THREAD_TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export class DemoIdAllocator {
  private readonly counters = new Map<string, number>();

  public next(tableHex: string): string {
    const prev = this.counters.get(tableHex) ?? 0;
    const seq = prev + 1;
    this.counters.set(tableHex, seq);
    return makeDemoUuid('90', tableHex, seq);
  }
}

export function normalizePaymentReference(reference: string): string {
  return reference.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function toFailAppError(failWith: ErrorCode | AppError): AppError {
  return typeof failWith === 'string' ? appError(failWith) : failWith;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const byteArray = new Uint8Array(digest);
  let hex = '';
  for (const byte of byteArray) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

export function generateThreadToken(): string {
  const randomBytes = new Uint8Array(43);
  globalThis.crypto.getRandomValues(randomBytes);
  let token = '';
  for (const byte of randomBytes) {
    const ch = THREAD_TOKEN_ALPHABET[byte % THREAD_TOKEN_ALPHABET.length];
    if (ch !== undefined) {
      token += ch;
    }
  }
  return token;
}

export function nowIsoFromClock(clock: Clock): string {
  return clock.now().toISOString();
}

export function addMinutesIso(clock: Clock, minutes: number): string {
  return new Date(clock.now().getTime() + minutes * 60_000).toISOString();
}

export function addHoursIso(clock: Clock, hours: number): string {
  return new Date(clock.now().getTime() + hours * 3_600_000).toISOString();
}

export function nextAccountCounter(
  world: DemoWorld,
  accountId: string,
  kind: 'booking' | 'receipt',
  nowIso: string,
): number {
  const existing = world.account_counters.find(
    (c) => c.account_id === accountId && c.kind === kind,
  );
  if (existing) {
    const idx = world.account_counters.indexOf(existing);
    const nextValue = existing.last_value + 1;
    world.account_counters[idx] = {
      ...existing,
      last_value: nextValue,
      updated_at: nowIso,
    };
    return nextValue;
  }

  world.account_counters.push({
    account_id: accountId,
    kind,
    last_value: 1,
    updated_at: nowIso,
  });
  return 1;
}

/**
 * Imitates the SQL functions' lazy hold release (`where kind = 'hold' and active and expires_at <= now()`).
 * The real expiration happens transactionally in PostgreSQL functions and via `expire_holds`.
 */
export function releaseExpiredHolds(
  world: DemoWorld,
  clock: Clock,
  ids: DemoIdAllocator,
  filterUnitId?: string,
): number {
  const nowMs = clock.now().getTime();
  const nowIso = new Date(nowMs).toISOString();
  let expiredCount = 0;

  for (let i = 0; i < world.unit_occupancy.length; i += 1) {
    const occ = world.unit_occupancy[i];
    if (!occ || !occ.active || occ.kind !== 'hold' || occ.expires_at === null) {
      continue;
    }
    if (filterUnitId !== undefined && occ.unit_id !== filterUnitId) {
      continue;
    }
    if (Date.parse(occ.expires_at) > nowMs) {
      continue;
    }

    world.unit_occupancy[i] = {
      ...occ,
      active: false,
      released_at: nowIso,
      updated_at: nowIso,
    };

    const bookingIdx = world.bookings.findIndex((b) => b.occupancy_id === occ.id);
    if (bookingIdx !== -1) {
      const booking = world.bookings[bookingIdx];
      if (booking && (booking.status === 'held' || booking.status === 'in_review')) {
        world.bookings[bookingIdx] = {
          ...booking,
          status: 'expired',
          updated_at: nowIso,
        };
        world.booking_events.push({
          id: ids.next('0015'),
          account_id: booking.account_id,
          booking_id: booking.id,
          type: 'expired',
          from_status: booking.status,
          to_status: 'expired',
          actor_kind: 'system',
          actor_profile_id: null,
          detail: {},
          created_at: nowIso,
        });
        expiredCount += 1;
      }
    }
  }

  return expiredCount;
}

/**
 * Imitates the PostgreSQL exclusion constraint on `public.unit_occupancy`:
 * `exclude using gist (unit_id with =, during with &&) where (active)`.
 */
export function hasActiveOccupancyOverlap(
  world: DemoWorld,
  unitId: string,
  rangeStart: CalendarDate,
  rangeEnd: CalendarDate,
  excludeOccupancyId?: string,
): boolean {
  for (const occ of world.unit_occupancy) {
    if (!occ.active || occ.unit_id !== unitId) {
      continue;
    }
    if (excludeOccupancyId !== undefined && occ.id === excludeOccupancyId) {
      continue;
    }
    const occEnd = occ.during.end;
    const startsBeforeOccEnds = occEnd === null || rangeStart < occEnd;
    const occStartsBeforeEnd = occ.during.start < rangeEnd;
    if (startsBeforeOccEnds && occStartsBeforeEnd) {
      return true;
    }
  }
  return false;
}

export function countActiveUnpaidHoldsForCustomer(
  world: DemoWorld,
  accountId: string,
  customerId: string,
): number {
  let count = 0;
  for (const booking of world.bookings) {
    if (
      booking.account_id === accountId &&
      booking.customer_id === customerId &&
      (booking.status === 'held' || booking.status === 'in_review')
    ) {
      count += 1;
    }
  }
  return count;
}

export function isAccountOperational(world: DemoWorld, accountId: string): boolean {
  const account = world.accounts.find((a) => a.id === accountId);
  if (!account || account.status !== 'active') {
    return false;
  }
  const sub = world.subscriptions.find((s) => s.account_id === accountId);
  if (!sub || (sub.status !== 'trial' && sub.status !== 'active')) {
    return false;
  }
  return true;
}

export function calculatePaidAndBalance(
  world: DemoWorld,
  booking: BookingsRow,
): {
  readonly paidCentavos: ReturnType<typeof centavos>;
  readonly balanceCentavos: ReturnType<typeof centavos>;
} {
  let sumApproved = 0;
  for (const payment of world.payments) {
    if (payment.booking_id !== booking.id || payment.status !== 'approved') {
      continue;
    }
    sumApproved += payment.kind === 'refund' ? -payment.amount_centavos : payment.amount_centavos;
  }
  const paidClamped = Math.max(0, sumApproved);
  const balanceClamped = Math.max(0, booking.total_centavos - paidClamped);
  return {
    paidCentavos: centavos(paidClamped),
    balanceCentavos: centavos(balanceClamped),
  };
}

export function quoteForUnit(params: {
  readonly world: DemoWorld;
  readonly unit: UnitsRow;
  readonly stayTerms: UnitStayTermsRow;
  readonly checkIn: CalendarDate;
  readonly checkOut: CalendarDate;
  readonly adults: number;
  readonly children: number;
  readonly today: CalendarDate;
}): ReturnType<typeof quoteStay> {
  return quoteStay({
    terms: {
      base_nightly_centavos: params.stayTerms.base_nightly_centavos,
      base_guests: params.stayTerms.base_guests,
      min_nights: params.stayTerms.min_nights,
      max_nights: params.stayTerms.max_nights,
      weekly_discount_percent: params.stayTerms.weekly_discount_percent,
      monthly_discount_percent: params.stayTerms.monthly_discount_percent,
      down_payment_percent: params.stayTerms.down_payment_percent,
      advance_notice_days: params.stayTerms.advance_notice_days,
      booking_window_days: params.stayTerms.booking_window_days,
      max_guests: params.unit.max_guests,
    },
    weekdayRates: params.world.weekday_rates.filter((r) => r.unit_id === params.unit.id),
    rateOverrides: params.world.rate_overrides.filter((r) => r.unit_id === params.unit.id),
    fees: params.world.unit_fees.filter((f) => f.unit_id === params.unit.id),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
    today: params.today,
  });
}

export function ensureProofFilesExist(params: {
  readonly world: DemoWorld;
  readonly accountId: string;
  readonly customerId: string;
  readonly fileIds: readonly string[];
  readonly paymentId: string;
  readonly nowIso: string;
}): Result<void> {
  for (const fileId of params.fileIds) {
    const existing = params.world.files.find((f) => f.id === fileId);
    if (existing) {
      if (existing.account_id !== params.accountId) {
        return err(appError('not_found'));
      }
      if (existing.status === 'deleted') {
        return err(appError('not_allowed', 'Uploaded proof file is no longer available.'));
      }
      continue;
    }

    params.world.files.push({
      id: fileId,
      account_id: params.accountId,
      bucket: 'payment-proofs',
      path: `${params.accountId}/proofs/${fileId}.webp`,
      purpose: 'proof',
      mime: 'image/webp',
      size_bytes: 96_000,
      width: 720,
      height: 1280,
      uploaded_by_kind: 'customer',
      customer_id: params.customerId,
      uploaded_by_profile: null,
      used_by_table: 'payment_proofs',
      used_by_id: params.paymentId,
      status: 'ready',
      confirmed_at: params.nowIso,
      delete_after: null,
      deleted_at: null,
      created_at: params.nowIso,
      updated_at: params.nowIso,
    });
  }

  return { ok: true, data: undefined };
}

export async function resolveThreadAccess(params: {
  readonly world: DemoWorld;
  readonly session: Session;
  readonly inputThreadToken: string | null;
  readonly targetThreadId?: string;
  readonly targetBookingId?: string;
}): Promise<Result<{ readonly threadIndex: number; readonly bookingIndex: number | null }>> {
  const { world, session, inputThreadToken, targetThreadId, targetBookingId } = params;

  if (session.role === 'guest') {
    if (!('threadToken' in session)) {
      return err(appError('not_allowed'));
    }
    if (inputThreadToken !== null && inputThreadToken !== session.threadToken) {
      return err(appError('not_found'));
    }
    const tokenHash = await sha256Hex(session.threadToken);
    const threadIndex = world.threads.findIndex((t) => t.token_hash === tokenHash);
    if (threadIndex === -1) {
      return err(appError('not_found'));
    }
    const thread = world.threads[threadIndex];
    if (!thread) {
      return err(appError('not_found'));
    }
    if (targetThreadId !== undefined && thread.id !== targetThreadId) {
      return err(appError('not_found'));
    }
    if (targetBookingId !== undefined && thread.booking_id !== targetBookingId) {
      return err(appError('not_found'));
    }
    const bookingIndex =
      thread.booking_id !== null
        ? world.bookings.findIndex((b) => b.id === thread.booking_id)
        : null;
    return {
      ok: true,
      data: {
        threadIndex,
        bookingIndex: bookingIndex === -1 ? null : bookingIndex,
      },
    };
  }

  if (session.role === 'member') {
    let threadIndex = -1;
    if (targetThreadId !== undefined) {
      threadIndex = world.threads.findIndex(
        (t) =>
          t.id === targetThreadId &&
          t.account_id === session.accountId &&
          t.customer_id === session.customerId,
      );
    } else if (targetBookingId !== undefined) {
      threadIndex = world.threads.findIndex(
        (t) =>
          t.booking_id === targetBookingId &&
          t.account_id === session.accountId &&
          t.customer_id === session.customerId,
      );
    }
    if (threadIndex === -1) {
      return err(appError('not_found'));
    }
    const thread = world.threads[threadIndex];
    if (!thread) {
      return err(appError('not_found'));
    }
    const bookingIndex =
      thread.booking_id !== null
        ? world.bookings.findIndex((b) => b.id === thread.booking_id)
        : null;
    return {
      ok: true,
      data: {
        threadIndex,
        bookingIndex: bookingIndex === -1 ? null : bookingIndex,
      },
    };
  }

  if (session.role === 'owner') {
    let threadIndex = -1;
    if (targetThreadId !== undefined) {
      threadIndex = world.threads.findIndex(
        (t) => t.id === targetThreadId && t.account_id === session.accountId,
      );
    } else if (targetBookingId !== undefined) {
      threadIndex = world.threads.findIndex(
        (t) => t.booking_id === targetBookingId && t.account_id === session.accountId,
      );
    }
    if (threadIndex === -1) {
      return err(appError('not_found'));
    }
    const thread = world.threads[threadIndex];
    if (!thread) {
      return err(appError('not_found'));
    }
    const bookingIndex =
      thread.booking_id !== null
        ? world.bookings.findIndex((b) => b.id === thread.booking_id)
        : null;
    return {
      ok: true,
      data: {
        threadIndex,
        bookingIndex: bookingIndex === -1 ? null : bookingIndex,
      },
    };
  }

  return err(appError('not_allowed'));
}

export function buildPropertyView(
  world: DemoWorld,
  slug: string,
  mediaConfig: MediaConfig,
): Result<PropertyView> {
  const property = world.properties.find((p) => p.slug === slug && p.status === 'published');
  if (!property) {
    return err(appError('not_found'));
  }

  const page = world.property_pages.find((pg) => pg.property_id === property.id);
  const account = world.accounts.find((a) => a.id === property.account_id);
  if (!page || page.published === null || !account) {
    return err(appError('not_found'));
  }
  const subscription = world.subscriptions.find((s) => s.account_id === account.id);

  const filesById = new Map(world.files.map((f) => [f.id, f]));
  const mapPhoto = (p: DemoWorld['listing_photos'][number]) => {
    const file = filesById.get(p.file_id);
    const url = file
      ? mediaUrl(file, mediaConfig)
      : mediaUrl({ bucket: 'listing-media', path: p.file_id }, mediaConfig);
    return {
      id: p.id,
      unit_id: p.unit_id,
      file_id: p.file_id,
      alt_text: p.alt_text,
      sort_order: p.sort_order,
      url,
    };
  };

  const listedUnits = world.units
    .filter((u) => u.property_id === property.id && u.status === 'listed')
    .sort((a, b) => a.sort_order - b.sort_order);

  const usedAmenityIds = new Set<string>();
  const unitCards = listedUnits.map((unit) => {
    const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id) ?? null;
    const unitPhotos = world.listing_photos
      .filter((lp) => lp.property_id === property.id && lp.unit_id === unit.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapPhoto);
    const amenityIds = world.unit_amenities
      .filter((ua) => ua.unit_id === unit.id)
      .map((ua) => {
        usedAmenityIds.add(ua.amenity_id);
        return ua.amenity_id;
      });

    return {
      id: unit.id,
      property_id: unit.property_id,
      slug: unit.slug,
      name: unit.name,
      mode: unit.mode,
      unit_type: unit.unit_type,
      description: unit.description,
      max_guests: unit.max_guests,
      bedrooms: unit.bedrooms,
      beds: unit.beds,
      bathrooms: unit.bathrooms,
      floor_area_sqm: unit.floor_area_sqm,
      sort_order: unit.sort_order,
      stay_terms: stayTerms
        ? {
            base_nightly_centavos: stayTerms.base_nightly_centavos,
            base_guests: stayTerms.base_guests,
            min_nights: stayTerms.min_nights,
            max_nights: stayTerms.max_nights,
            weekly_discount_percent: stayTerms.weekly_discount_percent,
            monthly_discount_percent: stayTerms.monthly_discount_percent,
            down_payment_percent: stayTerms.down_payment_percent,
            hold_minutes: stayTerms.hold_minutes,
            advance_notice_days: stayTerms.advance_notice_days,
            booking_window_days: stayTerms.booking_window_days,
          }
        : null,
      photos: unitPhotos,
      amenity_ids: amenityIds,
    };
  });

  const propertyPhotos = world.listing_photos
    .filter((lp) => lp.property_id === property.id && lp.unit_id === null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapPhoto);

  const amenities = world.amenities
    .filter((a) => a.is_active && usedAmenityIds.has(a.id))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({
      id: a.id,
      code: a.code,
      label: a.label,
      icon: a.icon,
      grp: a.grp,
      sort_order: a.sort_order,
    }));

  const houseRules = world.house_rules
    .filter((hr) => hr.property_id === property.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((hr) => ({
      id: hr.id,
      body: hr.body,
      sort_order: hr.sort_order,
    }));

  const propertyBookingIds = new Set(
    world.bookings.filter((b) => b.property_id === property.id).map((b) => b.id),
  );
  const reviews = world.stay_reviews
    .filter((r) => propertyBookingIds.has(r.booking_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const averageStars =
    reviews.length === 0
      ? null
      : Math.round((reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 100) / 100;

  return {
    ok: true,
    data: {
      property: {
        id: property.id,
        account_id: property.account_id,
        slug: property.slug,
        name: property.name,
        tagline: property.tagline,
        description: property.description,
        address_line: property.address_line,
        barangay: property.barangay,
        city: property.city,
        province: property.province,
        region: property.region,
        country: property.country,
        latitude: property.latitude,
        longitude: property.longitude,
        map_url: property.map_url,
        checkin_time: property.checkin_time,
        checkout_time: property.checkout_time,
        cancellation_preset: property.cancellation_preset,
        cancellation_note: property.cancellation_note,
        privacy_contact: property.privacy_contact,
        logo_file_id: property.logo_file_id,
        rebook_min_days: property.rebook_min_days,
        rebook_within_months: property.rebook_within_months,
        guest_ids_required: property.guest_ids_required,
        guest_list_due_hours: property.guest_list_due_hours,
        contact: property.contact,
        show_exact_location: property.show_exact_location,
        reply_hours: property.reply_hours,
        viewing_hours: property.viewing_hours,
      },
      page: {
        version: page.version,
        published: page.published,
      },
      account: {
        is_demo: account.is_demo,
        is_verified: account.verified_at !== null,
        is_paused: subscription?.status === 'paused',
      },
      units: unitCards,
      photos: propertyPhotos,
      amenities,
      house_rules: houseRules,
      reviews: {
        average_stars: averageStars,
        review_count: reviews.length,
        recent_reviews: reviews.slice(0, 10).map((r) => ({
          id: r.id,
          stars: r.stars,
          note: r.note_hidden ? null : r.note,
          created_at: r.created_at,
        })),
      },
    },
  };
}

export function buildUnitCalendarView(
  world: DemoWorld,
  unitId: string,
  clock: Clock,
): Result<UnitCalendarView> {
  const unit = world.units.find((u) => u.id === unitId && u.status === 'listed');
  if (!unit) {
    return err(appError('not_found'));
  }
  const property = world.properties.find(
    (p) => p.id === unit.property_id && p.status === 'published',
  );
  if (!property) {
    return err(appError('not_found'));
  }

  const stayTerms = world.unit_stay_terms.find((t) => t.unit_id === unit.id);
  const windowDays = stayTerms?.booking_window_days ?? 365;
  const windowStart = manilaToday(clock);
  const windowEnd = addDays(windowStart, windowDays);

  const takenRanges = world.unit_occupancy
    .filter(
      (occ) =>
        occ.active &&
        occ.unit_id === unit.id &&
        (occ.during.end === null || occ.during.end > windowStart) &&
        occ.during.start < windowEnd,
    )
    .map((occ) => ({
      start: occ.during.start < windowStart ? windowStart : occ.during.start,
      end: occ.during.end === null || occ.during.end > windowEnd ? windowEnd : occ.during.end,
    }))
    .filter((range) => range.start < range.end)
    .sort((a, b) => a.start.localeCompare(b.start));

  return {
    ok: true,
    data: {
      unit_id: unit.id,
      window_start: windowStart,
      window_end: windowEnd,
      taken_ranges: takenRanges,
      weekday_rates: world.weekday_rates
        .filter((r) => r.unit_id === unit.id)
        .map((r) => ({ iso_weekday: r.iso_weekday, nightly_centavos: r.nightly_centavos })),
      rate_overrides: world.rate_overrides
        .filter((r) => r.unit_id === unit.id)
        .map((r) => ({ during: r.during, nightly_centavos: r.nightly_centavos, label: r.label })),
    },
  };
}

export function buildThreadView(params: {
  readonly world: DemoWorld;
  readonly threadIndex: number;
  readonly bookingIndex: number | null;
  readonly clock: Clock;
  readonly mediaConfig: MediaConfig;
}): Result<ThreadView> {
  const { world, threadIndex, bookingIndex, clock, mediaConfig } = params;
  const thread = world.threads[threadIndex];
  if (!thread || bookingIndex === null) {
    return err(appError('not_found'));
  }
  const booking = world.bookings[bookingIndex];
  if (!booking) {
    return err(appError('not_found'));
  }
  const occupancy = world.unit_occupancy.find((o) => o.id === booking.occupancy_id);
  const property = world.properties.find((p) => p.id === booking.property_id);
  const unit = world.units.find((u) => u.id === booking.unit_id);
  const customer = world.customers.find((c) => c.id === booking.customer_id);
  if (!occupancy || !property || !unit || !customer) {
    return err(appError('not_found'));
  }

  const { paidCentavos, balanceCentavos } = calculatePaidAndBalance(world, booking);
  const canSeeArrivalInfo =
    booking.status === 'confirmed' ||
    booking.status === 'checked_in' ||
    booking.status === 'completed';

  const checkIn = occupancy.during.start;
  const checkOut = addDays(checkIn, booking.nights);
  const lines = world.booking_lines
    .filter((l) => l.booking_id === booking.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => ({
      id: l.id,
      kind: l.kind,
      label: l.label,
      stay_date: l.stay_date,
      quantity: l.quantity,
      unit_centavos: l.unit_centavos,
      amount_centavos: l.amount_centavos,
      sort_order: l.sort_order,
    }));

  const messages = world.messages
    .filter((m) => m.thread_id === thread.id && m.hidden_at === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((m) => ({
      id: m.id,
      sender_kind: m.sender_kind,
      kind: m.kind,
      body: m.body,
      payment_id: m.payment_id,
      file_id: m.file_id,
      created_at: m.created_at,
    }));

  const filesById = new Map(world.files.map((f) => [f.id, f]));
  const payments = world.payments
    .filter((p) => p.booking_id === booking.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => {
      const proofs = world.payment_proofs
        .filter((pp) => pp.payment_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((pp) => {
          const file = filesById.get(pp.file_id);
          return file
            ? mediaUrl(file, mediaConfig)
            : mediaUrl({ bucket: 'payment-proofs', path: pp.file_id }, mediaConfig);
        });
      return {
        id: p.id,
        kind: p.kind,
        amount_centavos: p.amount_centavos,
        method: p.method,
        reference_no: p.reference_no,
        paid_on: p.paid_on,
        status: p.status,
        submitted_by: p.submitted_by,
        reject_reason: p.reject_reason,
        receipt_no: p.receipt_no,
        created_at: p.created_at,
        proof_urls: proofs,
      };
    });

  const nowMs = clock.now().getTime();
  const sevenDaysMs = 7 * 86_400_000;
  const paymentAccounts = world.payment_accounts
    .filter((pa) => pa.account_id === property.account_id && pa.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pa) => {
      const updatedMs = Date.parse(pa.updated_at);
      const isRecentlyChanged =
        updatedMs >= nowMs - sevenDaysMs && Date.parse(pa.created_at) !== updatedMs;
      return {
        id: pa.id,
        method: pa.method,
        bank: pa.bank,
        bank_name: pa.bank_name,
        account_name: pa.account_name,
        account_number: pa.account_number,
        qr_file_id: pa.qr_file_id,
        instructions: pa.instructions,
        is_sample: pa.is_sample,
        sort_order: pa.sort_order,
        is_recently_changed: isRecentlyChanged,
      };
    });

  return {
    ok: true,
    data: {
      thread: {
        id: thread.id,
        status: thread.status,
        closed_at: thread.closed_at,
        last_message_at: thread.last_message_at,
        customer_read_at: thread.customer_read_at,
        owner_read_at: thread.owner_read_at,
      },
      property: {
        id: property.id,
        slug: property.slug,
        name: property.name,
        checkin_time: property.checkin_time,
        checkout_time: property.checkout_time,
        cancellation_preset: property.cancellation_preset,
        cancellation_note: property.cancellation_note,
        guest_ids_required: property.guest_ids_required,
        guest_list_due_hours: property.guest_list_due_hours,
      },
      unit: {
        id: unit.id,
        slug: unit.slug,
        name: unit.name,
      },
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        mobile: customer.mobile,
      },
      booking: {
        id: booking.id,
        property_id: booking.property_id,
        unit_id: booking.unit_id,
        booking_no: booking.booking_no,
        status: booking.status,
        adults: booking.adults,
        children: booking.children,
        nights: booking.nights,
        total_centavos: booking.total_centavos,
        required_centavos: booking.required_centavos,
        guest_note: booking.guest_note,
        confirmed_at: booking.confirmed_at,
        checked_in_at: booking.checked_in_at,
        checked_out_at: booking.checked_out_at,
        cancelled_at: booking.cancelled_at,
        cancelled_by: booking.cancelled_by,
        cancel_reason: booking.cancel_reason,
        vehicle_plate: booking.vehicle_plate,
        guest_list_submitted_at: booking.guest_list_submitted_at,
        created_at: booking.created_at,
        check_in: checkIn,
        check_out: checkOut,
        hold_expires_at: occupancy.expires_at,
        paid_centavos: paidCentavos,
        balance_centavos: balanceCentavos,
        property_arrival_info: canSeeArrivalInfo ? property.arrival_info : null,
        unit_arrival_info: canSeeArrivalInfo ? unit.arrival_info : null,
        lines,
      },
      messages,
      payments,
      payment_accounts: paymentAccounts,
    },
  };
}

export function buildBookingDetailView(
  world: DemoWorld,
  accountId: string,
  bookingId: string,
): Result<BookingDetailView> {
  const booking = world.bookings.find((b) => b.id === bookingId && b.account_id === accountId);
  if (!booking) {
    return err(appError('not_found'));
  }

  const occupancy = world.unit_occupancy.find((o) => o.id === booking.occupancy_id);
  const unit = world.units.find((u) => u.id === booking.unit_id);
  const customer = world.customers.find((c) => c.id === booking.customer_id);
  const thread = world.threads.find((t) => t.booking_id === booking.id);
  if (!occupancy || !unit || !customer || !thread) {
    return err(appError('not_found'));
  }

  const { paidCentavos, balanceCentavos } = calculatePaidAndBalance(world, booking);

  return {
    ok: true,
    data: {
      booking,
      occupancy,
      unit: {
        id: unit.id,
        slug: unit.slug,
        name: unit.name,
        max_guests: unit.max_guests,
      },
      customer,
      lines: world.booking_lines
        .filter((l) => l.booking_id === booking.id)
        .sort((a, b) => a.sort_order - b.sort_order),
      events: world.booking_events.filter((e) => e.booking_id === booking.id),
      guests: world.booking_guests
        .filter((g) => g.booking_id === booking.id)
        .sort((a, b) => a.sort_order - b.sort_order),
      payments: world.payments
        .filter((p) => p.booking_id === booking.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      paid_centavos: paidCentavos,
      balance_centavos: balanceCentavos,
      thread_id: thread.id,
    },
  };
}

export function buildOwnerHomeCounts(
  world: DemoWorld,
  accountId: string,
  clock: Clock,
): Result<{
  readonly arrivals_today: number;
  readonly departures_today: number;
  readonly proofs_to_check: number;
  readonly holds_expiring_soon: number;
  readonly unread_threads: number;
}> {
  const today = manilaToday(clock);
  const nowMs = clock.now().getTime();
  const soonMs = nowMs + 2 * 3_600_000;
  const occById = new Map(world.unit_occupancy.map((o) => [o.id, o]));

  let arrivalsToday = 0;
  let departuresToday = 0;
  let holdsExpiringSoon = 0;

  for (const booking of world.bookings) {
    if (booking.account_id !== accountId) {
      continue;
    }
    const occ = occById.get(booking.occupancy_id);
    if (!occ || !occ.active) {
      continue;
    }
    const checkIn = occ.during.start;
    const checkOut = addDays(checkIn, booking.nights);
    if (checkIn === today && (booking.status === 'confirmed' || booking.status === 'checked_in')) {
      arrivalsToday += 1;
    }
    if (checkOut === today && booking.status === 'checked_in') {
      departuresToday += 1;
    }
    if (
      (booking.status === 'held' || booking.status === 'in_review') &&
      occ.expires_at !== null &&
      Date.parse(occ.expires_at) <= soonMs
    ) {
      holdsExpiringSoon += 1;
    }
  }

  const proofsToCheck = world.payments.filter(
    (p) => p.account_id === accountId && p.status === 'submitted',
  ).length;

  const unreadThreads = world.threads.filter(
    (t) =>
      t.account_id === accountId &&
      t.status === 'open' &&
      t.last_message_at !== null &&
      (t.owner_read_at === null || t.last_message_at > t.owner_read_at),
  ).length;

  return {
    ok: true,
    data: {
      arrivals_today: arrivalsToday,
      departures_today: departuresToday,
      proofs_to_check: proofsToCheck,
      holds_expiring_soon: holdsExpiringSoon,
      unread_threads: unreadThreads,
    },
  };
}

export function buildBookingsBoard(
  world: DemoWorld,
  accountId: string,
  statusFilter: BookingsRow['status'] | null,
): Result<BookingBoardItem[]> {
  const occById = new Map(world.unit_occupancy.map((o) => [o.id, o]));
  const unitById = new Map(world.units.map((u) => [u.id, u]));
  const custById = new Map(world.customers.map((c) => [c.id, c]));

  const items: BookingBoardItem[] = [];
  for (const booking of world.bookings) {
    if (booking.account_id !== accountId) {
      continue;
    }
    if (statusFilter !== null && booking.status !== statusFilter) {
      continue;
    }
    const occ = occById.get(booking.occupancy_id);
    const unit = unitById.get(booking.unit_id);
    const cust = custById.get(booking.customer_id);
    if (!occ || !unit || !cust) {
      continue;
    }
    const { paidCentavos, balanceCentavos } = calculatePaidAndBalance(world, booking);
    const checkIn = occ.during.start;
    items.push({
      id: booking.id,
      property_id: booking.property_id,
      unit_id: booking.unit_id,
      customer_id: booking.customer_id,
      booking_no: booking.booking_no,
      status: booking.status,
      source: booking.source,
      adults: booking.adults,
      children: booking.children,
      nights: booking.nights,
      total_centavos: booking.total_centavos,
      required_centavos: booking.required_centavos,
      created_at: booking.created_at,
      unit_name: unit.name,
      customer_name: cust.full_name,
      check_in: checkIn,
      check_out: addDays(checkIn, booking.nights),
      hold_expires_at: occ.expires_at,
      paid_centavos: paidCentavos,
      balance_centavos: balanceCentavos,
    });
  }

  items.sort((a, b) => b.booking_no - a.booking_no);
  return { ok: true, data: items };
}

export function buildPaymentsToReview(
  world: DemoWorld,
  accountId: string,
  statusFilter: PaymentsRow['status'] | null,
): Result<PaymentReviewItemView[]> {
  const bookingById = new Map(world.bookings.map((b) => [b.id, b]));
  const unitById = new Map(world.units.map((u) => [u.id, u]));
  const custById = new Map(world.customers.map((c) => [c.id, c]));

  const items: PaymentReviewItemView[] = [];
  for (const payment of world.payments) {
    if (payment.account_id !== accountId || payment.booking_id === null) {
      continue;
    }
    if (statusFilter !== null && payment.status !== statusFilter) {
      continue;
    }
    const booking = bookingById.get(payment.booking_id);
    if (!booking) {
      continue;
    }
    const unit = unitById.get(booking.unit_id);
    const cust = custById.get(payment.customer_id);
    if (!unit || !cust) {
      continue;
    }
    const proofFileIds = world.payment_proofs
      .filter((pp) => pp.payment_id === payment.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pp) => pp.file_id);

    items.push({
      id: payment.id,
      booking_id: payment.booking_id,
      customer_id: payment.customer_id,
      kind: payment.kind,
      amount_centavos: payment.amount_centavos,
      method: payment.method,
      reference_no: payment.reference_no,
      paid_on: payment.paid_on,
      status: payment.status,
      submitted_by: payment.submitted_by,
      reject_reason: payment.reject_reason,
      receipt_no: payment.receipt_no,
      wallet_checked: payment.wallet_checked,
      created_at: payment.created_at,
      booking_no: booking.booking_no,
      unit_name: unit.name,
      customer_name: cust.full_name,
      proof_file_ids: proofFileIds,
    });
  }

  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { ok: true, data: items };
}

export function buildInboxThreads(
  world: DemoWorld,
  accountId: string,
  unreadOnly: boolean,
): Result<InboxThreadItemView[]> {
  const custById = new Map(world.customers.map((c) => [c.id, c]));
  const bookingById = new Map(world.bookings.map((b) => [b.id, b]));
  const unitById = new Map(world.units.map((u) => [u.id, u]));

  const items: InboxThreadItemView[] = [];
  for (const thread of world.threads) {
    if (thread.account_id !== accountId) {
      continue;
    }
    const unreadForOwner =
      thread.last_message_at !== null &&
      (thread.owner_read_at === null || thread.last_message_at > thread.owner_read_at);
    if (unreadOnly && !unreadForOwner) {
      continue;
    }
    const cust = custById.get(thread.customer_id);
    if (!cust) {
      continue;
    }
    const booking = thread.booking_id !== null ? bookingById.get(thread.booking_id) : undefined;
    const unit = booking ? unitById.get(booking.unit_id) : undefined;
    const lastMsg = world.messages
      .filter((m) => m.thread_id === thread.id && m.hidden_at === null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    items.push({
      id: thread.id,
      booking_id: thread.booking_id,
      customer_id: thread.customer_id,
      status: thread.status,
      last_message_at: thread.last_message_at,
      customer_read_at: thread.customer_read_at,
      owner_read_at: thread.owner_read_at,
      created_at: thread.created_at,
      customer_name: cust.full_name,
      unit_name: unit?.name ?? 'Unit',
      booking_no: booking?.booking_no ?? null,
      booking_status: booking?.status ?? null,
      last_message_preview: lastMsg?.body ?? null,
      unread_for_owner: unreadForOwner,
    });
  }

  items.sort((a, b) =>
    (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at),
  );
  return { ok: true, data: items };
}

export function buildCalendarTimeline(
  world: DemoWorld,
  accountId: string,
  range: { readonly start: CalendarDate; readonly end: CalendarDate },
): Result<CalendarTimelineView> {
  const bookingByOccId = new Map(world.bookings.map((b) => [b.occupancy_id, b]));
  const custById = new Map(world.customers.map((c) => [c.id, c]));

  const units = world.units
    .filter((u) => u.account_id === accountId && u.archived_at === null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((unit) => {
      const items = world.unit_occupancy
        .filter(
          (occ) =>
            occ.unit_id === unit.id &&
            occ.active &&
            (occ.during.end === null || occ.during.end > range.start) &&
            occ.during.start < range.end,
        )
        .sort((a, b) => a.during.start.localeCompare(b.during.start))
        .map((occ) => {
          const booking = bookingByOccId.get(occ.id);
          const customer = booking ? custById.get(booking.customer_id) : undefined;
          return {
            id: occ.id,
            unit_id: occ.unit_id,
            during: occ.during,
            buffer_nights: occ.buffer_nights,
            kind: occ.kind,
            active: occ.active,
            expires_at: occ.expires_at,
            note: occ.note,
            booking_id: booking?.id ?? null,
            booking_no: booking?.booking_no ?? null,
            booking_status: booking?.status ?? null,
            customer_name: customer?.full_name ?? null,
          };
        });

      return {
        id: unit.id,
        property_id: unit.property_id,
        slug: unit.slug,
        name: unit.name,
        mode: unit.mode,
        unit_type: unit.unit_type,
        status: unit.status,
        sort_order: unit.sort_order,
        items,
      };
    });

  return {
    ok: true,
    data: {
      range,
      units,
    },
  };
}

export function buildAdminOwnerAccounts(
  world: DemoWorld,
  statusFilter: DemoWorld['accounts'][number]['status'] | null,
  clock: Clock,
): Result<AdminOwnerItemView[]> {
  const today = manilaToday(clock);
  const cutoff30 = addDays(today, -30);
  const items: AdminOwnerItemView[] = [];

  for (const account of world.accounts) {
    if (statusFilter !== null && account.status !== statusFilter) {
      continue;
    }
    const sub = world.subscriptions.find((s) => s.account_id === account.id);
    const plan =
      world.plans.find((p) => p.id === (sub?.plan_id ?? DEMO_IDS.platform.standardPlan)) ??
      world.plans[0];
    if (!plan) {
      continue;
    }

    let derivedState: SubscriptionDerivedState = sub?.status ?? 'trial';
    if (sub && sub.status === 'active' && sub.paid_through !== null) {
      const daysPastDue = nightsBetween(sub.paid_through, today);
      if (daysPastDue > 0) {
        derivedState = 'overdue';
      } else if (nightsBetween(today, sub.paid_through) <= 5) {
        derivedState = 'due';
      }
    } else if (sub && sub.status === 'trial' && sub.trial_ends_on !== null) {
      if (nightsBetween(sub.trial_ends_on, today) > 0) {
        derivedState = 'overdue';
      } else if (nightsBetween(today, sub.trial_ends_on) <= 2) {
        derivedState = 'due';
      }
    }

    const unitCount = world.units.filter(
      (u) => u.account_id === account.id && u.archived_at === null,
    ).length;

    const bookingsLast30 = world.bookings.filter(
      (b) => b.account_id === account.id && b.created_at.slice(0, 10) >= cutoff30,
    ).length;

    const storageUsedBytes = world.files
      .filter((f) => f.account_id === account.id && f.status !== 'deleted')
      .reduce((sum, f) => sum + f.size_bytes, 0);

    const pendingPlanPayments = world.subscription_payments.filter(
      (sp) => sp.account_id === account.id && sp.status === 'submitted',
    ).length;

    items.push({
      id: account.id,
      name: account.name,
      status: account.status,
      is_demo: account.is_demo,
      contact_email: account.contact_email,
      contact_mobile: account.contact_mobile,
      approved_at: account.approved_at,
      verified_at: account.verified_at,
      created_at: account.created_at,
      subscription_status: sub?.status ?? 'trial',
      subscription_derived_state: derivedState,
      trial_ends_on: sub?.trial_ends_on ?? null,
      paid_through: sub?.paid_through ?? null,
      extra_units: sub?.extra_units ?? 0,
      unit_count: unitCount,
      bookings_last_30_days: bookingsLast30,
      storage_used_bytes: storageUsedBytes,
      storage_limit_bytes: plan.storage_bytes,
      pending_plan_payments: pendingPlanPayments,
    });
  }

  return { ok: true, data: items };
}
