import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import type { ApiResponse } from '@/lib/types/api';
import type { PaginatedResponse } from '@/lib/types/api';

export interface AffiliateApplicationPayload {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  currentOccupation?: string;
  hasAffiliateExperience?: boolean;
  experienceDetails?: string;
  occultKnowledge?: string;
  occultOther?: string;
  whyJoin?: string;
}

export interface AffiliateApplication {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  country: string | null;
  city: string | null;
  currentOccupation: string | null;
  hasAffiliateExperience: boolean;
  experienceDetails: string | null;
  occultKnowledge: string | null;
  occultOther: string | null;
  whyJoin: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string | null;
  reviewedById?: string | null;
  createdAt: string;
}

export async function submitAffiliateApplication(
  payload: AffiliateApplicationPayload
): Promise<AffiliateApplication> {
  try {
    const response = await apiClient.post<ApiResponse<AffiliateApplication>>(
      API_ENDPOINTS.AFFILIATE_APPLICATIONS,
      payload
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to submit application');
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Array<{ msg?: string; message?: string }> } }; message?: string };
    if (err.response?.data) {
      const data = err.response.data;
      if (data.errors?.length) {
        const msg = data.errors.map((e) => e.msg || e.message).filter(Boolean).join(', ');
        throw new Error(msg || data.message || 'Validation failed');
      }
      if (data.message) throw new Error(data.message);
    }
    if (err.message) throw new Error(err.message);
    throw new Error(handleApiError(error));
  }
}

export async function getAllAffiliateApplications(params?: {
  page?: number;
  limit?: number;
  search?: string;
  q?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}): Promise<PaginatedResponse<AffiliateApplication>> {
  const response = await apiClient.get<ApiResponse<AffiliateApplication[]>>(
    API_ENDPOINTS.AFFILIATE_APPLICATIONS,
    { params }
  );
  const data = response.data as ApiResponse<AffiliateApplication[]> & { pagination?: PaginatedResponse<AffiliateApplication>['pagination'] };
  if (data.success && data.data) {
    return {
      data: data.data,
      pagination: data.pagination ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        total: data.data.length,
        pages: 1,
      },
    };
  }
  throw new Error(data.message || 'Failed to fetch applications');
}

export async function updateAffiliateApplicationStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<AffiliateApplication> {
  try {
    const response = await apiClient.patch<ApiResponse<AffiliateApplication>>(
      `${API_ENDPOINTS.AFFILIATE_APPLICATIONS}/${id}/status`,
      { status }
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.message || 'Failed to update application status');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}
