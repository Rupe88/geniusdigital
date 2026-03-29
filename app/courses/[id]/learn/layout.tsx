'use client';

import React, { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import * as courseApi from '@/lib/api/courses';
import * as chapterApi from '@/lib/api/chapters';
import * as lessonApi from '@/lib/api/lessons';
import * as progressApi from '@/lib/api/progress';
import { Course, Chapter, Lesson } from '@/lib/types/course';
import { HiMenu, HiX, HiChevronLeft, HiCheckCircle } from 'react-icons/hi';
import { LessonTypeIcon } from '@/components/learn/LessonTypeIcon';
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
  const {
    course,
    chapters,
    lessons,
    completedLessonIds,
    progressPercent,
  } = useLearn();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentLessonId = resolvedParams.lessonId as string;

  // Flat playlist: lessons in order (by chapter then lesson order)
  const playlistLessons = useMemo(() => {
    const visibleLessons = lessons.filter(
      (l) => l && typeof l.title === 'string' && l.title.trim().length > 0
    );

    if (!chapters.length || !visibleLessons.length) {
      return visibleLessons.slice().sort((a, b) => a.order - b.order);
    }
    const out: Lesson[] = [];
    for (const ch of chapters) {
      const chLessons = visibleLessons
        .filter((l) => l.chapterId === ch.id)
        .sort((a, b) => a.order - b.order);
      out.push(...chLessons);
    }
    const rest = visibleLessons
      .filter((l) => !chapters.some((c) => c.id === l.chapterId))
      .sort((a, b) => a.order - b.order);
    return [...out, ...rest];
  }, [chapters, lessons]);

  if (!course) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="h-14 flex-shrink-0 bg-gray-900 text-white flex items-center justify-between px-4 lg:px-6 z-30 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${course.id}`}
            className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          >
            <HiChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <h1 className="text-base font-bold truncate max-w-[180px] sm:max-w-sm">
            {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold">{progressPercent}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 hover:bg-white/10 rounded transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Close playlist' : 'Open playlist'}
          >
            {sidebarOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Main content - video + lesson body */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>

        {/* YouTube-style playlist sidebar */}
        <aside
          className={`
            flex-shrink-0 w-full sm:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col z-20
            transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 top-14 bottom-0 lg:translate-x-0 lg:relative'}
          `}
        >
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Course content</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {playlistLessons.length} lessons · {playlistLessons.filter((l) => completedLessonIds.has(l.id)).length} completed
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Extra bottom padding so last lesson is fully scrollable on mobile */}
            <ul className="divide-y divide-gray-100 pb-24">
              {playlistLessons.map((lesson, index) => {
                const isActive = currentLessonId === lesson.id;
                const isCompleted = completedLessonIds.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${course.id}/learn/${lesson.id}`}
                      className={`
                        flex items-center gap-3 px-4 py-3 text-left transition-colors
                        ${isActive ? 'bg-[var(--primary-50)] text-[var(--primary-700)]' : 'hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-600">
                        {index + 1}
                      </span>
                      <span className="flex-shrink-0 text-gray-400">
                        <LessonTypeIcon lesson={lesson} variant="marketing" size="sm" />
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">
                        {lesson.title}
                      </span>
                      {lesson.videoDuration != null && lesson.videoDuration > 0 && (
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {Math.floor(lesson.videoDuration / 60)}m
                        </span>
                      )}
                      {isCompleted && (
                        <HiCheckCircle className="flex-shrink-0 w-5 h-5 text-emerald-500" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
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
      } catch (err) {
        if (!cancelled) showError('Failed to load course');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const getNextLesson = useCallback(
    (currentLessonId: string) => {
      const list = [...chapters].flatMap((ch) =>
        lessons.filter((l) => l.chapterId === ch.id).sort((a, b) => a.order - b.order)
      );
      const rest = lessons.filter((l) => !chapters.some((c) => c.id === l.chapterId)).sort((a, b) => a.order - b.order);
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
      const rest = lessons.filter((l) => !chapters.some((c) => c.id === l.chapterId)).sort((a, b) => a.order - b.order);
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
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">Loading course...</p>
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
