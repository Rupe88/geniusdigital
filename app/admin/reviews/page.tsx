'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { reviewsApi, type Review } from '@/lib/api/reviews';
import { showError, showSuccess } from '@/lib/utils/toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const approved = filter === 'all' ? undefined : filter === 'approved';
      const response = await reviewsApi.getAll({ page: 1, limit: 100, approved });
      setReviews(response.data || []);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to fetch reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModeration = async (reviewId: string, isApproved: boolean) => {
    try {
      setModeratingId(reviewId);
      await reviewsApi.moderate(reviewId, isApproved);
      showSuccess(isApproved ? 'Review approved' : 'Review rejected');
      await fetchReviews();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to moderate review');
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Review Moderation</h1>
        <div className="flex gap-2">
          <Button variant={filter === 'pending' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
            Pending
          </Button>
          <Button variant={filter === 'approved' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('approved')}>
            Approved
          </Button>
          <Button variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All
          </Button>
        </div>
      </div>

      <Card padding="md">
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No reviews found.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--foreground)]">{review.course?.title || 'Course'}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      by {review.user?.fullName || 'User'} ({review.user?.email || 'no-email'})
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--foreground)] mt-2">{review.comment || 'No comment provided.'}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      review.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {review.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={moderatingId === review.id || review.isApproved === true}
                    onClick={() => handleModeration(review.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={moderatingId === review.id || review.isApproved === false}
                    onClick={() => handleModeration(review.id, false)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
