import { z } from 'zod';

export const THREAD_STATUSES = ['open', 'closed'] as const;
export const threadStatusSchema = z.enum(THREAD_STATUSES);
export type ThreadStatus = z.infer<typeof threadStatusSchema>;

export const MESSAGE_SENDER_KINDS = ['customer', 'owner', 'system'] as const;
export const messageSenderKindSchema = z.enum(MESSAGE_SENDER_KINDS);
export type MessageSenderKind = z.infer<typeof messageSenderKindSchema>;

export const MESSAGE_KINDS = ['text', 'event', 'payment'] as const;
export const messageKindSchema = z.enum(MESSAGE_KINDS);
export type MessageKind = z.infer<typeof messageKindSchema>;
