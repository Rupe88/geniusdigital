import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod: 'MANUAL_QR' | 'ESEWA' | 'MOBILE_BANKING' | 'VISA_CARD' | 'MASTERCARD' | 'OTHER';
  paymentId?: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  } | string; // Can be JSON string from backend
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  } | string; // Can be JSON string from backend
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  couponId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  _count?: {
    items: number;
  };
}

export interface CreateOrderRequest {
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  couponCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: Order['status'];
  trackingNumber?: string;
}

/**
 * Get user's orders
 */
export const getUserOrders = async (params?: {
  status?: Order['status'];
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Order>> => {
  try {
    const response = await apiClient.get<ApiResponse<Order[]>>(API_ENDPOINTS.ORDERS.LIST, {
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
    throw new Error(responseData.message || 'Failed to fetch orders');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (params?: {
  status?: Order['status'];
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Order>> => {
  try {
    const response = await apiClient.get<ApiResponse<Order[]>>(API_ENDPOINTS.ORDERS.LIST, {
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
    throw new Error(responseData.message || 'Failed to fetch orders');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<Order> => {
  try {
    const response = await apiClient.get<ApiResponse<Order>>(API_ENDPOINTS.ORDERS.BY_ID(id));
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Order not found');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Create new order
 */
export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  try {
    const response = await apiClient.post<ApiResponse<Order>>(API_ENDPOINTS.ORDERS.LIST, data);
    return handleApiResponse<Order>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = async (id: string, data: UpdateOrderStatusRequest): Promise<Order> => {
  try {
    const response = await apiClient.put<ApiResponse<Order>>(`${API_ENDPOINTS.ORDERS.BY_ID(id)}/status`, data);
    return handleApiResponse<Order>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (id: string): Promise<Order> => {
  try {
    const response = await apiClient.post<ApiResponse<Order>>(`${API_ENDPOINTS.ORDERS.BY_ID(id)}/cancel`);
    return handleApiResponse<Order>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const ordersApi = {
  getUserOrders,
  getAllOrders,
  getById: getOrderById,
  create: createOrder,
  updateOrderStatus,
  cancelOrder,
};
