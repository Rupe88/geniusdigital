'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { User, LoginRequest, RegisterRequest, VerifyOtpRequest } from '@/lib/types/auth';
import * as authApi from '@/lib/api/auth';
import { shouldRefreshToken, getTimeUntilExpiry } from '@/lib/utils/tokenUtils';
import { storageClearTokens, storageGet, storageSetTokens } from '@/lib/utils/safeStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<User | null>;
  register: (data: RegisterRequest) => Promise<void>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<void>;
  resendOtp: (email: string, otpChannel?: 'email' | 'sms' | 'both') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUser = useCallback(async (isRetry = false) => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      const is401 =
        axios.isAxiosError(err) && err.response?.status === 401;
      if (is401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          storageClearTokens();
        }
      } else if (!isRetry && typeof window !== 'undefined') {
        // Network/timeout/5xx: keep tokens and retry once (helps PWA after refresh)
        const token = storageGet('accessToken');
        if (token) {
          await new Promise((r) => setTimeout(r, 1500));
          await refreshUser(true);
          return;
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Skip token refresh if we're on auth pages (login, register, verify-otp, etc.)
    const pathname = window.location.pathname;
    const isAuthPage =
      pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/verify-otp') ||
      pathname.includes('/forgot-password') ||
      pathname.includes('/reset-password');

    if (isAuthPage) {
      return; // Don't refresh tokens on auth pages
    }

    const accessToken = storageGet('accessToken');
    const refreshTokenValue = storageGet('refreshToken');

    if (!accessToken || !refreshTokenValue) {
      return;
    }

    // Check if token needs refresh (expires within 2 minutes)
    if (shouldRefreshToken(accessToken)) {
      try {
        const response = await authApi.refreshToken({ refreshToken: refreshTokenValue });
        storageSetTokens(response.accessToken, response.refreshToken);
        console.log('Token refreshed successfully');
      } catch (error) {
        // Refresh failed - clear tokens and logout
        console.error('Token refresh failed:', error);
        storageClearTokens();
        setUser(null);
        // Only redirect if on a protected route (so reload on home stays on home)
        const isProtected =
          pathname.startsWith('/dashboard') ||
          (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) ||
          pathname.includes('/learn') ||
          pathname.startsWith('/payment');
        if (isProtected) {
          window.location.href = '/login';
        }
      }
    }
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only set up refresh if we have a logged-in user
    if (user) {
      // Set up interval to check token every minute
      refreshIntervalRef.current = setInterval(() => {
        refreshAccessToken();
      }, 1 * 60 * 1000); // Check every minute
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]); // Removed refreshAccessToken from deps to prevent re-renders

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // Check if we're on an auth page - skip initialization on auth pages
      const pathname = window.location.pathname;
      const isAuthPage =
        pathname.includes('/login') ||
        pathname.includes('/register') ||
        pathname.includes('/verify-otp') ||
        pathname.includes('/forgot-password') ||
        pathname.includes('/reset-password');

      // On auth pages, just set loading to false without checking tokens
      if (isAuthPage) {
        setLoading(false);
        return;
      }

      const token = storageGet('accessToken');
      if (token) {
        try {
          await refreshUser();
        } catch {
          // Token is invalid, clear it silently (don't redirect if on auth page)
          storageClearTokens();
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest): Promise<User | null> => {
    const response = await authApi.login(credentials);
    if (typeof window !== 'undefined') {
      storageSetTokens(response.accessToken, response.refreshToken);
    }
    setUser(response.user);
    return response.user ?? null;
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
  };

  const verifyOtp = async (data: VerifyOtpRequest) => {
    const response = await authApi.verifyOtp(data);
    if (typeof window !== 'undefined') {
      storageSetTokens(response.accessToken, response.refreshToken);
    }
    setUser(response.user);
  };

  const resendOtp = async (email: string, otpChannel?: 'email' | 'sms' | 'both') => {
    await authApi.resendOtp(email, otpChannel);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (typeof window !== 'undefined') {
        storageClearTokens();
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

