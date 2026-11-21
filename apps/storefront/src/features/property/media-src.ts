/**
 * Normalizes local demo-media URLs (e.g. `http://localhost:3100/demo-media/...`) to root-relative
 * `/demo-media/...` paths so `next/image` treats them as local static assets across localhost, CI
 * and Vercel previews without remote hostname errors.
 */
export function normalizeMediaSrc(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  const demoIndex = trimmed.indexOf('/demo-media/');
  if (demoIndex !== -1) {
    return trimmed.slice(demoIndex);
  }
  return trimmed;
}
