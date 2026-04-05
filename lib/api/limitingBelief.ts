import { apiClient, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export type LimitingBeliefQuestion = {
  id: string;
  text: string;
  sortOrder: number;
};

export type LimitingBeliefSection = {
  id: string;
  title: string;
  sortOrder: number;
  questions: LimitingBeliefQuestion[];
};

export type LimitingBeliefScoreBand = {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  description: string | null;
  sortOrder: number;
};

export type LimitingBeliefCatalog = {
  sections: LimitingBeliefSection[];
  bands: LimitingBeliefScoreBand[];
  maxScore: number;
  pointsPerQuestion: number;
};

export type AdminLimitingBeliefSection = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  questions: Array<{
    id: string;
    sectionId: string;
    text: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminLimitingBeliefScoreBand = LimitingBeliefScoreBand & {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminLimitingBeliefCatalog = {
  sections: AdminLimitingBeliefSection[];
  bands: AdminLimitingBeliefScoreBand[];
  maxScorePublished: number;
};

function unwrapData<T>(response: { data: ApiResponse<T> }): T {
  const payload = response.data;
  if (payload.success && payload.data !== undefined && payload.data !== null) {
    return payload.data as T;
  }
  throw new Error(payload.message || 'Request failed');
}

export const getLimitingBeliefCatalog = async (): Promise<LimitingBeliefCatalog> => {
  try {
    const res = await apiClient.get<ApiResponse<LimitingBeliefCatalog>>(API_ENDPOINTS.LIMITING_BELIEF.CATALOG);
    return unwrapData(res);
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const submitLimitingBeliefAttempt = async (answers: Record<string, number>): Promise<void> => {
  try {
    const res = await apiClient.post<ApiResponse<{ id: string }>>(API_ENDPOINTS.LIMITING_BELIEF.ATTEMPTS, {
      answers,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to save attempt');
    }
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const getAdminLimitingBeliefCatalog = async (): Promise<AdminLimitingBeliefCatalog> => {
  try {
    const res = await apiClient.get<ApiResponse<AdminLimitingBeliefCatalog>>(
      API_ENDPOINTS.LIMITING_BELIEF.ADMIN_CATALOG
    );
    return unwrapData(res);
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const createLimitingBeliefSection = async (body: {
  title: string;
  sortOrder?: number;
  isActive?: boolean;
}) => {
  const res = await apiClient.post(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SECTIONS, body);
  return unwrapData(res.data);
};

export const updateLimitingBeliefSection = async (
  id: string,
  body: { title?: string; sortOrder?: number; isActive?: boolean }
) => {
  const res = await apiClient.put(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SECTION(id), body);
  return unwrapData(res.data);
};

export const deleteLimitingBeliefSection = async (id: string) => {
  await apiClient.delete(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SECTION(id));
};

export const createLimitingBeliefQuestion = async (body: {
  sectionId: string;
  text: string;
  sortOrder?: number;
  isActive?: boolean;
}) => {
  const res = await apiClient.post(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_QUESTIONS, body);
  return unwrapData(res.data);
};

export const updateLimitingBeliefQuestion = async (
  id: string,
  body: { text?: string; sortOrder?: number; isActive?: boolean; sectionId?: string }
) => {
  const res = await apiClient.put(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_QUESTION(id), body);
  return unwrapData(res.data);
};

export const deleteLimitingBeliefQuestion = async (id: string) => {
  await apiClient.delete(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_QUESTION(id));
};

export const createLimitingBeliefScoreBand = async (body: {
  minScore: number;
  maxScore: number;
  label: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) => {
  const res = await apiClient.post(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SCORE_BANDS, body);
  return unwrapData(res.data);
};

export const updateLimitingBeliefScoreBand = async (
  id: string,
  body: Partial<{
    minScore: number;
    maxScore: number;
    label: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  }>
) => {
  const res = await apiClient.put(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SCORE_BAND(id), body);
  return unwrapData(res.data);
};

export const deleteLimitingBeliefScoreBand = async (id: string) => {
  await apiClient.delete(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_SCORE_BAND(id));
};

export type LimitingBeliefAttemptRow = {
  id: string;
  totalScore: number;
  maxScore: number;
  bandLabel: string | null;
  createdAt: string;
  user: { id: string; email: string; fullName: string };
};

export const getAdminLimitingBeliefAttempts = async (params?: { limit?: number; offset?: number }) => {
  const res = await apiClient.get<
    ApiResponse<{ attempts: LimitingBeliefAttemptRow[]; total: number; take: number; skip: number }>
  >(API_ENDPOINTS.LIMITING_BELIEF.ADMIN_ATTEMPTS, { params });
  return unwrapData(res);
};
