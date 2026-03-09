import axios from 'axios';
import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { PaginatedResponse, ApiResponse, Pagination } from '@/lib/types/api';

export type GalleryMediaType = 'IMAGE' | 'VIDEO';

export interface GalleryItem {
  id: string;
  title?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: GalleryMediaType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGalleryItemData {
  title?: string;
  files?: File[]; // For image file upload (multiple)
  mediaType?: GalleryMediaType;
  videoUrl?: string; // For YouTube/Google Drive link
  videoFile?: File; // For uploaded video
}

export interface UpdateGalleryItemData extends Partial<CreateGalleryItemData> {}

// Public: Get all published gallery items
export const getGalleryItems = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<GalleryItem>> => {
  try {
    const response = await apiClient.get<ApiResponse<GalleryItem[]> & { pagination: Pagination }>(API_ENDPOINTS.GALLERY.LIST, {
      params,
    });

    const payload = response.data;
    if (payload.success && payload.data) {
      return {
        data: payload.data,
        pagination: payload.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error('Failed to fetch gallery items');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Admin: Get all gallery items (including unpublished)
export const getAllGalleryItems = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<GalleryItem>> => {
  try {
    const response = await apiClient.get<ApiResponse<GalleryItem[]> & { pagination: Pagination }>(API_ENDPOINTS.GALLERY.LIST, {
      params: {
        ...params,
      },
    });

    const payload = response.data;
    if (payload.success && payload.data) {
      return {
        data: payload.data,
        pagination: payload.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: payload.data.length,
          pages: 1,
        },
      };
    }
    throw new Error('Failed to fetch gallery items');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Public: Get gallery item by ID
export const getGalleryItemById = async (id: string): Promise<GalleryItem> => {
  try {
    const response = await apiClient.get<ApiResponse<GalleryItem>>(API_ENDPOINTS.GALLERY.BY_ID(id));
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Admin: Create gallery item
export const createGalleryItem = async (data: CreateGalleryItemData): Promise<GalleryItem[]> => {
  try {
    const mediaType: GalleryMediaType = data.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE';

    // Validate required media based on type
    if (mediaType === 'IMAGE') {
      if (!data.files || data.files.length === 0) {
        throw new Error('Please upload at least one image file');
      }
    } else if (mediaType === 'VIDEO') {
      const hasVideoFile = !!data.videoFile;
      const hasVideoUrl = !!data.videoUrl && data.videoUrl.trim().length > 0;
      if (!hasVideoFile && !hasVideoUrl) {
        throw new Error('Please upload a video file or provide a YouTube/Google Drive link');
      }
    }

    const formData = new FormData();

    if (data.title) formData.append('title', data.title.trim());
    formData.append('mediaType', mediaType);

    if (mediaType === 'IMAGE' && data.files) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    if (mediaType === 'VIDEO') {
      if (data.videoUrl && data.videoUrl.trim()) {
        formData.append('videoUrl', data.videoUrl.trim());
      }
      if (data.videoFile) {
        formData.append('video', data.videoFile);
      }
    }

    const response = await apiClient.post<ApiResponse<GalleryItem[]>>(API_ENDPOINTS.GALLERY.LIST, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes timeout for gallery uploads (larger files)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    return handleApiResponse(response);
  } catch (error: any) {
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Upload timed out. Please try again with a smaller file or check your internet connection.');
    }
    // Handle 408 status code
    if (error.response?.status === 408) {
      throw new Error(error.response?.data?.message || 'Upload timed out. Please try again with a smaller file.');
    }
    throw new Error(handleApiError(error));
  }
};

// Admin: Update gallery item
export const updateGalleryItem = async (id: string, data: UpdateGalleryItemData): Promise<GalleryItem> => {
  try {
    const formData = new FormData();

    if (data.title !== undefined) formData.append('title', data.title.trim());

    if (data.mediaType) {
      formData.append('mediaType', data.mediaType);
    }

    // Handle image file upload (update uses single file field)
    if (data.files && data.files.length > 0) {
      formData.append('file', data.files[0]);
    }

    // Handle video updates
    if (data.videoUrl && data.videoUrl.trim()) {
      formData.append('videoUrl', data.videoUrl.trim());
    }
    if (data.videoFile) {
      formData.append('video', data.videoFile);
    }

    const response = await apiClient.put<ApiResponse<GalleryItem>>(API_ENDPOINTS.GALLERY.BY_ID(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes timeout for gallery uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    return handleApiResponse(response);
  } catch (error: any) {
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Upload timed out. Please try again with a smaller file or check your internet connection.');
    }
    // Handle 408 status code
    if (error.response?.status === 408) {
      throw new Error(error.response?.data?.message || 'Upload timed out. Please try again with a smaller file.');
    }
    throw new Error(handleApiError(error));
  }
};

// Admin: Delete gallery item
export const deleteGalleryItem = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.GALLERY.BY_ID(id));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const galleryApi = {
  getAll: getAllGalleryItems,
  getById: getGalleryItemById,
  create: createGalleryItem,
  update: updateGalleryItem,
  delete: deleteGalleryItem,
};
