'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAudienceCount, sendMassEmail, type MassEmailAudience } from '@/lib/api/massEmail';
import * as coursesApi from '@/lib/api/courses';
import type { Course } from '@/lib/types/course';
import { showSuccess, showError } from '@/lib/utils/toast';

const AUDIENCE_OPTIONS: { value: MassEmailAudience; label: string }[] = [
  { value: 'all_users', label: 'All Registered Users' },
  { value: 'course_enrolled', label: 'Enrolled in Course' },
];

export default function AdminMassEmailPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<MassEmailAudience>('all_users');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await coursesApi.getAllCourses({ page: 1, limit: 500 });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      }
    };
    loadCourses();
  }, []);

  const canFetchCount =
    audience !== 'course_enrolled' || (courseId && courseId.trim().length > 0);

  const fetchRecipientCount = async () => {
    if (!canFetchCount) {
      showError('Select a course when targeting enrolled users');
      return;
    }
    try {
      setCountLoading(true);
      setRecipientCount(null);
      const res = await getAudienceCount(
        audience,
        audience === 'course_enrolled' ? courseId : null
      );
      setRecipientCount(res.count);
      showSuccess(`Recipients: ${res.count}`);
    } catch (error) {
      showError(Object(error).message || 'Failed to get recipient count');
    } finally {
      setCountLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      showError('Subject is required');
      return;
    }
    if (!body.trim()) {
      showError('Email body is required');
      return;
    }
    if (audience === 'course_enrolled' && !courseId) {
      showError('Select a course for enrolled users');
      return;
    }

    const confirmMsg =
      recipientCount != null
        ? `Send email to ${recipientCount} recipient(s)?`
        : 'Send mass email? This action cannot be undone.';
    if (!confirm(confirmMsg)) return;

    try {
      setSending(true);
      setLastResult(null);
      const result = await sendMassEmail({
        subject: subject.trim(),
        body: body.trim(),
        audience,
        courseId: audience === 'course_enrolled' ? courseId : null,
      });
      setLastResult({ sent: result.sent, failed: result.failed, total: result.total });
      showSuccess(`Sent to ${result.sent} recipients${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
    } catch (error) {
      showError(Object(error).message || 'Failed to send mass email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Mass Email</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Send announcements and notifications to users
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value as MassEmailAudience);
                setRecipientCount(null);
              }}
              className="w-full max-w-md px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)]"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course selector (when audience = course_enrolled) */}
          {audience === 'course_enrolled' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Course
              </label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setRecipientCount(null);
                }}
                className="w-full max-w-md px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)]"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient count */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchRecipientCount}
              disabled={!canFetchCount || countLoading}
            >
              {countLoading ? 'Checking...' : 'Preview recipient count'}
            </Button>
            {recipientCount !== null && (
              <span className="text-sm text-[var(--muted-foreground)]">
                <strong className="text-[var(--foreground)]">{recipientCount}</strong> recipients will receive this email
              </span>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Subject</label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="max-w-2xl"
              maxLength={255}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Message</label>
            <textarea
              placeholder="Write your email content here. You can use plain text or HTML (e.g. <p>Hello</p>)."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full max-w-2xl px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] font-mono text-sm focus:ring-2 focus:ring-[var(--primary-500)] focus:outline-none resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || (audience === 'course_enrolled' && !courseId)}
            >
              {sending ? 'Sending...' : 'Send Mass Email'}
            </Button>
            {lastResult && (
              <span className="text-sm text-[var(--muted-foreground)] self-center">
                Last send: {lastResult.sent} sent, {lastResult.failed} failed
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
