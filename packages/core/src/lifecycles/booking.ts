import type { BookingStatus } from '../lists/bookings.js';
import type { LifecycleMachine } from './machine.js';

export type BookingLifecycleActor = 'customer' | 'owner' | 'system';

export const BOOKING_LIFECYCLE: LifecycleMachine<BookingStatus, BookingLifecycleActor> = [
  { from: null, to: 'held', by: 'customer' },
  { from: null, to: 'confirmed', by: 'owner' },
  { from: 'held', to: 'in_review', by: 'customer' },
  { from: 'in_review', to: 'confirmed', by: 'owner' },
  { from: 'in_review', to: 'held', by: 'owner' },
  { from: 'held', to: 'expired', by: 'system' },
  { from: 'in_review', to: 'expired', by: 'system' },
  { from: 'held', to: 'cancelled', by: 'customer' },
  { from: 'held', to: 'cancelled', by: 'owner' },
  { from: 'in_review', to: 'cancelled', by: 'customer' },
  { from: 'in_review', to: 'cancelled', by: 'owner' },
  { from: 'confirmed', to: 'cancelled', by: 'customer' },
  { from: 'confirmed', to: 'cancelled', by: 'owner' },
  { from: 'confirmed', to: 'checked_in', by: 'owner' },
  { from: 'confirmed', to: 'completed', by: 'owner' },
  { from: 'confirmed', to: 'completed', by: 'system' },
  { from: 'checked_in', to: 'completed', by: 'owner' },
  { from: 'checked_in', to: 'completed', by: 'system' },
] as const;
