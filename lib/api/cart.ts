import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';

export interface CartItem {
  id: string;
  courseId?: string;
  productId?: string;
  quantity: number;
  price: number;
  product?: { name?: string };
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
}

export const getCart = async (): Promise<Cart> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(API_ENDPOINTS.CART.GET);
    const payload = response.data;
    if (!payload || !(payload as { success?: boolean }).success) {
      throw new Error((payload as { message?: string })?.message || 'Failed to fetch cart');
    }
    const data = (payload as { data: Record<string, unknown> }).data;
    if (!data) return { items: [], total: 0, subtotal: 0, discount: 0 };
    const rawItems = (data.items as Array<{ id: string; productId: string; quantity: number; product?: { price?: string | number; name?: string } }>) || [];
    const items: CartItem[] = rawItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.product?.price ?? 0),
      product: item.product?.name ? { name: item.product.name } : undefined,
    }));
    const subtotal = Number(data.subtotal ?? 0);
    return {
      items,
      total: subtotal,
      subtotal,
      discount: 0,
      couponCode: (data.couponCode as string) || undefined,
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const addToCart = async (_courseId: string, productId?: string): Promise<void> => {
  const pid = productId || _courseId;
  if (!pid) throw new Error('Product ID is required');
  try {
    const response = await apiClient.post(API_ENDPOINTS.CART.ADD, { productId: pid, quantity: 1 });
    const payload = response.data as { success?: boolean; message?: string };
    if (payload && !payload.success && payload.message) {
      throw new Error(payload.message);
    }
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const removeFromCart = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.CART.REMOVE(id));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const applyCoupon = async (code: string): Promise<Cart> => {
  try {
    const response = await apiClient.post<{ data: Cart }>(API_ENDPOINTS.CART.APPLY_COUPON, { code });
    return handleApiResponse(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

