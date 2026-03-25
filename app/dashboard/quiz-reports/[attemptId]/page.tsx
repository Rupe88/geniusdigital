'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/utils/constants';
import {
  getMyQuizAttemptDetails,
  type QuizAttemptReportResult,
  type UserQuizAttemptDetailsPayload,
} from '@/lib/api/userQuizAttempts';

function formatAnswer(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function StatusBadge({ isCorrect }: { isCorrect: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded border px-2 py-1 text-xs font-bold uppercase tracking-wider',
        isCorrect ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300',
      ].join(' ')}
    >
      {isCorrect ? 'Correct' : 'Wrong'}
    </span>
  );
}

export default function QuizAttemptDetailsPage({
  params: paramsPromise,
}: {
  params: Promise<{ attemptId?: string }>;
}) {
  const params = use(paramsPromise);
  const attemptId = typeof params.attemptId === 'string' ? params.attemptId : '';

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<UserQuizAttemptDetailsPayload | null>(null);

  const attempt = payload?.attempt;
  const report = payload?.report;
  const results = report?.results ?? [];

  const courseTitle = attempt?.quiz?.lesson?.course?.title || 'Course';
  const lessonTitle = attempt?.quiz?.lesson?.title || 'Lesson';
  const quizTitle = attempt?.quiz?.title || 'Quiz';
  const completed = attempt?.completedAt ? new Date(attempt.completedAt).toLocaleString() : '—';

  useEffect(() => {
    if (!attemptId) {
      router.replace(`${ROUTES.DASHBOARD}/quiz-reports`);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyQuizAttemptDetails(attemptId);
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load quiz attempt details');
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [attemptId, router]);

  const QuestionResultRow = useMemo(() => {
    return (r: QuizAttemptReportResult, idx: number) => {
      return (
        <Card key={r.questionId} padding="lg" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Question {idx + 1}
              </div>
              <div className="text-base font-bold text-[var(--foreground)] whitespace-pre-wrap">
                {r.question}
              </div>
            </div>
            <StatusBadge isCorrect={r.isCorrect} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-[var(--border)] bg-[var(--muted)]/30 p-3 rounded-md">
              <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                Your answer
              </div>
              <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{formatAnswer(r.userAnswer)}</div>
            </div>

            <div className="border border-[var(--border)] bg-[var(--muted)]/30 p-3 rounded-md">
              <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                Correct answer
              </div>
              <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                {formatAnswer(r.correctAnswer)}
              </div>
            </div>
          </div>

          <div className="text-sm text-[var(--muted-foreground)]">
            Points: <span className="text-[var(--foreground)] font-semibold">{r.points}</span>
          </div>
        </Card>
      );
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quiz Report</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Full details for your attempt.
          </p>
        </div>

        <Link href={`${ROUTES.DASHBOARD}/quiz-reports`}>
          <Button variant="outline" size="sm">Back to History</Button>
        </Link>
      </div>

      {error ? (
        <Card padding="lg">
          <div className="text-sm text-red-600">{error}</div>
        </Card>
      ) : loading ? (
        <Card padding="lg">
          <div className="text-sm text-[var(--muted-foreground)]">Loading report…</div>
        </Card>
      ) : !attempt || !report ? (
        <Card padding="lg">
          <div className="text-sm text-[var(--muted-foreground)]">
            Quiz attempt not found.
          </div>
        </Card>
      ) : (
        <>
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  {courseTitle}
                </div>
                <div className="text-base font-bold text-[var(--foreground)] truncate">{quizTitle}</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {lessonTitle} • Submitted: {completed}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Score
                </div>
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {report.totalScore}/{report.maxScore} ({report.percentage}%)
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  Status: <span className="font-semibold">{report.isPassed ? 'Passed' : 'Not passed'}</span>
                </div>
              </div>
            </div>

            {attempt.adminVisible && (attempt.adminNotes || '').trim().length > 0 ? (
              <div className="border border-[var(--border)] bg-[var(--muted)]/30 p-4 rounded-md">
                <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                  Admin reply
                </div>
                <div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{attempt.adminNotes}</div>
              </div>
            ) : null}
          </Card>

          <div className="space-y-4">
            <div className="text-lg font-bold text-[var(--foreground)]">Question breakdown</div>
            {results.length === 0 ? (
              <Card padding="lg">
                <div className="text-sm text-[var(--muted-foreground)]">No questions found for this attempt.</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((r, idx) => QuestionResultRow(r, idx))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

