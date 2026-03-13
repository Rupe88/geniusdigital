import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface AdminQuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  isPassed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string | null;
    email: string | null;
  };
  quiz?: {
    id: string;
    title: string;
    lesson?: {
      id: string;
      title: string;
      course?: {
        id: string;
        title: string;
      };
    };
  };
}

export interface GetAdminQuizAttemptsParams {
  page?: number;
  limit?: number;
  quizId?: string;
  userId?: string;
  courseId?: string;
  isPassed?: boolean;
}

export interface GetAdminQuizAttemptsResponse {
  data: AdminQuizAttempt[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const getAdminQuizAttempts = async (
  params: GetAdminQuizAttemptsParams = {}
): Promise<GetAdminQuizAttemptsResponse> => {
  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.quizId) searchParams.set('quizId', params.quizId);
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.courseId) searchParams.set('courseId', params.courseId);
    if (typeof params.isPassed === 'boolean') searchParams.set('isPassed', String(params.isPassed));

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.QUIZZES.ADMIN_ATTEMPTS}?${query}`
      : API_ENDPOINTS.QUIZZES.ADMIN_ATTEMPTS;

    const response = await apiClient.get<
      ApiResponse<AdminQuizAttempt[]> & { pagination?: GetAdminQuizAttemptsResponse['pagination'] }
    >(url);
    const responseData = response.data;

    if (!responseData.success || !responseData.data) {
      throw new Error(responseData.message || 'Failed to load quiz attempts');
    }

    return {
      data: responseData.data,
      pagination: responseData.pagination || {
        total: responseData.data.length,
        page: params.page ?? 1,
        limit: params.limit ?? responseData.data.length,
        pages: 1,
      },
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

