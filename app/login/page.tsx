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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Login form submitted with data:', { email: data.email, password: '***' });
    try {
      setError('');
      setIsLoading(true);
      console.log('Calling login function...');
      await login(data);
      console.log('Login successful, redirecting to dashboard...');
      router.push(ROUTES.DASHBOARD);
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

