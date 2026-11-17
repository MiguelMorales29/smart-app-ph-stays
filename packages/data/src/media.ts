import type { FilesRow } from '@smartapp/core';

export type MediaConfig =
  | {
      readonly mode: 'memory';
      /**
       * Storefront origin from app config (e.g. `'http://localhost:3100'` or `''` for same-origin `/demo-media/...`).
       */
      readonly storefrontOrigin: string;
    }
  | {
      readonly mode: 'supabase';
      readonly storageBaseUrl: string;
    };

export type MediaFileRef = Pick<FilesRow, 'bucket' | 'path'>;

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Converts a `files` row into a URL. In memory mode, demo files resolve to
 * `/demo-media/...` on the configured storefront origin; Phase 11 switches
 * to Supabase Storage.
 */
export function mediaUrl(file: MediaFileRef, config: MediaConfig): string {
  const cleanPath = file.path.replace(/^\/+/, '');
  if (config.mode === 'memory') {
    const origin = stripTrailingSlash(config.storefrontOrigin);
    if (cleanPath.startsWith('demo-media/')) {
      return `${origin}/${cleanPath}`;
    }
    return `${origin}/demo-media/${file.bucket}/${cleanPath}`;
  }

  const base = stripTrailingSlash(config.storageBaseUrl);
  return `${base}/storage/v1/object/public/${file.bucket}/${cleanPath}`;
}
