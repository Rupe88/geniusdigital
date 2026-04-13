
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '@/lib/types/api';
import { isAuthRoutePath } from '@/lib/utils/authRoute';
import { storageClearTokens, storageGet, storageSetTokens } from '@/lib/utils/safeStorage';

// Production API base — used when the browser is not on localhost/LAN (NEXT_PUBLIC_API_URL unset)
const PRODUCTION_API_URL = 'https://api.geniusshiksha.com/api';
const DEFAULT_DEV_API = 'http://localhost:4000/api';

// Use env first; then auto-detect local/LAN hosts to use local backend.
const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isPrivateIpv4 =
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    if (isLocalhost || isPrivateIpv4) {
      return `${protocol}//${hostname}:4000/api`;
    }

    return PRODUCTION_API_URL;
  }
  return DEFAULT_DEV_API;
};

/** Base URL for API (e.g. for OAuth redirects). Always call at use time — not frozen at module load. */
export const getApiBaseUrl = (): string => getApiUrl();

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

// Create axios instance — baseURL set per request so client always matches runtime host / env.
export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep enabled for authenticated requests
  timeout: 90000, // 90 seconds timeout for operations involving external services (Zoom, etc.)
});

// Request interceptor - Add auth token and handle FormData
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiUrl();

    // If FormData is being sent, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    if (typeof window !== 'undefined') {
      // Skip token for auth endpoints (they don't need tokens)
      const isAuthEndpoint = config.url?.includes('/auth/register') ||
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/verify-otp') ||
        config.url?.includes('/auth/resend-otp') ||
        config.url?.includes('/auth/forgot-password') ||
        config.url?.includes('/auth/reset-password') ||
        config.url?.includes('/auth/refresh-token');

      const token = storageGet('accessToken');

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
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage = isAuthRoutePath(pathname);

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

      const refreshToken = typeof window !== 'undefined' ? storageGet('refreshToken') : null;

      if (refreshToken) {
        try {
          const refreshUrl = `${getApiUrl()}/auth/refresh-token`;
          console.log(`Attempting to refresh token at: ${refreshUrl}`);

          // Using axios directly to avoid interceptor issues, with explicit config.
          // Timeout so create/product etc. do not hang forever if refresh hangs.
          const response = await axios.post(
            refreshUrl,
            { refreshToken },
            { withCredentials: true, timeout: 15000 }
          );

          if (response.data && response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            console.log('Token refresh successful, updating storage');

            if (typeof window !== 'undefined') {
              storageSetTokens(accessToken, newRefreshToken);
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
        return Promise.reject(error);
      }
    }

    // Retry after refresh failed above, or other 401 paths (e.g. _retry already true)
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

// Routes that require auth – only redirect to login when we're on one of these (reload on home stays on home)
const isProtectedRoute = (pathname: string) =>
  pathname.startsWith('/dashboard') ||
  (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) ||
  pathname.includes('/learn') ||
  pathname.startsWith('/payment');

// Helper: clear tokens and optionally redirect. Redirect only on protected routes so reload on home stays on home.
const handleLogout = () => {
  if (typeof window !== 'undefined') {
    storageClearTokens();

    const pathname = window.location.pathname;
    const isAuthPage = isAuthRoutePath(pathname);

    if (!isAuthPage && isProtectedRoute(pathname)) {
      window.location.href = '/login';
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
    // Timeout error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again. If the issue persists, the operation may be processing in the background.';
    }

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

    if (error.response.status === 503) {
      return (
        apiError?.message ||
        'File storage or the server is temporarily unavailable. Try again shortly, or continue without uploads and add media from the edit page.'
      );
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

