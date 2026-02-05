'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/lib/utils/constants';
import { getApiBaseUrl } from '@/lib/api/axios';
import * as authApi from '@/lib/api/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();
  const [error, setError] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const err = new URLSearchParams(window.location.search).get('error');
    return err ? decodeURIComponent(err) : '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google OAuth callback: tokens in URL -> store and redirect
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const err = searchParams.get('error');
    if (err) {
      setError(decodeURIComponent(err));
      return;
    }
    if (!accessToken || !refreshToken) return;

    const apply = async () => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      try {
        const user = await authApi.getMe();
        await refreshUser();
        if (user?.role === 'ADMIN') {
          window.location.replace(ROUTES.ADMIN);
        } else {
          window.location.replace(ROUTES.DASHBOARD);
        }
      } catch {
        setError('Session could not be restored. Please try again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    };
    apply();
  }, [searchParams, refreshUser]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setIsLoading(true);
      const user = await login(data);
      if (user?.role === 'ADMIN') {
        router.push(ROUTES.ADMIN);
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError((err instanceof Error ? err.message : 'An error occurred') || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
      <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Log in</h2>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            size="sm"
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="Email"
          />
          <Input
            size="sm"
            label="Password"
            type="password"
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
            placeholder="Password"
          />
          <div className="flex justify-end">
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-[#c01e2e] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm py-2"
            isLoading={isLoading}
          >
            Log in
          </Button>

          <div className="relative my-3">
            <span className="block text-center text-xs text-gray-500 before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-1rem)] before:bg-gray-200 after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-1rem)] after:bg-gray-200">
              or
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm py-2"
            disabled={googleLoading}
            onClick={() => {
              setGoogleLoading(true);
              window.location.href = `${getApiBaseUrl()}/auth/google`;
            }}
          >
            {googleLoading ? (
              'Redirecting…'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </span>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Don't have an account?{' '}
          <Link href={ROUTES.REGISTER} className="font-medium text-[#c01e2e] hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
      <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Log in</h2>
        <p className="text-center text-sm text-gray-500 py-8">Loading…</p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

