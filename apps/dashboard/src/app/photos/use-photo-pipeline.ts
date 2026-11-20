import { useCallback, useEffect, useRef, useState } from 'react';
import type { OwnerPhotoView } from '@smartapp/core';
import {
  checkPhotoFile,
  checkPhotoSize,
  compressImage,
  formatBytes,
} from '@smartapp/data/compress-image';
import type { PhotoTile } from '@smartapp/ui/compositions/photo-manager';
import { notify } from '@smartapp/ui/lib/notify';
import { useUploadPhotoMutation, type UploadPhotoInput } from '@/data/photos/upload';
import { extractAppError } from '@/data/shared';

interface PipelineTile extends PhotoTile {
  readonly fileId: string | null;
  readonly source?: File | undefined;
  readonly shrunk?: { blob: Blob; width: number; height: number } | undefined;
}

const MAX_UPLOADS = 2;

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
 * The photo pipeline behind PhotoManager (P4-5, D49): checks each file, shrinks one at a time,
 * uploads at most 2 at once, and keeps the order and descriptions until the owner saves.
 * Preview links are revoked when a tile is removed or the screen closes.
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

  // Load the saved photos once; later refetches don't overwrite unsaved changes.
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
          filename: tile.source?.name ?? 'photo',
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
        const result = await compressImage(tile.source);
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
        tilesRef.current = tilesRef.current.map((item) =>
          item.id === id ? { ...item, shrunk } : item,
        );
        patch(id, {
          shrunk,
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

  const add = useCallback(
    (files: File[]) => {
      const added: PipelineTile[] = [];
      for (const file of files) {
        const problem = checkPhotoFile(file);
        if (problem) {
          notify.error(FILE_PROBLEM[problem]);
          continue;
        }
        const src = URL.createObjectURL(file);
        urlsRef.current.add(src);
        added.push({
          id: localId(),
          fileId: null,
          src,
          alt: '',
          status: 'shrinking',
          source: file,
        });
      }
      if (added.length === 0) return;
      setDirty(true);
      tilesRef.current = [...tilesRef.current, ...added];
      setTiles((list) => [...list, ...added]);
      shrinkQueue.current.push(...added.map((tile) => tile.id));
      void pumpShrink();
    },
    [pumpShrink],
  );

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

  /** Forget unsaved changes and show the saved photos again. */
  const reset = useCallback((next: readonly OwnerPhotoView[]) => {
    setTiles(next.map(fromSaved));
    setDirty(false);
  }, []);

  const busy = tiles.some((tile) => tile.status === 'shrinking' || tile.status === 'uploading');
  // Descriptions are filled in for the owner where empty ("Ulap Suite A, photo 3").
  const display = tiles.map((tile, index) =>
    tile.alt.trim() ? tile : { ...tile, alt: `${altPrefix}, photo ${index + 1}`.slice(0, 160) },
  );
  const ready = display.filter((tile) => tile.status === 'saved' && tile.fileId !== null);

  return {
    tiles: display,
    add,
    reorder,
    setAlt,
    remove,
    retry,
    reset,
    busy,
    dirty,
    markSaved: () => setDirty(false),
    /** What to save: the uploaded photos in order. Failed or unfinished ones are left out. */
    photosToSave: ready.map((tile) => ({ fileId: tile.fileId ?? '', altText: tile.alt })),
    failedCount: tiles.filter((tile) => tile.status === 'error').length,
  };
}
