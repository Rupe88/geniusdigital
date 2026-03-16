import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface UpdateQuizAttemptFeedbackPayload {
  adminNotes?: string;
  adminVisible?: boolean;
}

export const updateQuizAttemptFeedback = async (
  attemptId: string,
  payload: UpdateQuizAttemptFeedbackPayload
): Promise<void> => {
  try {
    const response = await apiClient.patch<ApiResponse>(
      `${API_ENDPOINTS.QUIZZES.ADMIN_ATTEMPTS}/${attemptId}/feedback`,
      payload
    );
    const responseData = response.data;
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to update quiz attempt feedback');
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

