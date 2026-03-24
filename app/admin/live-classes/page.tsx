'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass, CreateLiveClassPayload } from '@/lib/api/liveClasses';
import { extractSeriesIdFromLiveClass } from '@/lib/api/liveClasses';
import * as instructorApi from '@/lib/api/instructors';
import * as courseApi from '@/lib/api/courses';
import { showError, showSuccess } from '@/lib/utils/toast';
import { HiArrowLeft, HiSearch, HiFilter, HiVideoCamera } from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE', label: 'Live' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminLiveClassesPage() {
  const DAY_OPTIONS = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];
  const DURATION_OPTIONS = [
    { label: '1 hr', value: 60 },
    { label: '1.5 hrs', value: 90 },
    { label: '2 hrs', value: 120 },
    { label: '3 hrs', value: 180 },
  ];

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingSeriesId, setCancellingSeriesId] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    instructorId: '',
    scheduledAt: '',
    duration: 60,
    meetingUrl: '',
    meetingPassword: '',
    recurrenceType: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    startDate: '',
    endDate: '',
    startTime: '21:00',
    daysOfWeek: [0] as number[],
    monthlyDay: 1,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLiveClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await liveClassApi.getAllLiveClasses({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(instructorFilter && { instructorId: instructorFilter }),
        ...(courseFilter && { courseId: courseFilter }),
      });
      setLiveClasses(res.data || []);
      setPagination((prev) => ({
        ...prev,
        ...res.pagination,
        total: res.pagination?.total ?? prev.total,
        pages: res.pagination?.pages ?? prev.pages,
      }));
    } catch (error) {
      console.error('Error fetching live classes:', error);
      showError(error instanceof Error ? error.message : 'Failed to load live classes');
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, instructorFilter, courseFilter]);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  useEffect(() => {
    instructorApi.getAllInstructors().then((r) => setInstructors(r.data || [])).catch(() => setInstructors([]));
    courseApi.getOngoingCourses().then((r) => setCourses(r || [])).catch(() => setCourses([]));
  }, []);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('');
    setInstructorFilter('');
    setCourseFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = searchInput.trim() || statusFilter || instructorFilter || courseFilter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateLiveClassPayload = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId || undefined,
        instructorId: formData.instructorId,
        duration: formData.duration,
        meetingUrl: formData.meetingUrl || undefined,
        meetingPassword: formData.meetingPassword || undefined,
        meetingProvider: 'ZOOM',
      };

      if (!editingClass) {
        if (!formData.startDate || !formData.endDate || !formData.startTime) {
          throw new Error('Start date, end date and start time are required for recurring schedule.');
        }
        if (
          formData.recurrenceType === 'WEEKLY' &&
          (!formData.daysOfWeek || formData.daysOfWeek.length === 0)
        ) {
          throw new Error('Select at least one weekday for weekly recurrence.');
        }
        if (formData.recurrenceType === 'MONTHLY' && (!formData.monthlyDay || formData.monthlyDay < 1 || formData.monthlyDay > 31)) {
          throw new Error('Monthly day must be between 1 and 31.');
        }
        payload.recurrenceType = formData.recurrenceType;
        payload.startDate = formData.startDate;
        payload.endDate = formData.endDate;
        payload.startTime = formData.startTime;
        payload.daysOfWeek = formData.recurrenceType === 'WEEKLY' ? formData.daysOfWeek : [];
        payload.monthlyDay = formData.recurrenceType === 'MONTHLY' ? formData.monthlyDay : undefined;
      } else {
        if (!formData.scheduledAt) {
          throw new Error('Scheduled date and time is required.');
        }
      }

      if (editingClass) {
        await liveClassApi.updateLiveClass(editingClass.id, {
          ...payload,
          scheduledAt: formData.scheduledAt,
          recurrenceType: undefined,
          startDate: undefined,
          endDate: undefined,
          startTime: undefined,
          daysOfWeek: undefined,
        });
        showSuccess('Live class updated successfully');
      } else {
        await liveClassApi.createLiveClass(payload);
        showSuccess('Live class series created successfully');
      }
      setShowForm(false);
      setEditingClass(null);
      resetForm();
      fetchLiveClasses();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save live class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (liveClass: LiveClass) => {
    setEditingClass(liveClass);
    setFormData({
      title: liveClass.title,
      description: liveClass.description || '',
      courseId: liveClass.courseId || '',
      instructorId: liveClass.instructorId,
      scheduledAt: new Date(liveClass.scheduledAt).toISOString().slice(0, 16),
      duration: liveClass.duration,
      meetingUrl: liveClass.meetingUrl || '',
      meetingPassword: liveClass.meetingPassword || '',
      recurrenceType: 'DAILY',
      startDate: '',
      endDate: '',
      startTime: '21:00',
      daysOfWeek: [0],
      monthlyDay: 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;
    try {
      await liveClassApi.deleteLiveClass(id);
      fetchLiveClasses();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleCancelSeries = async (seriesId: string) => {
    if (!confirm('Cancel all sessions in this recurring series?')) return;
    try {
      setCancellingSeriesId(seriesId);
      const result = await liveClassApi.cancelLiveClassSeries(seriesId);
      showSuccess(`Cancelled ${result.cancelledCount} sessions in series.`);
      fetchLiveClasses();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to cancel series');
    } finally {
      setCancellingSeriesId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      instructorId: '',
      scheduledAt: '',
      duration: 60,
      meetingUrl: '',
      meetingPassword: '',
      recurrenceType: 'DAILY',
      startDate: '',
      endDate: '',
      startTime: '21:00',
      daysOfWeek: [0],
      monthlyDay: 1,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <HiVideoCamera className="h-6 w-6" />
            Live Classes Management
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">Manage live classes and meetings</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingClass(null);
            resetForm();
          }}
        >
          {showForm ? 'Cancel' : 'Create Recurring Live Class'}
        </Button>
      </div>

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {editingClass ? 'Edit Live Class' : 'Create Recurring Live Class'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Instructor *</label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Course (Optional)</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Only ongoing courses are shown.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Duration *</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting Provider</label>
                <input
                  type="text"
                  value="Zoom"
                  readOnly
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--muted)] text-[var(--foreground)]"
                />
              </div>
            </div>
            {editingClass ? (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ) : (
              <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Recurrence</label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {formData.recurrenceType === 'WEEKLY' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Weekly On *</label>
                    <div className="flex flex-wrap gap-2">
                      {DAY_OPTIONS.map((day) => {
                        const active = formData.daysOfWeek.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                daysOfWeek: active
                                  ? prev.daysOfWeek.filter((d) => d !== day.value)
                                  : [...prev.daysOfWeek, day.value].sort((a, b) => a - b),
                              }))
                            }
                            className={`px-3 py-1.5 rounded-md border text-sm ${
                              active
                                ? 'bg-primary-100 border-primary-300 text-primary-800'
                                : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {formData.recurrenceType === 'MONTHLY' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Day of Month *</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formData.monthlyDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyDay: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)),
                        })
                      }
                      className="w-full md:w-56 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Example: 5 means class repeats on the 5th of each month in range.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting URL</label>
                <input
                  type="url"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting Password (Optional)</label>
                <input
                  type="text"
                  value={formData.meetingPassword}
                  onChange={(e) => setFormData({ ...formData, meetingPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {editingClass ? 'Update' : 'Create'} {editingClass ? 'Live Class' : 'Recurring Live Class'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingClass(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search and filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <HiFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={instructorFilter}
              onChange={(e) => {
                setInstructorFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All instructors</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Meeting Link
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-3/4" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-1/2" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                  </tr>
                ))
              ) : liveClasses.length > 0 ? (
                liveClasses.map((liveClass) => (
                  <tr key={liveClass.id} className="hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                      <div className="flex items-center gap-2">
                        <span>{liveClass.title}</span>
                        {extractSeriesIdFromLiveClass(liveClass) && (
                          <span className="inline-flex items-center rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                            Series session
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {liveClass.instructor?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {new Date(liveClass.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {liveClass.meetingProvider || 'OTHER'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {liveClass.zoomJoinUrl || liveClass.meetingUrl ? (
                        <a
                          href={liveClass.zoomJoinUrl || liveClass.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          liveClass.status === 'LIVE'
                            ? 'bg-red-100 text-red-800'
                            : liveClass.status === 'COMPLETED'
                            ? 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                            : liveClass.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}
                      >
                        {liveClass.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(liveClass)}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(liveClass.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                        {extractSeriesIdFromLiveClass(liveClass) && (
                          <button
                            type="button"
                            onClick={() => handleCancelSeries(extractSeriesIdFromLiveClass(liveClass)!)}
                            disabled={cancellingSeriesId === extractSeriesIdFromLiveClass(liveClass)}
                            className="text-sm text-amber-700 hover:underline disabled:opacity-60"
                          >
                            {cancellingSeriesId === extractSeriesIdFromLiveClass(liveClass)
                              ? 'Cancelling...'
                              : 'Cancel Series'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                    No live classes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="px-4 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted-foreground)]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
