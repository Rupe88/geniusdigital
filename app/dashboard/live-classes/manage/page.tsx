'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass, CreateLiveClassPayload } from '@/lib/api/liveClasses';
import { extractSeriesIdFromLiveClass, stripSeriesMarkerFromDescription } from '@/lib/api/liveClasses';
import { getMyInstructorCourses } from '@/lib/api/instructors';
import { showError, showSuccess } from '@/lib/utils/toast';
import { HiPencil, HiTrash, HiPlus, HiXCircle } from 'react-icons/hi';

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const defaultDayTimes: Record<number, string> = {
  0: '21:00',
  1: '21:00',
  2: '21:00',
  3: '21:00',
  4: '21:00',
  5: '21:00',
  6: '21:00',
};

function normalizeTime(value: string): string {
  const v = String(value || '').trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) ? v : '21:00';
}

export default function InstructorLiveClassManagePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    duration: 60,
    meetingUrl: '',
    meetingPassword: '',
    daysOfWeek: [0] as number[],
    startDate: '',
    endDate: '',
    dayTimes: { ...defaultDayTimes },
  });

  useEffect(() => {
    if (loading) return;
    if (user?.role !== 'INSTRUCTOR') {
      router.replace('/dashboard/live-classes');
    }
  }, [loading, user?.role, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [liveRes, myCourses] = await Promise.all([
        liveClassApi.getMyManagedLiveClasses({ page: 1, limit: 50 }),
        getMyInstructorCourses(),
      ]);
      setClasses(liveRes.data || []);
      setCourses((myCourses || []).map((c) => ({ id: c.id, title: c.title })));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load live classes');
      setClasses([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      duration: 60,
      meetingUrl: '',
      meetingPassword: '',
      daysOfWeek: [0],
      startDate: '',
      endDate: '',
      dayTimes: { ...defaultDayTimes },
    });
  };

  const handleEdit = (liveClass: LiveClass) => {
    const scheduleEntries = Object.entries(liveClass.weeklySchedule || {})
      .map(([day, time]) => ({ day: parseInt(day, 10), time }))
      .filter((s) => !Number.isNaN(s.day) && s.day >= 0 && s.day <= 6 && !!s.time);
    const selectedDays = scheduleEntries.length ? scheduleEntries.map((s) => s.day).sort((a, b) => a - b) : [0];
    const nextDayTimes = { ...defaultDayTimes };
    scheduleEntries.forEach((s) => {
      nextDayTimes[s.day] = normalizeTime(String(s.time || '21:00'));
    });
    setEditingClass(liveClass);
    setFormData({
      title: liveClass.title || '',
      description: stripSeriesMarkerFromDescription(liveClass.description || ''),
      courseId: liveClass.courseId || '',
      duration: liveClass.duration || 60,
      meetingUrl: liveClass.meetingUrl || '',
      meetingPassword: liveClass.meetingPassword || '',
      daysOfWeek: selectedDays,
      startDate: liveClass.startDate || '',
      endDate: liveClass.endDate || '',
      dayTimes: nextDayTimes,
    });
    setShowForm(true);
  };

  const buildPayload = (): CreateLiveClassPayload => {
    const selectedDay = formData.daysOfWeek[0] ?? 0;
    const dayTimes = Object.fromEntries(
      Object.entries(formData.dayTimes || {}).map(([k, v]) => [Number(k), normalizeTime(String(v || '21:00'))])
    ) as Record<number, string>;
    return {
      title: formData.title,
      description: formData.description.trim() || undefined,
      courseId: formData.courseId || undefined,
      duration: formData.duration,
      meetingUrl: formData.meetingUrl || undefined,
      meetingPassword: formData.meetingPassword || undefined,
      meetingProvider: 'ZOOM',
      recurrenceType: 'WEEKLY',
      daysOfWeek: formData.daysOfWeek,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: dayTimes[selectedDay] || '21:00',
      dayTimes,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.daysOfWeek.length) {
      showError('Please select at least one weekday');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showError('Start date and end date are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (editingClass) {
        await liveClassApi.updateLiveClass(editingClass.id, payload);
        showSuccess('Live class updated successfully');
      } else {
        await liveClassApi.createLiveClass(payload);
        showSuccess('Live class created successfully');
      }
      setShowForm(false);
      setEditingClass(null);
      resetForm();
      fetchData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save live class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this live class?')) return;
    try {
      await liveClassApi.deleteLiveClass(id);
      showSuccess('Live class deleted');
      fetchData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete live class');
    }
  };

  const handleCancelSeries = async (liveClass: LiveClass) => {
    const seriesId = extractSeriesIdFromLiveClass(liveClass);
    if (!seriesId) {
      showError('This live class does not belong to a recurring series');
      return;
    }
    if (!confirm('Cancel all upcoming sessions in this series?')) return;
    try {
      await liveClassApi.cancelLiveClassSeries(seriesId);
      showSuccess('Series cancelled successfully');
      fetchData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to cancel series');
    }
  };

  const classRows = useMemo(() => classes || [], [classes]);

  if (loading || user?.role !== 'INSTRUCTOR') return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Manage Live Classes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Create and manage live classes for your assigned courses.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            if (showForm) {
              setEditingClass(null);
              resetForm();
            }
            setShowForm(!showForm);
          }}
          className="gap-2"
        >
          <HiPlus className="w-4 h-4" />
          {showForm ? 'Close form' : 'Create Live Class'}
        </Button>
      </div>

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">{editingClass ? 'Edit Live Class' : 'Create Weekly Live Class'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Title *</label>
                <input className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Course</label>
                <select className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.courseId} onChange={(e) => setFormData((p) => ({ ...p, courseId: e.target.value }))}>
                  <option value="">No Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Duration (minutes)</label>
                <input type="number" min={1} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.duration} onChange={(e) => setFormData((p) => ({ ...p, duration: parseInt(e.target.value, 10) || 60 }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Start date *</label>
                <input type="date" className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">End date *</label>
                <input type="date" className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))} required />
              </div>
            </div>

            <div className="rounded-md border border-[var(--border)] p-3">
              <p className="text-xs text-[var(--muted-foreground)] mb-2">Choose weekdays and set time for each selected day</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {DAY_OPTIONS.map((d) => (
                  <div key={d.value} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`min-w-[96px] px-2.5 py-1.5 rounded-md border text-xs text-left ${formData.daysOfWeek.includes(d.value) ? 'bg-[var(--primary-100)] border-[var(--primary-400)] text-[var(--primary-800)]' : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]'}`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          daysOfWeek: prev.daysOfWeek.includes(d.value)
                            ? prev.daysOfWeek.filter((x) => x !== d.value)
                            : [...prev.daysOfWeek, d.value].sort((a, b) => a - b),
                        }))
                      }
                    >
                      {d.label}
                    </button>
                    <input
                      type="time"
                      className="w-full px-2 py-1.5 border border-[var(--border)] rounded-md"
                      value={normalizeTime(formData.dayTimes[d.value])}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dayTimes: { ...prev.dayTimes, [d.value]: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting URL</label>
                <input type="url" className="w-full px-3 py-2 border border-[var(--border)] rounded-md" placeholder="https://zoom.us/j/..." value={formData.meetingUrl} onChange={(e) => setFormData((p) => ({ ...p, meetingUrl: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting Password</label>
                <input type="text" className="w-full px-3 py-2 border border-[var(--border)] rounded-md" value={formData.meetingPassword} onChange={(e) => setFormData((p) => ({ ...p, meetingPassword: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description</label>
              <textarea className="w-full px-3 py-2 border border-[var(--border)] rounded-md" rows={3} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {editingClass ? 'Update' : 'Create'} Live Class
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingClass(null); resetForm(); }} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="md">
        {loadingData ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading live classes...</p>
        ) : classRows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No live classes yet. Create your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)] px-3 py-2">Title</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)] px-3 py-2">Course</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)] px-3 py-2">Status</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)] px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {classRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[var(--foreground)]">{row.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{stripSeriesMarkerFromDescription(row.description || '')}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--foreground)]">{row.course?.title || '-'}</td>
                    <td className="px-3 py-3 text-sm text-[var(--foreground)]">{row.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEdit(row)}>
                          <HiPencil className="w-4 h-4" />
                          Edit
                        </Button>
                        {extractSeriesIdFromLiveClass(row) && (
                          <Button size="sm" variant="ghost" className="gap-1 text-amber-700" onClick={() => handleCancelSeries(row)}>
                            <HiXCircle className="w-4 h-4" />
                            Cancel series
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="gap-1 text-red-700" onClick={() => handleDelete(row.id)}>
                          <HiTrash className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

