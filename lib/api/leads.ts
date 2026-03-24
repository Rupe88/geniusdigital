import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { Pagination } from '@/lib/types/api';

export interface AppLead {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadListResponse {
  success: boolean;
  data: AppLead[];
  pagination: Pagination;
}

export const getNumerologyLeads = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: AppLead[]; pagination: Pagination }> => {
  try {
    const response = await apiClient.get<LeadListResponse>(API_ENDPOINTS.NUMEROLOGY_LEADS, { params });
    const payload = response.data;
    return {
      data: payload?.data || [],
      pagination: payload?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getCompassLeads = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: AppLead[]; pagination: Pagination }> => {
  try {
    const response = await apiClient.get<LeadListResponse>(API_ENDPOINTS.COMPASS_LEADS, { params });
    const payload = response.data;
    return {
      data: payload?.data || [],
      pagination: payload?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
