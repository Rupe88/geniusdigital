import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface InstallmentPlan {
  id: string;
  courseId: string;
  numberOfInstallments: number;
  intervalMonths: number;
  minAmountForPlan: number | null;
  isActive: boolean;
}

export interface StartInstallmentResult {
  enrollmentId: string;
  course: { id: string; title: string; price: number };
  schedule: Array<{
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status: string;
  }>;
  firstInstallmentId: string;
  firstAmount: number;
}

export interface MyInstallmentItem {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
  course: { id: string; title: string; thumbnail?: string; slug?: string };
  enrollmentId: string;
}

/** Get active installment plan for a course (public) */
export const getPlanByCourse = async (courseId: string): Promise<InstallmentPlan | null> => {
  try {
    const response = await apiClient.get<ApiResponse<InstallmentPlan | null>>(
      API_ENDPOINTS.INSTALLMENTS.PLAN_BY_COURSE(courseId)
    );
    const payload = response.data;
    if (payload.success && payload.data) return payload.data;
    return null;
  } catch {
    return null;
  }
};

/** Start installment enrollment: creates enrollment + schedule; returns first installment id and amount */
export const startInstallmentEnrollment = async (courseId: string): Promise<StartInstallmentResult> => {
  try {
    const response = await apiClient.post<ApiResponse<StartInstallmentResult>>(API_ENDPOINTS.INSTALLMENTS.START, {
      courseId,
    });
    return handleApiResponse<StartInstallmentResult>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** Get current user's installments */
export const getMyInstallments = async (params?: {
  status?: 'PENDING' | 'PAID' | 'OVERDUE';
  courseId?: string;
}): Promise<MyInstallmentItem[]> => {
  try {
    const response = await apiClient.get<ApiResponse<MyInstallmentItem[]>>(API_ENDPOINTS.INSTALLMENTS.MY_LIST, {
      params,
    });
    const payload = response.data;
    if (payload.success && Array.isArray(payload.data)) return payload.data;
    return [];
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// --- Admin ---

export interface InstallmentPlanAdmin extends InstallmentPlan {
  course?: { id: string; title: string; price: number };
}

/** Admin: get installment plan for a course */
export const getPlanByCourseAdmin = async (courseId: string): Promise<InstallmentPlanAdmin | null> => {
  try {
    const response = await apiClient.get<ApiResponse<InstallmentPlanAdmin | null>>(
      API_ENDPOINTS.INSTALLMENTS.ADMIN_PLAN(courseId)
    );
    const payload = response.data;
    if (payload.success && payload.data) return payload.data;
    return null;
  } catch {
    return null;
  }
};

/** Admin: create or update installment plan */
export const upsertPlanAdmin = async (
  courseId: string,
  data: { numberOfInstallments?: number; intervalMonths?: number; minAmountForPlan?: number | null; isActive?: boolean }
): Promise<InstallmentPlanAdmin> => {
  const response = await apiClient.put<ApiResponse<InstallmentPlanAdmin>>(
    API_ENDPOINTS.INSTALLMENTS.ADMIN_UPSERT_PLAN(courseId),
    data
  );
  return handleApiResponse<InstallmentPlanAdmin>(response);
};

/** Admin: delete installment plan */
export const deletePlanAdmin = async (courseId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.INSTALLMENTS.ADMIN_DELETE_PLAN(courseId));
};
