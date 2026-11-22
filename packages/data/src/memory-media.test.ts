import { afterEach, describe, expect, it, vi } from 'vitest';

import { mediaUrl } from './media.js';
import {
  clearMemoryUploads,
  extractFileIdFromMemoryPath,
  registerMemoryUpload,
  registerMemoryUploadUrl,
  resolveMemoryUploadUrl,
} from './memory-media.js';

const FILE_ID = '00000000-0000-4000-8000-000000009999';

afterEach(() => {
  clearMemoryUploads();
  vi.restoreAllMocks();
});

describe('memory-media registry', () => {
  it('extracts file id from memory upload paths', () => {
    expect(extractFileIdFromMemoryPath(`acct-1/unit_photo/${FILE_ID}.webp`)).toBe(FILE_ID);
    expect(extractFileIdFromMemoryPath(`demo-media/ulap-suites/photos/studio-1.webp`)).toBeNull();
  });

  it('returns registered upload URL from mediaUrl in memory mode (by id or path)', () => {
    const dataUrl = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    registerMemoryUploadUrl(FILE_ID, dataUrl);

    expect(
      mediaUrl(
        {
          id: FILE_ID,
          bucket: 'listing-media',
          path: `acct/unit_photo/${FILE_ID}.webp`,
        },
        { mode: 'memory', storefrontOrigin: 'http://localhost:3100' },
      ),
    ).toBe(dataUrl);

    expect(
      mediaUrl(
        {
          bucket: 'listing-media',
          path: `acct/unit_photo/${FILE_ID}.webp`,
        },
        { mode: 'memory', storefrontOrigin: 'http://localhost:3100' },
      ),
    ).toBe(dataUrl);
  });

  it('keeps the in-memory object URL if sessionStorage quota throws', async () => {
    const fakeBlob = new Blob(['webp-bytes'], { type: 'image/webp' });
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:memory-test-1');
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: () => null,
          setItem: () => {
            throw new DOMException('QuotaExceededError');
          },
          removeItem: () => undefined,
          key: () => null,
          length: 0,
        },
      },
    });

    try {
      const url = await registerMemoryUpload(FILE_ID, fakeBlob);
      expect(url).toBe('blob:memory-test-1');
      expect(resolveMemoryUploadUrl(FILE_ID)).toBe('blob:memory-test-1');
      expect(createSpy).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
