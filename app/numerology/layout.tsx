'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ROUTES } from '@/lib/utils/constants';

const tabs = [
  { label: 'Basic', href: '/numerology/basic' },
  { label: 'Advance', href: '/numerology/advance' },
];

export default function NumerologyLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent('/numerology/basic')}`);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary-500)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--muted)] py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sanskar Numerology</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Basic calculations and advanced tools.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-1 bg-white w-fit mb-6">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname?.startsWith(t.href + '/');
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none ${
                  active
                    ? 'bg-[var(--primary-600)] text-white shadow-md'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-[var(--border)] p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

