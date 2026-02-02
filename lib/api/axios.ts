
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '@/lib/types/api';
import { shouldRefreshToken, isTokenExpired } from '@/lib/utils/tokenUtils';

// Production backend URL (DigitalOcean)
const PRODUCTION_API_URL = 'https://goldfish-app-d9t4j.ondigitalocean.app/api';

// Use environment variable for API URL, with smart fallbacks for production domains
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'sanskarvastu.com' || host === 'www.sanskarvastu.com' || host.endsWith('.vercel.app')) {
      return PRODUCTION_API_URL;
    }
  }
  return 'http://localhost:4000/api';
};

const API_URL = getApiUrl();

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};


const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Create axios instance with different timeouts for different operations
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep enabled for authenticated requests
  timeout: 60000, // 60 seconds default timeout (increased for file uploads)
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // Skip token for auth endpoints (they don't need tokens)
      const isAuthEndpoint = config.url?.includes('/auth/register') ||
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/verify-otp') ||
        config.url?.includes('/auth/resend-otp') ||
        config.url?.includes('/auth/forgot-password') ||
        config.url?.includes('/auth/reset-password') ||
        config.url?.includes('/auth/refresh-token');

      const token = localStorage.getItem('accessToken');

      // Only add token if it exists and we're not on auth endpoints
      if (!isAuthEndpoint && token) {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If we're already on an auth page, don't try to refresh
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage =
        pathname.includes('/login') ||
        pathname.includes('/register') ||
        pathname.includes('/verify-otp') ||
        pathname.includes('/forgot-password') ||
        pathname.includes('/reset-password');

      // If it's a 401 on the refresh-token endpoint itself, or on an auth page, logout
      if (originalRequest.url?.includes('/auth/refresh-token') || isAuthPage) {
        console.warn('401 on auth page or refresh endpoint - logging out');
        handleLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log('Refresh already in progress, queuing request');
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (refreshToken) {
        try {
          console.log(`Attempting to refresh token at: ${API_URL}/auth/refresh-token`);

          // Using axios directly to avoid interceptor issues, with explicit config.
          // Timeout so create/product etc. do not hang forever if refresh hangs.
          const response = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true, timeout: 15000 }
          );

          if (response.data && response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            console.log('Token refresh successful, updating storage');

            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
            }

            // Update default headers for subsequent requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            const token = accessToken;
            onTokenRefreshed(token);
            isRefreshing = false;

            // Update current request header
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            console.log('Retrying original request');
            return apiClient(originalRequest);
          } else {
            throw new Error('Refresh response indicated failure');
          }
        } catch (refreshError) {
          console.error('Token refresh critical failure:', refreshError);
          isRefreshing = false;
          handleLogout();
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('No refresh token found in storage');
        handleLogout();
      }
    }

    // Default handle for other errors or if refresh logic skipped
    if (error.response?.status === 401) {
      handleLogout();
    }

    // Handle 429 Too Many Requests - Rate limiting
    if (error.response?.status === 429) {
      const errorMessage = error.response?.data?.message || 'Too many requests. Please try again later.';
      return Promise.reject(new Error(errorMessage));
    }

    // Handle other errors
    const apiError: ApiError = {
      success: false,
      message: error.response?.data?.message || (Object(error).message || 'An error occurred'),
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

// Helper function to handle logout and redirection
const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Only redirect if not already on a login page (prevent loop)
    const pathname = window.location.pathname;
    const isAuthPage =
      pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/verify-otp') ||
      pathname.includes('/forgot-password') ||
      pathname.includes('/reset-password');

    if (!isAuthPage) {
      const isAdminRoute = pathname.startsWith('/admin');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    }
  }
};


// Helper function to handle API responses
export const handleApiResponse = <T>(response: { data: unknown }): T => {
  const payload = response.data as ApiResponse<T>;
  if (payload.success && payload.data) {
    return payload.data;
  }
  throw new Error(payload.message || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Network error (backend not running, CORS, etc.)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message === 'Failed to fetch') {
      return 'Unable to connect to the server. Please check if the backend is running and the API URL is correct.';
    }
    
    // Request was made but no response received
    if (!error.response) {
      return 'No response from server. Please check your connection and try again.';
    }

    const apiError = error.response?.data as ApiError & { 
      errors?: Array<{ msg?: string; param?: string; field?: string; message?: string }> 
    };
    
    // Handle validation errors (400 Bad Request with errors array)
    // express-validator uses { msg, param }, but we also support { field, message }
    if (error.response.status === 400) {
      // Check for validation errors array (express-validator format)
      if (apiError?.errors && Array.isArray(apiError.errors) && apiError.errors.length > 0) {
        const errorMessages = apiError.errors.map((err) => {
          const field = err.param || err.field || 'field';
          const message = err.msg || err.message || 'Invalid value';
          return `${field}: ${message}`;
        }).join('\n');
        return `Validation failed:\n${errorMessages}`;
      }
      // If no errors array but there's a message, return it
      if (apiError?.message) {
        return apiError.message;
      }
      // Fallback for 400 errors
      return 'Invalid request. Please check your input and try again.';
    }
    
    if (apiError?.message) {
      return apiError.message;
    }
    
    // Handle specific HTTP status codes
    if (error.response.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.message) {
      return error.message;
    }
    return `Request failed with status ${error.response?.status || 'unknown'}`;
  }
  if (error instanceof Error) {
    // Handle generic "Failed to fetch" errors
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check if the backend is running and the API URL is correct.';
    }
    return error.message;
  }
  // Interceptor may reject with plain API error object { success, message, errors }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
};

