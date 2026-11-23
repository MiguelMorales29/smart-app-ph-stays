import type { ProfileAvatar } from '@smartapp/core';
import { resolveMemoryUploadUrl } from '@smartapp/data';
import { PersonAvatar, directPhotoSrc } from '@smartapp/ui/compositions/person-avatar';
import { useProfileQuery } from '@/data/settings/reads';

// Remembers locally uploaded profile photo previews in memory mode so every avatar across the
// dashboard (AccountMenu, top bar, Settings → Account) renders the freshly cropped photo at once.
const localPhotoCache = new Map<string, string>();

export function rememberProfilePhoto(fileId: string, previewUrl: string): void {
  localPhotoCache.set(fileId, previewUrl);
}

export function resolveProfilePhotoSrc(
  fileId: string,
  serverPhotoUrl?: string | null,
): string | null {
  const cached = localPhotoCache.get(fileId);
  if (cached) return cached;
  const memoryUploaded = resolveMemoryUploadUrl(fileId);
  if (memoryUploaded) return memoryUploaded;
  if (serverPhotoUrl) return serverPhotoUrl;
  return directPhotoSrc(fileId);
}

/**
 * Renders the signed-in owner's `PersonAvatar` using the live profile query (or explicit override).
 * Used in `AccountMenu` (sidebar, top bar, dropdown) and `AccountSettingsPage` so a picked face or
 * uploaded photo shows identically everywhere.
 */
export function DashboardOwnerAvatar({
  name,
  avatar,
  photoUrl,
  size,
  className,
}: {
  readonly name: string;
  readonly avatar?: ProfileAvatar | null | undefined;
  readonly photoUrl?: string | null | undefined;
  readonly size?: 'default' | 'sm' | 'lg' | undefined;
  readonly className?: string | undefined;
}) {
  const profileQuery = useProfileQuery();
  const effectiveAvatar =
    avatar !== undefined ? avatar : (profileQuery.data?.profile.avatar ?? null);
  const effectiveName = name || profileQuery.data?.profile.full_name || 'Account';
  const effectivePhotoUrl =
    photoUrl !== undefined ? photoUrl : (profileQuery.data?.profile_photo_url ?? null);

  return (
    <PersonAvatar
      avatar={effectiveAvatar}
      name={effectiveName}
      photoSrc={(fileId) => resolveProfilePhotoSrc(fileId, effectivePhotoUrl)}
      size={size}
      className={className}
    />
  );
}
