'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import * as testimonialApi from '@/lib/api/testimonials';
import * as courseApi from '@/lib/api/courses';
import { Testimonial } from '@/lib/api/testimonials';
import { Course } from '@/lib/types/course';
import { PaginatedResponse } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiPencil, HiTrash, HiPlus, HiStar } from 'react-icons/hi';

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [pagination.page, search, statusFilter, courseFilter, featuredFilter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      // For admin, we can filter by published status
      if (statusFilter === 'published') {
        params.isPublished = 'true';
      } else if (statusFilter === 'draft') {
        params.isPublished = 'false';
      }
      // Note: If statusFilter is empty, admin will see all testimonials (backend handles this)
      if (courseFilter) params.courseId = courseFilter;
      if (featuredFilter) params.featured = featuredFilter === 'true';

      const response: PaginatedResponse<Testimonial> = await testimonialApi.getAllTestimonials(params);
      setTestimonials(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      showError(Object(error).message || 'Failed to load testimonials');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await courseApi.getAllCourses({ limit: 100 });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleDelete = async (testimonialId: string, testimonialName: string) => {
    if (!confirm(`Are you sure you want to delete "${testimonialName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(testimonialId);
      await testimonialApi.deleteTestimonial(testimonialId);
      showSuccess('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      showError(Object(error).message || 'Failed to delete testimonial');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (isPublished: boolean) => {
    if (isPublished) {
      return <Badge variant="success">Published</Badge>;
    }
    return <Badge variant="warning">Draft</Badge>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Testimonials</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage student testimonials and reviews</p>
        </div>
        <Link href="/admin/testimonials/new">
          <Button variant="primary">
            <HiPlus className="h-5 w-5 mr-2" />
            Add Testimonial
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
          <Select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            options={[
              { value: '', label: 'All Courses' },
              ...courses.map((course) => ({
                value: course.id,
                label: course.title,
              })),
            ]}
          />
          <Select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            options={[
              { value: '', label: 'All Featured' },
              { value: 'true', label: 'Featured' },
              { value: 'false', label: 'Not Featured' },
            ]}
          />
        </div>
      </Card>

      {/* Testimonials Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : testimonials && testimonials.length > 0 ? (
                testimonials.map((testimonial) => (
                  <tr key={testimonial.id} className="hover:bg-[var(--muted)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {testimonial.image ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">{testimonial.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{testimonial.name}</div>
                      {testimonial.designation && (
                        <div className="text-sm text-[var(--muted-foreground)]">{testimonial.designation}</div>
                      )}
                      {testimonial.company && (
                        <div className="text-xs text-[var(--muted-foreground)]">{testimonial.company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(testimonial.rating)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {testimonial.course?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(testimonial.isPublished)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {testimonial.featured ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                      {formatDate(testimonial.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/testimonials/${testimonial.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <HiPencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(testimonial.id, testimonial.name)}
                          disabled={deletingId === testimonial.id}
                        >
                          <HiTrash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No testimonials found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted-foreground)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} testimonials
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
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
