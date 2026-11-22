import { useCallback, useEffect, useRef, useState } from 'react';
import type { OwnerPhotoView } from '@smartapp/core';
import {
  autoFitAndCompressPhoto,
  checkPhotoFile,
  checkPhotoSize,
  compressImage,
  cropImage,
  formatBytes,
  type PixelArea,
} from '@smartapp/data/compress-image';
import type { CropperAreaData } from '@smartapp/ui/components/cropper';
import type { PhotoCropSheetProps } from '@smartapp/ui/compositions/photo-crop-sheet';
import type { PhotoTile } from '@smartapp/ui/compositions/photo-manager';
import { notify } from '@smartapp/ui/lib/notify';
import { useUploadPhotoMutation, type UploadPhotoInput } from '@/data/photos/upload';
import { extractAppError } from '@/data/shared';

interface PipelineTile extends PhotoTile {
  readonly fileId: string | null;
  readonly source?: Blob | undefined;
  readonly filename?: string | undefined;
  /** Whether to auto-fit to 4:3 centre crop (multi-photo) or apply an explicit crop. */
  readonly mode?: 'as-is' | 'auto-fit' | 'cropped' | undefined;
  readonly crop?: PixelArea | undefined;
  readonly shrunk?: { blob: Blob; width: number; height: number } | undefined;
}

type CropSession =
  | {
      readonly kind: 'new';
      readonly file: File;
      readonly src: string;
    }
  | {
      readonly kind: 'adjust';
      readonly tileId: string;
      readonly src: string;
      readonly source?: Blob | undefined;
      readonly filename: string;
    };

const MAX_UPLOADS = 2;
const LISTING_ASPECT = 4 / 3;

const FILE_PROBLEM: Record<'heic' | 'not_image' | 'too_big', string> = {
  heic: "This iPhone photo (HEIC) can't be opened here. Pick it from Photos, or take a screenshot.",
  not_image: 'Use a JPEG, PNG or WebP photo.',
  too_big: 'This photo is over 15 MB. Pick a smaller one.',
};

function fromSaved(photo: OwnerPhotoView): PipelineTile {
  return {
    id: photo.id,
    fileId: photo.file_id,
    src: photo.url,
    alt: photo.alt_text,
    status: 'saved',
  };
}

let counter = 0;
const localId = () => `new-${Date.now().toString(36)}-${(counter += 1)}`;

/**
 * The photo pipeline behind PhotoManager (P4-5, D49, UI-2):
 * - Multi-photo selection auto-fits each photo to 4:3 (centre crop) and compresses without
 *   forcing a crop sheet.
 * - Single-photo selection opens `PhotoCropSheet` with "Use as is" as the primary action.
 * - Any tile's "Adjust" action opens `PhotoCropSheet` to crop and re-compress in place.
 */
export function usePhotoPipeline({
  saved,
  altPrefix,
  purpose = 'unit_photo',
}: {
  /** The photos already saved for this unit or property (undefined while loading). */
  readonly saved: readonly OwnerPhotoView[] | undefined;
  /** "Ulap Suite A" → "Ulap Suite A, photo 3". */
  readonly altPrefix: string;
  readonly purpose?: UploadPhotoInput['purpose'];
}) {
  const upload = useUploadPhotoMutation();
  const uploadRef = useRef(upload.mutateAsync);
  useEffect(() => {
    uploadRef.current = upload.mutateAsync;
  });
  const [tiles, setTiles] = useState<PipelineTile[]>([]);
  const [dirty, setDirty] = useState(false);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);
  const [cropping, setCropping] = useState(false);
  const loadedRef = useRef(false);
  const urlsRef = useRef(new Set<string>());
  const shrinkQueue = useRef<string[]>([]);
  const uploadQueue = useRef<string[]>([]);
  const shrinking = useRef(false);
  const uploading = useRef(0);
  const tilesRef = useRef<PipelineTile[]>([]);

  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    if (saved === undefined || loadedRef.current) return;
    loadedRef.current = true;
    setTiles(saved.map(fromSaved));
  }, [saved]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const patch = useCallback((id: string, change: Partial<PipelineTile>) => {
    setTiles((list) => list.map((tile) => (tile.id === id ? { ...tile, ...change } : tile)));
  }, []);

  const pumpUploads = useCallback(() => {
    while (uploading.current < MAX_UPLOADS && uploadQueue.current.length > 0) {
      const id = uploadQueue.current.shift();
      const tile = tilesRef.current.find((item) => item.id === id);
      if (!id || !tile?.shrunk) continue;
      uploading.current += 1;
      const shrunk = tile.shrunk;
      patch(id, { status: 'uploading', progress: 0 });
      void uploadRef
        .current({
          file: shrunk.blob,
          filename: tile.filename ?? 'photo.webp',
          purpose,
          width: shrunk.width || undefined,
          height: shrunk.height || undefined,
          onProgress: (progress) => patch(id, { progress }),
        })
        .then((result) => patch(id, { status: 'saved', fileId: result.fileId, progress: 100 }))
        .catch((caught: unknown) =>
          patch(id, {
            status: 'error',
            error: extractAppError(caught).message,
            canRetry: true,
          }),
        )
        .finally(() => {
          uploading.current -= 1;
          pumpUploads();
        });
    }
  }, [patch, purpose]);

  const pumpShrink = useCallback(async () => {
    if (shrinking.current) return;
    shrinking.current = true;
    while (shrinkQueue.current.length > 0) {
      const id = shrinkQueue.current.shift();
      const tile = tilesRef.current.find((item) => item.id === id);
      if (!id || !tile?.source) continue;
      try {
        const result =
          tile.mode === 'auto-fit'
            ? await autoFitAndCompressPhoto(tile.source, LISTING_ASPECT)
            : tile.mode === 'cropped' && tile.crop
              ? await compressImage(tile.source, { crop: tile.crop })
              : await compressImage(tile.source);

        const check = checkPhotoSize(result.original);
        if (check === 'too_small') {
          patch(id, {
            status: 'error',
            error: `Too small (${result.original.width} × ${result.original.height}). Use a photo at least 600 × 400.`,
            canRetry: false,
          });
          continue;
        }
        const shrunk = { blob: result.blob, width: result.width, height: result.height };
        const previewUrl = URL.createObjectURL(result.blob);
        urlsRef.current.add(previewUrl);
        tilesRef.current = tilesRef.current.map((item) =>
          item.id === id ? { ...item, shrunk, src: previewUrl } : item,
        );
        patch(id, {
          shrunk,
          src: previewUrl,
          status: 'uploading',
          progress: 0,
          sizeNote: `${formatBytes(tile.source.size)} → ${formatBytes(result.blob.size)}`,
          warning:
            check === 'small' ? 'Small photo. It may look blurry on big screens.' : undefined,
        });
        uploadQueue.current.push(id);
        pumpUploads();
      } catch {
        patch(id, {
          status: 'error',
          error: FILE_PROBLEM.heic,
          canRetry: false,
        });
      }
    }
    shrinking.current = false;
  }, [patch, pumpUploads]);

  const enqueueFile = useCallback(
    (file: Blob, filename: string, mode: 'as-is' | 'auto-fit' | 'cropped', crop?: PixelArea) => {
      const src = URL.createObjectURL(file);
      urlsRef.current.add(src);
      const tile: PipelineTile = {
        id: localId(),
        fileId: null,
        src,
        alt: '',
        status: 'shrinking',
        source: file,
        filename,
        mode,
        crop,
      };
      setDirty(true);
      tilesRef.current = [...tilesRef.current, tile];
      setTiles((list) => [...list, tile]);
      shrinkQueue.current.push(tile.id);
      void pumpShrink();
    },
    [pumpShrink],
  );

  const add = useCallback(
    (files: File[]) => {
      const valid: File[] = [];
      for (const file of files) {
        const problem = checkPhotoFile(file);
        if (problem) {
          notify.error(FILE_PROBLEM[problem]);
          continue;
        }
        valid.push(file);
      }
      if (valid.length === 0) return;

      // Single photo opens the crop sheet with "Use as is" as the primary action.
      if (valid.length === 1) {
        const single = valid[0];
        if (!single) return;
        const src = URL.createObjectURL(single);
        urlsRef.current.add(src);
        setCropSession({ kind: 'new', file: single, src });
        return;
      }

      // Multi-photo selection auto-fits each photo to 4:3 centre crop and compresses immediately.
      const added: PipelineTile[] = valid.map((file) => {
        const src = URL.createObjectURL(file);
        urlsRef.current.add(src);
        return {
          id: localId(),
          fileId: null,
          src,
          alt: '',
          status: 'shrinking',
          source: file,
          filename: file.name,
          mode: 'auto-fit',
        };
      });
      setDirty(true);
      tilesRef.current = [...tilesRef.current, ...added];
      setTiles((list) => [...list, ...added]);
      shrinkQueue.current.push(...added.map((tile) => tile.id));
      void pumpShrink();
    },
    [pumpShrink],
  );

  const adjust = useCallback((id: string) => {
    const tile = tilesRef.current.find((item) => item.id === id);
    if (!tile) return;
    let src = tile.src;
    if (tile.source) {
      src = URL.createObjectURL(tile.source);
      urlsRef.current.add(src);
    }
    setCropSession({
      kind: 'adjust',
      tileId: id,
      src,
      source: tile.source,
      filename: tile.filename ?? 'photo.webp',
    });
  }, []);

  const confirmCrop = useCallback(
    async (area: CropperAreaData) => {
      if (!cropSession) return;
      if (cropSession.kind === 'new') {
        const file = cropSession.file;
        setCropSession(null);
        enqueueFile(file, file.name, 'cropped', area);
        return;
      }
      setCropping(true);
      try {
        const croppedBlob = cropSession.source
          ? (await compressImage(cropSession.source, { crop: area })).blob
          : (await compressImage(await cropImage(cropSession.src, area))).blob;
        const previewUrl = URL.createObjectURL(croppedBlob);
        urlsRef.current.add(previewUrl);
        const targetId = cropSession.tileId;
        const filename = cropSession.filename;
        setCropSession(null);
        setDirty(true);
        const shrunk = {
          blob: croppedBlob,
          width: Math.round(area.width),
          height: Math.round(area.height),
        };
        tilesRef.current = tilesRef.current.map((item) =>
          item.id === targetId
            ? {
                ...item,
                src: previewUrl,
                shrunk,
                filename,
                status: 'uploading',
                progress: 0,
                error: undefined,
                warning: undefined,
              }
            : item,
        );
        patch(targetId, {
          src: previewUrl,
          shrunk,
          filename,
          status: 'uploading',
          progress: 0,
          error: undefined,
          warning: undefined,
        });
        uploadQueue.current.push(targetId);
        pumpUploads();
      } catch {
        notify.error("Couldn't crop this photo. Try another one.");
      } finally {
        setCropping(false);
      }
    },
    [cropSession, enqueueFile, patch, pumpUploads],
  );

  const useCropAsIs = useCallback(() => {
    if (!cropSession || cropSession.kind !== 'new') return;
    const file = cropSession.file;
    setCropSession(null);
    enqueueFile(file, file.name, 'as-is');
  }, [cropSession, enqueueFile]);

  const reorder = useCallback((ids: string[]) => {
    setDirty(true);
    setTiles((list) =>
      ids.flatMap((id) => {
        const tile = list.find((item) => item.id === id);
        return tile ? [tile] : [];
      }),
    );
  }, []);

  const setAlt = useCallback((id: string, alt: string) => {
    setDirty(true);
    setTiles((list) => list.map((tile) => (tile.id === id ? { ...tile, alt } : tile)));
  }, []);

  const remove = useCallback((id: string) => {
    setDirty(true);
    setTiles((list) => {
      const tile = list.find((item) => item.id === id);
      if (tile?.src.startsWith('blob:')) {
        URL.revokeObjectURL(tile.src);
        urlsRef.current.delete(tile.src);
      }
      return list.filter((item) => item.id !== id);
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      const tile = tilesRef.current.find((item) => item.id === id);
      if (!tile) return;
      patch(id, { status: tile.shrunk ? 'uploading' : 'shrinking', error: undefined, progress: 0 });
      if (tile.shrunk) {
        uploadQueue.current.push(id);
        pumpUploads();
      } else {
        shrinkQueue.current.push(id);
        void pumpShrink();
      }
    },
    [patch, pumpShrink, pumpUploads],
  );

  const reset = useCallback((next: readonly OwnerPhotoView[]) => {
    setTiles(next.map(fromSaved));
    setDirty(false);
  }, []);

  const busy = tiles.some((tile) => tile.status === 'shrinking' || tile.status === 'uploading');
  const display = tiles.map((tile, index) =>
    tile.alt.trim() ? tile : { ...tile, alt: `${altPrefix}, photo ${index + 1}`.slice(0, 160) },
  );
  const ready = display.filter((tile) => tile.status === 'saved' && tile.fileId !== null);

  const cropSheetProps: PhotoCropSheetProps = {
    open: cropSession !== null,
    onOpenChange: (next) => {
      if (!next && !cropping) setCropSession(null);
    },
    src: cropSession?.src ?? null,
    title: cropSession?.kind === 'adjust' ? 'Adjust photo' : 'Fit photo',
    description: 'Drag to move. Pinch or use the buttons to zoom.',
    aspectRatio: LISTING_ASPECT,
    shape: 'rectangle',
    primaryAction: cropSession?.kind === 'new' ? 'use-as-is' : 'crop',
    confirmLabel: 'Apply crop',
    useAsIsLabel: 'Use as is',
    busy: cropping,
    onConfirm: confirmCrop,
    onUseAsIs: cropSession?.kind === 'new' ? useCropAsIs : undefined,
  };

  return {
    tiles: display,
    add,
    adjust,
    reorder,
    setAlt,
    remove,
    retry,
    reset,
    busy,
    dirty,
    markSaved: () => setDirty(false),
    photosToSave: ready.map((tile) => ({ fileId: tile.fileId ?? '', altText: tile.alt })),
    failedCount: tiles.filter((tile) => tile.status === 'error').length,
    cropSheetProps,
  };
}
