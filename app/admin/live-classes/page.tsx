'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass, CreateLiveClassPayload } from '@/lib/api/liveClasses';
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
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
  const DURATION_OPTIONS = [
    { label: '1 hr', value: 60 },
    { label: '1.5 hrs', value: 90 },
    { label: '2 hrs', value: 120 },
    { label: '3 hrs', value: 180 },
  ];
  const getWeeklyTimeRows = (dateString: string) => {
    const d = new Date(dateString);
    const activeDay = Number.isNaN(d.getTime()) ? -1 : d.getDay();
    const activeTime = Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return DAY_OPTIONS.map((day) => ({
      label: day.label,
      time: day.value === activeDay ? activeTime : 'Not scheduled',
      active: day.value === activeDay,
    }));
  };

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
    recurrenceType: 'WEEKLY' as 'WEEKLY',
    daysOfWeek: [0] as number[],
    startDate: '',
    startTime: '21:00',
    dayTimes: {
      0: '21:00',
      1: '21:00',
      2: '21:00',
      3: '21:00',
      4: '21:00',
      5: '21:00',
      6: '21:00',
    } as Record<number, string>,
    adminNotes: '',
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
  const selectedWeeklyDay = formData.daysOfWeek[0] ?? 0;
  const combineDateAndTime = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}`;
  };
  const shiftDateToSelectedWeekday = (dateValue: string, weekday: number) => {
    if (!dateValue) return dateValue;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return dateValue;
    const delta = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const renderDayTimeInputs = () => (
    <div className="rounded-md border border-[var(--border)] p-3">
      <p className="text-xs text-[var(--muted-foreground)] mb-2">
        Sunday to Saturday time setup (editable). Selected day/time will be used for save.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {DAY_OPTIONS.map((day) => (
          <div key={day.value} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  daysOfWeek: [day.value],
                  startDate: shiftDateToSelectedWeekday(prev.startDate, day.value),
                  startTime: prev.dayTimes[day.value] || prev.startTime,
                }))
              }
              className={`min-w-[96px] px-2.5 py-1.5 rounded-md border text-xs text-left ${
                formData.daysOfWeek.includes(day.value)
                  ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200'
                  : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]'
              }`}
            >
              {day.label}
            </button>
            <input
              type="time"
              value={formData.dayTimes[day.value] || '21:00'}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dayTimes: {
                    ...prev.dayTimes,
                    [day.value]: e.target.value,
                  },
                  ...(prev.daysOfWeek.includes(day.value) ? { startTime: e.target.value } : {}),
                }))
              }
              className="w-full px-2 py-1.5 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateLiveClassPayload = {
        title: formData.title,
        description: formData.description,
        adminNotes: formData.adminNotes || undefined,
        courseId: formData.courseId || undefined,
        instructorId: formData.instructorId,
        duration: formData.duration,
        meetingUrl: formData.meetingUrl || undefined,
        meetingPassword: formData.meetingPassword || undefined,
        meetingProvider: 'ZOOM',
      };

      if (!editingClass) {
        if (!formData.startDate || !formData.startTime) {
          throw new Error('Start date and start time are required.');
        }
        if (!formData.daysOfWeek.length) {
          throw new Error('Please select at least one weekday.');
        }
        payload.recurrenceType = 'WEEKLY';
        payload.daysOfWeek = formData.daysOfWeek;
        payload.startDate = formData.startDate;
        payload.startTime = formData.startTime;
      } else {
        if (!formData.startDate || !formData.startTime) {
          throw new Error('Scheduled date and time are required.');
        }
      }

      if (editingClass) {
        await liveClassApi.updateLiveClass(editingClass.id, {
          ...payload,
          scheduledAt: combineDateAndTime(formData.startDate, formData.startTime),
          recurrenceType: undefined,
          startDate: undefined,
          startTime: undefined,
        });
        showSuccess('Live class updated successfully');
      } else {
        await liveClassApi.createLiveClass(payload);
        showSuccess('Live class created successfully');
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
      recurrenceType: 'WEEKLY',
      daysOfWeek: [new Date(liveClass.scheduledAt).getDay()],
      startDate: new Date(liveClass.scheduledAt).toISOString().slice(0, 10),
      startTime: new Date(liveClass.scheduledAt).toTimeString().slice(0, 5),
      dayTimes: {
        0: '21:00',
        1: '21:00',
        2: '21:00',
        3: '21:00',
        4: '21:00',
        5: '21:00',
        6: '21:00',
        [new Date(liveClass.scheduledAt).getDay()]: new Date(liveClass.scheduledAt).toTimeString().slice(0, 5),
      },
      adminNotes: liveClass.adminNotes || '',
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
      recurrenceType: 'WEEKLY',
      daysOfWeek: [0],
      startDate: '',
      startTime: '21:00',
      dayTimes: {
        0: '21:00',
        1: '21:00',
        2: '21:00',
        3: '21:00',
        4: '21:00',
        5: '21:00',
        6: '21:00',
      },
      adminNotes: '',
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
          {showForm ? 'Cancel' : 'Create Live Class'}
        </Button>
      </div>

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {editingClass ? 'Edit Live Class' : 'Create Weekly Live Class'}
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
              {!editingClass && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Recurrence</label>
                  <input
                    type="text"
                    value="Weekly"
                    readOnly
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--muted)] text-[var(--foreground)]"
                  />
                </div>
              )}
            </div>
            {editingClass ? (
              <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
                {renderDayTimeInputs()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Scheduled Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Scheduled Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                          dayTimes: {
                            ...prev.dayTimes,
                            [selectedWeeklyDay]: e.target.value,
                          },
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-md border border-[var(--border)] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderDayTimeInputs()}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                          dayTimes: {
                            ...prev.dayTimes,
                            [selectedWeeklyDay]: e.target.value,
                          },
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Time is saved per selected weekday.
                    </p>
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
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Weekly recurrence is enabled. One live class is created per submit.
                </p>
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
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Admin Notes (Optional)</label>
              <textarea
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                rows={2}
                placeholder="Add note for students (e.g. if class is postponed, timing updates, etc.)"
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
                {editingClass ? 'Update' : 'Create'} Live Class
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
                  Weekly Schedule
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
                    <td className="px-4 py-3"><div className="h-16 bg-[var(--muted)] rounded w-40" /></td>
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
                      {liveClass.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {liveClass.instructor?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      {new Date(liveClass.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="rounded-md border border-[var(--border)] overflow-hidden">
                        <table className="w-full text-[10px]">
                          <tbody>
                            {getWeeklyTimeRows(liveClass.scheduledAt).map((row) => (
                              <tr
                                key={`${liveClass.id}-${row.label}`}
                                className={`border-t border-[var(--border)] first:border-t-0 ${
                                  row.active ? 'bg-amber-100/70 dark:bg-amber-900/35' : 'bg-[var(--background)]'
                                }`}
                              >
                                <td className={`px-2 py-0.5 ${row.active ? 'text-amber-900 dark:text-amber-200 font-semibold' : 'text-[var(--muted-foreground)]'}`}>{row.label}</td>
                                <td className={`px-2 py-0.5 ${row.active ? 'text-amber-900 dark:text-amber-200 font-semibold' : 'text-[var(--foreground)]'}`}>{row.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
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
