import { apiClient } from './axios';

/**
 * Get a short-lived URL with token for secure video streaming.
 * Use this when videoUrl from API is a stream path (e.g. /api/media/stream/lesson/:id).
 * Only authorized users (enrolled or preview) get a valid URL.
 */
export async function getVideoStreamUrl(params: {
  lessonId?: string;
  courseId?: string;
  type?: 'promo';
}): Promise<string> {
  const { lessonId, courseId, type } = params;
  const search = new URLSearchParams();
  if (lessonId) search.set('lessonId', lessonId);
  if (courseId) search.set('courseId', courseId);
  if (type) search.set('type', type);
  const response = await apiClient.get<{ success: boolean; url?: string; message?: string }>(
    `/media/video-token?${search.toString()}`
  );
  const data = response.data;
  if (data.success && data.url) return data.url;
  throw new Error(data.message || 'Could not get video link');
}

/** True if the video URL is a secure stream path (requires token before use). */
export function isSecureStreamPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/api/media/stream/') || url.includes('/api/media/stream/');
}
