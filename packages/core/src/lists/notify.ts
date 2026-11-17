import { z } from 'zod';

export const PUSH_AUDIENCES = ['customer', 'owner'] as const;
export const pushAudienceSchema = z.enum(PUSH_AUDIENCES);
export type PushAudience = z.infer<typeof pushAudienceSchema>;

export const NOTIFICATION_CHANNELS = ['push', 'email'] as const;
export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export const NOTIFICATION_STATUSES = ['pending', 'sending', 'sent', 'failed', 'dead'] as const;
export const notificationStatusSchema = z.enum(NOTIFICATION_STATUSES);
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
