'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseForm } from '@/components/admin/CourseForm';
import { useAuth } from '@/lib/context/AuthContext';
import { Course } from '@/lib/types/course';
import { Category } from '@/lib/types/course';
import { Instructor } from '@/lib/api/instructors';
import { CreateCourseData } from '@/lib/api/courses';
import * as courseApi from '@/lib/api/courses';
import * as categoryApi from '@/lib/api/categories';
import * as instructorApi from '@/lib/api/instructors';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function InstructorManageCoursePage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const params = use(paramsPromise);
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role !== 'INSTRUCTOR') {
      router.replace('/dashboard/my-courses');
      return;
    }
    if (courseId && user?.role === 'INSTRUCTOR') {
      fetchData();
    }
  }, [courseId, user?.role, loading]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [courseData, categoriesData, instructorsResponse] = await Promise.all([
        courseApi.getCourseById(courseId),
        categoryApi.getAllCategories(),
        instructorApi.getAllInstructors(),
      ]);
      setCourse(courseData);
      setCategories(categoriesData || []);
      setInstructors(instructorsResponse.data || []);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load course data');
      router.push('/dashboard/my-courses');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (data: CreateCourseData) => {
    try {
      setSubmitting(true);
      await courseApi.updateCourse(courseId, data);
      showSuccess('Course updated successfully');
      await fetchData();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/my-courses');
  };

  if (loading || pageLoading) {
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
      <div className="flex items-center justify-center min-h-[320px] text-[var(--muted-foreground)]">
        Course not found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Manage Course</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Update your assigned course details and curriculum.
        </p>
      </div>

      <CourseForm
        course={course}
        categories={categories}
        instructors={instructors}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
