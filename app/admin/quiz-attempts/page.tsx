'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getAdminQuizAttempts,
  getAdminQuizAttemptDetails,
  AdminQuizAttempt,
  AdminQuizAttemptDetails,
} from '@/lib/api/quizAttempts';
import { updateQuizAttemptFeedback } from '@/lib/api/quizFeedback';
import { Textarea } from '@/components/ui/Textarea';
import { showSuccess, showError } from '@/lib/utils/toast';

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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<AdminQuizAttemptDetails | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyAttemptId, setReplyAttemptId] = useState<string | null>(null);
  const [replyNote, setReplyNote] = useState('');
  const [replyVisible, setReplyVisible] = useState(true);

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

  const formatAnswerValue = (value: string | string[] | null | undefined) => {
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (value === null || value === undefined) return '—';
    const text = String(value).trim();
    return text || '—';
  };

  const openDetailsModal = async (attemptId: string) => {
    try {
      setDetailsOpen(true);
      setDetailsLoading(true);
      setDetailsError(null);
      setDetailsData(null);

      const details = await getAdminQuizAttemptDetails(attemptId);
      setDetailsData(details);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to load attempt details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailsOpen(false);
    setDetailsError(null);
    setDetailsData(null);
  };

  const openReplyModal = (attempt: AdminQuizAttempt) => {
    setReplyAttemptId(attempt.id);
    setReplyNote(attempt.adminNotes ?? '');
    setReplyVisible(!!attempt.adminVisible);
    setReplyOpen(true);
  };

  const closeReplyModal = () => {
    setReplyOpen(false);
    setReplyAttemptId(null);
    setReplyNote('');
    setReplyVisible(true);
  };

  const handleSaveReply = async () => {
    if (!replyAttemptId) return;
    try {
      setSavingId(replyAttemptId);
      await updateQuizAttemptFeedback(replyAttemptId, {
        adminNotes: replyNote,
        adminVisible: replyVisible,
      });
      setAttempts((prev) =>
        prev.map((att) =>
          att.id === replyAttemptId
            ? { ...att, adminNotes: replyNote, adminVisible: replyVisible }
            : att
        )
      );
      showSuccess('Reply saved.');
      closeReplyModal();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save reply');
    } finally {
      setSavingId(null);
    }
  };

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
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[var(--muted)]/80 border-b border-[var(--border)]">
              <tr>
                {[
                  'Student',
                  'Email',
                  'Course',
                  'Quiz',
                  'Submitted Answers',
                  'Score',
                  'Result',
                  'Completed At',
                  'Consultation Feedback',
                ].map(
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
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-[var(--muted)] rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAttempts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    No quiz attempts found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--muted)]/50 transition-colors align-top">
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
                    <td className="px-3 py-3 text-sm text-[var(--foreground)] min-w-[320px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(a.id)}
                          >
                            View submitted answers
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openReplyModal(a)}>
                            Reply
                          </Button>
                        </div>
                        <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/20 px-2.5 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                            Admin Note
                          </p>
                          <p className="mt-1 text-xs text-[var(--foreground)] whitespace-pre-wrap break-words line-clamp-3">
                            {a.adminNotes?.trim() ? a.adminNotes : 'No admin note yet.'}
                          </p>
                        </div>
                      </div>
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
                    <td className="px-3 py-3 text-sm min-w-[180px]">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.adminVisible
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {a.adminVisible ? 'Reply visible to student' : 'Reply hidden'}
                      </span>
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

      {detailsOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetailsModal} />
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Submitted Answers Detail
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Question-wise answer review with correctness and expected answer
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeDetailsModal}>
                Close
              </Button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-90px)]">
              {detailsLoading ? (
                <div className="text-sm text-[var(--muted-foreground)]">Loading attempt details...</div>
              ) : detailsError ? (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {detailsError}
                </div>
              ) : detailsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/20">
                      <p className="text-xs text-[var(--muted-foreground)]">Student</p>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-1">
                        {detailsData.attempt.user?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/20">
                      <p className="text-xs text-[var(--muted-foreground)]">Score</p>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-1">
                        {detailsData.report.totalScore}/{detailsData.report.maxScore} ({detailsData.report.percentage}
                        %)
                      </p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/20">
                      <p className="text-xs text-[var(--muted-foreground)]">Passing Score</p>
                      <p className="text-sm font-medium text-[var(--foreground)] mt-1">
                        {detailsData.report.passingScore}%
                      </p>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/20">
                      <p className="text-xs text-[var(--muted-foreground)]">Result</p>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          detailsData.report.isPassed ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {detailsData.report.isPassed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {detailsData.report.results.map((item, idx) => (
                      <div key={item.questionId} className="border border-[var(--border)] rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            Q{idx + 1}. {item.question}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.isCorrect
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-[var(--muted-foreground)]">Student Answer</p>
                            <p className="text-[var(--foreground)] whitespace-pre-wrap break-words mt-1">
                              {formatAnswerValue(item.userAnswer)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--muted-foreground)]">Correct / Model Answer</p>
                            <p className="text-[var(--foreground)] whitespace-pre-wrap break-words mt-1">
                              {formatAnswerValue(item.correctAnswer)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)]">No details available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {replyOpen && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeReplyModal} />
          <div className="relative z-10 w-full max-w-2xl bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Admin Reply</h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Write feedback for this quiz attempt
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeReplyModal}>
                Close
              </Button>
            </div>
            <div className="p-5 space-y-3">
              <Textarea
                label="Admin notes / reply"
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                placeholder="Write personalized feedback for this attempt..."
                rows={6}
              />
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={replyVisible}
                  onChange={(e) => setReplyVisible(e.target.checked)}
                />
                Visible to student in dashboard
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={closeReplyModal}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!replyAttemptId || savingId === replyAttemptId}
                  onClick={handleSaveReply}
                >
                  {savingId === replyAttemptId ? 'Saving…' : 'Save reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

