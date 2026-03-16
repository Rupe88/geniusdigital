import { apiClient, handleApiError } from './axios';
import type { ApiResponse } from '@/lib/types/api';

export type AffiliateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface MyAffiliate {
  id: string;
  userId: string;
  affiliateCode: string;
  status: AffiliateStatus;
  commissionRate: string | number;
}

export async function getMyAffiliate(): Promise<MyAffiliate> {
  try {
    const response = await apiClient.get<ApiResponse<MyAffiliate>>('/affiliate/me');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.message || 'Failed to load affiliate status');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

