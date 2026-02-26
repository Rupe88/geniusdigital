
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import * as enrollmentApi from '@/lib/api/enrollments';
import * as adminApi from '@/lib/api/admin';
import * as coursesApi from '@/lib/api/courses';
import { Enrollment } from '@/lib/types/course';
import type { Course } from '@/lib/types/course';
import type { User } from '@/lib/types/auth';
import { formatDate } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiDownload, HiFilter, HiTrash, HiSearch } from 'react-icons/hi';

type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [studentResults, setStudentResults] = useState<User[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEnrollments();
  }, [pagination.page, status, courseId]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // All courses for dropdowns (no status filter = all statuses)
        const res = await coursesApi.getAllCourses({ page: 1, limit: 500 });
        setAvailableCourses(res.data || []);
      } catch (error) {
        console.error('Failed to load courses:', error);
      }
    };
    loadCourses();
  }, []);

  // Debounced search for students by email/name
  useEffect(() => {
    const q = grantEmail.trim();
    if (!q) {
      setStudentResults([]);
      setShowStudentDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setStudentSearchLoading(true);
      try {
        const res = await adminApi.getAllUsers({ search: q, page: 1, limit: 10 });
        setStudentResults(res.data || []);
        setShowStudentDropdown((res.data?.length ?? 0) > 0);
      } catch {
        setStudentResults([]);
        setShowStudentDropdown(false);
      } finally {
        setStudentSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [grantEmail]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectStudent = useCallback((user: User) => {
    setGrantEmail(user.email);
    setGrantUserId(user.id);
    setShowStudentDropdown(false);
    setStudentResults([]);
  }, []);

  const handleGrantInputChange = useCallback((value: string) => {
    setGrantEmail(value);
    setGrantUserId(null);
  }, []);

  const fetchEnrollments = async (opts?: { page?: number }) => {
    try {
      setLoading(true);
      const page = opts?.page ?? pagination.page;
      const data = await enrollmentApi.getAllEnrollments({
        page,
        limit: pagination.limit,
        status: (status === '' ? undefined : status) as EnrollmentStatus | undefined,
        courseId: courseId || undefined,
        search: search.trim() || undefined,
      });
      setEnrollments(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showError(Object(error).message || 'An error occurred' || 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEnrollments({ page: 1 });
  };

  const handleGrantAccess = async () => {
    if (!grantEmail.trim()) {
      showError('Please search and select a student to grant access');
      return;
    }
    if (!grantCourseId) {
      showError('Please select a course to grant access');
      return;
    }

    let userId = grantUserId;
    if (!userId) {
      // Fallback: search by email
      try {
        const usersResult = await adminApi.getAllUsers({
          page: 1,
          limit: 1,
          search: grantEmail.trim(),
        });
        userId = usersResult.data[0]?.id;
      } catch {
        showError('Failed to find student');
        return;
      }
    }
    if (!userId) {
      showError('No student found. Search by email or name and select from the list.');
      return;
    }

    try {
      setGrantLoading(true);
      await enrollmentApi.grantCourseAccess(userId, grantCourseId);
      showSuccess('Course access granted successfully');

      setGrantEmail('');
      setGrantUserId(null);
      setGrantCourseId('');
      setStudentResults([]);
      setShowStudentDropdown(false);
      fetchEnrollments();
    } catch (error) {
      showError(Object(error).message || 'Failed to grant course access');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) return;
    try {
      await enrollmentApi.deleteEnrollment(id);
      showSuccess('Enrollment removed successfully');
      fetchEnrollments();
    } catch (error) {
      showError(Object(error).message || 'An error occurred' || 'Failed to remove enrollment');
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Enrollment Management</h1>
        <p className="text-[var(--muted-foreground)] mt-2">View and manage student course enrollments</p>
      </div>

      <Card padding="md" className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Grant Course Access Manually</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Search by student email or name, select from the list, then choose a course.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div ref={studentSearchRef} className="relative">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Student
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={grantEmail}
                onChange={(e) => handleGrantInputChange(e.target.value)}
                onFocus={() => studentResults.length > 0 && setShowStudentDropdown(true)}
                className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                {studentSearchLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <HiSearch className="h-4 w-4" />
                )}
              </span>
            </div>
            {showStudentDropdown && studentResults.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded border border-[var(--border)] bg-[var(--background)] shadow-lg">
                {studentResults.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectStudent(user)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex flex-col"
                    >
                      <span className="font-medium text-[var(--foreground)]">
                        {user.fullName || 'No name'}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">{user.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Course</label>
            <select
              className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              value={grantCourseId}
              onChange={(e) => setGrantCourseId(e.target.value)}
            >
              <option value="">Select course</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            onClick={handleGrantAccess}
            disabled={grantLoading}
            className="w-full md:w-auto"
          >
            {grantLoading ? 'Granting access...' : 'Grant Access'}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Search by student name, email or course"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>
        <div className="w-full md:w-56">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Filter by Course</label>
          <select
            className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Courses</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-40">
          <Select
            label="Filter Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
        <Button variant="outline" onClick={handleApplyFilters} className="h-[42px]">
          <HiFilter className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
        <Button variant="secondary" className="h-[42px]">
          <HiDownload className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Student</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Course</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Enrolled Date</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Status</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Price Paid</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-[var(--muted)] rounded-none w-full"></div>
                    </td>
                  </tr>
                ))
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No enrollments found matching your criteria.
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{enrollment.user?.fullName || 'Unknown Student'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{enrollment.user?.email || 'No Email'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{enrollment.course?.title || 'Unknown Course'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">ID: #{enrollment.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)]">
                      {(enrollment.enrolledAt || enrollment.createdAt)
                      ? formatDate((enrollment.enrolledAt || enrollment.createdAt) as string)
                      : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      Rs. {(enrollment.pricePaid || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 p-2"
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
                      >
                        <HiTrash className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">
              Showing {enrollments.length} of {pagination.total} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

