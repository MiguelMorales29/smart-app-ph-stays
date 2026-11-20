import { describe, expect, it } from 'vitest';

import {
  calculateTargetDimensions,
  checkPhotoFile,
  checkPhotoSize,
  compressImage,
  formatBytes,
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
