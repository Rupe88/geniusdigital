import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import type { ApiResponse } from '@/lib/types/api';
import type { PaginatedResponse } from '@/lib/types/api';

export interface UpcomingEventBookingPayload {
  eventId?: string;
  courseId?: string;
  name: string;
  email: string;
  phone: string;
  referralSource?: string;
  message?: string;
}

export interface UpcomingEventBooking {
  id: string;
  eventId: string | null;
  courseId: string | null;
  name: string;
  email: string;
  phone: string;
  referralSource: string | null;
  message: string | null;
  createdAt: string;
  event?: { id: string; title: string; slug: string; startDate: string } | null;
  course?: { id: string; title: string; slug: string } | null;
}

export async function submitUpcomingEventBooking(
  payload: UpcomingEventBookingPayload
): Promise<UpcomingEventBooking> {
  try {
    const response = await apiClient.post<ApiResponse<UpcomingEventBooking>>(
      API_ENDPOINTS.UPCOMING_EVENT_BOOKINGS,
      payload
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to submit booking');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Array<{ msg?: string; message?: string }> } }; message?: string };
    if (err.response?.data) {
      const data = err.response.data;
      if (data.errors?.length) {
        const msg = data.errors.map((e) => e.msg || e.message).filter(Boolean).join(', ');
        throw new Error(msg || data.message || 'Validation failed');
      }
      if (data.message) throw new Error(data.message);
    }
    if (err.message) throw new Error(err.message);
    throw new Error(handleApiError(error));
  }
}

export async function getAllUpcomingEventBookings(params?: {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  type?: 'EVENT' | 'COURSE';
  referralSource?: string;
}): Promise<PaginatedResponse<UpcomingEventBooking>> {
  const response = await apiClient.get<ApiResponse<UpcomingEventBooking[]>>(
    API_ENDPOINTS.UPCOMING_EVENT_BOOKINGS,
    { params }
  );
  const data = response.data as ApiResponse<UpcomingEventBooking[]> & { pagination?: PaginatedResponse<UpcomingEventBooking>['pagination'] };
  if (data.success && data.data) {
    return {
      data: data.data,
      pagination: data.pagination ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        total: data.data.length,
        pages: 1,
      },
    };
  }
  throw new Error(data.message || 'Failed to fetch bookings');
}
