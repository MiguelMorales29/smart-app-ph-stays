import { z } from 'zod';

export const FILE_BUCKETS = ['listing-media', 'payment-proofs', 'documents'] as const;
export const fileBucketSchema = z.enum(FILE_BUCKETS);
export type FileBucket = z.infer<typeof fileBucketSchema>;

export const FILE_PURPOSES = [
  'unit_photo',
  'property_photo',
  'logo',
  'profile_photo',
  'payment_qr',
  'proof',
  'subscription_proof',
  'reward_image',
  'message_photo',
  'guest_id',
  'data_export',
] as const;
export const filePurposeSchema = z.enum(FILE_PURPOSES);
export type FilePurpose = z.infer<typeof filePurposeSchema>;

export const FILE_UPLOADER_KINDS = ['owner', 'customer', 'system'] as const;
export const fileUploaderKindSchema = z.enum(FILE_UPLOADER_KINDS);
export type FileUploaderKind = z.infer<typeof fileUploaderKindSchema>;

export const FILE_STATUSES = ['pending', 'ready', 'deleted'] as const;
export const fileStatusSchema = z.enum(FILE_STATUSES);
export type FileStatus = z.infer<typeof fileStatusSchema>;
