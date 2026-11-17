import { z } from 'zod';

export const BOOKING_STATUSES = [
  'held',
  'in_review',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'expired',
] as const;
export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const BOOKING_SOURCES = ['direct', 'manual'] as const;
export const bookingSourceSchema = z.enum(BOOKING_SOURCES);
export type BookingSource = z.infer<typeof bookingSourceSchema>;

export const BOOKING_CANCELLED_BY = ['customer', 'owner', 'system'] as const;
export const bookingCancelledBySchema = z.enum(BOOKING_CANCELLED_BY);
export type BookingCancelledBy = z.infer<typeof bookingCancelledBySchema>;

export const BOOKING_LINE_KINDS = ['night', 'fee', 'discount'] as const;
export const bookingLineKindSchema = z.enum(BOOKING_LINE_KINDS);
export type BookingLineKind = z.infer<typeof bookingLineKindSchema>;

export const BOOKING_EVENT_TYPES = [
  'created',
  'proof_submitted',
  'payment_approved',
  'payment_rejected',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'expired',
  'dates_changed',
  'note',
] as const;
export const bookingEventTypeSchema = z.enum(BOOKING_EVENT_TYPES);
export type BookingEventType = z.infer<typeof bookingEventTypeSchema>;

export const BOOKING_ACTOR_KINDS = ['customer', 'owner', 'staff', 'system'] as const;
export const bookingActorKindSchema = z.enum(BOOKING_ACTOR_KINDS);
export type BookingActorKind = z.infer<typeof bookingActorKindSchema>;
