'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
  const [callbackProcessing, setCallbackProcessing] = useState(false);
  const callbackHandled = useRef(false);

  // Read tokens from URL (hash or query). Hash can appear after hydration on some hosts.
  const getTokensFromUrl = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    const href = window.location.href || '';
    const hashIndex = href.indexOf('#');
    const hashPart = hashIndex >= 0 ? href.slice(hashIndex + 1) : '';
    const hashParams = hashPart ? new URLSearchParams(hashPart) : null;
    const accessToken = hashParams?.get('accessToken') ?? searchParams.get('accessToken');
    const refreshToken = hashParams?.get('refreshToken') ?? searchParams.get('refreshToken');
    return { accessToken, refreshToken };
  };

  // Handle Google OAuth callback: tokens in hash or query -> store and redirect to dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const err = searchParams.get('error');
    if (err) {
      setError(decodeURIComponent(err));
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const tryProcessCallback = () => {
      if (callbackHandled.current) return;
      const { accessToken, refreshToken } = getTokensFromUrl();
      if (!accessToken || !refreshToken) return;

      callbackHandled.current = true;
      setCallbackProcessing(true);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      window.history.replaceState({}, '', window.location.pathname);

      const goTo = (path: string) => {
        window.location.replace(path);
      };

      authApi
        .getMe()
        .then((user) => {
          if (user?.role === 'ADMIN') goTo(ROUTES.ADMIN);
          else goTo(ROUTES.DASHBOARD);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setError('Session could not be restored. Please try logging in again.');
          setCallbackProcessing(false);
          callbackHandled.current = false;
        });
    };

    tryProcessCallback();
    const t = setTimeout(tryProcessCallback, 200);
    return () => clearTimeout(t);
  }, [searchParams]);

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

  if (callbackProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
          <p className="text-center text-gray-600">Signing you in…</p>
        </Card>
      </div>
    );
  }

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

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-none border-2 border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={googleLoading}
            onClick={() => {
              setGoogleLoading(true);
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const state = origin ? encodeURIComponent(origin) : '';
              const url = `${getApiBaseUrl()}/auth/google${state ? `?state=${state}` : ''}`;
              window.location.href = url;
            }}
          >
            {googleLoading ? (
              <span className="text-gray-900">Redirecting…</span>
            ) : (
              <>
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <span className="text-gray-900">Continue with Google</span>
              </>
            )}
          </button>
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

