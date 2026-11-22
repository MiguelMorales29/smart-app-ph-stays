import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calculateCenterCrop,
  calculateQrDimensions,
  calculateTargetDimensions,
  checkPhotoFile,
  checkPhotoSize,
  compressImage,
  formatBytes,
  prepareQrImage,
} from './compress-image.js';

describe('calculateTargetDimensions', () => {
  it('scales a landscape photo so the longest side is 1600 px', () => {
    expect(calculateTargetDimensions(3200, 2400)).toEqual({ width: 1600, height: 1200 });
  });

  it('scales a portrait photo so the longest side is 1600 px', () => {
    expect(calculateTargetDimensions(2400, 3200)).toEqual({ width: 1200, height: 1600 });
  });

  it('leaves smaller photos alone', () => {
    expect(calculateTargetDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('scales squares exactly', () => {
    expect(calculateTargetDimensions(2500, 2500)).toEqual({ width: 1600, height: 1600 });
  });

  it('never returns zero', () => {
    const result = calculateTargetDimensions(0, 0);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateQrDimensions', () => {
  it('upscales small QR crops to at least 800 px on the longest side', () => {
    expect(calculateQrDimensions(400, 400)).toEqual({ width: 800, height: 800 });
    expect(calculateQrDimensions(500, 500)).toEqual({ width: 800, height: 800 });
  });

  it('preserves sharp sizes between 800 px and 1200 px', () => {
    expect(calculateQrDimensions(900, 900)).toEqual({ width: 900, height: 900 });
    expect(calculateQrDimensions(1200, 1200)).toEqual({ width: 1200, height: 1200 });
  });

  it('caps huge QR crops at 1200 px', () => {
    expect(calculateQrDimensions(2400, 2400)).toEqual({ width: 1200, height: 1200 });
  });
});

describe('calculateCenterCrop', () => {
  it('centres a 4:3 crop inside a wide 16:9 photo', () => {
    expect(calculateCenterCrop(1600, 900, 4 / 3)).toEqual({
      x: 200,
      y: 0,
      width: 1200,
      height: 900,
    });
  });

  it('centres a 4:3 crop inside a tall portrait photo', () => {
    expect(calculateCenterCrop(1200, 1600, 4 / 3)).toEqual({
      x: 0,
      y: 350,
      width: 1200,
      height: 900,
    });
  });

  it('keeps an already 4:3 photo untouched', () => {
    expect(calculateCenterCrop(1600, 1200, 4 / 3)).toEqual({
      x: 0,
      y: 0,
      width: 1600,
      height: 1200,
    });
  });
});

describe('checkPhotoFile', () => {
  it('accepts JPEG, PNG and WebP up to 15 MB', () => {
    expect(checkPhotoFile({ name: 'a.jpg', type: 'image/jpeg', size: 15 * 1024 * 1024 })).toBe(
      null,
    );
    expect(checkPhotoFile({ name: 'a.webp', type: 'image/webp', size: 10 })).toBe(null);
  });

  it('spots HEIC by type or by name', () => {
    expect(checkPhotoFile({ name: 'IMG_1.HEIC', type: '', size: 10 })).toBe('heic');
    expect(checkPhotoFile({ name: 'x', type: 'image/heif', size: 10 })).toBe('heic');
  });

  it('refuses other files and anything over 15 MB', () => {
    expect(checkPhotoFile({ name: 'a.gif', type: 'image/gif', size: 10 })).toBe('not_image');
    expect(checkPhotoFile({ name: 'a.jpg', type: 'image/jpeg', size: 16 * 1024 * 1024 })).toBe(
      'too_big',
    );
  });
});

describe('checkPhotoSize', () => {
  it('refuses under 600 × 400 either way round', () => {
    expect(checkPhotoSize({ width: 590, height: 900 })).toBe('small');
    expect(checkPhotoSize({ width: 390, height: 590 })).toBe('too_small');
    expect(checkPhotoSize({ width: 400, height: 600 })).toBe('small');
    expect(checkPhotoSize({ width: 800, height: 399 })).toBe('too_small');
  });

  it('warns under 1024 px wide', () => {
    expect(checkPhotoSize({ width: 1000, height: 750 })).toBe('small');
    expect(checkPhotoSize({ width: 1600, height: 1200 })).toBe('ok');
  });
});

describe('formatBytes', () => {
  it('writes MB with one decimal and KB as a whole number', () => {
    expect(formatBytes(4.2 * 1024 * 1024)).toBe('4.2 MB');
    expect(formatBytes(180 * 1024)).toBe('180 KB');
    expect(formatBytes(10)).toBe('1 KB');
  });
});

describe('compressImage outside a browser', () => {
  it('returns the file unchanged', async () => {
    const blob = new Blob(['test image data'], { type: 'image/png' });
    const result = await compressImage(blob);
    expect(result.blob.size).toBe(blob.size);
  });
});

describe('prepareQrImage lossless PNG guarantee', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never uses lossy WebP or JPEG compression and keeps QR at least 800 px sharp PNG', async () => {
    const requestedTypes: Array<{ readonly type: string | undefined; readonly quality: unknown }> =
      [];
    let smoothingEnabled: boolean | undefined;
    let canvasWidth = 0;
    let canvasHeight = 0;

    const fakeContext = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      drawImage: vi.fn(() => {
        smoothingEnabled = fakeContext.imageSmoothingEnabled;
      }),
    };

    const fakeCanvas = {
      get width() {
        return canvasWidth;
      },
      set width(value: number) {
        canvasWidth = value;
      },
      get height() {
        return canvasHeight;
      },
      set height(value: number) {
        canvasHeight = value;
      },
      getContext: vi.fn(() => fakeContext),
      toBlob: vi.fn((callback: (blob: Blob | null) => void, type?: string, quality?: number) => {
        requestedTypes.push({ type, quality });
        callback(new Blob(['png-bytes'], { type: type ?? 'image/png' }));
      }),
    };

    class FakeImage {
      naturalWidth = 420;
      naturalHeight = 420;
      width = 420;
      height = 420;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') return fakeCanvas;
        throw new Error(`Unexpected tag ${tag}`);
      }),
    });
    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-qr'),
      revokeObjectURL: vi.fn(),
    });

    const input = new Blob(['raw-qr'], { type: 'image/png' });
    const result = await prepareQrImage(input, { x: 10, y: 10, width: 400, height: 400 });

    expect(requestedTypes).toEqual([{ type: 'image/png', quality: undefined }]);
    expect(requestedTypes.some((entry) => entry.type === 'image/webp')).toBe(false);
    expect(requestedTypes.some((entry) => entry.type === 'image/jpeg')).toBe(false);
    expect(result.blob.type).toBe('image/png');
    expect(result.width).toBeGreaterThanOrEqual(800);
    expect(result.height).toBeGreaterThanOrEqual(800);
    expect(smoothingEnabled).toBe(false);
  });
});
