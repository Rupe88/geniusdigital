import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import type { ApiResponse } from '@/lib/types/api';

export type MassEmailAudience = 'all_users' | 'course_enrolled';

export const getAudienceCount = async (
  audience: MassEmailAudience,
  courseId?: string | null
): Promise<{ count: number }> => {
  try {
    const params: Record<string, string> = { audience };
    if (courseId) params.courseId = courseId;
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      API_ENDPOINTS.ADMIN.MASS_EMAIL_AUDIENCE_COUNT,
      { params }
    );
    return handleApiResponse<{ count: number }>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface SendMassEmailParams {
  subject: string;
  body: string;
  audience: MassEmailAudience;
  courseId?: string | null;
  batchSize?: number;
  delayMs?: number;
}

export interface SendMassEmailResult {
  sent: number;
  failed: number;
  total: number;
  errors?: string[];
}

export const sendMassEmail = async (params: SendMassEmailParams): Promise<SendMassEmailResult> => {
  try {
    const response = await apiClient.post<ApiResponse<SendMassEmailResult>>(
      API_ENDPOINTS.ADMIN.MASS_EMAIL_SEND,
      params
    );
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || 'Failed to send mass email');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
