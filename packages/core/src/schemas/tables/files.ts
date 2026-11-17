import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import {
  fileBucketSchema,
  filePurposeSchema,
  fileStatusSchema,
  fileUploaderKindSchema,
} from '../../lists/index.js';
import { isoTimestampSchema } from './common.js';

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export const filesRow = z.object({
  id: uuidSchema,
  account_id: uuidSchema,
  bucket: fileBucketSchema,
  path: z.string().min(1).max(300),
  purpose: filePurposeSchema,
  mime: z.string().min(1).max(100),
  size_bytes: z.int().min(1).max(MAX_UPLOAD_SIZE_BYTES),
  width: z.int().min(1).nullable(),
  height: z.int().min(1).nullable(),
  uploaded_by_kind: fileUploaderKindSchema,
  customer_id: uuidSchema.nullable(),
  uploaded_by_profile: uuidSchema.nullable(),
  used_by_table: z.string().min(1).max(60).nullable(),
  used_by_id: uuidSchema.nullable(),
  status: fileStatusSchema,
  confirmed_at: isoTimestampSchema.nullable(),
  delete_after: isoTimestampSchema.nullable(),
  deleted_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
export type FilesRow = z.infer<typeof filesRow>;
