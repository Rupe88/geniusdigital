import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  couponType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  applicableCourses?: string[];
  applicableProducts?: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  couponType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  validFrom: string;
  validUntil: string;
  applicableCourses?: string[];
  applicableProducts?: string[];
}

export interface UpdateCouponRequest {
  code?: string;
  description?: string;
  couponType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  validFrom?: string;
  validUntil?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  applicableCourses?: string[];
  applicableProducts?: string[];
}

export interface ValidateCouponRequest {
  code: string;
  amount: number;
  courseId?: string;
  productIds?: string[];
}

export interface ValidateCouponResponse {
  success: boolean;
  data?: {
    coupon: { id: string; code: string; couponType: string; discountValue: number };
    discountAmount: number;
    finalAmount: number;
  };
  message?: string;
}

/**
 * Get all coupons (admin only)
 */
export const getAllCoupons = async (params?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Coupon>> => {
  try {
    const response = await apiClient.get<ApiResponse<Coupon[]>>(`${API_ENDPOINTS.COUPONS.LIST}/admin`, {
      params,
    });
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return {
        data: responseData.data,
        pagination: (responseData as any).pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: responseData.data.length,
          pages: 1,
        },
      };
    }
    throw new Error(responseData.message || 'Failed to fetch coupons');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (id: string): Promise<Coupon> => {
  try {
    const response = await apiClient.get<ApiResponse<Coupon>>(API_ENDPOINTS.COUPONS.BY_ID(id));
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Coupon not found');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Create new coupon (admin only)
 */
export const createCoupon = async (data: CreateCouponRequest): Promise<Coupon> => {
  try {
    const response = await apiClient.post<ApiResponse<Coupon>>(API_ENDPOINTS.COUPONS.LIST, data);
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Failed to create coupon');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update coupon (admin only)
 */
export const updateCoupon = async (id: string, data: UpdateCouponRequest): Promise<Coupon> => {
  try {
    const response = await apiClient.put<ApiResponse<Coupon>>(API_ENDPOINTS.COUPONS.BY_ID(id), data);
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Failed to update coupon');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete coupon (admin only)
 */
export const deleteCoupon = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.COUPONS.BY_ID(id));
    handleApiResponse<void>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get active coupons
 */
export const getActiveCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Coupon[]>>(API_ENDPOINTS.COUPONS.ACTIVE);
    return handleApiResponse<Coupon[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/** Result of validateCoupon: either valid with data or invalid with message. */
export type ValidateCouponResult =
  | { valid: true; coupon: { id: string; code: string; couponType: string; discountValue: number }; discountAmount: number; finalAmount: number }
  | { valid: false; message: string };

/**
 * Validate coupon for a course or cart. Pass courseId when validating for a course purchase.
 */
export const validateCoupon = async (data: ValidateCouponRequest): Promise<ValidateCouponResult> => {
  try {
    const response = await apiClient.post<{ success: boolean; data?: ValidateCouponResponse['data']; message?: string }>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      { code: data.code.trim().toUpperCase(), amount: data.amount, courseId: data.courseId, productIds: data.productIds }
    );
    const res = response.data;
    if (res.success && res.data) {
      return { valid: true, ...res.data };
    }
    return { valid: false, message: res.message || 'Invalid coupon' };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    const message = err.response?.data?.message || handleApiError(error);
    return { valid: false, message };
  }
};

// For backward compatibility
export const couponApi = {
  getAllCoupons,
  getById: getCouponById,
  create: createCoupon,
  update: updateCoupon,
  delete: deleteCoupon,
  getActive: getActiveCoupons,
  validate: validateCoupon,
};
