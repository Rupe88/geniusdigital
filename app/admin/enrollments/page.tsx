
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
import { HiDownload, HiFilter, HiTrash, HiSearch, HiUpload, HiCheck, HiX } from 'react-icons/hi';
import { getAllCoupons, validateCoupon, type Coupon } from '@/lib/api/coupon';
import { apiClient } from '@/lib/api/axios';

type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

function couponAppliesToCourse(c: Coupon, courseId: string): boolean {
  if (!courseId) return true;
  const arr = c.applicableCourses;
  if (!arr || !Array.isArray(arr) || arr.length === 0) return true;
  return arr.includes(courseId);
}

type GrantCouponPreview =
  | null
  | { valid: true; discountAmount: number; finalAmount: number; code: string }
  | { valid: false; message: string };

type PendingManualPayment = {
  id: string;
  transactionId: string;
  createdAt: string;
  finalAmount?: number;
  paymentMethod?: string;
  proofImageUrl?: string | null;
  user?: { fullName?: string | null; email?: string | null };
  course?: { title?: string | null };
};

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
  
  // Partial Access State
  const [showPartialAccessModal, setShowPartialAccessModal] = useState(false);
  const [partialAccessDuration, setPartialAccessDuration] = useState(7);
  const [partialAccessPrice, setPartialAccessPrice] = useState('');
  const [partialAccessNotes, setPartialAccessNotes] = useState('');
  
  const [studentResults, setStudentResults] = useState<User[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importCourseId, setImportCourseId] = useState('');
  const [importResult, setImportResult] = useState<{ granted: number; failed: string[]; skipped: string[] } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const studentSearchRef = useRef<HTMLDivElement>(null);

  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [grantCouponId, setGrantCouponId] = useState('');
  const [grantCouponPreview, setGrantCouponPreview] = useState<GrantCouponPreview>(null);
  const [pendingManualPayments, setPendingManualPayments] = useState<PendingManualPayment[]>([]);
  const [pendingManualLoading, setPendingManualLoading] = useState(false);
  const [manualActionId, setManualActionId] = useState<string | null>(null);

  const selectedCourseForGrant = availableCourses.find((c) => c.id === grantCourseId) || null;
  const existingEnrollmentForGrant =
    enrollments.find((e) => e.userId === grantUserId && e.courseId === grantCourseId) || null;
  const baseCoursePrice = selectedCourseForGrant?.price ?? 0;
  const alreadyPaidForGrant = existingEnrollmentForGrant?.pricePaid ?? 0;
  const partialPaymentAmount = partialAccessPrice ? Number(partialAccessPrice) : 0;
  const newTotalPaidForGrant = alreadyPaidForGrant + (Number.isFinite(partialPaymentAmount) ? partialPaymentAmount : 0);

  const effectiveNetCap =
    existingEnrollmentForGrant?.netPayableAfterDiscount != null
      ? Number(existingEnrollmentForGrant.netPayableAfterDiscount)
      : grantCouponPreview && grantCouponPreview.valid
        ? grantCouponPreview.finalAmount
        : baseCoursePrice;

  const remainingAfterGrant =
    effectiveNetCap > 0 ? Math.max(0, effectiveNetCap - newTotalPaidForGrant) : 0;

  const couponsForSelectedCourse = activeCoupons.filter((c) => couponAppliesToCourse(c, grantCourseId));
  const enrollmentHasCoupon = Boolean(existingEnrollmentForGrant?.couponId);

  useEffect(() => {
    fetchEnrollments();
  }, [pagination.page, status, courseId]);

  const fetchPendingManualPayments = useCallback(async () => {
    try {
      setPendingManualLoading(true);
      const r = await apiClient.get('/payments/admin', {
        params: { page: 1, limit: 50, status: 'PENDING' },
      });
      if (r.data?.success) {
        const all: PendingManualPayment[] = r.data.data || [];
        const pendingProofs = all.filter((p) => p.proofImageUrl);
        setPendingManualPayments(pendingProofs);
      } else {
        setPendingManualPayments([]);
      }
    } catch {
      setPendingManualPayments([]);
    } finally {
      setPendingManualLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingManualPayments();
  }, [fetchPendingManualPayments]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAllCoupons({ status: 'ACTIVE', page: 1, limit: 500 });
        if (!cancelled) setActiveCoupons(res.data || []);
      } catch {
        if (!cancelled) setActiveCoupons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!grantCourseId || !grantCouponId || enrollmentHasCoupon || !baseCoursePrice) {
        setGrantCouponPreview(null);
        return;
      }
      const c = activeCoupons.find((x) => x.id === grantCouponId);
      if (!c) {
        setGrantCouponPreview(null);
        return;
      }
      const res = await validateCoupon({
        code: c.code,
        amount: baseCoursePrice,
        courseId: grantCourseId,
      });
      if (cancelled) return;
      if (res.valid) {
        setGrantCouponPreview({
          valid: true,
          discountAmount: res.discountAmount,
          finalAmount: res.finalAmount,
          code: res.coupon.code,
        });
      } else {
        setGrantCouponPreview({ valid: false, message: res.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [grantCourseId, grantCouponId, baseCoursePrice, enrollmentHasCoupon, activeCoupons]);

  useEffect(() => {
    if (!grantCouponId) return;
    const stillApplies = couponsForSelectedCourse.some((c) => c.id === grantCouponId);
    if (!stillApplies) {
      setGrantCouponId('');
      setGrantCouponPreview(null);
    }
  }, [grantCourseId, couponsForSelectedCourse, grantCouponId]);

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

    if (grantCouponId && baseCoursePrice > 0) {
      if (grantCouponPreview?.valid === false) {
        showError(grantCouponPreview.message || 'Invalid coupon for this course');
        return;
      }
      if (!grantCouponPreview?.valid) {
        showError('Validating coupon… try again in a moment.');
        return;
      }
    }

    try {
      setGrantLoading(true);
      const selectedCoupon = grantCouponId ? activeCoupons.find((c) => c.id === grantCouponId) : null;
      const sendCoupon =
        baseCoursePrice > 0 && selectedCoupon && grantCouponPreview?.valid === true;
      await enrollmentApi.grantCourseAccess(userId, grantCourseId, {
        ...(sendCoupon ? { couponCode: selectedCoupon.code } : {}),
      });
      showSuccess('Course access granted successfully');

      setGrantEmail('');
      setGrantUserId(null);
      setGrantCourseId('');
      setGrantCouponId('');
      setGrantCouponPreview(null);
      setStudentResults([]);
      setShowStudentDropdown(false);
      fetchEnrollments();
    } catch (error) {
      showError(Object(error).message || 'Failed to grant course access');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleGrantPartialAccess = async () => {
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

    if (!enrollmentHasCoupon && grantCouponId && baseCoursePrice > 0) {
      if (grantCouponPreview?.valid === false) {
        showError(grantCouponPreview.message || 'Invalid coupon for this course');
        return;
      }
      if (!grantCouponPreview?.valid) {
        showError('Validating coupon… try again in a moment.');
        return;
      }
    }

    try {
      setGrantLoading(true);
      const selectedCoupon = grantCouponId ? activeCoupons.find((c) => c.id === grantCouponId) : null;
      const canSendCoupon =
        baseCoursePrice > 0 &&
        !enrollmentHasCoupon &&
        selectedCoupon &&
        grantCouponPreview?.valid === true;

      await enrollmentApi.grantPartialAccess({
        userId,
        courseId: grantCourseId,
        accessType: 'PARTIAL',
        durationDays: partialAccessDuration,
        pricePaid: partialAccessPrice ? parseFloat(partialAccessPrice) : undefined,
        adminNotes: partialAccessNotes,
        ...(canSendCoupon ? { couponCode: selectedCoupon.code } : {}),
      });
      showSuccess(`Partial access granted successfully for ${partialAccessDuration} days`);

      // Reset form
      setGrantEmail('');
      setGrantUserId(null);
      setGrantCourseId('');
      setGrantCouponId('');
      setGrantCouponPreview(null);
      setStudentResults([]);
      setShowStudentDropdown(false);
      setShowPartialAccessModal(false);
      setPartialAccessDuration(7);
      setPartialAccessPrice('');
      setPartialAccessNotes('');
      fetchEnrollments();
    } catch (error) {
      showError(Object(error).message || 'Failed to grant partial access');
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

  const handleApproveManual = async (paymentId: string) => {
    if (!confirm('Approve this payment and complete enrollment/order?')) return;
    try {
      setManualActionId(paymentId);
      const response = await apiClient.post(`/payments/admin/${paymentId}/approve-manual`);
      if (response.data?.success) {
        showSuccess('Manual payment approved');
        fetchPendingManualPayments();
        fetchEnrollments();
      }
    } catch (error) {
      showError(Object(error).message || 'Failed to approve payment');
    } finally {
      setManualActionId(null);
    }
  };

  const handleRejectManual = async (paymentId: string) => {
    const reason = window.prompt('Optional rejection reason:') ?? '';
    if (!confirm('Reject this manual payment proof?')) return;
    try {
      setManualActionId(paymentId);
      const response = await apiClient.post(`/payments/admin/${paymentId}/reject-manual`, {
        reason: reason.trim() || undefined,
      });
      if (response.data?.success) {
        showSuccess('Manual payment rejected');
        fetchPendingManualPayments();
      }
    } catch (error) {
      showError(Object(error).message || 'Failed to reject payment');
    } finally {
      setManualActionId(null);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'danger';
      case 'EXPIRED': return 'danger';
      default: return 'default';
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      await enrollmentApi.exportEnrollmentsDetail({
        status: (status === '' ? undefined : status) as EnrollmentStatus | undefined,
        courseId: courseId || undefined,
        search: search.trim() || undefined,
      });
      showSuccess('Detailed enrollments CSV downloaded (uses current status, course, and search filters)');
    } catch (error) {
      showError(Object(error).message || 'Failed to export enrollments');
    } finally {
      setExportLoading(false);
    }
  };

  const parseCsvEmails = (text: string): string[] => {
    const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
    const emails: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const emailCol = cols.find((c) => c.toLowerCase().includes('@'));
      const firstCell = (emailCol ?? cols[0] ?? '').trim();
      if (firstCell.toLowerCase() === 'email') continue;
      const email = firstCell.toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !seen.has(email)) {
        seen.add(email);
        emails.push(email);
      }
    }
    return emails;
  };

  const handleDownloadImportTemplate = () => {
    const template = 'email\nuser1@example.com\nuser2@example.com';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-grant-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Template downloaded');
  };

  const handleImportAndGrant = async () => {
    if (!importCourseId) {
      showError('Please select a course to grant access');
      return;
    }
    if (!importFile) {
      showError('Please select a CSV file');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      const text = await importFile.text();
      const emails = parseCsvEmails(text);
      if (emails.length === 0) {
        showError('No valid emails found in the file. Use format: email (one per row)');
        return;
      }

      const granted: string[] = [];
      const failed: string[] = [];
      const skipped: string[] = [];

      for (const email of emails) {
        try {
          const usersResult = await adminApi.getAllUsers({ search: email, page: 1, limit: 1 });
          const user = usersResult.data?.find((u) => u.email?.toLowerCase() === email);
          if (!user) {
            failed.push(`${email} (user not found)`);
            continue;
          }
          try {
            await enrollmentApi.grantCourseAccess(user.id, importCourseId);
            granted.push(email);
          } catch (grantErr: unknown) {
            const msg = Object(grantErr).message || '';
            if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
              skipped.push(`${email} (already enrolled)`);
            } else {
              failed.push(`${email} (${msg})`);
            }
          }
        } catch {
          failed.push(`${email} (lookup failed)`);
        }
      }

      setImportResult({ granted: granted.length, failed, skipped });
      showSuccess(`${granted.length} user(s) granted access`);
      setImportFile(null);
      if ((document.getElementById('import-csv-input') as HTMLInputElement)) {
        (document.getElementById('import-csv-input') as HTMLInputElement).value = '';
      }
      fetchEnrollments();
    } catch (error) {
      showError(Object(error).message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Enrollment Management</h1>
        <p className="text-[var(--muted-foreground)] mt-2">View and manage student course enrollments</p>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Pending Manual Payment Proofs</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchPendingManualPayments}
            disabled={pendingManualLoading}
          >
            {pendingManualLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
        {pendingManualPayments.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {pendingManualLoading ? 'Loading pending proofs…' : 'No pending manual payment proofs yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-[var(--border)]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Student</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Course</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Txn ID</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Amount</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Screenshot</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pendingManualPayments.slice(0, 20).map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--foreground)]">
                        {p.user?.fullName || 'Unknown Student'}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {p.user?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{p.course?.title || 'Unknown Course'}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{p.transactionId}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      Rs. {Number(p.finalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.proofImageUrl ? (
                        <a
                          href={p.proofImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--primary-700)] underline"
                        >
                          View screenshot
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">No screenshot</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveManual(p.id)}
                          disabled={manualActionId === p.id}
                        >
                          <HiCheck className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectManual(p.id)}
                          disabled={manualActionId === p.id}
                        >
                          <HiX className="w-4 h-4 mr-1" />
                          Reject
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

      <Card padding="md" className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Grant Course Access Manually</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Search by student email or name, select from the list, then choose a course.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div ref={studentSearchRef} className="relative md:col-span-1">
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
            <div className="relative">
              <select
                className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] appearance-none"
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none">
                <HiSearch className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="flex gap-2 md:col-span-1">
            <Button
              variant="primary"
              onClick={handleGrantAccess}
              disabled={grantLoading}
              className="flex-1"
            >
              {grantLoading ? 'Granting access...' : 'Grant Full Access'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPartialAccessModal(true)}
              disabled={!grantUserId || !grantCourseId}
              className="flex-1"
            >
              Grant Partial Access
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Coupon (optional)
            </label>
            <select
              className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] disabled:opacity-60"
              value={grantCouponId}
              onChange={(e) => setGrantCouponId(e.target.value)}
              disabled={
                !grantCourseId ||
                enrollmentHasCoupon ||
                !baseCoursePrice ||
                Boolean(selectedCourseForGrant?.isFree)
              }
            >
              <option value="">No coupon</option>
              {couponsForSelectedCourse.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                  {c.couponType === 'PERCENTAGE' ? ` (${c.discountValue}%)` : ` (Rs. ${c.discountValue})`}
                </option>
              ))}
            </select>
            {(!baseCoursePrice || selectedCourseForGrant?.isFree) && grantCourseId && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Coupons apply to paid courses only.
              </p>
            )}
            {enrollmentHasCoupon && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                This enrollment already has coupon{' '}
                {existingEnrollmentForGrant?.coupon?.code ? `(${existingEnrollmentForGrant.coupon.code})` : ''}. Use
                partial access to add payments only.
              </p>
            )}
            {grantCouponId && grantCouponPreview?.valid === false && (
              <p className="text-xs text-red-600 mt-1">{grantCouponPreview.message}</p>
            )}
            {grantCouponPreview?.valid === true && (
              <p className="text-xs text-green-700 mt-1">
                Discount Rs. {grantCouponPreview.discountAmount.toLocaleString()} → Net Rs.{' '}
                {grantCouponPreview.finalAmount.toLocaleString()} (list Rs. {baseCoursePrice.toLocaleString()})
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card padding="md" className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Import & Bulk Grant Access</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upload a CSV with user emails (one per row) to grant multiple users access to a course. Export users from User Management to get the list.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Course</label>
            <select
              className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              value={importCourseId}
              onChange={(e) => setImportCourseId(e.target.value)}
            >
              <option value="">Select course</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">CSV File</label>
            <input
              id="import-csv-input"
              type="file"
              accept=".csv"
              className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-medium file:bg-[var(--primary-50)] file:text-[var(--primary-700)] hover:file:bg-[var(--primary-100)]"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleImportAndGrant}
            disabled={importLoading || !importCourseId || !importFile}
          >
            <HiUpload className="w-4 h-4 mr-2" />
            {importLoading ? 'Importing…' : 'Import & Grant'}
          </Button>
          <Button variant="outline" onClick={handleDownloadImportTemplate} type="button">
            Download template
          </Button>
        </div>
        {importResult && (
          <div className="rounded border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-sm space-y-2">
            <p className="font-medium text-green-600">{importResult.granted} user(s) granted access</p>
            {importResult.skipped.length > 0 && (
              <p className="text-amber-600">
                Skipped ({importResult.skipped.length}): {importResult.skipped.slice(0, 5).join(', ')}
                {importResult.skipped.length > 5 ? ` +${importResult.skipped.length - 5} more` : ''}
              </p>
            )}
            {importResult.failed.length > 0 && (
              <p className="text-red-600">
                Failed ({importResult.failed.length}): {importResult.failed.slice(0, 5).join(', ')}
                {importResult.failed.length > 5 ? ` +${importResult.failed.length - 5} more` : ''}
              </p>
            )}
          </div>
        )}
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
              { value: 'EXPIRED', label: 'Expired' },
            ]}
          />
        </div>
        <Button variant="outline" onClick={handleApplyFilters} className="h-[42px]">
          <HiFilter className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
        <Button
          variant="secondary"
          className="h-[42px]"
          onClick={handleExport}
          disabled={exportLoading}
          title="CSV includes phone, login email, access expiry, net/total due, paid vs remaining, installments, and all completed payments for each row. Uses the status, course, and search fields above (apply filters first if you changed them)."
        >
          <HiDownload className="w-4 h-4 mr-2" />
          {exportLoading ? 'Exporting…' : 'Export full CSV'}
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
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Access Type</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Expires At</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Course Price</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Coupon / Net</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)]">Paid / Remaining</th>
                <th className="px-6 py-4 font-semibold text-[var(--foreground)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="h-4 bg-[var(--muted)] rounded-none w-full"></div>
                    </td>
                  </tr>
                ))
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.accessType === 'PARTIAL' 
                          ? 'bg-blue-100 text-blue-800' 
                          : enrollment.accessType === 'FULL'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.accessType || 'FULL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.accessExpiresAt ? (
                        <div className="text-sm">
                          <div>{formatDate(enrollment.accessExpiresAt)}</div>
                          {new Date(enrollment.accessExpiresAt) < new Date() && (
                            <span className="text-red-500 text-xs">Expired</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No expiration</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.course ? (
                        <div className="text-sm">
                          {typeof enrollment.course.originalPrice === 'number' ? (
                            <>
                              <span className="line-through text-xs text-gray-400 mr-1">
                                Rs. {enrollment.course.originalPrice.toLocaleString()}
                              </span>
                              <span className="font-medium">
                                Rs. {enrollment.course.price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">
                              Rs. {enrollment.course.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.coupon?.code ||
                      enrollment.netPayableAfterDiscount != null ||
                      (enrollment.adminDiscountAmount ?? 0) > 0 ? (
                        <div className="text-sm space-y-0.5">
                          {enrollment.coupon?.code && (
                            <div className="font-medium text-[var(--foreground)]">{enrollment.coupon.code}</div>
                          )}
                          {(enrollment.adminDiscountAmount ?? 0) > 0 && (
                            <div className="text-xs text-amber-700">
                              Discount −Rs. {(enrollment.adminDiscountAmount ?? 0).toLocaleString()}
                            </div>
                          )}
                          {enrollment.netPayableAfterDiscount != null &&
                            Number(enrollment.netPayableAfterDiscount) >= 0 && (
                              <div className="text-xs text-[var(--muted-foreground)]">
                                Net due Rs. {Number(enrollment.netPayableAfterDiscount).toLocaleString()}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>
                          Paid:{' '}
                          <span className="font-medium">
                            Rs. {(enrollment.pricePaid || 0).toLocaleString()}
                          </span>
                        </div>
                        {typeof enrollment.remainingBalance === 'number' ? (
                          <div className="text-xs text-[var(--muted-foreground)]">
                            Remaining: Rs. {Math.max(0, enrollment.remainingBalance).toLocaleString()}
                            {enrollment.accessType === 'PARTIAL' && ' (partial access)'}
                          </div>
                        ) : (
                          enrollment.course &&
                          typeof enrollment.course.price === 'number' && (
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Remaining:{' '}
                              Rs.{' '}
                              {Math.max(
                                0,
                                enrollment.course.price - (enrollment.pricePaid || 0),
                              ).toLocaleString()}
                              {enrollment.accessType === 'PARTIAL' && ' (partial access)'}
                            </div>
                          )
                        )}
                      </div>
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

      {/* Partial Access Modal */}
      {showPartialAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              Grant Partial Access
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Duration (Days)
                </label>
                <select
                  className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  value={partialAccessDuration}
                  onChange={(e) => setPartialAccessDuration(parseInt(e.target.value))}
                >
                  <option value={7}>7 Days</option>
                  <option value={10}>10 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={20}>20 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                  <option value={548}>1.5 Years</option>
                  <option value={730}>2 Years</option>
                  <option value={1095}>3 Years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Price Paid (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount paid"
                  value={partialAccessPrice}
                  onChange={(e) => setPartialAccessPrice(e.target.value)}
                />
              </div>

              <div className="rounded border border-dashed border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Course price (list)</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {baseCoursePrice
                      ? `Rs. ${baseCoursePrice.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
                {enrollmentHasCoupon &&
                  (existingEnrollmentForGrant?.adminDiscountAmount ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">
                          Coupon ({existingEnrollmentForGrant?.coupon?.code ?? '—'})
                        </span>
                        <span className="text-amber-700">
                          −Rs. {(existingEnrollmentForGrant?.adminDiscountAmount ?? 0).toLocaleString()}
                        </span>
                      </div>
                      {existingEnrollmentForGrant?.netPayableAfterDiscount != null && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-foreground)]">Net due (enrollment)</span>
                          <span className="font-semibold text-[var(--foreground)]">
                            Rs.{' '}
                            {Number(existingEnrollmentForGrant.netPayableAfterDiscount).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                {!enrollmentHasCoupon && grantCouponPreview?.valid === true && baseCoursePrice > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Coupon ({grantCouponPreview.code})</span>
                      <span className="text-amber-700">
                        −Rs. {grantCouponPreview.discountAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Net due (after coupon)</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        Rs. {grantCouponPreview.finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Already paid</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    Rs. {alreadyPaidForGrant.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">This payment</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    Rs. {(Number.isFinite(partialPaymentAmount) ? partialPaymentAmount : 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--border)]/60 mt-1">
                  <span className="text-[var(--muted-foreground)]">Total paid after grant</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    Rs. {newTotalPaidForGrant.toLocaleString()}
                  </span>
                </div>
                {baseCoursePrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Remaining</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      Rs. {remainingAfterGrant.toLocaleString()}
                    </span>
                  </div>
                )}
                {existingEnrollmentForGrant?.accessType === 'PARTIAL' && (
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Existing enrollment is already on partial access; this will extend duration and update totals.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  className="block w-full rounded-none border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  rows={3}
                  placeholder="Add notes about this partial access grant..."
                  value={partialAccessNotes}
                  onChange={(e) => setPartialAccessNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  onClick={() => setShowPartialAccessModal(false)}
                  className="flex-1 h-10"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGrantPartialAccess}
                  disabled={grantLoading}
                  className="flex-1 h-10"
                >
                  {grantLoading ? 'Granting...' : 'Grant Access'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

