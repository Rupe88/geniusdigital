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
  console.log('[getVideoStreamUrl] Requesting video stream URL', { lessonId, courseId, type });
  
  const search = new URLSearchParams();
  if (lessonId) search.set('lessonId', lessonId);
  if (courseId) search.set('courseId', courseId);
  if (type) search.set('type', type);
  
  const url = `/media/video-token?${search.toString()}`;
  console.log('[getVideoStreamUrl] API endpoint:', url);
  
  try {
    const startTime = Date.now();
    const response = await apiClient.get<{ success: boolean; url?: string; message?: string }>(url);
    const duration = Date.now() - startTime;
    
    console.log('[getVideoStreamUrl] API response received', {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data,
    });
    
    const data = response.data;
    if (data.success && data.url) {
      console.log('[getVideoStreamUrl] Success - returning URL:', data.url);
      return data.url;
    }
    
    const errorMsg = data.message || 'Could not get video link';
    console.error('[getVideoStreamUrl] API returned unsuccessful response', {
      success: data.success,
      message: errorMsg,
      data,
    });
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error('[getVideoStreamUrl] API call failed', {
      error,
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    throw error;
  }
}

/** True if the video URL is a secure stream path (requires token before use). */
export function isSecureStreamPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/api/media/stream/') || url.includes('/api/media/stream/');
}

/** True if the URL is from our S3 storage bucket. */
export function isOurS3Url(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const s3Host = 's3-np1.datahub.com.np';
  const bucket = 'vaastu-lms';
  return url.includes(s3Host) && url.includes(bucket);
}
