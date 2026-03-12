'use client';

import React, { use, useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';
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

type SearchParamsLike = Record<string, string | string[] | undefined>;
function getParam(sp: SearchParamsLike | null, key: string): string | null {
  if (!sp || !(key in sp)) return null;
  const v = sp[key];
  return Array.isArray(v) ? v[0] ?? null : (v ?? null);
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua);
}

function LoginForm({ searchParams }: { searchParams: SearchParamsLike }) {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [callbackProcessing, setCallbackProcessing] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const callbackHandled = useRef(false);

  // Read tokens from URL (hash or query). Hash can appear after hydration on some hosts.
  const getTokensFromUrl = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    const href = window.location.href || '';
    const hashIndex = href.indexOf('#');
    const hashPart = hashIndex >= 0 ? href.slice(hashIndex + 1) : '';
    const hashParams = hashPart ? new URLSearchParams(hashPart) : null;
    const accessToken = hashParams?.get('accessToken') ?? getParam(searchParams, 'accessToken');
    const refreshToken = hashParams?.get('refreshToken') ?? getParam(searchParams, 'refreshToken');
    return { accessToken, refreshToken };
  };

  // Handle Google OAuth callback: tokens in hash or query -> store and redirect to dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const err = getParam(searchParams, 'error');
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

      authApi
        .getMe()
        .then((user) => {
          if (user?.role === 'ADMIN') window.location.href = ROUTES.ADMIN;
          else window.location.href = ROUTES.HOME;
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
      if (typeof window !== 'undefined') {
        if (user?.role === 'ADMIN') {
          window.location.href = ROUTES.ADMIN;
        } else {
          window.location.href = ROUTES.HOME;
        }
      } else {
        if (user?.role === 'ADMIN') router.push(ROUTES.ADMIN);
        else router.push(ROUTES.HOME);
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-xl border border-gray-200 shadow-lg" padding="md">
          <p className="text-center text-gray-600">Signing you in…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Card className="w-full rounded-xl border border-gray-200 shadow-lg" padding="md">
          <div className="flex items-center justify-center relative mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <HiArrowLeft className="h-5 w-5 text-gray-800" />
            </button>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">
              Login To Your Account
            </h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              size="md"
              label="Your Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="Enter your email address"
            />
            <Input
              size="md"
              label="Your Password"
              type="password"
              showPasswordToggle
              {...register('password')}
              error={errors.password?.message}
              placeholder="Enter your password"
            />

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#c01e2e] focus:ring-[#c01e2e]"
                />
                Remember me
              </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-[#c01e2e] hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-[#c01e2e] hover:bg-[#a01926] focus:ring-[#c01e2e] text-base py-3 rounded-lg"
              isLoading={isLoading}
            >
              Login
            </Button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3 px-4 text-base font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={googleLoading}
              onClick={() => {
                setGoogleLoading(true);
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                // Send the full frontend origin as state so backend can validate and redirect back correctly
                const state = origin ? encodeURIComponent(origin) : '';
                const url = `${getApiBaseUrl()}/auth/google${state ? `?state=${state}` : ''}`;
                // Important: keep OAuth inside the same PWA window so tokens land in the PWA storage.
                // Opening a new tab can complete login in the browser but not in the installed PWA.
                window.location.assign(url);
              }}
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
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
              <span>{googleLoading ? 'Redirecting…' : 'Login With Google'}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href={ROUTES.REGISTER} className="font-medium text-[#c01e2e] hover:underline">
              Register Here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-xl border border-gray-200 shadow-lg" padding="md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Login To Your Account</h2>
        <p className="text-center text-sm text-gray-500 py-8">Loading…</p>
      </Card>
    </div>
  );
}

export default function LoginPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParamsLike>;
}) {
  const searchParams = use(searchParamsPromise);
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

