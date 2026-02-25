import { apiClient } from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  featured: boolean;
  published: boolean;
  stockQuantity: number;
  sku?: string;
  status?: string;

  // Vastu specific fields
  productType?: string;
  vastuPurpose?: string;
  energyType?: string;
  material?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  images?: string[];
  imageFiles?: File[];
  featured?: boolean;
  published?: boolean;
  stockQuantity: number;
  sku?: string;
  status?: string;

  // Vastu specific fields
  productType?: string;
  vastuPurpose?: string;
  energyType?: string;
  material?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tags?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  category?: string;
  images?: string[];
  imageFiles?: File[];
  existingImages?: string[];
  featured?: boolean;
  published?: boolean;
  stockQuantity?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tags?: string[];

  // Vastu specific fields
  productType?: string;
  vastuPurpose?: string;
  energyType?: string;
  material?: string;
  sku?: string;
  status?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

/**
 * Helper to create FormData from object
 */
const createFormData = (data: any): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === 'imageFiles') {
      if (data.imageFiles && Array.isArray(data.imageFiles)) {
        data.imageFiles.forEach((file: File) => {
          formData.append('images', file);
        });
      }
    } else if (key === 'dimensions') {
      // Handle dimensions object
      if (data[key] !== undefined && data[key] !== null) {
        const dims = data[key];
        if (dims.length || dims.width || dims.height) {
          formData.append(key, JSON.stringify(dims));
        }
      }
    } else if (key === 'tags' || key === 'existingImages') {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, JSON.stringify(data[key]));
      }
    } else if (key === 'images') {
      // Only append 'images' as JSON if there are NO imageFiles being sent.
      // If there are imageFiles, they will use the 'images' field name for the actual files.
      if (!data.imageFiles || data.imageFiles.length === 0) {
        if (data.images !== undefined && data.images !== null) {
          formData.append('images', JSON.stringify(data.images));
        }
      }
    } else if (key === 'featured') {
      // Convert boolean to string
      if (data[key] !== undefined) {
        formData.append(key, data[key] ? 'true' : 'false');
      }
    } else if (key === 'status') {
      // Status is already a string
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      formData.append(key, data[key].toString());
    }
  });
  return formData;
};

/**
 * Products API
 */
export const productsApi = {
  /**
   * Get all products
   */
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.LIST);
    const payload = response.data as ApiResponse<any[]>;
    const normalized: ApiResponse<Product[]> = {
      ...payload,
      data: (payload.data || []).map((p: any) => ({
        ...p,
        // Backend sends price as string, stock as "stock"
        price: typeof p.price === 'string' ? Number(p.price) : p.price,
        originalPrice:
          p.originalPrice != null
            ? Number(p.originalPrice)
            : p.comparePrice != null
              ? Number(p.comparePrice)
              : undefined,
        stockQuantity:
          p.stockQuantity != null
            ? Number(p.stockQuantity)
            : p.stock != null
              ? Number(p.stock)
              : 0,
      })),
    };
    return normalized;
  },

  /**
   * Get featured products
   */
  getFeatured: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/featured`);
    return response.data;
  },

  /**
   * Get products by category
   */
  getByCategory: async (category: string): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/category/${category}`);
    return response.data;
  },

  /**
   * Get product by ID
   */
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    const payload = response.data as ApiResponse<any>;
    if (!payload.data) return payload as ApiResponse<Product>;
    const p = payload.data;
    const normalized: ApiResponse<Product> = {
      ...payload,
      data: {
        ...p,
        price: typeof p.price === 'string' ? Number(p.price) : p.price,
        originalPrice:
          p.originalPrice != null
            ? Number(p.originalPrice)
            : p.comparePrice != null
              ? Number(p.comparePrice)
              : undefined,
        stockQuantity:
          p.stockQuantity != null
            ? Number(p.stockQuantity)
            : p.stock != null
              ? Number(p.stock)
              : 0,
      },
    };
    return normalized;
  },

  /**
   * Create new product (admin only). Sends FormData with images when imageFiles present (S3 upload);
   * otherwise sends JSON.
   */
  create: async (data: CreateProductRequest): Promise<ApiResponse<Product>> => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasImageFiles = data.imageFiles && data.imageFiles.length > 0;

      if (hasImageFiles) {
        const payload: Record<string, unknown> = {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          price: data.price,
          comparePrice: data.originalPrice,
          stock: (data as any).stock ?? data.stockQuantity ?? 0,
          status: data.status ?? 'ACTIVE',
          featured: data.featured ?? false,
          productType: data.productType,
          vastuPurpose: data.vastuPurpose,
          energyType: data.energyType,
          material: data.material,
          dimensions: data.dimensions,
          imageFiles: data.imageFiles,
        };
        if (data.category && uuidRegex.test(String(data.category))) payload.categoryId = data.category;
        if (data.sku) payload.sku = data.sku;
        Object.keys(payload).forEach((k) => {
          if (payload[k] === undefined || payload[k] === '') delete payload[k];
        });
        const formData = createFormData(payload);
        const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.LIST, formData, {
          timeout: 120000,
        });
        return response.data;
      }

      const jsonBody: Record<string, unknown> = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        comparePrice: data.originalPrice,
        stock: (data as any).stock ?? data.stockQuantity ?? 0,
        status: data.status ?? 'ACTIVE',
        featured: data.featured ?? false,
        productType: data.productType,
        vastuPurpose: data.vastuPurpose,
        energyType: data.energyType,
        material: data.material,
        dimensions: data.dimensions,
      };
      if (data.category && uuidRegex.test(String(data.category))) jsonBody.categoryId = data.category;
      if (data.sku) jsonBody.sku = data.sku;
      if (data.images && data.images.length) jsonBody.images = data.images;
      Object.keys(jsonBody).forEach((k) => {
        if (jsonBody[k] === undefined || jsonBody[k] === '') delete jsonBody[k];
      });
      const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.LIST, jsonBody, { timeout: 60000 });
      return response.data;
    } catch (error: any) {
      console.error('Product creation error:', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((e: any) => `${e.param || e.field}: ${e.msg || e.message}`).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        throw new Error(errorData.message || 'Failed to create product');
      }
      throw error;
    }
  },

  /**
   * Update product (admin only). Sends JSON when no new image files (works reliably locally);
   * sends FormData when imageFiles present (S3 upload).
   */
  update: async (id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> => {
    try {
      const hasImageFiles = data.imageFiles && data.imageFiles.length > 0;

      if (!hasImageFiles) {
        const jsonBody: Record<string, unknown> = {
          name: data.name,
          slug: (data as any).slug,
          description: data.description,
          shortDescription: (data as any).shortDescription,
          price: data.price,
          comparePrice: data.originalPrice,
          stock: data.stockQuantity ?? (data as any).stockQuantity,
          status: data.status ?? (data.published !== undefined ? (data.published ? 'ACTIVE' : 'INACTIVE') : undefined),
          featured: data.featured,
          images: data.images,
          dimensions: data.dimensions,
          productType: data.productType,
          vastuPurpose: data.vastuPurpose,
          energyType: data.energyType,
          material: data.material,
        };
        if (data.sku !== undefined) jsonBody.sku = data.sku;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (data.category !== undefined && data.category !== '' && uuidRegex.test(String(data.category))) jsonBody.categoryId = data.category;
        Object.keys(jsonBody).forEach((k) => {
          if (jsonBody[k] === undefined || jsonBody[k] === '') delete jsonBody[k];
        });
        const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), jsonBody, { timeout: 60000 });
        return response.data;
      }

      const formData = createFormData(data);
      const imageCount = data.imageFiles?.length || 0;
      const timeout = Math.min(Math.max(imageCount * 120000, 300000), 900000);

      const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), formData, {
        timeout: timeout,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(2);
            const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(2);
            console.log(`Update upload progress: ${percentCompleted}% (${loadedMB}MB / ${totalMB}MB)`);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Product update error:', error);

      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const imageCount = data.imageFiles?.length || 0;
        const timeoutMinutes = Math.round((imageCount * 120000 || 300000) / 60000);
        throw new Error(`Upload timed out after ${timeoutMinutes} minutes. Please try again with smaller images (max 5MB each) or fewer files.`);
      }

      // Extract error message from response
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((e: any) => `${e.param || e.field}: ${e.msg || e.message}`).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        throw new Error(errorData.message || 'Failed to update product');
      }
      throw error;
    }
  },

  /**
   * Delete product (admin only)
   */
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    return response.data;
  },
};
