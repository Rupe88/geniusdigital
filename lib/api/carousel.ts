import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse } from '@/lib/types/api';

export interface HeroCarouselSlide {
  id: string;
  image: string | null;
  altText: string;
  videoEmbedUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Public: Get carousel slides for home page */
export const getCarouselSlides = async (): Promise<HeroCarouselSlide[]> => {
  try {
    const response = await apiClient.get<ApiResponse<HeroCarouselSlide[]>>(API_ENDPOINTS.CAROUSEL.LIST);
    const payload = response.data;
    if (payload?.success && Array.isArray(payload.data)) return payload.data;
    return [];
  } catch (error) {
    console.error('getCarouselSlides error:', error);
    return [];
  }
};

/** Admin: Get all slides */
export const getCarouselSlidesAdmin = async (): Promise<HeroCarouselSlide[]> => {
  try {
    const response = await apiClient.get<ApiResponse<HeroCarouselSlide[]>>(API_ENDPOINTS.CAROUSEL.ADMIN_LIST);
    return handleApiResponse<HeroCarouselSlide[]>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface CreateCarouselSlideData {
  altText?: string;
  videoEmbedUrl?: string;
  imageFile?: File;
  videoFile?: File;
}

/** Admin: Create slide (either image OR video, not both) */
export const createCarouselSlide = async (data: CreateCarouselSlideData): Promise<HeroCarouselSlide> => {
  const formData = new FormData();
  if (data.imageFile) formData.append('image', data.imageFile);
  if (data.altText !== undefined) formData.append('altText', data.altText);
  if (data.videoEmbedUrl?.trim()) formData.append('videoEmbedUrl', data.videoEmbedUrl.trim());
  if (data.videoFile) formData.append('video', data.videoFile);

  const response = await apiClient.post<ApiResponse<HeroCarouselSlide>>(
    API_ENDPOINTS.CAROUSEL.ADMIN_LIST,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  const payload = response.data;
  if (payload?.success && payload.data) return payload.data;
  throw new Error(payload?.message || 'Failed to create slide');
};

export interface UpdateCarouselSlideData {
  altText?: string;
  videoEmbedUrl?: string;
  videoUrl?: string;
  imageFile?: File;
  videoFile?: File;
}

/** Admin: Update slide */
export const updateCarouselSlide = async (
  id: string,
  data: UpdateCarouselSlideData
): Promise<HeroCarouselSlide> => {
  const formData = new FormData();
  if (data.altText !== undefined) formData.append('altText', data.altText);
  if (data.videoEmbedUrl !== undefined) formData.append('videoEmbedUrl', data.videoEmbedUrl);
  if (data.videoUrl !== undefined) formData.append('videoUrl', data.videoUrl);
  if (data.imageFile) formData.append('image', data.imageFile);
  if (data.videoFile) formData.append('video', data.videoFile);

  const response = await apiClient.put<ApiResponse<HeroCarouselSlide>>(
    API_ENDPOINTS.CAROUSEL.ADMIN_BY_ID(id),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  const payload = response.data;
  if (payload?.success && payload.data) return payload.data;
  throw new Error(payload?.message || 'Failed to update slide');
};

/** Admin: Delete slide */
export const deleteCarouselSlide = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.CAROUSEL.ADMIN_BY_ID(id));
};

/** Admin: Reorder slides (array of ids in order) */
export const reorderCarouselSlides = async (order: string[]): Promise<HeroCarouselSlide[]> => {
  const response = await apiClient.post<ApiResponse<HeroCarouselSlide[]>>(
    API_ENDPOINTS.CAROUSEL.ADMIN_REORDER,
    { order }
  );
  return handleApiResponse<HeroCarouselSlide[]>(response);
};
