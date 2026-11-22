// Shrinks listing photos on the phone before upload (P4-5, D49). Ported from the food app's
// compress-image.ts (same rules: longest side 1,600 px, WebP where the browser can write it,
// otherwise JPEG because Safari cannot), plus cropping, centre auto-fit, and lossless PNG QR prep.

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

export interface PixelArea {
  readonly x: number;
  readonly y: number;
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

/**
 * Target dimensions for payment QR codes: always square/aspect-preserving with longest side at
 * least `minSide` (800 px) and at most `maxSide` (1,200 px) so scanners always read the modules.
 */
export function calculateQrDimensions(
  width: number,
  height: number,
  minSide = 800,
  maxSide = 1200,
): Dimensions {
  if (width <= 0 || height <= 0) {
    return { width: minSide, height: minSide };
  }
  const longest = Math.max(width, height);
  if (longest < minSide) {
    const scale = minSide / longest;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }
  if (longest > maxSide) {
    return calculateTargetDimensions(width, height, maxSide);
  }
  return { width: Math.round(width), height: Math.round(height) };
}

/** Computes the largest centred rectangle inside `width × height` matching `aspectRatio`. */
export function calculateCenterCrop(width: number, height: number, aspectRatio: number): PixelArea {
  if (width <= 0 || height <= 0 || aspectRatio <= 0) {
    return { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) };
  }
  const current = width / height;
  if (Math.abs(current - aspectRatio) < 0.001) {
    return { x: 0, y: 0, width, height };
  }
  if (current > aspectRatio) {
    const cropWidth = Math.max(1, Math.round(height * aspectRatio));
    return {
      x: Math.floor((width - cropWidth) / 2),
      y: 0,
      width: cropWidth,
      height,
    };
  }
  const cropHeight = Math.max(1, Math.round(width / aspectRatio));
  return {
    x: 0,
    y: Math.floor((height - cropHeight) / 2),
    width,
    height: cropHeight,
  };
}

/** Types the photo picker accepts. HEIC is left out on purpose: most browsers can't open it. */
export const LISTING_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const LISTING_PHOTO_MAX_BYTES = 15 * 1024 * 1024;
export const LISTING_PHOTO_MIN = { width: 600, height: 400 } as const;
export const LISTING_PHOTO_GOOD_WIDTH = 1024;
export const QR_MIN_SIDE = 800;
export const QR_MAX_SIDE = 1200;

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
  readonly maxSide?: number | undefined;
  readonly quality?: number | undefined;
  /** Optional crop rectangle applied before scaling (in natural source pixels). */
  readonly crop?: PixelArea | undefined;
  /** Keep lossless PNG encoding (never WebP/JPEG). Used for payment QR codes. */
  readonly lossless?: boolean | undefined;
  /** Minimum longest side when scaling (used with lossless QR codes, e.g. 800 px). */
  readonly minSide?: number | undefined;
}

export interface CompressedImage {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  /** The picture's size before shrinking (cropped size when a crop is applied). */
  readonly original: Dimensions;
}

function loadImageSource(srcOrBlob: string | Blob): Promise<{
  readonly img: HTMLImageElement;
  readonly cleanup: () => void;
}> {
  return new Promise((resolve, reject) => {
    const isBlob = typeof srcOrBlob !== 'string';
    const url = isBlob ? URL.createObjectURL(srcOrBlob) : srcOrBlob;
    const cleanup = () => {
      if (isBlob) URL.revokeObjectURL(url);
    };
    const img = new Image();
    img.onload = () => resolve({ img, cleanup });
    img.onerror = () => {
      cleanup();
      reject(new Error('unreadable_image'));
    };
    if (!isBlob && /^https?:/.test(url)) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
  });
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  fallback: Blob,
  options: { readonly lossless: boolean; readonly quality: number },
): Promise<Blob> {
  return new Promise((resolve) => {
    if (options.lossless) {
      // Lossless PNG only — never WebP/JPEG — so QR codes stay razor sharp without blur.
      canvas.toBlob((pngBlob) => resolve(pngBlob ?? fallback), 'image/png');
      return;
    }
    // WebP first. Safari can't write WebP and quietly returns a PNG instead (WebKit bug 226950),
    // which can be bigger than the photo, so anything that isn't a real WebP falls back to JPEG.
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve(webpBlob);
          return;
        }
        canvas.toBlob((jpeg) => resolve(jpeg ?? fallback), 'image/jpeg', options.quality);
      },
      'image/webp',
      options.quality,
    );
  });
}

/**
 * Shrinks (and optionally crops) an image in the browser with a canvas. Rejects with
 * `unreadable_image` when the browser can't open the file. Outside a browser it returns the file
 * unchanged.
 */
export async function compressImage(
  file: Blob,
  options?: CompressOptions,
): Promise<CompressedImage> {
  const maxSide = options?.maxSide ?? 1600;
  const quality = options?.quality ?? 0.8;
  const lossless = options?.lossless === true;
  const minSide = options?.minSide;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob: file, width: 0, height: 0, original: { width: 0, height: 0 } };
  }

  const { img, cleanup } = await loadImageSource(file);
  try {
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    const sourceRect: PixelArea = options?.crop
      ? {
          x: Math.max(0, Math.round(options.crop.x)),
          y: Math.max(0, Math.round(options.crop.y)),
          width: Math.max(1, Math.min(naturalWidth, Math.round(options.crop.width))),
          height: Math.max(1, Math.min(naturalHeight, Math.round(options.crop.height))),
        }
      : { x: 0, y: 0, width: naturalWidth, height: naturalHeight };

    const original = { width: sourceRect.width, height: sourceRect.height };
    const { width, height } =
      minSide !== undefined
        ? calculateQrDimensions(original.width, original.height, minSide, maxSide)
        : calculateTargetDimensions(original.width, original.height, maxSide);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { blob: file, width: original.width, height: original.height, original };
    }
    if (lossless) {
      // Keep QR module edges crisp when scaling.
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingQuality = 'high';
    }
    ctx.drawImage(
      img,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      0,
      0,
      width,
      height,
    );
    const blob = await encodeCanvas(canvas, file, { lossless, quality });
    return { blob, width, height, original };
  } finally {
    cleanup();
  }
}

/**
 * Crops an image URL or Blob to the given pixel rectangle and returns a `Blob` (lossless PNG by
 * default so callers can hand it straight into `compressImage` without double lossy encoding).
 */
export async function cropImage(
  src: string | Blob,
  area: PixelArea,
  options?: {
    readonly width?: number | undefined;
    readonly height?: number | undefined;
    readonly lossless?: boolean | undefined;
    readonly quality?: number | undefined;
  },
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return typeof src === 'string' ? new Blob([], { type: 'image/png' }) : src;
  }

  const { img, cleanup } = await loadImageSource(src);
  try {
    const targetWidth = Math.max(1, Math.round(options?.width ?? area.width));
    const targetHeight = Math.max(1, Math.round(options?.height ?? area.height));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('unreadable_image');
    }
    if (options?.lossless) {
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingQuality = 'high';
    }
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, targetWidth, targetHeight);
    const fallback = typeof src === 'string' ? new Blob([], { type: 'image/png' }) : src;
    return await encodeCanvas(canvas, fallback, {
      lossless: options?.lossless ?? true,
      quality: options?.quality ?? 0.85,
    });
  } finally {
    cleanup();
  }
}

/**
 * Auto-fits a listing photo to the target aspect ratio (4:3 centre crop) and compresses it.
 * Used when an owner selects multiple photos at once so they are never forced to crop each one.
 */
export async function autoFitAndCompressPhoto(
  file: Blob,
  aspectRatio = 4 / 3,
  options?: Omit<CompressOptions, 'crop'>,
): Promise<CompressedImage> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob: file, width: 0, height: 0, original: { width: 0, height: 0 } };
  }
  const { img, cleanup } = await loadImageSource(file);
  let crop: PixelArea;
  try {
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    crop = calculateCenterCrop(naturalWidth, naturalHeight, aspectRatio);
  } finally {
    cleanup();
  }
  return compressImage(file, { ...options, crop });
}

/**
 * Prepares a payment QR code image: optional square crop, lossless PNG only (never lossy WebP or
 * JPEG), at least 800 px on the longest side so scanning stays sharp and reliable.
 */
export async function prepareQrImage(
  file: Blob,
  area?: PixelArea | undefined,
  options?: { readonly minSide?: number | undefined; readonly maxSide?: number | undefined },
): Promise<CompressedImage> {
  return compressImage(file, {
    crop: area,
    lossless: true,
    minSide: options?.minSide ?? QR_MIN_SIDE,
    maxSide: options?.maxSide ?? QR_MAX_SIDE,
  });
}
