
'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseForm } from '@/components/admin/CourseForm';
import { Course } from '@/lib/types/course';
import { Category } from '@/lib/types/course';
import { Instructor } from '@/lib/api/instructors';
import { CreateCourseData } from '@/lib/api/courses';
import * as courseApi from '@/lib/api/courses';
import * as categoryApi from '@/lib/api/categories';
import * as instructorApi from '@/lib/api/instructors';
import * as installmentApi from '@/lib/api/installments';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Button } from '@/components/ui/Button';

export default function EditCoursePage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState<installmentApi.InstallmentPlanAdmin | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    numberOfInstallments: 3,
    intervalMonths: 1,
    minAmountForPlan: '' as string,
    isActive: true,
  });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      const [courseData, categoriesData, instructorsResponse, planData] = await Promise.all([
        courseApi.getCourseById(courseId),
        categoryApi.getAllCategories(),
        instructorApi.getAllInstructors(),
        installmentApi.getPlanByCourseAdmin(courseId),
      ]);
      setCourse(courseData);
      setCategories(categoriesData || []);
      setInstructors(instructorsResponse.data || []);
      setInstallmentPlan(planData || null);
      if (planData) {
        setInstallmentForm({
          numberOfInstallments: planData.numberOfInstallments,
          intervalMonths: planData.intervalMonths,
          minAmountForPlan: planData.minAmountForPlan != null ? String(planData.minAmountForPlan) : '',
          isActive: planData.isActive,
        });
      }
    } catch (error) {
      console.error(`Error fetching data (attempt ${retryCount + 1}):`, error);

      // Retry up to 3 times for potential race conditions
      if (retryCount < 3) {
        setTimeout(() => fetchData(retryCount + 1), 1000);
        return;
      }

      showError(Object(error).message || 'An error occurred' || 'Failed to load course data');
      router.push('/admin/courses');
    } finally {
      if (retryCount === 0 || !loading) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (data: CreateCourseData) => {
    try {
      setSubmitting(true);
      await courseApi.updateCourse(courseId, data);
      showSuccess('Course updated successfully!');
      // router.push('/admin/courses'); - Stay on page for consistent behavior
    } catch (error) {
      console.error('Error updating course:', error);
      showError(Object(error).message || 'An error occurred' || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/courses');
  };

  const handleSaveInstallmentPlan = async () => {
    if (!courseId) return;
    setSavingPlan(true);
    try {
      await installmentApi.upsertPlanAdmin(courseId, {
        numberOfInstallments: installmentForm.numberOfInstallments,
        intervalMonths: installmentForm.intervalMonths,
        minAmountForPlan: installmentForm.minAmountForPlan === '' ? null : parseFloat(installmentForm.minAmountForPlan) || null,
        isActive: installmentForm.isActive,
      });
      showSuccess('Installment plan saved');
      const plan = await installmentApi.getPlanByCourseAdmin(courseId);
      setInstallmentPlan(plan || null);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeleteInstallmentPlan = async () => {
    if (!courseId || !confirm('Remove installment plan for this course?')) return;
    setSavingPlan(true);
    try {
      await installmentApi.deletePlanAdmin(courseId);
      showSuccess('Installment plan removed');
      setInstallmentPlan(null);
      setInstallmentForm({ numberOfInstallments: 3, intervalMonths: 1, minAmountForPlan: '', isActive: true });
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to remove plan');
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in fade-in duration-200">
        <div className="mb-8">
          <div className="h-9 w-64 bg-[var(--muted)] rounded mb-2 animate-pulse" />
          <div className="h-5 w-72 bg-[var(--muted)] rounded animate-pulse opacity-80" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
          <div className="h-48 bg-[var(--card)] border border-[var(--border)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Course not found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit Course</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Update course details below</p>
      </div>

      <CourseForm
        course={course}
        categories={categories}
        instructors={instructors}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />

      {/* Installment plan (EMI) */}
      <div className="mt-10 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Installment plan (EMI)</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Offer this course in installments. Only shown when course price ≥ min amount (if set).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Number of installments</label>
            <input
              type="number"
              min={1}
              max={12}
              value={installmentForm.numberOfInstallments}
              onChange={(e) => setInstallmentForm((f) => ({ ...f, numberOfInstallments: parseInt(e.target.value, 10) || 1 }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Interval (months)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={installmentForm.intervalMonths}
              onChange={(e) => setInstallmentForm((f) => ({ ...f, intervalMonths: parseInt(e.target.value, 10) || 1 }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Min price for plan (optional)</label>
            <input
              type="number"
              min={0}
              step={100}
              placeholder="e.g. 5000"
              value={installmentForm.minAmountForPlan}
              onChange={(e) => setInstallmentForm((f) => ({ ...f, minAmountForPlan: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={installmentForm.isActive}
                onChange={(e) => setInstallmentForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-[var(--border)]"
              />
              <span className="text-sm font-medium text-[var(--foreground)]">Active</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSaveInstallmentPlan} isLoading={savingPlan} disabled={savingPlan}>
            {installmentPlan ? 'Update plan' : 'Add installment plan'}
          </Button>
          {installmentPlan && (
            <Button variant="outline" onClick={handleDeleteInstallmentPlan} disabled={savingPlan}>
              Remove plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

