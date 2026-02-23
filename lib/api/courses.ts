import axios from 'axios';
import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { Course } from '@/lib/types/course';
import { PaginatedResponse, ApiResponse, Pagination } from '@/lib/types/api';

export const getAllCourses = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  instructorId?: string;
  level?: string;
  status?: string;
}): Promise<PaginatedResponse<Course>> => {
  try {
    const response = await apiClient.get<ApiResponse<Course[]> & { pagination: Pagination }>(API_ENDPOINTS.COURSES.LIST, {
      params,
    });

    const payload = response.data;
    if (payload.success && payload.data) {
      return {
        data: payload.data,
        pagination: payload.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error('Failed to fetch courses');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const filterCourses = async (filters: {
  category?: string;
  instructor?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  featured?: boolean;
  isOngoing?: boolean;
  search?: string;
  searchRegex?: string;
  sortBy?: 'newest' | 'oldest' | 'price' | 'rating' | 'popularity' | 'enrollments';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Course>> => {
  try {
    const response = await apiClient.get<ApiResponse<Course[]> & { pagination: Pagination }>(API_ENDPOINTS.COURSES.FILTER, {
      params: filters,
    });

    const payload = response.data;
    if (payload.success && payload.data) {
      return {
        data: payload.data,
        pagination: payload.pagination || {
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error('Failed to filter courses');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get featured (popular) courses for homepage. Always returns an array.
 */
export const getFeaturedCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Course[]>>(API_ENDPOINTS.COURSES.FEATURED_LIST);
    const payload = response.data as ApiResponse<Course[]> & { data?: Course[] };
    if (payload?.success && Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  } catch (error) {
    console.error('getFeaturedCourses error:', error);
    return [];
  }
};

export const getOngoingCourses = async (): Promise<Course[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Course[]>>(API_ENDPOINTS.COURSES.ONGOING);
    return handleApiResponse<Course[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getCourseById = async (id: string): Promise<Course> => {
  try {
    const response = await apiClient.get<ApiResponse<Course>>(API_ENDPOINTS.COURSES.BY_ID(id));
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    return handleApiResponse<Course>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface CreateCourseData {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  price?: number;
  originalPrice?: number;
  isFree?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ONGOING';
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number;
  language?: string;
  featured?: boolean;
  isOngoing?: boolean;
  startDate?: string;
  endDate?: string;
  tags?: string;
  learningOutcomes?: string[];
  skills?: string[];
  instructorId?: string;
  categoryId?: string;
  videoUrl?: string;
  /** Up to 5 promo videos: order-preserved slots (URLs and/or file placeholders). Backend expects files as multipart 'video'. */
  promoVideoSlots?: Array<{ type: 'url'; url: string } | { type: 'file' }>;
  videoFiles?: File[];
  thumbnailFile?: File;
  videoFile?: File;
  onProgress?: (progress: number) => void;
}

export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  try {
    data.onProgress?.(0);

    // Validate required fields (title and thumbnail are required; thumbnail is validated via backend)
    if (!data.title || !data.title.trim()) {
      throw new Error('Title is required');
    }

    const formData = new FormData();

    // Add all fields to FormData
    formData.append('title', data.title.trim());
    if (data.instructorId?.trim()) formData.append('instructorId', data.instructorId.trim());
    if (data.slug) formData.append('slug', data.slug.trim());
    if (data.description) formData.append('description', data.description);
    if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
    if (data.thumbnail && !data.thumbnailFile) formData.append('thumbnail', data.thumbnail);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.originalPrice !== undefined) formData.append('originalPrice', data.originalPrice.toString());
    if (data.isFree !== undefined) formData.append('isFree', data.isFree.toString());
    formData.append('status', data.status || 'PUBLISHED');
    if (data.level) formData.append('level', data.level);
    if (data.duration !== undefined) formData.append('duration', data.duration.toString());
    if (data.language) formData.append('language', data.language);
    if (data.featured !== undefined) formData.append('featured', data.featured.toString());
    if (data.isOngoing !== undefined) formData.append('isOngoing', data.isOngoing.toString());
    if (data.startDate !== undefined && data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate !== undefined && data.endDate) formData.append('endDate', data.endDate);
    if (data.tags) formData.append('tags', data.tags);
    if (data.learningOutcomes && Array.isArray(data.learningOutcomes)) {
      formData.append('learningOutcomes', JSON.stringify(data.learningOutcomes));
    }
    if (data.skills && Array.isArray(data.skills)) {
      formData.append('skills', JSON.stringify(data.skills));
    }
    if (data.promoVideoSlots && data.promoVideoSlots.length > 0) {
      formData.append('promoVideoSlots', JSON.stringify(data.promoVideoSlots));
      data.videoFiles?.forEach((file) => formData.append('video', file));
    } else if (data.videoUrl && data.videoUrl.trim()) {
      formData.append('videoUrl', data.videoUrl.trim());
    }

    // categoryId is optional but must be valid UUID if provided
    if (data.categoryId && data.categoryId.trim()) {
      formData.append('categoryId', data.categoryId.trim());
    }

    // Add thumbnail file if provided
    if (data.thumbnailFile) {
      formData.append('thumbnail', data.thumbnailFile);
    }
    // Single video file (when not using promoVideoSlots)
    if (!data.promoVideoSlots?.length && data.videoFile) {
      formData.append('video', data.videoFile);
    }

    // Log FormData contents for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('FormData being sent:', {
        title: data.title,
        instructorId: data.instructorId,
        categoryId: data.categoryId || 'none',
        hasThumbnail: !!data.thumbnailFile,
        status: data.status,
        price: data.price,
        isFree: data.isFree,
      });
    }

    data.onProgress?.(0);

    // Large video uploads (1GB+) can take 1–2+ hours on slow connections
    const hasVideoUpload = data.videoFile || data.thumbnailFile || (data.videoFiles && data.videoFiles.length > 0);
    const uploadTimeout = hasVideoUpload ? 7200000 : 120000; // 2 hours with file(s), 2 min without
    const response = await apiClient.post<ApiResponse<Course>>(API_ENDPOINTS.COURSES.LIST, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: uploadTimeout,
      onUploadProgress: (progressEvent) => {
        if (!data.onProgress) return;
        if (progressEvent.total != null && progressEvent.total > 0) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          data.onProgress(Math.min(percent, 99));
        } else if (progressEvent.loaded != null) {
          const loadedMB = progressEvent.loaded / (1024 * 1024);
          const estimatedPercent = 5 + 90 * Math.min(1, loadedMB / 200);
          data.onProgress(Math.min(Math.round(estimatedPercent), 99));
        }
      },
    });

    data.onProgress?.(100);

    return handleApiResponse<Course>(response);
  } catch (error) {
    // Provide more specific error messages for course creation
    if (axios.isAxiosError(error)) {
      // Always log the full error for debugging (even in production for now)
      console.error('Course creation error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: {
          title: data.title,
          instructorId: data.instructorId,
          hasThumbnail: !!data.thumbnailFile,
        },
      });

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Upload took too long. For 300MB+ videos use a fast connection or try a smaller file. You can also add the video later from the course edit page.');
      }
      if (error.response?.status === 408) {
        throw new Error('Request timed out during file upload. Please try again.');
      }
      if (error.response?.status === 400) {
        // Validation error - extract detailed error messages
        const errorData = error.response.data;
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const errorMessages = errorData.errors.map((err: any) => {
            const field = err.param || err.path || err.field || 'field';
            const message = err.msg || err.message || 'Invalid value';
            return `${field}: ${message}`;
          }).join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        // Fallback to handleApiError if errors array format is different
        const errorMessage = handleApiError(error);
        throw new Error(errorMessage);
      }
      if (!error.response) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    throw new Error(handleApiError(error));
  }
};

export const updateCourse = async (id: string, data: Partial<CreateCourseData>): Promise<Course> => {
  try {
    const formData = new FormData();

    // Add all provided fields to FormData (title and instructorId required by backend)
    if (data.title) formData.append('title', data.title.trim());
    if (data.slug) formData.append('slug', data.slug);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.shortDescription !== undefined) formData.append('shortDescription', data.shortDescription);
    if (data.thumbnail && !data.thumbnailFile) formData.append('thumbnail', data.thumbnail);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.originalPrice !== undefined) formData.append('originalPrice', data.originalPrice.toString());
    if (data.isFree !== undefined) formData.append('isFree', data.isFree.toString());
    if (data.status !== undefined) formData.append('status', data.status);
    if (data.level) formData.append('level', data.level);
    if (data.duration !== undefined) formData.append('duration', data.duration.toString());
    if (data.language) formData.append('language', data.language);
    if (data.featured !== undefined) formData.append('featured', data.featured.toString());
    if (data.isOngoing !== undefined) formData.append('isOngoing', data.isOngoing.toString());
    if (data.startDate !== undefined) formData.append('startDate', data.startDate || '');
    if (data.endDate !== undefined) formData.append('endDate', data.endDate || '');
    if (data.tags !== undefined) formData.append('tags', data.tags);
    if (data.promoVideoSlots && data.promoVideoSlots.length > 0) {
      formData.append('promoVideoSlots', JSON.stringify(data.promoVideoSlots));
      data.videoFiles?.forEach((file) => formData.append('video', file));
    } else if (data.promoVideoSlots && data.promoVideoSlots.length === 0) {
      formData.append('promoVideoSlots', '[]');
    } else if (data.videoUrl !== undefined) {
      formData.append('videoUrl', data.videoUrl !== null ? String(data.videoUrl).trim() : '');
    }

    // Handle learningOutcomes - send as JSON string if array, empty string if undefined/null
    if (data.learningOutcomes !== undefined) {
      if (Array.isArray(data.learningOutcomes) && data.learningOutcomes.length > 0) {
        formData.append('learningOutcomes', JSON.stringify(data.learningOutcomes));
      } else {
        formData.append('learningOutcomes', '');
      }
    }

    // Handle skills - send as JSON string if array, empty string if undefined/null
    if (data.skills !== undefined) {
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        formData.append('skills', JSON.stringify(data.skills));
      } else {
        formData.append('skills', '');
      }
    }

    if (data.instructorId) formData.append('instructorId', data.instructorId.trim());
    if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId || '');

    // Add thumbnail file if provided (only if it's a new file)
    if (data.thumbnailFile) {
      formData.append('thumbnail', data.thumbnailFile);
    }
    if (!data.promoVideoSlots?.length && data.videoFile) {
      formData.append('video', data.videoFile);
    }

    const onProgress = (data as CreateCourseData).onProgress;
    onProgress?.(0);

    const hasVideoUpload = data.thumbnailFile || data.videoFile || (data.videoFiles && data.videoFiles.length > 0);
    const uploadTimeout = hasVideoUpload ? 7200000 : 60000; // 2 hours with file(s)
    const response = await apiClient.put<ApiResponse<Course>>(API_ENDPOINTS.COURSES.BY_ID(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: uploadTimeout,
      onUploadProgress: (progressEvent) => {
        if (!onProgress) return;
        if (progressEvent.total != null && progressEvent.total > 0) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(Math.min(percent, 99));
        } else if (progressEvent.loaded != null) {
          const loadedMB = progressEvent.loaded / (1024 * 1024);
          const estimatedPercent = 5 + 90 * Math.min(1, loadedMB / 200);
          onProgress(Math.min(Math.round(estimatedPercent), 99));
        }
      },
    });

    onProgress?.(100);
    return handleApiResponse<Course>(response);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        const errorMessages = errorData.errors.map((err: any) => {
          const field = err.param || err.path || err.field || 'field';
          const message = err.msg || err.message || 'Invalid value';
          return `${field}: ${message}`;
        }).join('\n');
        throw new Error(`Validation failed:\n${errorMessages}`);
      }
    }
    throw new Error(handleApiError(error));
  }
};

/**
 * Update course status only (for admin list quick toggle)
 */
export const updateCourseStatus = async (
  id: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'ARCHIVED'
): Promise<Course> => {
  try {
    const response = await apiClient.patch<ApiResponse<Course>>(API_ENDPOINTS.COURSES.STATUS(id), { status });
    const responseData = response.data;
    if (responseData.success && responseData.data) return responseData.data;
    throw new Error(responseData.message || 'Failed to update status');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update course featured (Popular) flag (for admin list toggle)
 */
export const updateCourseFeatured = async (id: string, featured: boolean): Promise<Course> => {
  try {
    const response = await apiClient.patch<ApiResponse<Course>>(API_ENDPOINTS.COURSES.FEATURED(id), { featured });
    const responseData = response.data;
    if (responseData.success && responseData.data) return responseData.data;
    throw new Error(responseData.message || 'Failed to update popular');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const deleteCourse = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.COURSES.BY_ID(id));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

