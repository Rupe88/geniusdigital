'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/lib/utils/constants';
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
      const normalized = digits.length === 12 && digits.startsWith('977') ? digits.slice(2) : digits;
      return normalized.length === 10 && normalized.startsWith('98');
    }, 'Please enter a valid 10-digit Nepal mobile (e.g. 98XXXXXXXX)'),
  otpChannel: z.enum(['email', 'sms', 'both']).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('977')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('977')) return digits.slice(2);
  return digits.length === 10 ? digits : phone;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, verifyOtp, resendOtp } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
        <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">Verify your account</h2>
          <p className="text-xs text-gray-600 mb-4">
            Enter the 6-digit code sent to {otpSentTo}.
          </p>

          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-3">
            <Input
              size="sm"
              label="Verification code"
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
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm py-2"
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
              className="w-full text-xs font-medium text-[#c01e2e] hover:underline disabled:opacity-60"
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
      <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Create account</h2>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            size="sm"
            label="Full name"
            type="text"
            {...register('fullName')}
            error={errors.fullName?.message}
            placeholder="Full name"
          />
          <Input
            size="sm"
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="Email"
          />

          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--foreground)]">
              Phone number <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-none border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--primary-500)]">
              <span className="flex items-center border-r border-[var(--border)] bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">+977</span>
              <input
                type="tel"
                className="block w-full rounded-none border-0 bg-[var(--input)] py-1.5 px-3 text-sm text-[var(--foreground)] focus:outline-none"
                placeholder="98XXXXXXXX"
                {...register('phone')}
              />
            </div>
            {errors.phone?.message && <p className="mt-0.5 text-xs text-[var(--error)]">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
              Send OTP verification code to
            </label>
            <select
              {...register('otpChannel')}
              className="block w-full rounded-none border border-[var(--border)] bg-[var(--input)] py-2 px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            >
              <option value="email">Email only</option>
              {smsAvailable && (
                <>
                  <option value="sms">Mobile number (SMS) only</option>
                  <option value="both">Both email and mobile number (SMS)</option>
                </>
              )}
            </select>
            {smsAvailable && (
              <p className="mt-1 text-xs text-gray-500">
                You can receive the code on your mobile number via SMS.
              </p>
            )}
          </div>

          <Input
            size="sm"
            label="Password"
            type="password"
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
            placeholder="At least 8 characters, with uppercase, lowercase & number"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm py-2"
            isLoading={isLoading}
          >
            Sign up
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="font-medium text-[#c01e2e] hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

