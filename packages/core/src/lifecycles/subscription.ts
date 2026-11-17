import type { SubscriptionStatus } from '../lists/platform.js';
import type { LifecycleMachine } from './machine.js';

export type SubscriptionLifecycleActor = 'owner' | 'super_admin' | 'system';

export const SUBSCRIPTION_LIFECYCLE: LifecycleMachine<
  SubscriptionStatus,
  SubscriptionLifecycleActor
> = [
  { from: null, to: 'trial', by: 'super_admin' },
  { from: 'trial', to: 'active', by: 'super_admin' },
  { from: 'trial', to: 'paused', by: 'system' },
  { from: 'active', to: 'paused', by: 'system' },
  { from: 'paused', to: 'active', by: 'super_admin' },
  { from: 'trial', to: 'cancelled', by: 'owner' },
  { from: 'trial', to: 'cancelled', by: 'super_admin' },
  { from: 'active', to: 'cancelled', by: 'owner' },
  { from: 'active', to: 'cancelled', by: 'super_admin' },
  { from: 'paused', to: 'cancelled', by: 'owner' },
  { from: 'paused', to: 'cancelled', by: 'super_admin' },
] as const;
