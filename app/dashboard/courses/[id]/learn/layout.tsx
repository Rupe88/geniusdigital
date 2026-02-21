'use client';

import React, { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import * as courseApi from '@/lib/api/courses';
import * as chapterApi from '@/lib/api/chapters';
import * as lessonApi from '@/lib/api/lessons';
import * as progressApi from '@/lib/api/progress';
import { Course, Chapter, Lesson } from '@/lib/types/course';
import { HiMenu, HiX, HiChevronLeft, HiChevronDown } from 'react-icons/hi';
import { useAuth } from '@/lib/context/AuthContext';
import { showError } from '@/lib/utils/toast';
import { LearnProvider, useLearn } from '@/lib/context/LearnContext';

function LearnLayoutInner({
  children,
  params: resolvedParams,
}: {
  children: React.ReactNode;
  params: { id?: string; lessonId?: string };
}) {
  const { course, chapters, lessons, completedLessonIds, progressPercent } = useLearn();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentLessonId = resolvedParams.lessonId as string;
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  // Clean A2 layout: group lessons under chapter headings (no per-lesson/per-chapter progress UI).
  const lessonsByChapter = useMemo(() => {
    const byChapter = new Map<string, Lesson[]>();
    for (const ch of chapters) byChapter.set(ch.id, []);
    const noChapter: Lesson[] = [];

    for (const l of lessons) {
      if (l.chapterId && byChapter.has(l.chapterId)) byChapter.get(l.chapterId)!.push(l);
      else noChapter.push(l);
    }

    for (const [key, arr] of byChapter.entries()) {
      byChapter.set(key, arr.slice().sort((a, b) => a.order - b.order));
    }

    return {
      byChapter,
      noChapter: noChapter.slice().sort((a, b) => a.order - b.order),
      total: lessons.length,
    };
  }, [chapters, lessons]);

  // Auto-open chapter containing current lesson; otherwise open the first chapter that has lessons.
  useEffect(() => {
    if (!chapters.length) return;
    if (!lessons.length) return;

    const current = lessons.find((l) => l.id === currentLessonId);
    if (current?.chapterId) {
      setOpenChapters((prev) => {
        if (prev.has(current.chapterId!)) return prev;
        return new Set(prev).add(current.chapterId!);
      });
      return;
    }

    setOpenChapters((prev) => {
      if (prev.size > 0) return prev;
      const firstWithLessons = chapters.find((c) => (lessonsByChapter.byChapter.get(c.id)?.length ?? 0) > 0);
      return firstWithLessons ? new Set([firstWithLessons.id]) : prev;
    });
  }, [chapters, lessons, currentLessonId, lessonsByChapter.byChapter]);

  if (!course) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--muted)]">
      <header className="h-14 flex-shrink-0 bg-[var(--background)] text-[var(--foreground)] border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-6 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/my-courses"
            className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors flex-shrink-0"
            aria-label="Back to My Courses"
          >
            <HiChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
          <h1 className="text-sm sm:text-base font-semibold truncate max-w-[180px] sm:max-w-sm">
            {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              Progress
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary-700)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[var(--foreground)]">
                {progressPercent}%
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Close lessons list' : 'Open lessons list'}
          >
            {sidebarOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--muted)] p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>

        <aside
          className={`
            flex-shrink-0 w-full sm:w-80 lg:w-96 bg-[var(--background)] border-l border-[var(--border)] flex flex-col z-20
            transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 top-14 bottom-0 lg:translate-x-0 lg:relative'}
          `}
        >
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Lessons</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{lessonsByChapter.total} lessons</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {chapters.map((ch) => {
                const chLessons = lessonsByChapter.byChapter.get(ch.id) ?? [];
                if (chLessons.length === 0) return null;
                const isOpen = openChapters.has(ch.id);
                return (
                  <div key={ch.id} className="mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenChapters((prev) => {
                          const next = new Set(prev);
                          if (next.has(ch.id)) next.delete(ch.id);
                          else next.add(ch.id);
                          return next;
                        })
                      }
                      className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-[var(--muted)] transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider truncate pr-3">
                        {ch.title}
                      </span>
                      <HiChevronDown
                        className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {isOpen && (
                      <ul className="space-y-1 px-2 pb-1">
                        {chLessons.map((lesson) => {
                          const isActive = currentLessonId === lesson.id;
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={`/dashboard/courses/${course.id}/learn/${lesson.id}`}
                                className={[
                                  'px-3 py-2 block rounded-md text-sm transition-colors',
                                  isActive
                                    ? 'bg-[var(--primary-50)] text-[var(--primary-800)] border-l-4 border-[var(--primary-700)]'
                                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                                ].join(' ')}
                              >
                                <span className="line-clamp-2">{lesson.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}

              {lessonsByChapter.noChapter.length > 0 && (
                <div className="mb-3">
                  <div className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Other lessons</div>
                  <ul className="space-y-1 px-2 pb-1">
                    {lessonsByChapter.noChapter.map((lesson) => {
                      const isActive = currentLessonId === lesson.id;
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/dashboard/courses/${course.id}/learn/${lesson.id}`}
                            className={[
                              'px-3 py-2 block rounded-md text-sm transition-colors',
                              isActive
                                ? 'bg-[var(--primary-50)] text-[var(--primary-800)] border-l-4 border-[var(--primary-700)]'
                                : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                            ].join(' ')}
                          >
                            <span className="line-clamp-2">{lesson.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LearnLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<{ id?: string; lessonId?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '')}`);
    }
  }, [isAuthenticated, authLoading, pathname, router]);

  const refreshProgress = useCallback(async () => {
    const courseId = params.id as string;
    if (!courseId) return;
    try {
      const data = await progressApi.getCourseProgress(courseId);
      const completed = new Set<string>();
      data.course.lessons?.forEach((l) => {
        const isCompleted = l.progress?.some((p) => p.isCompleted);
        if (isCompleted) completed.add(l.id);
      });
      setCompletedLessonIds(completed);
      setProgressPercent(data.enrollment?.progress ?? 0);
    } catch {
      // ignore
    }
  }, [params.id]);

  useEffect(() => {
    const courseId = params.id as string;
    if (!courseId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [courseData, chaptersData, lessonsData] = await Promise.all([
          courseApi.getCourseById(courseId),
          chapterApi.getCourseChapters(courseId),
          lessonApi.getCourseLessons(courseId),
        ]);
        if (cancelled) return;
        setCourse(courseData);
        setChapters(chaptersData);
        setLessons(lessonsData);

        try {
          const progressData = await progressApi.getCourseProgress(courseId);
          if (cancelled) return;
          const completed = new Set<string>();
          progressData.course.lessons?.forEach((l) => {
            if (l.progress?.some((p) => p.isCompleted)) completed.add(l.id);
          });
          setCompletedLessonIds(completed);
          setProgressPercent(progressData.enrollment?.progress ?? 0);
        } catch {
          // not enrolled or no progress yet
        }
      } catch {
        if (!cancelled) showError('Failed to load course');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const getNextLesson = useCallback(
    (currentLessonId: string) => {
      const list = [...chapters].flatMap((ch) =>
        lessons.filter((l) => l.chapterId === ch.id).sort((a, b) => a.order - b.order)
      );
      const rest = lessons
        .filter((l) => !chapters.some((c) => c.id === l.chapterId))
        .sort((a, b) => a.order - b.order);
      const ordered = [...list, ...rest];
      const idx = ordered.findIndex((l) => l.id === currentLessonId);
      return idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
    },
    [chapters, lessons]
  );

  const getPrevLesson = useCallback(
    (currentLessonId: string) => {
      const list = [...chapters].flatMap((ch) =>
        lessons.filter((l) => l.chapterId === ch.id).sort((a, b) => a.order - b.order)
      );
      const rest = lessons
        .filter((l) => !chapters.some((c) => c.id === l.chapterId))
        .sort((a, b) => a.order - b.order);
      const ordered = [...list, ...rest];
      const idx = ordered.findIndex((l) => l.id === currentLessonId);
      return idx > 0 ? ordered[idx - 1] : null;
    },
    [chapters, lessons]
  );

  const contextValue = useMemo(
    () => ({
      course,
      chapters,
      lessons,
      completedLessonIds,
      progressPercent,
      refreshProgress,
      getNextLesson,
      getPrevLesson,
    }),
    [course, chapters, lessons, completedLessonIds, progressPercent, refreshProgress, getNextLesson, getPrevLesson]
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--foreground)] font-medium">Loading course...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <LearnProvider value={contextValue}>
      <LearnLayoutInner params={params}>{children}</LearnLayoutInner>
    </LearnProvider>
  );
}

