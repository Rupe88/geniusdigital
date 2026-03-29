'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as enrollmentApi from '@/lib/api/enrollments';
import * as progressApi from '@/lib/api/progress';
import type { Enrollment } from '@/lib/types/course';
import type { CourseProgressResponse } from '@/lib/api/progress';
import { ROUTES } from '@/lib/utils/constants';
import {
  HiChartBar,
  HiPlay,
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiRefresh,
  HiBookOpen,
} from 'react-icons/hi';
import { LessonTypeIcon } from '@/components/learn/LessonTypeIcon';

type FilterStatus = 'ALL' | 'ACTIVE' | 'COMPLETED';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'In progress',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-600 text-white border-0',
  ACTIVE: 'bg-blue-600 text-white border-0',
  PENDING: 'bg-amber-600 text-white border-0',
  CANCELLED: 'bg-gray-500 text-white border-0',
};

function ProgressSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} padding="none" className="overflow-hidden">
          <div className="h-40 bg-[var(--muted)] animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-[var(--muted)] rounded animate-pulse w-3/4" />
            <div className="h-2 bg-[var(--muted)] rounded animate-pulse w-full" />
            <div className="h-9 bg-[var(--muted)] rounded animate-pulse w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function CourseProgressCard({
  enrollment,
  onToggleDetails,
  isExpanded,
  detailData,
  loadingDetails,
}: {
  enrollment: Enrollment;
  onToggleDetails: (courseId: string) => void;
  isExpanded: boolean;
  detailData: CourseProgressResponse | null;
  loadingDetails: boolean;
}) {
  const progress = Math.min(100, Math.round(enrollment.progress ?? 0));
  const isCompleted = enrollment.status === 'COMPLETED';
  const learnHref = `/dashboard/courses/${enrollment.courseId}/learn`;

  return (
    <Card className="overflow-hidden border border-[var(--border)] hover:border-[var(--primary-300)] hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col md:flex-row">
        {enrollment.course?.thumbnail && (
          <div className="relative w-full md:w-72 lg:w-80 md:h-44 lg:h-48 flex-shrink-0 bg-white p-2">
            <StorageImage
              src={enrollment.course.thumbnail}
              alt={enrollment.course.title ?? 'Course'}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        )}
        <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1 line-clamp-2">
            {enrollment.course?.title ?? 'Course'}
          </h3>
          {enrollment.course?.instructor?.name && (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              {enrollment.course.instructor.name}
            </p>
          )}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--muted-foreground)]">Progress</span>
              <span className="font-medium text-[var(--foreground)]">{progress}%</span>
            </div>
            <div
              className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Course progress ${progress}%`}
            >
              <div
                className="h-full bg-[var(--primary-600)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${STATUS_STYLES[enrollment.status] ?? STATUS_STYLES.ACTIVE}`}
            >
              {STATUS_LABELS[enrollment.status] ?? enrollment.status}
            </span>
            <Link href={learnHref} className="inline-flex">
              <Button variant="primary" size="sm" className="gap-2 shadow-md">
                {isCompleted ? (
                  <>
                    <HiBookOpen className="w-4 h-4" />
                    Review
                  </>
                ) : (
                  <>
                    <HiPlay className="w-4 h-4" />
                    Continue
                  </>
                )}
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => onToggleDetails(enrollment.courseId)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 rounded px-2 py-1.5 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`progress-detail-${enrollment.courseId}`}
            >
              {isExpanded ? (
                <>
                  <HiChevronUp className="w-4 h-4" />
                  Hide details
                </>
              ) : (
                <>
                  <HiChevronDown className="w-4 h-4" />
                  View details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          id={`progress-detail-${enrollment.courseId}`}
          role="region"
          aria-label="Lesson progress"
          className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-4 sm:px-5 py-4"
        >
          {loadingDetails ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detailData === null ? (
            <p className="text-sm text-[var(--error)] py-2">
              Could not load lesson list. Try again later.
            </p>
          ) : detailData?.course?.lessons && detailData.course.lessons.length > 0 ? (
            <ul className="space-y-2" role="list">
              {detailData.course.lessons
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((lesson) => {
                  const isLessonCompleted =
                    lesson.progress?.some((p) => p.isCompleted) ?? false;
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md bg-[var(--background)] border border-[var(--border)]"
                    >
                      {isLessonCompleted ? (
                        <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden />
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-[var(--border)] flex-shrink-0" />
                      )}
                      <span className="text-gray-500 [&_svg]:text-gray-500">
                        <LessonTypeIcon
                          lesson={{
                            lessonType: (lesson.lessonType ?? 'TEXT') as 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT',
                            attachmentUrl: lesson.attachmentUrl ?? undefined,
                          }}
                          variant="dashboard"
                          size="sm"
                        />
                      </span>
                      <span className="text-sm text-[var(--foreground)] truncate flex-1 min-w-0">
                        {lesson.title}
                      </span>
                      {lesson.videoDuration != null && lesson.videoDuration > 0 && (
                        <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                          {Math.floor(lesson.videoDuration / 60)}m
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] py-2">
              No lessons in this course yet.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, CourseProgressResponse | null>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await enrollmentApi.getUserEnrollments({ limit: 100 });
      setEnrollments(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const filtered = filter === 'ALL'
    ? enrollments
    : enrollments.filter((e) => e.status === filter);

  const handleToggleDetails = useCallback(async (courseId: string) => {
    if (expandedId === courseId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(courseId);
    if (detailCache[courseId]) return;
    setLoadingDetails(courseId);
    try {
      const data = await progressApi.getCourseProgress(courseId);
      setDetailCache((prev) => ({ ...prev, [courseId]: data }));
    } catch {
      setDetailCache((prev) => ({ ...prev, [courseId]: null }));
    } finally {
      setLoadingDetails(null);
    }
  }, [expandedId, detailCache]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
          My Progress
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--muted-foreground)]">Filter:</span>
          <div className="flex rounded-lg border border-[var(--border)] p-1 bg-[var(--muted)]/20">
            {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 ${
                  filter === f
                    ? 'bg-[var(--primary-600)] text-white shadow-md'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
                }`}
                aria-pressed={filter === f}
                aria-label={`Filter by ${f === 'ALL' ? 'all courses' : f === 'ACTIVE' ? 'in progress' : 'completed'}`}
              >
                {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'In progress' : 'Completed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {error && (
        <Card padding="lg" className="border-[var(--error)]/30 bg-[var(--error)]/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[var(--foreground)]">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchEnrollments}
              className="gap-2"
            >
              <HiRefresh className="w-4 h-4" />
              Try again
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <ProgressSkeleton />
      ) : filtered.length === 0 ? (
        <Card padding="lg" className="text-center">
          <HiChartBar className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-60" />
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No courses yet
          </h2>
          <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
            {filter === 'ALL'
              ? "You haven't enrolled in any courses. Browse courses and start learning to see your progress here."
              : `No ${filter === 'ACTIVE' ? 'in progress' : 'completed'} courses.`}
          </p>
          <Link href={ROUTES.COURSES}>
            <Button variant="primary" size="lg">
              Browse courses
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-5" role="list">
          {filtered.map((enrollment) => (
            <CourseProgressCard
              key={enrollment.id}
              enrollment={enrollment}
              onToggleDetails={handleToggleDetails}
              isExpanded={expandedId === enrollment.courseId}
              detailData={detailCache[enrollment.courseId] ?? null}
              loadingDetails={loadingDetails === enrollment.courseId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
