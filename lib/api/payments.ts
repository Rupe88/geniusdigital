import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { Payment } from '@/lib/types/payment';
import { PaginatedResponse, ApiResponse } from '@/lib/types/api';

export interface InitiatePaymentResponse {
  success: boolean;
  paymentId: string;
  transactionId: string;
  amount: number;
  discount: number;
  paymentMethod: string;
  paymentDetails: {
    paymentUrl?: string;
    formData?: Record<string, string>;
    qrImageUrl?: string;
    instructions?: string;
    method?: string;
    [key: string]: unknown;
  };
}

export const createPayment = async (data: {
  courseId?: string;
  orderId?: string;
  productIds?: string[];
  amount: number;
  paymentMethod: string;
  couponCode?: string;
  referralClickId?: string;
  successUrl?: string;
  failureUrl?: string;
  /** When paying a single installment (EMI) */
  installmentId?: string;
}): Promise<InitiatePaymentResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(API_ENDPOINTS.PAYMENTS.CREATE, data);
    return handleApiResponse<InitiatePaymentResponse>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const verifyPayment = async (transactionId: string, paymentMethod: string): Promise<Payment> => {
  try {
    const response = await apiClient.post<ApiResponse<Payment>>(API_ENDPOINTS.PAYMENTS.VERIFY, {
      transactionId,
      paymentMethod,
    });
    return handleApiResponse<Payment>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** Legacy verify callback (public endpoint). Manual QR payments are approved in admin, not here. */
export const verifyPaymentCallback = async (
  transactionId: string,
  paymentMethod: string,
  verificationData?: Record<string, unknown>
): Promise<Payment> => {
  try {
    const response = await apiClient.post<ApiResponse<Payment>>(API_ENDPOINTS.PAYMENTS.VERIFY_CALLBACK, {
      transactionId,
      paymentMethod,
      verificationData: verificationData || {},
    });
    return handleApiResponse<Payment>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** @deprecated Use verifyPaymentCallback for success page (no auth required) */
export const verifyPaymentWithData = verifyPaymentCallback;

export const getPaymentHistory = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Payment>> => {
  try {
    const response = await apiClient.get<
      ApiResponse<Payment[]> & { pagination: { page: number; limit: number; total: number; pages: number } }
    >(API_ENDPOINTS.PAYMENTS.HISTORY, { params });
    const payload = response.data;
    if (payload.success && Array.isArray(payload.data)) {
      return {
        data: payload.data,
        pagination: payload.pagination ?? {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error((payload as ApiResponse<unknown>).message || 'Failed to fetch payment history');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  try {
    const response = await apiClient.get<ApiResponse<Payment>>(API_ENDPOINTS.PAYMENTS.BY_ID(id));
    return handleApiResponse<Payment>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** After paying via QR, upload proof screenshot (multipart). */
export const submitPaymentProof = async (paymentId: string, file: File): Promise<{ proofImageUrl: string }> => {
  const form = new FormData();
  form.append('paymentId', paymentId);
  form.append('proof', file);
  try {
    const response = await apiClient.post<ApiResponse<{ proofImageUrl: string }>>(
      API_ENDPOINTS.PAYMENTS.SUBMIT_PROOF,
      form
    );
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

