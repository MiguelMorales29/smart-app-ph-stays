const MEMORY_MEDIA_PREFIX = 'smartapp.memory.media.v1:';

// In-memory map keyed by fileId -> object URL (or data URL). Keeps uploaded photos alive for
// the tab even when sessionStorage is unavailable or its quota is full.
const memoryUrls = new Map<string, string>();

// Matches the last path segment before the file extension:
// e.g. "<accountId>/<purpose>/<fileId>.webp" -> "<fileId>"
const UUID_SEGMENT_RE =
  /(?:^|\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.[a-z0-9]+)?$/i;

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readFromSessionStorage(fileId: string): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${MEMORY_MEDIA_PREFIX}${fileId}`);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

function writeToSessionStorage(fileId: string, dataUrl: string): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(`${MEMORY_MEDIA_PREFIX}${fileId}`, dataUrl);
  } catch {
    // Quota full or private browsing: keep the in-memory object URL so photos still show
    // until the tab closes.
  }
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      try {
        reader.readAsDataURL(blob);
      } catch {
        resolve(null);
      }
      return;
    }
    resolve(null);
  });
}

/**
 * Extracts a UUID file id from a memory-mode storage path (`<account>/<purpose>/<fileId>.<ext>`).
 */
export function extractFileIdFromMemoryPath(path: string): string | null {
  const match = UUID_SEGMENT_RE.exec(path.trim());
  return match?.[1] ?? null;
}

/**
 * Stores uploaded bytes for a memory-mode file id:
 * - Creates an in-memory object URL (instant, zero quota risk) when supported.
 * - Persists a data URL to `sessionStorage` in `try/catch` so it survives in-tab reloads/views.
 */
export async function registerMemoryUpload(fileId: string, blob: Blob): Promise<string> {
  let objectUrl: string | null = null;
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      objectUrl = URL.createObjectURL(blob);
    } catch {
      objectUrl = null;
    }
  }

  if (objectUrl) {
    memoryUrls.set(fileId, objectUrl);
  }

  const dataUrl = await blobToDataUrl(blob);
  if (dataUrl) {
    if (!objectUrl) {
      memoryUrls.set(fileId, dataUrl);
    }
    writeToSessionStorage(fileId, dataUrl);
  }

  return objectUrl ?? dataUrl ?? '';
}

/**
 * Registers a pre-built URL (e.g. a data URL in tests) for a memory-mode file id.
 */
export function registerMemoryUploadUrl(fileId: string, url: string): void {
  memoryUrls.set(fileId, url);
  if (url.startsWith('data:')) {
    writeToSessionStorage(fileId, url);
  }
}

/**
 * Returns the stored object URL or sessionStorage data URL for a memory-mode upload, or null.
 */
export function resolveMemoryUploadUrl(fileId: string): string | null {
  const cached = memoryUrls.get(fileId);
  if (cached) return cached;
  const persisted = readFromSessionStorage(fileId);
  if (persisted) {
    memoryUrls.set(fileId, persisted);
    return persisted;
  }
  return null;
}

/** Clears in-memory and sessionStorage upload entries (primarily for tests). */
export function clearMemoryUploads(): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    for (const url of memoryUrls.values()) {
      if (url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore revoke failures in synthetic environments.
        }
      }
    }
  }
  memoryUrls.clear();
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(MEMORY_MEDIA_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      storage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}
