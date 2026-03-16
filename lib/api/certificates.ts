import { apiClient, handleApiResponse, handleApiError } from './axios';
import { ApiResponse } from '@/lib/types/api';

// Backend Prisma model: Certificate with related user & course.
export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateId: string;
  certificateUrl: string;
  issuedAt: string;
  user?: {
    fullName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    thumbnail?: string | null;
  };
}

export interface IssueCertificateRequest {
  userId: string;
  courseId: string;
}

/**
 * Get all certificates (admin only)
 */
export const getAllCertificates = async (): Promise<Certificate[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Certificate[]>>('/certificates/admin');
    return handleApiResponse<Certificate[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get user's certificates
 */
export const getUserCertificates = async (): Promise<Certificate[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Certificate[]>>('/certificates');
    return handleApiResponse<Certificate[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Issue certificate (admin only)
 */
export const issueCertificate = async (data: IssueCertificateRequest): Promise<Certificate> => {
  try {
    const response = await apiClient.post<ApiResponse<Certificate>>('/certificates/admin/issue', data);
    return handleApiResponse<Certificate>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Upload a signed certificate file for a user & course (admin only).
 * Expects FormData with:
 * - file: File
 * - userId: string
 * - courseId: string
 */
export const uploadCertificateFile = async (formData: FormData): Promise<Certificate> => {
  try {
    const response = await apiClient.post<ApiResponse<Certificate>>('/certificates/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return handleApiResponse<Certificate>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete certificate (admin only)
 */
export const deleteCertificate = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(`/certificates/${id}`);
    handleApiResponse<void>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const certificatesApi = {
  getAll: getAllCertificates,
  getUserCertificates,
  issue: issueCertificate,
  upload: uploadCertificateFile,
  delete: deleteCertificate,
};
