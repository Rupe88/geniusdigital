/**
 * Storage URL helpers for Supabase Storage, legacy S3 (DataHub), and Cloudinary.
 * Use these when rendering images/videos from the backend (Next/Image unoptimized, etc.).
 */

const STORAGE_HOSTNAMES = [
  's3-np1.datahub.com.np',
  'datahub.com.np',
  'res.cloudinary.com', // legacy
];

function isSupabaseStorageHost(host: string): boolean {
  return host === 'supabase.co' || host.endsWith('.supabase.co');
}

/** Hostnames for our direct object storage (public URLs / signed URLs). */
const LEGACY_S3_DIRECT_HOSTNAMES = ['s3-np1.datahub.com.np', 'datahub.com.np'];

/**
 * Returns true if the URL is from our storage (S3 or Cloudinary) or any remote URL.
 */
export function isStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = url.trim();
    if (u.startsWith('https://') || u.startsWith('http://')) return true;
    const host = new URL(url).hostname.toLowerCase();
    return (
      isSupabaseStorageHost(host) ||
      STORAGE_HOSTNAMES.some((h) => host === h || host.endsWith('.' + h))
    );
  } catch {
    return false;
  }
}

/**
 * Returns true if the URL is from our storage (Supabase or legacy DataHub S3).
 */
export function isOurS3StorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    if (isSupabaseStorageHost(host)) return true;
    return LEGACY_S3_DIRECT_HOSTNAMES.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/**
 * Returns the URL to use for displaying an image.
 * Storage URLs (including signed URLs from API) are used as-is so the browser loads directly (no backend proxy).
 */
export function getStorageImageSrc(
  url: string | null | undefined,
  _apiBase: string
): string {
  if (!url || typeof url !== 'string') return '';
  return url;
}

/**
 * Alias for isStorageUrl – use when deciding unoptimized prop for next/image.
 */
export function useUnoptimizedForStorage(url: string | null | undefined): boolean {
  return isStorageUrl(url);
}
