import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setupKeys } from '../setup/keys';
import { unitsKeys } from '../units/keys';
import {
  createIdempotencyKey,
  requireOwnerClient,
  unwrapResult,
  useActiveDataClient,
} from '../shared';
import { photosKeys } from './keys';

async function imageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/** Sends the file to a signed address with progress (fetch can't report upload progress). */
function putWithProgress(url: string, file: Blob, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(10 + (event.loaded / event.total) * 80);
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error('upload_failed'));
    request.onerror = () => reject(new Error('upload_failed'));
    request.send(file);
  });
}

export interface UploadedPhoto {
  readonly fileId: string;
  readonly width: number | null;
  readonly height: number | null;
}

export interface UploadPhotoInput {
  readonly file: Blob;
  readonly filename: string;
  readonly purpose: 'unit_photo' | 'property_photo' | 'payment_qr' | 'logo';
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly onProgress?: ((percent: number) => void) | undefined;
}

/**
 * Uploads one already-shrunk image: asks for an upload slot, sends the file, then confirms it.
 * Progress: 10% once the slot is ready, up to 90% while sending, 100% when confirmed. On sample
 * data nothing leaves the device, so progress moves with the (switchable) data latency.
 */
export function useUploadPhotoMutation() {
  const active = useActiveDataClient();
  return useMutation({
    mutationFn: async (input: UploadPhotoInput): Promise<UploadedPhoto> => {
      const { source, session, accountId } = requireOwnerClient(active);
      const size =
        input.width && input.height
          ? { width: input.width, height: input.height }
          : await imageSize(input.file);
      const slot = unwrapResult(
        await source.requestUpload(
          {
            idempotencyKey: createIdempotencyKey('upload'),
            accountId,
            purpose: input.purpose,
            mime: input.file.type || 'application/octet-stream',
            sizeBytes: Math.max(1, input.file.size),
            width: size?.width ?? null,
            height: size?.height ?? null,
            filename: input.filename.slice(0, 200) || 'photo',
          },
          session,
        ),
      );
      input.onProgress?.(10);
      if (slot.uploadUrl.startsWith('http')) {
        await putWithProgress(slot.uploadUrl, input.file, (percent) => input.onProgress?.(percent));
      }
      input.onProgress?.(90);
      const confirmed = unwrapResult(
        await source.confirmUpload(
          {
            idempotencyKey: createIdempotencyKey('confirm-upload'),
            accountId,
            fileId: slot.file.id,
            width: size?.width ?? null,
            height: size?.height ?? null,
            usedByTable: null,
            usedById: null,
          },
          session,
        ),
      );
      input.onProgress?.(100);
      return { fileId: confirmed.id, width: size?.width ?? null, height: size?.height ?? null };
    },
  });
}

/**
 * Saves the photo order and descriptions for each unit given (bed spaces in one room share their
 * photos), or for the property when `unitId` is null.
 */
export function useSetUnitPhotosMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly units: readonly { readonly unitId: string | null; readonly name: string }[];
      readonly photos: readonly { readonly fileId: string; readonly altText: string | null }[];
    }) => {
      const { source, session, accountId } = requireOwnerClient(active);
      for (const unit of input.units) {
        unwrapResult(
          await source.saveListingPhotos(
            {
              idempotencyKey: createIdempotencyKey('save-photos'),
              accountId,
              propertyId: input.propertyId,
              unitId: unit.unitId,
              photos: input.photos.map((photo, index) => ({
                fileId: photo.fileId,
                altText: (photo.altText?.trim() || `${unit.name}, photo ${index + 1}`).slice(
                  0,
                  160,
                ),
              })),
            },
            session,
          ),
        );
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: photosKeys.all }),
        queryClient.invalidateQueries({ queryKey: unitsKeys.all }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]);
    },
  });
}
