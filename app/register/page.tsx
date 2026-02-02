'use client';

import React, { useState } from 'react';
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

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, verifyOtp, resendOtp } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
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
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      });
      setRegisteredEmail(data.email);
      setShowOtpVerification(true);
    } catch (err: any) {
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
      // After successful verification, redirect to login so the user can sign in.
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      setError((err instanceof Error ? err.message : 'An error occurred') || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
        <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">Verify email</h2>
          <p className="text-xs text-gray-600 mb-4">Enter the 6-digit code sent to {registeredEmail}</p>

          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-3">
            <Input
              size="sm"
              label="Code"
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
                  await resendOtp(registeredEmail);
                  setResendMessage('New code sent.');
                } catch (err: any) {
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
              Phone <span className="text-gray-400">(optional)</span>
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
          <Input
            size="sm"
            label="Password"
            type="password"
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
            placeholder="Password"
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

