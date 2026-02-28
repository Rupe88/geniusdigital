import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse, PaginatedResponse, Pagination } from '@/lib/types/api';

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
  changes?: unknown;
  metadata?: unknown;
  riskScore?: number | null;
  flagged: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  flagged?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all audit logs (admin only)
 */
export const getAllAuditLogs = async (filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> => {
  try {
    const params: Record<string, string> = {};

    if (filters) {
      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.flagged !== undefined) params.flagged = String(filters.flagged);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page) params.page = String(filters.page);
      if (filters.limit) params.limit = String(filters.limit);
    }

    const query = new URLSearchParams(params).toString();
    const url = `${API_ENDPOINTS.AUDIT_LOGS.LIST}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<ApiResponse<AuditLog[]> & { pagination: Pagination }>(url);

    const payload = response.data;
    if (payload.success && payload.data) {
      return {
        data: payload.data,
        pagination: payload.pagination || {
          page: filters?.page || 1,
          limit: filters?.limit || 50,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error('Failed to fetch audit logs');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const auditLogsApi = {
  getAll: getAllAuditLogs,
};
