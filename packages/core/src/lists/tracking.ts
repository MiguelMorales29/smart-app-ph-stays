import { z } from 'zod';

export const META_PIXEL_SCOPES = ['platform', 'account', 'property'] as const;
export const metaPixelScopeSchema = z.enum(META_PIXEL_SCOPES);
export type MetaPixelScope = z.infer<typeof metaPixelScopeSchema>;

export const META_PIXEL_STATUSES = ['off', 'test', 'live'] as const;
export const metaPixelStatusSchema = z.enum(META_PIXEL_STATUSES);
export type MetaPixelStatus = z.infer<typeof metaPixelStatusSchema>;

export const META_EVENT_NAMES = [
  'PageView',
  'ViewContent',
  'CompleteRegistration',
  'StartTrial',
  'Purchase',
] as const;
export const metaEventNameSchema = z.enum(META_EVENT_NAMES);
export type MetaEventName = z.infer<typeof metaEventNameSchema>;

export const META_DELIVERY_ENTITY_TYPES = ['accounts', 'subscription_payments'] as const;
export const metaDeliveryEntityTypeSchema = z.enum(META_DELIVERY_ENTITY_TYPES);
export type MetaDeliveryEntityType = z.infer<typeof metaDeliveryEntityTypeSchema>;

export const META_DELIVERY_STATUSES = ['pending', 'sending', 'sent', 'failed', 'expired'] as const;
export const metaDeliveryStatusSchema = z.enum(META_DELIVERY_STATUSES);
export type MetaDeliveryStatus = z.infer<typeof metaDeliveryStatusSchema>;

export const META_DELIVERY_TRIGGERS = ['owner', 'super_admin', 'job'] as const;
export const metaDeliveryTriggerSchema = z.enum(META_DELIVERY_TRIGGERS);
export type MetaDeliveryTrigger = z.infer<typeof metaDeliveryTriggerSchema>;

export const META_ACTION_SOURCES = ['website', 'other'] as const;
export const metaActionSourceSchema = z.enum(META_ACTION_SOURCES);
export type MetaActionSource = z.infer<typeof metaActionSourceSchema>;
