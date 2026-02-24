'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import * as enrollmentApi from '@/lib/api/enrollments';
import { getPaymentHistory } from '@/lib/api/payments';
import { getReferralStats } from '@/lib/api/referrals';
import type { Enrollment } from '@/lib/types/course';
import type { Payment } from '@/lib/types/payment';
import { ROUTES } from '@/lib/utils/constants';
import {
  HiBookOpen,
  HiCheckCircle,
  HiCreditCard,
  HiShare,
  HiCog,
  HiChartBar,
  HiChevronRight,
  HiRefresh,
} from 'react-icons/hi';

const DASHBOARD_SECTIONS = [
  {
    href: `${ROUTES.DASHBOARD}/my-courses`,
    label: 'My Courses',
    description: 'View and continue your enrolled courses',
    icon: HiBookOpen,
    color: 'bg-[var(--primary-100)] text-[var(--primary-700)] dark:bg-[var(--primary-900)]/40 dark:text-[var(--primary-300)]',
  },
  {
    href: `${ROUTES.DASHBOARD}/progress`,
    label: 'Progress',
    description: 'Track your learning progress by course',
    icon: HiChartBar,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    href: `${ROUTES.DASHBOARD}/referrals`,
    label: 'Referrals',
    description: 'Share courses and earn rewards',
    icon: HiShare,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    href: `${ROUTES.DASHBOARD}/payments`,
    label: 'Payments',
    description: 'View payment and transaction history',
    icon: HiCreditCard,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  {
    href: `${ROUTES.DASHBOARD}/settings`,
    label: 'Settings',
    description: 'Profile and account preferences',
    icon: HiCog,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string = 'NPR'): string {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: currency || 'NPR', maximumFractionDigits: 0 }).format(amount);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    paymentCount: 0,
    referralConversions: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [enrollmentsRes, paymentsRes, referralRes] = await Promise.allSettled([
        enrollmentApi.getUserEnrollments(),
        getPaymentHistory({ page: 1, limit: 5 }),
        getReferralStats(),
      ]);

      const enrollments = enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value?.data
        ? enrollmentsRes.value.data
        : [];
      const completed = enrollments.filter((e: Enrollment) => e.status === 'COMPLETED');
      setRecentEnrollments(enrollments.slice(0, 3));

      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value?.data ?? [] : [];
      const paymentTotal = paymentsRes.status === 'fulfilled' ? paymentsRes.value?.pagination?.total ?? payments.length : 0;
      setRecentPayments(payments.slice(0, 3));

      const referral = referralRes.status === 'fulfilled' ? referralRes.value : null;

      setStats({
        enrolledCourses: enrollments.length,
        completedCourses: completed.length,
        paymentCount: paymentTotal,
        referralConversions: referral?.totalConversions ?? 0,
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--muted)]/60 px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Welcome back, {user?.fullName ?? 'Learner'}!
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
            Continue your courses and track your progress from this simple overview.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          disabled={loading}
          className="gap-2 self-start sm:self-center"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loadError && (
        <Card padding="md" className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 text-sm">{loadError}</p>
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="mt-3 gap-2">
            <HiRefresh className="w-4 h-4" /> Try again
          </Button>
        </Card>
      )}

      {/* Stats */}
      <section aria-label="Overview statistics">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="flex flex-row items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-2.5 rounded-lg bg-[var(--primary-100)] dark:bg-[var(--primary-900)]/40">
              <HiBookOpen className="h-5 w-5 text-[var(--primary-700)] dark:text-[var(--primary-300)]" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : stats.enrolledCourses}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">Enrolled</p>
            </div>
          </Card>
          <Card padding="md" className="flex flex-row items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <HiCheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : stats.completedCourses}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">Completed</p>
            </div>
          </Card>
          <Card padding="md" className="flex flex-row items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <HiCreditCard className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : stats.paymentCount}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">Payments</p>
            </div>
          </Card>
          <Card padding="md" className="flex flex-row items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <HiShare className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-[var(--foreground)]">{loading ? '—' : stats.referralConversions}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">Referrals</p>
            </div>
          </Card>
        </div>
      </section>

      {/* All sections – quick access */}
      <section aria-label="Dashboard sections">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">All sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DASHBOARD_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card padding="md" className="h-full border border-[var(--border)] hover:border-[var(--primary-300)] hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary-700)] transition-colors">
                        {section.label}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                        {section.description}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[var(--primary-700)]">
                        View <HiChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section aria-label="Recent activity" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent courses</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-12 h-12 rounded bg-[var(--muted)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-2 w-1/3 bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-[var(--muted)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentEnrollments.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">No enrollments yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentEnrollments.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-[var(--muted)]">
                    {e.course?.thumbnail ? (
                      <StorageImage
                        src={e.course.thumbnail}
                        alt={e.course.title || 'Course thumbnail'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                        <HiBookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/courses/${e.courseId}/learn`} className="font-medium text-[var(--foreground)] hover:underline line-clamp-1">
                      {e.course?.title ?? 'Course'}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">{Math.round(e.progress ?? 0)}% complete</p>
                  </div>
                  <Link href={`/dashboard/courses/${e.courseId}/learn`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Continue <HiChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`${ROUTES.DASHBOARD}/my-courses`} className="inline-block mt-4 text-sm font-medium text-[var(--primary-700)] hover:underline">
            View all courses →
          </Link>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent payments</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-2 w-1/3 bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">No payments yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] truncate">
                      {p.course?.title ?? (p.order ? `Order #${p.order.orderNumber}` : 'Payment')}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatDate(p.createdAt)} · {p.status}</p>
                  </div>
                  <span className="font-medium text-[var(--foreground)] flex-shrink-0">{formatCurrency(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`${ROUTES.DASHBOARD}/payments`} className="inline-block mt-4 text-sm font-medium text-[var(--primary-700)] hover:underline">
            View all payments →
          </Link>
        </Card>
      </section>
    </div>
  );
}
