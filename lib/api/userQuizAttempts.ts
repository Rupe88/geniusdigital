import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface UserQuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: any;
  score: number | null;
  isPassed: boolean | null;
  adminNotes?: string | null;
  adminVisible?: boolean;
  completedAt: string;
  createdAt?: string;
  updatedAt?: string;
  quiz?: {
    id: string;
    title: string;
    isConsultation?: boolean;
    lesson?: {
      id: string;
      title: string;
      course?: { id: string; title: string };
    };
  };
}

export interface QuizAttemptReportResult {
  questionId: string;
  question: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  points: number;
}

export interface QuizAttemptReport {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passingScore: number;
  isPassed: boolean;
  results: QuizAttemptReportResult[];
}

export interface UserQuizAttemptDetailsPayload {
  attempt: UserQuizAttempt;
  report: QuizAttemptReport;
}

export const getMyConsultationAttempts = async (): Promise<UserQuizAttempt[]> => {
  try {
    const response = await apiClient.get<ApiResponse<UserQuizAttempt[]>>(
      API_ENDPOINTS.QUIZZES.MY_CONSULTATION_ATTEMPTS
    );
    const responseData = response.data;
    if (!responseData.success || !responseData.data) {
      throw new Error(responseData.message || 'Failed to load consultation attempts');
    }
    return responseData.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getMyQuizAttempts = async (params?: { page?: number; limit?: number }): Promise<UserQuizAttempt[]> => {
  try {
    const response = await apiClient.get<ApiResponse<UserQuizAttempt[]>>(API_ENDPOINTS.QUIZZES.MY_ATTEMPTS, {
      params,
    });
    const responseData = response.data;
    if (!responseData.success || !responseData.data) {
      throw new Error(responseData.message || 'Failed to load quiz attempts');
    }
    return responseData.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getMyAttemptsForQuiz = async (quizId: string): Promise<UserQuizAttempt[]> => {
  try {
    const response = await apiClient.get<ApiResponse<UserQuizAttempt[]>>(
      `${API_ENDPOINTS.QUIZZES.LIST}/${quizId}/attempts`
    );
    const responseData = response.data;
    if (!responseData.success || !responseData.data) {
      throw new Error(responseData.message || 'Failed to load quiz attempts');
    }
    return responseData.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getMyQuizAttemptDetails = async (
  attemptId: string
): Promise<UserQuizAttemptDetailsPayload> => {
  try {
    const response = await apiClient.get<ApiResponse<UserQuizAttemptDetailsPayload>>(
      API_ENDPOINTS.QUIZZES.MY_ATTEMPT_DETAILS(attemptId)
    );
    const responseData = response.data;
    if (!responseData.success || !responseData.data) {
      throw new Error(responseData.message || 'Failed to load quiz attempt details');
    }
    return responseData.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

