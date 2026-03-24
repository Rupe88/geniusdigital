'use client';

import React, { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StorageImage } from '@/components/ui/StorageImage';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass } from '@/lib/api/liveClasses';
import { useAuth } from '@/lib/context/AuthContext';
import { ROUTES } from '@/lib/utils/constants';
import {
  HiCalendar,
  HiClock,
  HiUser,
  HiVideoCamera,
  HiArrowLeft,
  HiCheckCircle,
  HiPlay,
  HiBookOpen,
  HiRefresh,
} from 'react-icons/hi';
import { showSuccess, showError } from '@/lib/utils/toast';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:
    'bg-blue-50 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
  LIVE:
    'bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
  COMPLETED:
    'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900/70 dark:text-gray-200 dark:border-gray-600',
  CANCELLED:
    'bg-red-50 text-red-900 border border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-700',
};

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export default function DashboardLiveClassDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`${ROUTES.DASHBOARD}/live-classes`);
  }, [router]);

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const fetchClass = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await liveClassApi.getLiveClassById(id);
      setLiveClass(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load live class');
      setLiveClass(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchMyEnrollment = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    setEnrollmentsLoading(true);
    try {
      const res = await liveClassApi.getMyLiveClassEnrollments({ limit: 100 });
      const found = (res.data ?? []).some((e) => e.liveClassId === id);
      setEnrolled(found);
    } catch {
      setEnrolled(false);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  useEffect(() => {
    fetchMyEnrollment();
  }, [fetchMyEnrollment]);

  const handleEnroll = async () => {
    if (!id || !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/dashboard/live-classes/${id}`)}`);
      return;
    }
    setEnrolling(true);
    try {
      await liveClassApi.enrollInLiveClass(id);
      showSuccess('You are enrolled in this live class.');
      setEnrolled(true);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--muted-foreground)]">Loading live class...</p>
      </div>
    );
  }

  return null;
}
