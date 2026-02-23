import { apiClient, handleApiResponse, handleApiError } from './axios';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  venue?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  price: number;
  isFree: boolean;
  maxAttendees?: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  isRegistered?: boolean;
  _count?: {
    registrations: number;
  };
}

export interface CreateEventRequest {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  imageFile?: File;
  venue?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  price?: number;
  isFree?: boolean;
  maxAttendees?: number;
  featured?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  imageFile?: File;
  venue?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
  isFree?: boolean;
  maxAttendees?: number;
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  featured?: boolean;
}

/**
 * Get all events
 */
export const getAllEvents = async (params?: {
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  featured?: boolean;
  upcoming?: boolean;
  past?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Event>> => {
  try {
    const response = await apiClient.get<ApiResponse<Event[]>>(API_ENDPOINTS.EVENTS.LIST, {
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
    throw new Error(responseData.message || 'Failed to fetch events');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get featured events
 */
export const getFeaturedEvents = async (): Promise<Event[]> => {
  try {
    const response = await getAllEvents({ featured: true, limit: 100 });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get upcoming events
 */
export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const response = await getAllEvents({ upcoming: true, limit: 100 });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get event by ID or slug
 */
export const getEventById = async (id: string): Promise<Event> => {
  try {
    const response = await apiClient.get<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.BY_ID(id));
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Event not found');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

function buildEventFormData(data: CreateEventRequest | (UpdateEventRequest & { startDate?: string }), isUpdate = false): FormData {
  const formData = new FormData();
  if (data.title) formData.append('title', data.title.trim());
  if (data.slug) formData.append('slug', data.slug.trim());
  if (data.startDate) formData.append('startDate', data.startDate);
  if (data.endDate) formData.append('endDate', data.endDate);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.shortDescription !== undefined) formData.append('shortDescription', data.shortDescription);
  if (data.venue !== undefined) formData.append('venue', data.venue);
  if (data.location !== undefined) formData.append('location', data.location);
  if (data.price !== undefined) formData.append('price', String(data.price));
  if (data.isFree !== undefined) formData.append('isFree', String(data.isFree));
  if (data.maxAttendees !== undefined) formData.append('maxAttendees', String(data.maxAttendees));
  if (data.featured !== undefined) formData.append('featured', String(data.featured));
  if ('imageFile' in data && data.imageFile) formData.append('image', data.imageFile);
  formData.append('folder', 'lms/events');
  if (isUpdate && 'status' in data && data.status) formData.append('status', data.status);
  return formData;
}

/**
 * Create new event (admin only)
 */
export const createEvent = async (data: CreateEventRequest): Promise<Event> => {
  try {
    const hasFile = !!data.imageFile;
    if (hasFile) {
      const formData = buildEventFormData(data, false);
      const response = await apiClient.post<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.LIST, formData, { timeout: 60000 });
      const responseData = response.data;
      if (responseData.success && responseData.data) return responseData.data;
      throw new Error(responseData.message || 'Failed to create event');
    }
    const response = await apiClient.post<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.LIST, data);
    const responseData = response.data;
    if (responseData.success && responseData.data) return responseData.data;
    throw new Error(responseData.message || 'Failed to create event');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Update event (admin only)
 */
export const updateEvent = async (id: string, data: UpdateEventRequest): Promise<Event> => {
  try {
    const hasFile = !!data.imageFile;
    if (hasFile) {
      const formData = buildEventFormData({ ...data, startDate: data.startDate }, true);
      const response = await apiClient.put<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.BY_ID(id), formData, { timeout: 60000 });
      const responseData = response.data;
      if (responseData.success && responseData.data) return responseData.data;
      throw new Error(responseData.message || 'Failed to update event');
    }
    const response = await apiClient.put<ApiResponse<Event>>(API_ENDPOINTS.EVENTS.BY_ID(id), data);
    const responseData = response.data;
    if (responseData.success && responseData.data) return responseData.data;
    throw new Error(responseData.message || 'Failed to update event');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Delete event (admin only)
 */
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.EVENTS.BY_ID(id));
    handleApiResponse<void>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Register for event (guests: send name, email, phone; optional referralSource, message)
 */
export const registerForEvent = async (
  id: string,
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    referralSource?: string;
    message?: string;
  }
): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>(`${API_ENDPOINTS.EVENTS.BY_ID(id)}/register`, data || {});
    const responseData = response.data;
    if (responseData.success) {
      return;
    }
    throw new Error(responseData.message || 'Failed to register for event');
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const responseData = error.response.data;
      
      // Handle validation errors from backend
      if (responseData.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors
          .map((e: any) => e.msg || e.message || JSON.stringify(e))
          .filter(Boolean)
          .join(', ');
        throw new Error(errorMessages || responseData.message || 'Validation failed');
      }
      
      // Handle other error messages
      if (responseData.message) {
        throw new Error(responseData.message);
      }
    }
    
    // Handle network errors or other issues
    if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error(handleApiError(error));
  }
};

/**
 * Unregister from event
 */
export const unregisterFromEvent = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<void>>(`${API_ENDPOINTS.EVENTS.BY_ID(id)}/unregister`);
    handleApiResponse<void>(response);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  referralSource?: string | null;
  message?: string | null;
  attended: boolean;
  createdAt: string;
  user?: { id: string; fullName?: string; email: string; profileImage?: string };
  event?: { id: string; title: string; slug: string; startDate: string };
}

/**
 * Get all event registrations across events (admin only)
 */
export const getAllEventRegistrations = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    q?: string;
    eventId?: string;
    referralSource?: string;
  }
): Promise<PaginatedResponse<EventRegistration>> => {
  try {
    const response = await apiClient.get<ApiResponse<EventRegistration[]>>(
      API_ENDPOINTS.EVENTS.ADMIN_REGISTRATIONS,
      { params }
    );
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
    throw new Error(responseData.message || 'Failed to fetch registrations');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get event registrations (admin only)
 */
export const getEventRegistrations = async (
  eventId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<EventRegistration>> => {
  try {
    const response = await apiClient.get<ApiResponse<EventRegistration[]>>(
      `${API_ENDPOINTS.EVENTS.BY_ID(eventId)}/registrations`,
      { params }
    );
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
    throw new Error(responseData.message || 'Failed to fetch registrations');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Mark event attendance (admin only)
 */
export const markEventAttendance = async (eventId: string, registrationId: string): Promise<EventRegistration> => {
  try {
    const response = await apiClient.post<ApiResponse<EventRegistration>>(
      `${API_ENDPOINTS.EVENTS.BY_ID(eventId)}/attendance/${registrationId}`
    );
    const responseData = response.data;
    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    throw new Error(responseData.message || 'Failed to mark attendance');
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// For backward compatibility
export const eventsApi = {
  getAllEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getById: getEventById,
  create: createEvent,
  update: updateEvent,
  delete: deleteEvent,
  register: registerForEvent,
  unregister: unregisterFromEvent,
  getEventRegistrations,
  getAllEventRegistrations,
  markEventAttendance,
};
