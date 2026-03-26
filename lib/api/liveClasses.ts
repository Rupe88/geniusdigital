import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { PaginatedResponse, ApiResponse, Pagination } from '@/lib/types/api';

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  adminNotes?: string;
  courseId?: string;
  instructorId: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  meetingProvider?: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  autoGenerateMeeting?: boolean;
  recordingUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    name: string;
    email?: string;
  };
  course?: {
    id: string;
    title: string;
    slug?: string;
    thumbnail?: string;
  };
  _count?: { enrollments: number };
  weeklySchedule?: Record<number, string>;
  startDate?: string;
  endDate?: string;
}

const SERIES_MARKER_REGEX = /\[\[series:([a-f0-9-]{8,})\]\]/i;

export const extractSeriesIdFromLiveClass = (liveClass: Pick<LiveClass, 'description'>): string | null => {
  const match = String(liveClass.description || '').match(SERIES_MARKER_REGEX);
  return match?.[1] || null;
};

export const stripSeriesMarkerFromDescription = (description?: string | null): string => {
  return String(description || '').replace(SERIES_MARKER_REGEX, '').trim();
};

export interface CreateLiveClassPayload {
  title: string;
  description?: string;
  courseId?: string;
  instructorId: string;
  duration: number; // minutes
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  meetingProvider?: 'ZOOM';
  autoGenerateMeeting?: boolean;
  // Recurrence support (admin create, recurring only)
  recurrenceType?: 'WEEKLY';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  daysOfWeek?: number[]; // 0-6 (Sun-Sat), use first for single create
  dayTimes?: Record<number, string>; // per-day HH:mm
  adminNotes?: string;
}

/** Backend returns { success, data: LiveClass[], pagination } */
export const getAllLiveClasses = async (params?: {
  status?: string;
  instructorId?: string;
  courseId?: string;
  upcoming?: boolean;
  search?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<LiveClass>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: LiveClass[]; pagination: Pagination }>(
      API_ENDPOINTS.LIVE_CLASSES.LIST,
      { params }
    );
    const payload = response.data;
    if (payload?.success) {
      return {
        data: payload.data ?? [],
        pagination: payload.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
    throw new Error('Failed to fetch live classes');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** Get available live classes for authenticated user (filtered by enrolled courses and time window) */
export const getMyAvailableLiveClasses = async (params?: {
  page?: number;
  limit?: number;
  refreshKey?: number;
}): Promise<PaginatedResponse<LiveClass>> => {
  try {
    const { refreshKey, ...queryParams } = params || {};
    const response = await apiClient.get<{ success: boolean; data: LiveClass[]; pagination: Pagination }>(
      '/live-classes/my-available',
      {
        params: {
          ...queryParams,
          // Cache buster helps on aggressive mobile/webview caches.
          _t: refreshKey ?? Date.now(),
        },
      }
    );
    const payload = response.data;
    if (payload?.success) {
      return {
        data: payload.data ?? [],
        pagination: payload.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
    throw new Error('Failed to fetch available live classes');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getLiveClassById = async (id: string): Promise<LiveClass> => {
  try {
    const response = await apiClient.get<ApiResponse<LiveClass>>(API_ENDPOINTS.LIVE_CLASSES.BY_ID(id));
    const data = handleApiResponse<LiveClass>(response);
    return data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const createLiveClass = async (liveClassData: CreateLiveClassPayload): Promise<LiveClass> => {
  try {
    const response = await apiClient.post<ApiResponse<LiveClass>>(API_ENDPOINTS.LIVE_CLASSES.LIST, liveClassData);
    const data = handleApiResponse<LiveClass>(response);
    return data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const updateLiveClass = async (
  id: string,
  liveClassData: Partial<CreateLiveClassPayload> & Partial<LiveClass>
): Promise<LiveClass> => {
  try {
    const response = await apiClient.put<ApiResponse<LiveClass>>(API_ENDPOINTS.LIVE_CLASSES.BY_ID(id), liveClassData);
    const data = handleApiResponse<LiveClass>(response);
    return data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const deleteLiveClass = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.LIVE_CLASSES.BY_ID(id));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const cancelLiveClassSeries = async (
  seriesId: string
): Promise<{ seriesId: string; cancelledCount: number }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ seriesId: string; cancelledCount: number }>>(
      API_ENDPOINTS.LIVE_CLASSES.CANCEL_SERIES(seriesId)
    );
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface LiveClassEnrollment {
  id: string;
  userId: string;
  liveClassId: string;
  attended?: boolean;
  joinedAt?: string;
  createdAt: string;
  liveClass: LiveClass;
}

/** Get current user's live class enrollments (requires auth) */
export const getMyLiveClassEnrollments = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<LiveClassEnrollment>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: LiveClassEnrollment[]; pagination: Pagination }>(
      '/live-classes/me/enrollments',
      { params }
    );
    const payload = response.data;
    if (payload?.success) {
      return {
        data: payload.data ?? [],
        pagination: payload.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
    throw new Error('Failed to fetch enrollments');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** Enroll in a live class (requires auth) */
export const enrollInLiveClass = async (liveClassId: string): Promise<LiveClassEnrollment> => {
  try {
    const response = await apiClient.post<ApiResponse<LiveClassEnrollment>>(
      `${API_ENDPOINTS.LIVE_CLASSES.LIST}/${liveClassId}/enroll`
    );
    return handleApiResponse<LiveClassEnrollment>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

