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

export interface UploadedPhoto {
  readonly fileId: string;
  readonly width: number | null;
  readonly height: number | null;
}

/**
 * Uploads one already-prepared image (P4-5 shrinks it first): asks for an upload slot, sends the
 * file, then confirms it. On sample data nothing leaves the device; the data layer only records it.
 */
export function useUploadPhotoMutation() {
  const active = useActiveDataClient();
  return useMutation({
    mutationFn: async (input: {
      readonly file: Blob;
      readonly filename: string;
      readonly purpose: 'unit_photo' | 'property_photo' | 'payment_qr' | 'logo';
    }): Promise<UploadedPhoto> => {
      const { source, session, accountId } = requireOwnerClient(active);
      const size = await imageSize(input.file);
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
      if (slot.uploadUrl.startsWith('http')) {
        await fetch(slot.uploadUrl, { method: 'PUT', body: input.file }).catch(() => undefined);
      }
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
      return { fileId: confirmed.id, width: size?.width ?? null, height: size?.height ?? null };
    },
  });
}

/** Saves the photo order and descriptions for each unit given (bed spaces share their photos). */
export function useSetUnitPhotosMutation() {
  const active = useActiveDataClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      readonly propertyId: string;
      readonly units: readonly { readonly unitId: string | null; readonly name: string }[];
      readonly fileIds: readonly string[];
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
              photos: input.fileIds.map((fileId, index) => ({
                fileId,
                altText: `${unit.name}, photo ${index + 1}`.slice(0, 160),
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
