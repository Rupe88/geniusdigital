import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { Enrollment } from '@/lib/types/course';
import { PaginatedResponse, ApiResponse, Pagination } from '@/lib/types/api';

export const getUserEnrollments = async (params?: {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Enrollment>> => {
  try {
    const response = await apiClient.get<ApiResponse<Enrollment[]> & { pagination: Pagination }>(API_ENDPOINTS.ENROLLMENTS.MY_ENROLLMENTS, {
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
          pages: Math.ceil(payload.data.length / (params?.limit || 10)),
        },
      };
    }
    throw new Error('Failed to fetch user enrollments');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getAllEnrollments = async (params?: {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  courseId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Enrollment>> => {
  try {
    const response = await apiClient.get<ApiResponse<Enrollment[]> & { pagination: Pagination }>(API_ENDPOINTS.ENROLLMENTS.LIST, {
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
          pages: Math.ceil(payload.data.length / (params?.limit || 10)),
        },
      };
    }
    throw new Error('Failed to fetch enrollments');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const enrollInCourse = async (courseId: string, affiliateCode?: string): Promise<Enrollment> => {
  try {
    const response = await apiClient.post<ApiResponse<Enrollment>>(API_ENDPOINTS.ENROLLMENTS.CREATE, {
      courseId,
      affiliateCode,
    });

    const payload = response.data;
    if (payload.success && payload.data) {
      return payload.data;
    }
    throw new Error('Failed to enroll in course');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getEnrollmentById = async (id: string): Promise<Enrollment> => {
  try {
    const response = await apiClient.get<{ data: Enrollment }>(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const unenrollFromCourse = async (courseId: string): Promise<void> => {
  try {
    const response = await apiClient.delete(API_ENDPOINTS.ENROLLMENTS.UNENROLL(courseId));

    // Backend returns: { success: true, message: string }
    const payload = response.data as { success: boolean; message: string };
    if (!payload.success) {
      throw new Error(payload.message || 'Failed to unenroll from course');
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getProgress = async (enrollmentId: string): Promise<unknown> => {
  try {
    const response = await apiClient.get<ApiResponse<unknown>>(API_ENDPOINTS.ENROLLMENTS.PROGRESS(enrollmentId));

    const payload = response.data;
    if (payload.success && payload.data) {
      return payload.data;
    }
    throw new Error('Failed to get progress');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const deleteEnrollment = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
    const payload = response.data as { success: boolean; message: string };
    if (!payload.success) {
      throw new Error(payload.message || 'Failed to delete enrollment');
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const grantCourseAccess = async (userId: string, courseId: string): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<Enrollment>>(API_ENDPOINTS.ENROLLMENTS.ADMIN_GRANT, {
      userId,
      courseId,
    });
    const payload = response.data;
    if (!payload.success) {
      throw new Error(payload.message || 'Failed to grant course access');
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Partial Access Functions
export const grantPartialAccess = async (data: {
  userId: string;
  courseId: string;
  accessType: 'PARTIAL';
  durationDays: number;
  pricePaid?: number;
  adminNotes?: string;
}): Promise<Enrollment> => {
  try {
    const response = await apiClient.post<ApiResponse<Enrollment>>(API_ENDPOINTS.ENROLLMENTS.ADMIN_GRANT_PARTIAL, data);
    const payload = response.data;
    if (!payload.success || !payload.data) {
      throw new Error(payload.message || 'Failed to grant partial access');
    }
    return payload.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const extendAccess = async (data: {
  enrollmentId: string;
  durationDays: number;
  adminNotes?: string;
}): Promise<Enrollment> => {
  try {
    const response = await apiClient.post<ApiResponse<Enrollment>>(API_ENDPOINTS.ENROLLMENTS.ADMIN_EXTEND_ACCESS, data);
    const payload = response.data;
    if (!payload.success || !payload.data) {
      throw new Error(payload.message || 'Failed to extend access');
    }
    return payload.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const checkAccessExpiry = async (courseId: string): Promise<{
  enrollment: {
    id: string;
    status: string;
    accessType?: string;
    accessExpiresAt?: string;
    grantedByAdmin?: boolean;
  };
  course: {
    id: string;
    title: string;
  };
  accessStatus: 'FULL_ACCESS' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  daysRemaining?: number;
  warningLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> => {
  try {
    const response = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.ENROLLMENTS.CHECK_EXPIRY(courseId));
    const payload = response.data;
    if (!payload.success || !payload.data) {
      throw new Error(payload.message || 'Failed to check access expiry');
    }
    return payload.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

