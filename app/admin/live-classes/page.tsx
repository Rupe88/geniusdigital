'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass } from '@/lib/api/liveClasses';
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
    meetingProvider: 'OTHER',
    meetingPassword: '',
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
    courseApi.getAllCourses({ limit: 200 }).then((r) => setCourses(r.data || [])).catch(() => setCourses([]));
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
      if (editingClass) {
        await liveClassApi.updateLiveClass(editingClass.id, formData);
        showSuccess('Live class updated successfully');
      } else {
        await liveClassApi.createLiveClass(formData);
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
      meetingProvider: (liveClass.meetingProvider as 'ZOOM' | 'GOOGLE_MEET' | 'OTHER') || 'OTHER',
      meetingPassword: liveClass.meetingPassword || '',
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
      meetingProvider: 'OTHER',
      meetingPassword: '',
    });
  };

  const meetingProviders = [
    { value: 'ZOOM', label: 'Zoom' },
    { value: 'GOOGLE_MEET', label: 'Google Meet' },
    { value: 'OTHER', label: 'Other' },
  ];

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
            {editingClass ? 'Edit Live Class' : 'Create Live Class'}
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
              </div>
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
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Duration (minutes) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Meeting Provider</label>
                <select
                  value={formData.meetingProvider}
                  onChange={(e) => setFormData({ ...formData, meetingProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {meetingProviders.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
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
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{liveClass.title}</td>
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
