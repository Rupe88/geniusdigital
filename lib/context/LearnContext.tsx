'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Course, Chapter, Lesson } from '@/lib/types/course';

type LearnContextValue = {
  course: Course | null;
  chapters: Chapter[];
  lessons: Lesson[];
  completedLessonIds: Set<string>;
  progressPercent: number;
  refreshProgress: () => Promise<void>;
  getNextLesson: (currentLessonId: string) => Lesson | null;
  getPrevLesson: (currentLessonId: string) => Lesson | null;
};

const LearnContext = createContext<LearnContextValue | null>(null);

export function useLearn() {
  const ctx = useContext(LearnContext);
  if (!ctx) throw new Error('useLearn must be used inside LearnProvider');
  return ctx;
}

export function LearnProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LearnContextValue;
}) {
  return <LearnContext.Provider value={value}>{children}</LearnContext.Provider>;
}
