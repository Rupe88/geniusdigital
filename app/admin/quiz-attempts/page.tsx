'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getAdminQuizAttempts, AdminQuizAttempt } from '@/lib/api/quizAttempts';

interface Filters {
  search: string;
  onlyFailed: boolean;
}

export default function AdminQuizAttemptsPage() {
  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [filters, setFilters] = useState<Filters>({ search: '', onlyFailed: false });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async (pageNumber = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminQuizAttempts({ page: pageNumber, limit: 25 });
      setAttempts(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.pages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load quiz attempts';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts(1);
  }, []);

  const filteredAttempts = attempts.filter((a) => {
    if (filters.onlyFailed && a.isPassed) return false;
    if (!filters.search.trim()) return true;
    const term = filters.search.toLowerCase();
    const userName = a.user?.fullName?.toLowerCase() || '';
    const email = a.user?.email?.toLowerCase() || '';
    const courseTitle = a.quiz?.lesson?.course?.title?.toLowerCase() || '';
    const quizTitle = a.quiz?.title?.toLowerCase() || '';
    return (
      userName.includes(term) ||
      email.includes(term) ||
      courseTitle.includes(term) ||
      quizTitle.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quiz Attempts</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            View students&apos; quiz performance across all courses.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="w-full sm:w-72">
            <Input
              label="Search by student, course or quiz"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="e.g. Student name, course title..."
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={filters.onlyFailed}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, onlyFailed: e.target.checked }))
                }
              />
              Show only failed attempts
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ search: '', onlyFailed: false });
                fetchAttempts(1);
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[var(--muted)]/80 border-b border-[var(--border)]">
              <tr>
                {['Student', 'Email', 'Course', 'Quiz', 'Score', 'Result', 'Completed At'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-[var(--muted)] rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAttempts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    No quiz attempts found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-3 py-3 text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
                      {a.user?.fullName || 'Unknown'}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {a.user?.email || '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {a.quiz?.lesson?.course?.title || '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {a.quiz?.title || '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--foreground)] whitespace-nowrap">
                      {a.score}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.isPassed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {a.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {a.completedAt
                        ? new Date(a.completedAt).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-[var(--muted-foreground)]">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => {
                const newPage = Math.max(1, page - 1);
                fetchAttempts(newPage);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const newPage = Math.min(totalPages, page + 1);
                fetchAttempts(newPage);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

