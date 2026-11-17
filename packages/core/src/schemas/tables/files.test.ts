import { describe, expect, it } from 'vitest';

import { MAX_UPLOAD_SIZE_BYTES, filesRow } from './files.js';

const id1 = 'dec0de00-0000-4000-8000-000000000001';
const id2 = 'dec0de00-0000-4000-8000-000000000002';
const ts = '2026-12-10T10:00:00+08:00';

describe('files table schema', () => {
  it('validates filesRow and rejects 3 broken rows', () => {
    const valid = {
      id: id1,
      account_id: id2,
      bucket: 'listing-media',
      path: `${id2}/photos/${id1}.webp`,
      purpose: 'unit_photo',
      mime: 'image/webp',
      size_bytes: 142886,
      width: 1200,
      height: 900,
      uploaded_by_kind: 'owner',
      customer_id: null,
      uploaded_by_profile: id1,
      used_by_table: 'listing_photos',
      used_by_id: id1,
      status: 'ready',
      confirmed_at: ts,
      delete_after: null,
      deleted_at: null,
      created_at: ts,
      updated_at: ts,
    };
    expect(filesRow.safeParse(valid).success).toBe(true);
    expect(filesRow.safeParse({ ...valid, purpose: 'guest_id' }).success).toBe(true);
    expect(filesRow.safeParse({ ...valid, size_bytes: 0 }).success).toBe(false);
    expect(filesRow.safeParse({ ...valid, size_bytes: MAX_UPLOAD_SIZE_BYTES + 1 }).success).toBe(
      false,
    );
    expect(filesRow.safeParse({ ...valid, bucket: 'public-bucket' }).success).toBe(false);
  });
});
