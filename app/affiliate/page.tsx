'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/utils/constants';
import { HiCash, HiLink, HiUserGroup, HiArrowRight } from 'react-icons/hi';

export default function AffiliatePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Affiliate Program
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Share our courses and earn <strong className="text-[var(--primary-700)]">10%</strong> on every sale.
          </p>
        </div>

        <Card padding="lg" className="mb-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
                <HiCash className="w-6 h-6 text-[var(--primary-700)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">10% per course</h2>
                <p className="text-gray-600 mt-1">
                  When someone enrolls in a paid course using your referral link, you earn 10% of the course price. No cap—earn more as you refer more.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
                <HiLink className="w-6 h-6 text-[var(--primary-700)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your referral link</h2>
                <p className="text-gray-600 mt-1">
                  After signing in, get a unique link for each course. Share it on social media, with friends, or on your blog. When they sign up and enroll, you get the commission.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
                <HiUserGroup className="w-6 h-6 text-[var(--primary-700)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Track and get paid</h2>
                <p className="text-gray-600 mt-1">
                  In your dashboard you can see clicks, conversions, and pending earnings. Payouts are processed by our team.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          {authLoading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isAuthenticated ? (
            <Link href="/dashboard/referrals">
              <Button variant="primary" className="inline-flex items-center gap-2">
                Go to My Referrals
                <HiArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={ROUTES.LOGIN}>
                <Button variant="primary" className="w-full sm:w-auto">
                  Log in
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="outline" className="w-full sm:w-auto border-[var(--primary-700)] text-[var(--primary-700)] hover:bg-[var(--primary-50)]">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
          {!authLoading && isAuthenticated && (
            <p className="mt-3 text-sm text-gray-500">
              Create referral links for courses and track your earnings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
