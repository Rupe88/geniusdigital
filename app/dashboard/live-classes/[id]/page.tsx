'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  LIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
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

export default function DashboardLiveClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = params.id as string;

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

  if (error || !liveClass) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card padding="lg" className="text-center">
          <p className="text-[var(--foreground)] mb-4">{error || 'Live class not found.'}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push(`${ROUTES.DASHBOARD}/live-classes`)}>
              Back to live classes
            </Button>
            <Button variant="primary" onClick={fetchClass}>
              <HiRefresh className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const joinUrl = liveClass.zoomJoinUrl || liveClass.meetingUrl;
  const statusStyle = STATUS_STYLES[liveClass.status] ?? 'bg-gray-100 text-gray-700';
  const canJoin = (liveClass.status === 'SCHEDULED' || liveClass.status === 'LIVE') && joinUrl;
  const showEnrollButton =
    isAuthenticated &&
    !enrolled &&
    liveClass.status !== 'CANCELLED' &&
    liveClass.status !== 'COMPLETED';

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`${ROUTES.DASHBOARD}/live-classes`}
        className="inline-flex items-center text-sm text-[var(--primary-700)] hover:underline mb-6"
      >
        <HiArrowLeft className="w-4 h-4 mr-2" />
        Back to live classes
      </Link>

      <Card padding="lg" className="border border-[var(--border)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
              {liveClass.title}
            </h1>
            <span className={`inline-flex px-3 py-1 rounded-md text-sm font-medium ${statusStyle}`}>
              {liveClass.status}
            </span>
          </div>
          {enrolled && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm font-medium">
              <HiCheckCircle className="w-4 h-4" />
              You&apos;re enrolled
            </span>
          )}
        </div>

        {liveClass.description && (
          <div className="prose prose-sm max-w-none text-[var(--foreground)] mb-6">
            <p className="whitespace-pre-wrap">{liveClass.description}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {liveClass.instructor?.name && (
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <HiUser className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span><strong>Instructor:</strong> {liveClass.instructor.name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-[var(--foreground)]">
            <HiCalendar className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span>{formatDate(liveClass.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-3 text-[var(--foreground)]">
            <HiClock className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span>{formatTime(liveClass.scheduledAt)} · {liveClass.duration} minutes</span>
          </div>
          {liveClass.course?.title && (
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <HiBookOpen className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span>
                <strong>Course:</strong>{' '}
                <Link
                  href={`/courses/${liveClass.course.id}`}
                  className="text-[var(--primary-700)] hover:underline"
                >
                  {liveClass.course.title}
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Meeting link – display admin-provided link so users can join directly */}
        {joinUrl && (liveClass.status === 'SCHEDULED' || liveClass.status === 'LIVE') && (
          <Card padding="md" className="mb-6 bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/20 border-[var(--primary-200)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
              <HiVideoCamera className="w-4 h-4 text-[var(--primary-600)]" />
              Meeting link
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Use the link below to join the live meeting. You can open it in your browser or copy and share it.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--primary-700)] hover:underline font-medium break-all text-left"
              >
                <HiVideoCamera className="w-5 h-5 flex-shrink-0" />
                {joinUrl}
              </a>
              <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button variant="primary" size="lg" className="gap-2">
                  <HiVideoCamera className="w-5 h-5" />
                  Join meeting now
                </Button>
              </a>
            </div>
            {(liveClass.meetingId || liveClass.meetingPassword) && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {liveClass.meetingId && (
                  <p className="text-[var(--muted-foreground)]">
                    <strong className="text-[var(--foreground)]">Meeting ID:</strong> {liveClass.meetingId}
                  </p>
                )}
                {liveClass.meetingPassword && (
                  <p className="text-[var(--muted-foreground)]">
                    <strong className="text-[var(--foreground)]">Password:</strong> {liveClass.meetingPassword}
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
          {showEnrollButton && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleEnroll}
              isLoading={enrolling || enrollmentsLoading}
              disabled={enrollmentsLoading}
              className="gap-2"
            >
              <HiCheckCircle className="w-5 h-5" />
              Enroll in this class
            </Button>
          )}
          {!isAuthenticated && liveClass.status !== 'CANCELLED' && liveClass.status !== 'COMPLETED' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/dashboard/live-classes/${id}`)}`)}
              className="gap-2"
            >
              Log in to enroll
            </Button>
          )}
          {canJoin && (
            <a href={joinUrl!} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button variant="primary" size="lg" className="gap-2">
                <HiVideoCamera className="w-5 h-5" />
                Join meeting
              </Button>
            </a>
          )}
          {liveClass.status === 'COMPLETED' && liveClass.recordingUrl && (
            <a
              href={liveClass.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="lg" className="gap-2">
                <HiPlay className="w-5 h-5" />
                Watch recording
              </Button>
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
