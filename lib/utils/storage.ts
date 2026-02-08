/**
 * Storage URL helpers for S3 (Kailesh/DataHub) and legacy Cloudinary.
 * Use these when rendering images/videos from the backend (Next/Image unoptimized, etc.).
 */

const STORAGE_HOSTNAMES = [
  's3-np1.datahub.com.np',
  'datahub.com.np',
  'res.cloudinary.com', // legacy
];

/** Hostnames for our S3 (DataHub). Use direct S3 base URL when bucket is public. */
const S3_DIRECT_HOSTNAMES = ['s3-np1.datahub.com.np', 'datahub.com.np'];

/**
 * Returns true if the URL is from our storage (S3 or Cloudinary) or any remote URL.
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
 * Returns true if the URL is from our S3 (DataHub). We use direct S3 base URL for images/video.
 */
export function isOurS3StorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return S3_DIRECT_HOSTNAMES.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * Returns the URL to use for displaying an image.
 * S3 URLs go through backend proxy so the client never sees S3 or AWS params.
 * API may also return token URLs (e.g. /api/media/image?token=...) which are used as-is.
 */
const USE_DIRECT_S3_IMAGES =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_DIRECT_S3_IMAGES === 'true';

export function getStorageImageSrc(
  url: string | null | undefined,
  apiBase: string
): string {
  if (!url || typeof url !== 'string') return '';
  if (isOurS3StorageUrl(url)) {
    if (USE_DIRECT_S3_IMAGES) return url;
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
