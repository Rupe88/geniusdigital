/**
 * Storage URL helpers for S3 (Kailesh/DataHub) and legacy Cloudinary.
 * Use these when rendering images/videos from the backend (Next/Image unoptimized, etc.).
 */

const STORAGE_HOSTNAMES = [
  's3-np1.datahub.com.np',
  'datahub.com.np',
  'res.cloudinary.com', // legacy
];

/** Hostnames that are our private S3 – use backend image proxy to avoid 403. */
const S3_PROXY_HOSTNAMES = ['s3-np1.datahub.com.np', 'datahub.com.np'];

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
 * Returns true if the URL is from our S3 (DataHub). These need to go through the backend
 * image proxy so private bucket images load without 403.
 */
export function isOurS3StorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return S3_PROXY_HOSTNAMES.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * Returns the URL to use for displaying an image. S3 URLs are rewritten to the backend
 * proxy so private bucket images load without 403. Pass getApiBaseUrl() from @/lib/api/axios.
 */
export function getStorageImageSrc(
  url: string | null | undefined,
  apiBase: string
): string {
  if (!url || typeof url !== 'string') return '';
  if (isOurS3StorageUrl(url)) {
    return `${apiBase.replace(/\/$/, '')}/media/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Alias for isStorageUrl – use when deciding unoptimized prop for next/image.
 */
export function useUnoptimizedForStorage(url: string | null | undefined): boolean {
  return isStorageUrl(url);
}
