'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLearn } from '@/lib/context/LearnContext';
import * as lessonApi from '@/lib/api/lessons';
import { Button } from '@/components/ui/Button';

export default function DashboardCourseLearnIndexPage() {
  const params = useParams();
  const router = useRouter();
  const { course, lessons, completedLessonIds } = useLearn();
  const [fallbackTried, setFallbackTried] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const courseId = useMemo(() => {
    if (course?.id) return course.id;
    const id = params.id;
    return typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  }, [params.id, course?.id]);

  const hasLessons = Array.isArray(lessons) && lessons.length > 0;
  const noLessons = !!course && Array.isArray(lessons) && lessons.length === 0;

  useEffect(() => {
    if (!course) return;
    if (!lessons || lessons.length === 0) return;

    const sorted = lessons.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const next = sorted.find((l) => !completedLessonIds.has(l.id)) ?? sorted[0];
    router.replace(`/dashboard/courses/${course.id}/learn/${next.id}`);
  }, [course, lessons, completedLessonIds, router]);

  // Fallback: if LearnContext lessons are empty (or failed to load), try fetching lessons directly once.
  useEffect(() => {
    if (!courseId) return;
    if (hasLessons) return;
    if (noLessons) return;
    if (fallbackTried) return;

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, 8000);

    (async () => {
      setFallbackTried(true);
      try {
        const fetched = await lessonApi.getCourseLessons(courseId);
        if (cancelled) return;
        if (fetched && fetched.length > 0) {
          const sorted = fetched.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          router.replace(`/dashboard/courses/${courseId}/learn/${sorted[0].id}`);
          clearTimeout(timeout);
          return;
        }
        setFallbackFailed(true);
      } catch {
        if (!cancelled) setFallbackFailed(true);
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [courseId, hasLessons, noLessons, fallbackTried, router]);

  if (!courseId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-gray-700 font-medium">Invalid course link.</p>
        <Button variant="primary" size="md" onClick={() => router.push('/dashboard/my-courses')}>
          Back to My Courses
        </Button>
      </div>
    );
  }

  // If the layout has loaded and the course truly has zero lessons, do not spin forever.
  if (noLessons) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-gray-700 font-medium">No lessons found for this course.</p>
        <Button variant="primary" size="md" onClick={() => router.push('/dashboard/my-courses')}>
          Back to My Courses
        </Button>
      </div>
    );
  }

  if (fallbackFailed || timedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-gray-700 font-medium">
          {fallbackFailed ? 'No lessons found for this course.' : 'Taking longer than expected to load lessons.'}
        </p>
        {!fallbackFailed && (
          <p className="text-sm text-gray-500">
            This can happen if the course has no lessons yet or the server is not responding.
          </p>
        )}
        <Button variant="primary" size="md" onClick={() => router.push('/dashboard/my-courses')}>
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">
        {fallbackTried ? 'Opening lesson...' : 'Loading lessons...'}
      </p>
    </div>
  );
}

