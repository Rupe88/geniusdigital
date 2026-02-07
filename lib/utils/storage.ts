/**
 * Storage URL helpers for S3 (Kailesh/DataHub) and legacy Cloudinary.
 * Use these when rendering images/videos from the backend (Next/Image unoptimized, etc.).
 */

const STORAGE_HOSTNAMES = [
  's3-np1.datahub.com.np',
  'datahub.com.np',
  'res.cloudinary.com', // legacy
];

/**
 * Returns true if the URL is from our storage (S3 or Cloudinary) or any remote URL.
 * Use for Next/Image unoptimized to avoid optimization errors on external storage.
 * Any absolute http(s) URL from the API is treated as storage so thumbnails always load.
 */
export function isStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = url.trim();
    if (u.startsWith('https://') || u.startsWith('http://')) return true;
    const host = new URL(url).hostname.toLowerCase();
    return STORAGE_HOSTNAMES.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * Alias for isStorageUrl – use when deciding unoptimized prop for next/image.
 */
export function useUnoptimizedForStorage(url: string | null | undefined): boolean {
  return isStorageUrl(url);
}
