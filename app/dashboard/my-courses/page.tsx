'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as enrollmentApi from '@/lib/api/enrollments';
import { getUpcomingEvents } from '@/lib/api/events';
import { getUpcomingEventCourses } from '@/lib/api/courses';
import { reviewsApi, type Review } from '@/lib/api/reviews';
import { Enrollment } from '@/lib/types/course';
import { formatDate } from '@/lib/utils/helpers';
import { showError, showSuccess } from '@/lib/utils/toast';

export default function MyCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageLimit = 100; // backend max for this endpoint is 100
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number }>({
    page: 1,
    limit: pageLimit,
    total: 0,
    pages: 1,
  });
  const [accessInfo, setAccessInfo] = useState<Record<string, any | null>>({});
  const [upcomingItems, setUpcomingItems] = useState<
    {
      id: string;
      slug?: string;
      title: string;
      type: 'event' | 'course';
      dateLabel?: string;
      thumbnail?: string | null;
    }[]
  >([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewCourse, setReviewCourse] = useState<Enrollment['course'] | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getUserEnrollments({ page, limit: pageLimit });
      setEnrollments(data.data);
      setPagination(data.pagination);
      
      // Check access expiry for each enrollment
      const accessPromises = data.data.map(async (enrollment) => {
        try {
          const accessData = await enrollmentApi.checkAccessExpiry(enrollment.courseId);
          return { [enrollment.courseId]: accessData };
        } catch (error) {
          console.error(`Error checking access for course ${enrollment.courseId}:`, error);
          return { [enrollment.courseId]: null };
        }
      });
      
      const accessResults = await Promise.all(accessPromises);
      const accessMap = Object.assign({}, ...accessResults);
      setAccessInfo(accessMap);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [page]);

  const fetchUpcoming = async () => {
    try {
      setLoadingUpcoming(true);
      const [events, courses] = await Promise.all([getUpcomingEvents(), getUpcomingEventCourses()]);
      const mappedEvents =
        events?.map((e: any) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          type: 'event' as const,
          thumbnail: e.image || null,
          dateLabel: e.startDate ? formatDate(e.startDate) : undefined,
        })) ?? [];
      const mappedCourses =
        courses?.map((c: any) => ({
          id: c.id,
          title: c.title,
          type: 'course' as const,
          thumbnail: c.thumbnail || null,
          dateLabel: c.startDate ? formatDate(c.startDate) : undefined,
        })) ?? [];
      setUpcomingItems([...mappedEvents, ...mappedCourses]);
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
      setUpcomingItems([]);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const courseCardShellClass =
    'bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg cursor-pointer';

  const upcomingHref = (item: (typeof upcomingItems)[0]) =>
    item.type === 'course' ? `/courses/${item.id}` : `/events/${item.slug || item.id}`;

  const upcomingSideItems = upcomingItems.slice(0, 6);
  const relatedCourseItems = upcomingItems.filter((item) => item.type === 'course').slice(0, 6);
  const shimmerPulse = 'animate-pulse';

  const CourseCardShimmer = () => (
    <div className={`${courseCardShellClass} ${shimmerPulse}`} aria-hidden>
      <div className="relative w-full h-52 p-2 bg-white">
        <div className="h-full w-full rounded-lg bg-[var(--muted)]" />
      </div>
      <div className="px-5 pt-0 pb-4">
        <div className="h-5 w-3/4 rounded bg-[var(--muted)] mb-3" />
        <div className="h-3 w-1/2 rounded bg-[var(--muted)] mb-4" />
        <div className="h-2 w-full rounded bg-[var(--muted)] mb-2" />
        <div className="h-2 w-2/3 rounded bg-[var(--muted)] mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 rounded-full bg-[var(--muted)]" />
          <div className="h-8 w-24 rounded bg-[var(--muted)]" />
        </div>
      </div>
    </div>
  );

  const UpcomingSideShimmer = () => (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 shadow-[0_4px_10px_rgba(0,0,0,0.10)] ${shimmerPulse}`} aria-hidden>
      <div className="flex gap-3">
        <div className="w-32 h-20 rounded-md bg-[var(--muted)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-5/6 rounded bg-[var(--muted)] mb-2" />
          <div className="h-3 w-1/2 rounded bg-[var(--muted)] mb-3" />
          <div className="h-5 w-16 rounded-full bg-[var(--muted)] mb-3" />
          <div className="h-8 w-20 rounded bg-[var(--muted)]" />
        </div>
      </div>
    </div>
  );

  const openReviewModal = async (enrollment: Enrollment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReviewCourse(enrollment.course || null);
    setReviewComment('');
    setMyReview(null);
    setReviewModalOpen(true);
    try {
      const res = await reviewsApi.getMyReview(enrollment.courseId);
      const review = res.data || null;
      setMyReview(review);
      setReviewComment(review?.comment || '');
    } catch {
      setMyReview(null);
      setReviewComment('');
    }
  };

  const closeReviewModal = () => {
    if (reviewLoading) return;
    setReviewModalOpen(false);
    setReviewCourse(null);
    setMyReview(null);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!reviewCourse?.id) return;
    try {
      setReviewLoading(true);
      const res = await reviewsApi.create({
        courseId: reviewCourse.id,
        rating: 5,
        comment: reviewComment.trim() || undefined,
      });
      setMyReview(res.data || myReview);
      showSuccess('Review submitted. It will appear after admin approval.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewCourse?.id) return;
    if (!confirm('Delete your review?')) return;
    try {
      setReviewLoading(true);
      await reviewsApi.delete(reviewCourse.id);
      setMyReview(null);
      setReviewComment('');
      showSuccess('Review deleted');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">My Courses</h1>

      {/* My Courses split layout: 60% + 40% */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <section className="xl:col-span-3 min-h-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">My Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <CourseCardShimmer key={`my-course-shimmer-${idx}`} />
              ))}
            </div>
          </section>
          <aside className="xl:col-span-2 xl:sticky xl:top-24 xl:self-start">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Upcoming Courses & Events</h2>
            <div className="grid grid-cols-1 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <UpcomingSideShimmer key={`upcoming-side-shimmer-${idx}`} />
              ))}
            </div>
          </aside>
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <section className="xl:col-span-3 min-h-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">My Courses</h2>
            <div className="xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto xl:pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className={courseCardShellClass}
                    onClick={() => router.push(`/dashboard/courses/${enrollment.courseId}/learn`)}
                  >
                    <div className="relative w-full h-52 p-2 bg-white flex items-center justify-center">
                      {enrollment.course?.thumbnail ? (
                        <StorageImage
                          src={enrollment.course.thumbnail}
                          alt={enrollment.course.title}
                          fill
                          className="object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
                          <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                            {enrollment.course?.title?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-5 pt-0 pb-4">
                      <h3 className="text-base font-[550] md:text-lg leading-6 antialiased tracking-[0.05em] text-gray-900 mb-2 line-clamp-2">
                        {enrollment.course?.title}
                      </h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--muted-foreground)]">Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <div className="w-full bg-[var(--muted)] rounded-none h-2">
                          <div className="bg-[var(--primary-700)] h-2 rounded-none" style={{ width: `${enrollment.progress}%` }} />
                        </div>
                      </div>
                      {accessInfo[enrollment.courseId] && (
                        <div className="mb-4">
                          {accessInfo[enrollment.courseId].accessStatus === 'FULL_ACCESS' ? (
                            <button
                              type="button"
                              className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                              onClick={(e) => openReviewModal(enrollment, e)}
                            >
                              Review
                            </button>
                          ) : (
                            <div
                              className={`text-sm px-2 py-1 rounded ${
                                accessInfo[enrollment.courseId].warningLevel === 'CRITICAL'
                                  ? 'bg-red-100 text-red-700'
                                  : accessInfo[enrollment.courseId].warningLevel === 'HIGH'
                                  ? 'bg-orange-100 text-orange-700'
                                  : accessInfo[enrollment.courseId].warningLevel === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span>
                                  {accessInfo[enrollment.courseId].accessStatus === 'EXPIRED'
                                    ? 'Access Expired'
                                    : accessInfo[enrollment.courseId].accessStatus === 'EXPIRING_SOON'
                                    ? 'Expires Soon'
                                    : 'Partial Access'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            enrollment.accessType === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800'
                              : enrollment.accessType === 'FULL'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {enrollment.accessType || 'FULL'}
                        </div>
                        <Link href={`/dashboard/courses/${enrollment.courseId}/learn`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="primary" size="sm">
                            {enrollment.status === 'COMPLETED' ? 'Review' : 'Continue'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="xl:col-span-2 xl:sticky xl:top-24 xl:self-start">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Upcoming Courses & Events</h2>
            <div className="grid grid-cols-1 gap-6">
              {loadingUpcoming ? (
                <Card padding="md">
                  <p className="text-sm text-[var(--muted-foreground)]">Loading upcoming items...</p>
                </Card>
              ) : upcomingSideItems.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-[var(--muted-foreground)]">No upcoming courses or events.</p>
                </Card>
              ) : (
                upcomingSideItems.map((item) => (
                <div
                  key={`upcoming-side-${item.type}-${item.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-[0_4px_10px_rgba(0,0,0,0.10)] hover:shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(upcomingHref(item))}
                >
                  <div className="flex gap-3">
                    <div className="relative w-32 h-20 shrink-0 rounded-md overflow-hidden bg-[var(--muted)]">
                      {item.thumbnail ? (
                        item.type === 'course' ? (
                        <StorageImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-contain"
                        />
                        ) : (
                          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-contain" />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] flex items-center justify-center">
                        <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                            {item.type === 'course' ? 'C' : 'E'}
                        </span>
                      </div>
                    )}
                  </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {item.title}
                    </h3>
                      <div className="text-xs text-[var(--muted-foreground)] mb-2">
                        {item.dateLabel ? `Starts: ${item.dateLabel}` : 'Date: TBA'}
                      </div>
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${
                          item.type === 'course' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.type === 'course' ? 'COURSE' : 'EVENT'}
                      </div>
                      <Link href={upcomingHref(item)} onClick={(e) => e.stopPropagation()}>
                        <Button variant="primary" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : (
        <Card padding="lg" className="text-center mb-10">
          <p className="text-[var(--muted-foreground)] mb-4">You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/courses">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      )}

      {pagination.pages > 1 && !loading && enrollments.length > 0 ? (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <div className="text-sm text-[var(--muted-foreground)]">
            Page <span className="font-semibold text-[var(--foreground)]">{pagination.page}</span> of{' '}
            <span className="font-semibold text-[var(--foreground)]">{pagination.pages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}

      {/* Related courses — full width */}
      <section className="mt-12 pt-10 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">Related Courses</h2>

        {loadingUpcoming ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CourseCardShimmer key={`related-course-shimmer-${idx}`} />
            ))}
          </div>
        ) : relatedCourseItems.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No related courses right now. Check back soon.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedCourseItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`${courseCardShellClass} h-full`}
                onClick={() => router.push(upcomingHref(item))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(upcomingHref(item));
                  }
                }}
              >
                <div className="relative w-full h-52 p-2 bg-white flex items-center justify-center">
                  {item.thumbnail ? (
                    item.type === 'course' ? (
                      <StorageImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-contain rounded-lg"
                      />
                    ) : (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
                      <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                        {item.type === 'course' ? 'Course' : 'Event'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 pt-0 pb-4">
                  <h3 className="text-base font-[550] md:text-lg leading-6 antialiased tracking-[0.05em] text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--muted-foreground)]">Starts</span>
                      <span className="font-medium">{item.dateLabel || 'TBA'}</span>
                    </div>
                    <div className="w-full bg-[var(--muted)] rounded-none h-2">
                      <div
                        className="bg-[var(--primary-700)] h-2 rounded-none"
                        style={{ width: '0%' }}
                        aria-hidden
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                      Open for booking
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'course' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.type === 'course' ? 'UPCOMING COURSE' : 'EVENT'}
                    </div>
                    <Link href={upcomingHref(item)} onClick={(e) => e.stopPropagation()}>
                      <Button variant="primary" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewModalOpen && reviewCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-lg border border-gray-200 shadow-xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Your Course Review</h3>
              <div className="flex items-center gap-2">
                {myReview ? (
                  <span className={`text-xs font-medium px-2 py-1 rounded ${myReview.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {myReview.isApproved ? 'Approved' : 'Pending approval'}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={closeReviewModal}
                  disabled={reviewLoading}
                >
                  Close
                </button>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">{reviewCourse.title}</p>
            <div className="mb-2 flex items-center gap-2">
              <div className="text-amber-400 text-lg leading-none" aria-label="5 out of 5 stars">
                {'★★★★★'}
              </div>
            </div>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="primary" isLoading={reviewLoading} onClick={handleSubmitReview}>
                {myReview ? 'Update Review' : 'Submit Review'}
              </Button>
              {myReview ? (
                <Button size="sm" variant="outline" disabled={reviewLoading} onClick={handleDeleteReview}>
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

