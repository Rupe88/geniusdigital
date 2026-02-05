'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { forgotPassword, resetPassword } from '@/lib/api/auth';
import { ROUTES } from '@/lib/utils/constants';
import { showSuccess, showError } from '@/lib/utils/toast';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z
  .object({
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d+$/, 'OTP must contain only numbers'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSendOtp = async (data: EmailFormData) => {
    setError('');
    setSendLoading(true);
    try {
      await forgotPassword({ email: data.email });
      setEmail(data.email);
      setStep('reset');
      showSuccess('If this email is registered, we’ve sent a 6-digit OTP. Check your inbox.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send OTP. Please try again.';
      setError(message);
      showError(message);
    } finally {
      setSendLoading(false);
    }
  };

  const onResetPassword = async (data: ResetFormData) => {
    setError('');
    setResetLoading(true);
    try {
      await resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      showSuccess('Password reset successfully. You can now log in.');
      router.push(ROUTES.LOGIN);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to reset password. Please check the OTP and try again.';
      setError(message);
      showError(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-start justify-center px-4 pt-16 pb-10">
      <Card className="w-full max-w-sm rounded-none border border-gray-200 shadow-md" padding="md">
        <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">
          {step === 'email' ? 'Forgot password' : 'Reset password'}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-4">
          {step === 'email'
            ? 'Enter your email and we’ll send you a one-time code.'
            : `We sent a 6-digit code to ${email}. Enter it below with your new password.`}
        </p>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail(onSendOtp)} className="space-y-3">
            <Input
              size="sm"
              label="Email"
              type="email"
              {...registerEmail('email')}
              error={emailErrors.email?.message}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm py-2"
              isLoading={sendLoading}
            >
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-3">
            <div>
              <label className="block font-medium text-[var(--foreground)] mb-0.5 text-xs">Email</label>
              <p className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200">{email}</p>
            </div>
            <Input
              size="sm"
              label="OTP (6 digits)"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              {...registerReset('otp')}
              error={resetErrors.otp?.message}
              autoComplete="one-time-code"
            />
            <Input
              size="sm"
              label="New password"
              type="password"
              showPasswordToggle
              {...registerReset('newPassword')}
              error={resetErrors.newPassword?.message}
              placeholder="At least 8 characters, with uppercase, lowercase & number"
            />
            <Input
              size="sm"
              label="Confirm new password"
              type="password"
              showPasswordToggle
              {...registerReset('confirmPassword')}
              error={resetErrors.confirmPassword?.message}
              placeholder="Repeat new password"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm py-2"
              isLoading={resetLoading}
            >
              Reset password
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-gray-600 hover:text-[#c01e2e] hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-gray-600">
          Remember your password?{' '}
          <Link href={ROUTES.LOGIN} className="font-medium text-[#c01e2e] hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
