import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '../utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent: number; // in minutes
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  courseId: string;
  enrollmentId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  timeSpent: number;
  lastAccessedAt: string;
}

export interface UpdateProgressRequest {
  completed?: boolean;
  timeSpent?: number;
}

/**
 * Get user's progress for all enrolled courses
 */
export const getUserProgress = async (): Promise<CourseProgress[]> => {
  try {
    const response = await apiClient.get<ApiResponse<CourseProgress[]>>(API_ENDPOINTS.PROGRESS.LIST);
    return handleApiResponse<CourseProgress[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get progress for specific enrollment
 */
export const getEnrollmentProgress = async (id: string): Promise<LessonProgress[]> => {
  try {
    const response = await apiClient.get<ApiResponse<LessonProgress[]>>(API_ENDPOINTS.PROGRESS.BY_ID(id));
    return handleApiResponse<LessonProgress[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface CourseProgressResponse {
  enrollment: { id: string; progress: number; status: string };
  course: {
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      chapterId?: string;
      lessonType: string;
      videoDuration?: number;
      progress?: Array<{ isCompleted: boolean; watchTime?: number }>;
    }>;
  };
}

/**
 * Get course progress (enrollment + lessons with completion) for current user
 */
export const getCourseProgress = async (courseId: string): Promise<CourseProgressResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<CourseProgressResponse>>(API_ENDPOINTS.PROGRESS.COURSE(courseId));
    return handleApiResponse<CourseProgressResponse>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (id: string, data: UpdateProgressRequest): Promise<LessonProgress> => {
  try {
    const response = await apiClient.put<ApiResponse<LessonProgress>>(API_ENDPOINTS.PROGRESS.BY_ID(id), data);
    return handleApiResponse<LessonProgress>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Mark lesson as completed (PUT progress for lesson with isCompleted: true)
 */
export const completeLesson = async (lessonId: string): Promise<LessonProgress> => {
  try {
    const response = await apiClient.put<ApiResponse<LessonProgress>>(API_ENDPOINTS.PROGRESS.LESSON(lessonId), {
      isCompleted: true,
    });
    return handleApiResponse<LessonProgress>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Also export as a default object for backward compatibility if needed
export const progressApi = {
  getUserProgress,
  getEnrollmentProgress,
  updateLessonProgress,
  completeLesson
};
