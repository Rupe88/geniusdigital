import { apiClient } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  published: boolean;
  isApproved?: boolean;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    email?: string;
    avatar?: string;
  };
  course?: {
    title: string;
  };
  reviewedBy?: {
    fullName: string;
    email?: string;
  };
}

export interface CreateReviewRequest {
  courseId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  published?: boolean;
  isApproved?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Reviews API
 */
export const reviewsApi = {
  /**
   * Get all reviews (admin only)
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    approved?: boolean;
    search?: string;
  }): Promise<ApiResponse<Review[]>> => {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.LIST, { params });
    return response.data;
  },

  /**
   * Get reviews for a specific course
   */
  getByCourse: async (courseId: string): Promise<ApiResponse<Review[]>> => {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.BY_COURSE(courseId));
    return response.data;
  },

  getMyReview: async (courseId: string): Promise<ApiResponse<Review>> => {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.MY_REVIEW(courseId));
    return response.data;
  },

  /**
   * Get review by ID
   */
  getById: async (id: string): Promise<ApiResponse<Review>> => {
    const response = await apiClient.get(API_ENDPOINTS.REVIEWS.BY_ID(id));
    return response.data;
  },

  /**
   * Create new review
   */
  create: async (data: CreateReviewRequest): Promise<ApiResponse<Review>> => {
    const { courseId, ...reviewData } = data;
    const response = await apiClient.post(API_ENDPOINTS.REVIEWS.CREATE(courseId), reviewData);
    return response.data;
  },

  /**
   * Update review (admin only)
   */
  update: async (id: string, data: UpdateReviewRequest): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put(API_ENDPOINTS.REVIEWS.BY_ID(id), data);
    return response.data;
  },

  moderate: async (id: string, isApproved: boolean): Promise<ApiResponse<Review>> => {
    const response = await apiClient.patch(`${API_ENDPOINTS.REVIEWS.BY_ID(id)}/moderate`, { isApproved });
    return response.data;
  },

  /**
   * Delete review
   */
  delete: async (courseId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(API_ENDPOINTS.REVIEWS.DELETE(courseId));
    return response.data;
  },

  deleteById: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(API_ENDPOINTS.REVIEWS.BY_ID(id));
    return response.data;
  },
};
