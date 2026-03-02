import { apiClient } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface CourseComment {
  id: string;
  userId: string;
  courseId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    profileImage?: string | null;
  };
}

export interface CourseCommentsResponse {
  success: boolean;
  data: CourseComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const courseCommentsApi = {
  getByCourse: async (
    courseId: string,
    params?: { page?: number; limit?: number }
  ): Promise<CourseCommentsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const url = API_ENDPOINTS.COURSE_COMMENTS.BY_COURSE(courseId) + (qs ? `?${qs}` : '');
    const response = await apiClient.get(url);
    return response.data;
  },

  create: async (courseId: string, content: string): Promise<{ success: boolean; data: CourseComment }> => {
    const response = await apiClient.post(API_ENDPOINTS.COURSE_COMMENTS.CREATE(courseId), { content });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(API_ENDPOINTS.COURSE_COMMENTS.DELETE(id));
    return response.data;
  },
};
