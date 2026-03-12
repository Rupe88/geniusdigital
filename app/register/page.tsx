'use client';

import React, { useState, useEffect } from 'react';
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
import type { OtpChannel } from '@/lib/types/auth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include uppercase, lowercase, and a number'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      let normalized = digits;
      if (digits.startsWith('977') && digits.length === 13) normalized = digits.slice(3);
      const validPrefixes = ['96', '97', '98'];
      const prefix = normalized.slice(0, 2);
      return normalized.length === 10 && validPrefixes.includes(prefix);
    }, 'Please enter a valid 10-digit Nepal mobile (96, 97 or 98XXXXXXXX)'),
  otpChannel: z.enum(['email', 'sms', 'both']).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length === 13) return digits.slice(3);
  if (digits.length === 10 && ['96', '97', '98'].includes(digits.slice(0, 2))) return digits;
  return digits.length === 10 ? digits : phone;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, verifyOtp, resendOtp } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registeredPhone, setRegisteredPhone] = useState<string>('');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email');
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  useEffect(() => {
    authApi.getOtpOptions().then((opts) => setSmsAvailable(opts.smsAvailable)).catch(() => setSmsAvailable(false));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { otpChannel: 'email' },
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<{ otp: string }>({
    resolver: zodResolver(
      z.object({
        otp: z
          .string()
          .regex(/^\d{6}$/, 'OTP must be exactly 6 digits (numbers only)'),
      })
    ),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      setIsLoading(true);
      const channel = (data.otpChannel || 'email') as OtpChannel;
      const phoneForApi = data.phone?.trim() ? normalizePhone(data.phone.trim()) : '';
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: phoneForApi,
        otpChannel: channel,
      });
      setRegisteredEmail(data.email);
      setRegisteredPhone(phoneForApi);
      setOtpChannel(channel);
      setShowOtpVerification(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'An error occurred') || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (data: { otp: string }) => {
    try {
      setError('');
      setIsLoading(true);
      await verifyOtp({
        email: registeredEmail,
        otp: data.otp,
      });
      router.push(ROUTES.LOGIN);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'An error occurred') || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const otpSentTo =
    otpChannel === 'email'
      ? 'your email'
      : otpChannel === 'sms'
        ? 'your mobile number (SMS)'
        : 'your email and mobile number (SMS)';

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md rounded-xl border border-gray-200 shadow-lg" padding="md">
          <div className="flex items-center justify-center relative mb-2">
            <button
              type="button"
              onClick={() => setShowOtpVerification(false)}
              aria-label="Go back"
              className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <HiArrowLeft className="h-5 w-5 text-gray-800" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 text-center">Verify your account</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Enter the 6-digit code sent to {otpSentTo}.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <Input
              size="md"
              label="OTP Code"
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              {...registerOtp('otp')}
              error={otpErrors.otp?.message}
              placeholder="000000"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-[#c01e2e] hover:bg-[#a01926] focus:ring-[#c01e2e] text-base py-3 rounded-lg"
              isLoading={isLoading}
            >
              Verify
            </Button>
            <button
              type="button"
              onClick={async () => {
                if (!registeredEmail) return;
                try {
                  setError('');
                  setResendMessage('');
                  setIsResending(true);
                  await resendOtp(registeredEmail, otpChannel);
                  setResendMessage('New code sent.');
                } catch (err: unknown) {
                  setError((err instanceof Error ? err.message : 'An error occurred') || 'Failed to resend.');
                } finally {
                  setIsResending(false);
                }
              }}
              className="w-full text-sm font-medium text-[#c01e2e] hover:underline disabled:opacity-60"
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
            {resendMessage && !error && <p className="text-xs text-green-600">{resendMessage}</p>}
          </form>
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
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">Sign Up Your Account</h2>
          </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            size="md"
            label="Your Full Name"
            type="text"
            {...register('fullName')}
            error={errors.fullName?.message}
            placeholder="enter your full name"
          />
          <Input
            size="md"
            label="Your Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="enter your email address"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">
              Your Contact Number
            </label>
            <div className="flex rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-[#c01e2e]/30">
              <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">+977</span>
              <input
                type="tel"
                className="block w-full rounded-lg border-0 bg-white py-2 px-3 text-base text-gray-900 focus:outline-none"
                placeholder="Enter your contact number"
                {...register('phone')}
              />
            </div>
            {errors.phone?.message && <p className="mt-1 text-sm text-[var(--error)]">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Where would you like to receive your OTP code?
            </label>
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="email"
                  defaultChecked
                  {...register('otpChannel')}
                  className="h-4 w-4 text-[#c01e2e] focus:ring-[#c01e2e]"
                />
                Email
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="sms"
                  {...register('otpChannel')}
                  className="h-4 w-4 text-[#c01e2e] focus:ring-[#c01e2e]"
                  disabled={!smsAvailable}
                />
                Phone Number
              </label>
            </div>
            {!smsAvailable ? (
              <p className="mt-2 text-xs text-gray-500">SMS OTP is currently unavailable. Please use Email.</p>
            ) : (
              <p className="mt-2 text-xs text-gray-500">You can receive the code on your mobile number via SMS.</p>
            )}
          </div>

          <Input
            size="md"
            label="Your Password"
            type="password"
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
            placeholder="********"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#c01e2e] hover:bg-[#a01926] focus:ring-[#c01e2e] text-base py-3 rounded-lg"
            isLoading={isLoading}
          >
            Sign up
          </Button>
        </form>

        <div className="flex items-center gap-4 py-4">
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

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="font-medium text-[#c01e2e] hover:underline">
            Login here
          </Link>
        </p>
        </Card>
      </div>
    </div>
  );
}

