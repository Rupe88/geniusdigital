import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface ConsultationCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  order: number;
  isActive: boolean;
}

export interface Consultation {
  id: string;
  name: string;
  email: string;
  phone: string;
  categoryId?: string | null;
  category?: ConsultationCategory | null;
  consultationType?: 'ONLINE' | 'OFFLINE';
  referralSource?: string;
  referralSourceOther?: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationRequest {
  name: string;
  email: string;
  phone: string;
  categoryId?: string | null;
  consultationType?: 'ONLINE' | 'OFFLINE';
  referralSource?: string;
  referralSourceOther?: string;
  message: string;
  topic?: string;
}

/**
 * Get all active consultation categories (public)
 */
export const getConsultationCategories = async (): Promise<ConsultationCategory[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ConsultationCategory[]>>(API_ENDPOINTS.CONSULTATIONS.CATEGORIES);
    return handleApiResponse<ConsultationCategory[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface UpdateConsultationStatusRequest {
  status: Consultation['status'];
  notes?: string;
}

/**
 * Create a new consultation request
 */
export const createConsultation = async (data: CreateConsultationRequest): Promise<Consultation> => {
  try {
    const response = await apiClient.post<ApiResponse<Consultation>>(API_ENDPOINTS.CONSULTATIONS.CREATE, data);
    return handleApiResponse<Consultation>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get all consultations (admin only)
 */
export const getAllConsultations = async (): Promise<Consultation[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Consultation[]>>(API_ENDPOINTS.CONSULTATIONS.LIST);
    return handleApiResponse<Consultation[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get consultation by ID
 */
export const getConsultationById = async (id: string): Promise<Consultation> => {
  try {
    const response = await apiClient.get<ApiResponse<Consultation>>(API_ENDPOINTS.CONSULTATIONS.BY_ID(id));
    return handleApiResponse<Consultation>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update consultation status (admin only)
 */
export const updateConsultationStatus = async (id: string, data: UpdateConsultationStatusRequest): Promise<Consultation> => {
  try {
    const response = await apiClient.patch<ApiResponse<Consultation>>(API_ENDPOINTS.CONSULTATIONS.BY_ID(id), data);
    return handleApiResponse<Consultation>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete consultation (admin only)
 */
export const deleteConsultation = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.CONSULTATIONS.BY_ID(id));
    handleApiResponse<void>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const consultationApi = {
  getCategories: getConsultationCategories,
  create: createConsultation,
  getAll: getAllConsultations,
  getById: getConsultationById,
  updateStatus: updateConsultationStatus,
  delete: deleteConsultation,
};
