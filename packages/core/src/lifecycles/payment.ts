import type { PaymentStatus } from '../lists/payments.js';
import type { LifecycleMachine } from './machine.js';

export type PaymentLifecycleActor = 'customer' | 'owner';

export const PAYMENT_LIFECYCLE: LifecycleMachine<PaymentStatus, PaymentLifecycleActor> = [
  { from: null, to: 'submitted', by: 'customer' },
  { from: null, to: 'approved', by: 'owner' },
  { from: 'submitted', to: 'approved', by: 'owner' },
  { from: 'submitted', to: 'rejected', by: 'owner' },
  { from: 'approved', to: 'reversed', by: 'owner' },
] as const;
