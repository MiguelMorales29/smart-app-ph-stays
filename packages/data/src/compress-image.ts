// Shrinks listing photos on the phone before upload (P4-5, D49). Ported from the food app's
// compress-image.ts (same rules: longest side 1,600 px, WebP where the browser can write it,
// otherwise JPEG because Safari cannot), plus the photo checks the listing rules need.

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

export function calculateTargetDimensions(
  width: number,
  height: number,
  maxSide = 1600,
): Dimensions {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }
  if (width <= maxSide && height <= maxSide) {
    return { width, height };
  }
  if (width >= height) {
    return { width: maxSide, height: Math.max(1, Math.round(maxSide * (height / width))) };
  }
  return { width: Math.max(1, Math.round(maxSide * (width / height))), height: maxSide };
}

/** Types the photo picker accepts. HEIC is left out on purpose: most browsers can't open it. */
export const LISTING_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const LISTING_PHOTO_MAX_BYTES = 15 * 1024 * 1024;
export const LISTING_PHOTO_MIN = { width: 600, height: 400 } as const;
export const LISTING_PHOTO_GOOD_WIDTH = 1024;

export type PhotoFileProblem = 'heic' | 'not_image' | 'too_big';

/** Checks a picked file before anything is read: the type and the size. */
export function checkPhotoFile(file: {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}): PhotoFileProblem | null {
  const type = file.type.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)) {
    return 'heic';
  }
  if (!LISTING_PHOTO_TYPES.some((allowed) => allowed === type)) return 'not_image';
  if (file.size > LISTING_PHOTO_MAX_BYTES) return 'too_big';
  return null;
}

export type PhotoSizeCheck = 'too_small' | 'small' | 'ok';

/** Refuses under 600 × 400 (either way round) and warns under 1,024 px wide. */
export function checkPhotoSize(size: Dimensions): PhotoSizeCheck {
  const long = Math.max(size.width, size.height);
  const short = Math.min(size.width, size.height);
  if (long < LISTING_PHOTO_MIN.width || short < LISTING_PHOTO_MIN.height) return 'too_small';
  if (size.width < LISTING_PHOTO_GOOD_WIDTH) return 'small';
  return 'ok';
}

/** "4.2 MB", "180 KB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export interface CompressOptions {
  readonly maxSide?: number;
  readonly quality?: number;
}

export interface CompressedImage {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  /** The picture's size before shrinking. */
  readonly original: Dimensions;
}

/**
 * Shrinks an image in the browser with a canvas. Rejects with `unreadable_image` when the browser
 * can't open the file (a HEIC that slipped through, a broken file). Outside a browser it returns
 * the file unchanged.
 */
export async function compressImage(
  file: Blob,
  options?: CompressOptions,
): Promise<CompressedImage> {
  const maxSide = options?.maxSide ?? 1600;
  const quality = options?.quality ?? 0.8;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob: file, width: 0, height: 0, original: { width: 0, height: 0 } };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const original = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      };
      const { width, height } = calculateTargetDimensions(original.width, original.height, maxSide);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: file, width: original.width, height: original.height, original });
        return;
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      // WebP first. Safari can't write WebP and quietly returns a PNG instead (WebKit bug 226950),
      // which can be bigger than the photo, so anything that isn't a real WebP falls back to JPEG.
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob && webpBlob.type === 'image/webp') {
            resolve({ blob: webpBlob, width, height, original });
            return;
          }
          canvas.toBlob(
            (jpeg) => resolve({ blob: jpeg ?? file, width, height, original }),
            'image/jpeg',
            quality,
          );
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('unreadable_image'));
    };

    img.src = objectUrl;
  });
}
