'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as lessonApi from '@/lib/api/lessons';
import * as progressApi from '@/lib/api/progress';
import * as quizApi from '@/lib/api/quizzes';
import { Lesson } from '@/lib/types/course';
import { LessonPlayer } from '@/components/player/LessonPlayer';
import { Button } from '@/components/ui/Button';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useLearn } from '@/lib/context/LearnContext';
import { reviewsApi, type Review } from '@/lib/api/reviews';

export default function LessonPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string; lessonId?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { course, getNextLesson, getPrevLesson, refreshProgress } = useLearn();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (params.lessonId) {
      fetchLesson(params.lessonId as string);
    }
  }, [params.lessonId]);

  useEffect(() => {
    const courseId = course?.id;
    if (!courseId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await reviewsApi.getMyReview(courseId);
        if (cancelled) return;
        const review = res.data || null;
        setMyReview(review);
        setReviewComment(review?.comment || '');
      } catch {
        if (!cancelled) {
          setMyReview(null);
          setReviewComment('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [course?.id]);

  const fetchLesson = async (id: string) => {
    try {
      setLoading(true);
      setLesson(null);
      const data = await lessonApi.getLessonById(id);
      if (data.lessonType === 'QUIZ' && !data.quiz) {
        try {
          const quizData = await quizApi.getQuizByLesson(data.id);
          data.quiz = quizData;
        } catch (err) {
          console.error('Error fetching quiz data:', err);
          data.quiz = undefined;
        }
      }
      if (data.lessonType === 'QUIZ' && data.quiz && !Array.isArray(data.quiz.questions)) {
        (data.quiz as { questions: unknown }).questions = [];
      }
      setLoadError(null);
      setLesson(data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setLesson(null);
      setLoadError(error instanceof Error ? error.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!lesson) return;
    try {
      setCompleting(true);
      await progressApi.completeLesson(lesson.id);
      showSuccess('Lesson completed!');
      await refreshProgress();
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleNextLesson = async () => {
    if (!lesson || !nextLesson || !course) return;
    try {
      setCompleting(true);
      await progressApi.completeLesson(lesson.id);
      await refreshProgress();
    } catch (error) {
      console.error('Auto-complete before next failed:', error);
      // Do not block navigation even if completion call fails.
    } finally {
      setCompleting(false);
      router.push(`/dashboard/courses/${course.id}/learn/${nextLesson.id}`);
    }
  };

  const nextLesson = lesson && course ? getNextLesson(lesson.id) : null;
  const prevLesson = lesson && course ? getPrevLesson(lesson.id) : null;

  const handleSubmitReview = async () => {
    if (!course?.id) return;
    try {
      setReviewLoading(true);
      const res = await reviewsApi.create({
        courseId: course.id,
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
    if (!course?.id) return;
    if (!confirm('Delete your review?')) return;
    try {
      setReviewLoading(true);
      await reviewsApi.delete(course.id);
      setMyReview(null);
      setReviewComment('');
      showSuccess('Review deleted');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-gray-700 font-medium mb-2">
          {loadError?.toLowerCase().includes('enroll')
            ? 'Please enroll in this course to access lessons.'
            : loadError || 'Lesson not found'}
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={() => router.push('/dashboard/my-courses')}
          className="mt-4"
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <LessonPlayer lesson={lesson} onComplete={handleComplete} />

      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevLesson && course ? (
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push(`/dashboard/courses/${course.id}/learn/${prevLesson.id}`)}
            className="rounded-lg self-start sm:self-auto"
          >
            <HiChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>
        ) : (
          <div />
        )}
        {nextLesson && course && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNextLesson}
            isLoading={completing}
            className="rounded-lg h-8 px-3 text-xs font-semibold self-start sm:self-auto"
          >
            Next
            <HiChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {course?.id && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-base font-semibold text-gray-900">Your Course Review</h3>
            {myReview ? (
              <span className={`text-xs font-medium px-2 py-1 rounded ${myReview.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {myReview.isApproved ? 'Approved' : 'Pending approval'}
              </span>
            ) : null}
          </div>
          <div className="mb-2 flex items-center gap-2">
            <div className="text-amber-400 text-lg leading-none" aria-label="5 out of 5 stars">
              {'★★★★★'}
            </div>
          </div>
          <textarea
            rows={3}
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
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

