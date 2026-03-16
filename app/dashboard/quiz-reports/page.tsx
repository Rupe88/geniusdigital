'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getMyConsultationAttempts, type UserQuizAttempt } from '@/lib/api/userQuizAttempts';
import { ROUTES } from '@/lib/utils/constants';

export default function DashboardQuizReportsPage() {
  const [items, setItems] = useState<UserQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyConsultationAttempts()
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load reports');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(
    () => items.filter((a) => a.adminVisible && (a.adminNotes || '').trim().length > 0),
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quiz Reports</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            View replies from admins on consultation quizzes.
          </p>
        </div>
        <Link href={`${ROUTES.DASHBOARD}/my-courses`}>
          <Button variant="outline" size="sm">Back to My Courses</Button>
        </Link>
      </div>

      {error ? (
        <Card padding="lg">
          <div className="text-sm text-red-600">{error}</div>
        </Card>
      ) : loading ? (
        <Card padding="lg">
          <div className="text-sm text-[var(--muted-foreground)]">Loading reports…</div>
        </Card>
      ) : visibleItems.length === 0 ? (
        <Card padding="lg">
          <div className="text-sm text-[var(--muted-foreground)]">
            No reports yet. After you submit a consultation quiz, your reply will appear here once an admin reviews it.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((a) => {
            const courseTitle = a.quiz?.lesson?.course?.title || 'Course';
            const lessonTitle = a.quiz?.lesson?.title || 'Lesson';
            const quizTitle = a.quiz?.title || 'Quiz';
            const completed = a.completedAt ? new Date(a.completedAt).toLocaleString() : '—';
            return (
              <Card key={a.id} padding="lg" className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      {courseTitle}
                    </div>
                    <div className="text-base font-bold text-[var(--foreground)] truncate">
                      {quizTitle}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {lessonTitle} • Submitted: {completed}
                    </div>
                  </div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--muted)]/30 p-4 rounded-md">
                  <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Admin reply
                  </div>
                  <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {a.adminNotes}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

