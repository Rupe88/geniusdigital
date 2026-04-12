
'use client';

import React, { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as courseApi from '@/lib/api/courses';
import * as lessonApi from '@/lib/api/lessons';
import * as enrollmentApi from '@/lib/api/enrollments';
import * as paymentApi from '@/lib/api/payments';
import * as installmentApi from '@/lib/api/installments';
import * as chapterApi from '@/lib/api/chapters';
import { validateCoupon } from '@/lib/api/coupon';
import { reviewsApi } from '@/lib/api/reviews';
import { courseCommentsApi, type CourseComment as CourseCommentType } from '@/lib/api/courseComments';
import { Course, Lesson, Review, Chapter } from '@/lib/types/course';
import { formatPrice, formatCurrency, getYouTubeEmbedUrl, getGoogleDriveEmbedUrl } from '@/lib/utils/helpers';
import { useAuth } from '@/lib/context/AuthContext';
import { getVideoStreamUrl, isSecureStreamPath, isOurS3Url } from '@/lib/api/media';
import { ROUTES } from '@/lib/utils/constants';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiCheck, HiClock, HiUsers, HiPlay, HiDocument, HiChevronRight, HiVideoCamera } from 'react-icons/hi';
import { LessonTypeIcon } from '@/components/learn/LessonTypeIcon';
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { ShareButton } from '@/components/referrals/ShareButton';
import { ManualPaymentFlow } from '@/components/payments/ManualPaymentFlow';

type TabType = 'overview' | 'chapters' | 'instructors' | 'reviews' | 'comments';

type SearchParamsLike = Record<string, string | string[] | undefined>;
function getParam(sp: SearchParamsLike | null, key: string): string | null {
  if (!sp || !(key in sp)) return null;
  const v = sp[key];
  return Array.isArray(v) ? v[0] ?? null : (v ?? null);
}

export default function CourseDetailPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id?: string }>;
  searchParams?: Promise<SearchParamsLike>;
}) {
  const params = use(paramsPromise);
  const searchParams = use(searchParamsPromise ?? Promise.resolve({}));
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);
  const [manualPayment, setManualPayment] = useState<{
    paymentId: string;
    qrImageUrl: string;
    instructions?: string;
    amountLabel: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [demoVideoPlaying, setDemoVideoPlaying] = useState(false);
  const [promoStreamUrl, setPromoStreamUrl] = useState<string | null>(null);
  const [promoStreamError, setPromoStreamError] = useState<string | null>(null);
  const promoFetchedForCourseId = useRef<string | null>(null);
  const promoVideoRef = useRef<HTMLVideoElement>(null);
  const reviewRating = 5;
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [comments, setComments] = useState<CourseCommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState<{ page: number; total: number; pages: number }>({ page: 1, total: 0, pages: 1 });
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; finalAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  type PayMode = 'full' | 'installment';
  const [payMode, setPayMode] = useState<PayMode>('full');

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    try {
      setSubmittingReview(true);
      const data = await reviewsApi.create({
        courseId: course.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (data.success) {
      showSuccess('Review submitted. It will appear after admin approval.');
        setReviewComment('');
        // Refresh course to show new review
        fetchCourse(course.id);
      }
    } catch (error) {
      showError(Object(error).message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id as string);
      fetchChapters(params.id as string);
      fetchLessons(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isAuthenticated || !course?.id || course.isEnrolled) {
      setPendingApproval(false);
      return;
    }
    checkPendingManualPayment(course.id);
  }, [isAuthenticated, course?.id, course?.isEnrolled]);

  useEffect(() => {
    if (activeTab === 'comments' && course?.id) {
      fetchComments(course.id);
    }
  }, [activeTab, course?.id]);

  // Clear promo URL when switching to a different course so we don't show the previous course's video
  useEffect(() => {
    if (course?.id && promoFetchedForCourseId.current !== null && promoFetchedForCourseId.current !== course.id) {
      setPromoStreamUrl(null);
      setPromoStreamError(null);
      promoFetchedForCourseId.current = null;
    }
  }, [course?.id]);

  // Use promo URL from course when API already returns signed URL (faster); otherwise fetch from video-token
  const effectiveVideoUrl = course?.videoUrl || course?.promoVideos?.[0];
  useEffect(() => {
    if (!course?.id || !effectiveVideoUrl) return;

    const isS3 = isOurS3Url(effectiveVideoUrl);
    const isStream = isSecureStreamPath(effectiveVideoUrl);

    // If it's a generic public URL (not S3, not stream), use it directly
    if (effectiveVideoUrl.startsWith('http') && !isS3 && !isStream) {
      setPromoStreamUrl(effectiveVideoUrl);
      setPromoStreamError(null);
      promoFetchedForCourseId.current = course.id;
      return;
    }

    // If it's an S3 URL or a stream path, we NEED a tokenized stream URL
    if (!isS3 && !isStream) return;
    // Skip fetch for Google Drive / YouTube - they use direct embed
    if (getGoogleDriveEmbedUrl(effectiveVideoUrl) || getYouTubeEmbedUrl(effectiveVideoUrl)) return;
    if (promoFetchedForCourseId.current === course.id) return;

    promoFetchedForCourseId.current = course.id;
    let cancelled = false;
    setPromoStreamError(null);
    getVideoStreamUrl({ courseId: course.id, type: 'promo' })
      .then((url) => {
        if (!cancelled) setPromoStreamUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setPromoStreamError(err instanceof Error ? err.message : 'Could not load video');
          promoFetchedForCourseId.current = null;
        }
      });
    return () => { cancelled = true; };
  }, [course?.id, effectiveVideoUrl]);

  useEffect(() => {
    if (demoVideoPlaying && promoVideoRef.current) {
      promoVideoRef.current.play().catch(() => { });
    }
  }, [demoVideoPlaying]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const data = await courseApi.getCourseById(id);
      setCourse(data);
      if (data.lessons) setLessons(data.lessons);
      if (data.reviews) setReviews(data.reviews);
      if (data.chapters) setChapters(data.chapters);

      // Fetch related courses from the same category
      if (data.categoryId) {
        fetchRelatedCourses(data.categoryId, id);
      }
      if (data.isEnrolled) {
        setPendingApproval(false);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      showError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingManualPayment = async (courseId: string) => {
    try {
      setCheckingPending(true);
      const history = await paymentApi.getPaymentHistory({ page: 1, limit: 100 });
      const hasPending = (history.data || []).some(
        (p) =>
          p.courseId === courseId &&
          p.paymentMethod === 'MANUAL_QR' &&
          p.status === 'PENDING'
      );
      setPendingApproval(hasPending);
    } catch {
      setPendingApproval(false);
    } finally {
      setCheckingPending(false);
    }
  };

  const fetchChapters = async (courseId: string) => {
    try {
      const data = await chapterApi.getCourseChapters(courseId);
      setChapters(data || []);
      // Auto-expand first chapter
      if (data && data.length > 0) {
        setExpandedChapters(new Set([data[0].id]));
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchRelatedCourses = async (categoryId: string, currentId: string) => {
    try {
      const data = await courseApi.getAllCourses({ categoryId, limit: 5 });
      setRelatedCourses(data.data.filter(c => c.id !== currentId).slice(0, 4));
    } catch (error) {
      console.error('Error fetching related courses:', error);
    }
  };

  const fetchReviews = async (id: string) => {
    try {
      const response = await reviewsApi.getByCourse(id);
      // Correctly extract reviews array from response.data
      if (response.success && response.data) {
        setReviews(response.data as any);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchComments = async (courseId: string, page = 1) => {
    try {
      setCommentsLoading(true);
      const res = await courseCommentsApi.getByCourse(courseId, { page, limit: 20 });
      if (res.success && res.data) {
        setComments(res.data);
        if (res.pagination) {
          setCommentsPagination({
            page: res.pagination.page,
            total: res.pagination.total,
            pages: res.pagination.pages,
          });
        }
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await courseCommentsApi.create(course.id, commentText.trim());
      if (res.success && res.data) {
        showSuccess('Comment posted.');
        setCommentText('');
        setComments((prev) => [res.data!, ...prev]);
        setCommentsPagination((p) => ({ ...p, total: p.total + 1 }));
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!course) return;
    try {
      await courseCommentsApi.delete(id);
      showSuccess('Comment removed.');
      setComments((prev) => prev.filter((c) => c.id !== id));
      setCommentsPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const fetchLessons = async (courseId: string) => {
    try {
      const data = await lessonApi.getCourseLessons(courseId);
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  };

  /* --------------------------------------------------------------------------------
   * REFERRAL TRACKING LOGIC
   * -------------------------------------------------------------------------------- */
  const [referralClickId, setReferralClickId] = useState<string | null>(null);

  useEffect(() => {
    const handleReferral = async () => {
      const refCode = getParam(searchParams, 'ref');
      if (refCode) {
        try {
          // Track the click
          const response = await import('@/lib/api/referrals').then(m => m.trackReferralClick(refCode));
          if (response && response.clickId) {
            console.log('Referral tracked:', response.clickId);
            setReferralClickId(response.clickId);
            // Optionally persist to sessionStorage if needed for strict persistence across reloads
            // sessionStorage.setItem('referral_click_id', response.clickId);
          }
        } catch (error) {
          console.error('Error tracking referral:', error);
        }
      }
    };

    handleReferral();
  }, [searchParams]);


  const applyPromoCode = async () => {
    if (!course || course.isFree) return;
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code');
      return;
    }
    setPromoError(null);
    setApplyingPromo(true);
    try {
      const result = await validateCoupon({
        code,
        amount: Number(course.price),
        courseId: course.id,
      });
      if (result.valid && result.discountAmount != null && result.finalAmount != null) {
        setAppliedPromo({ code, discountAmount: result.discountAmount, finalAmount: result.finalAmount });
      } else {
        setAppliedPromo(null);
        setPromoError(result.valid === false ? result.message : 'Invalid or expired promo code');
      }
    } catch {
      setAppliedPromo(null);
      setPromoError('Could not validate promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/courses/${params.id}`)}`);
      return;
    }

    if (!course) return;

    if (course.isEnrolled) {
      router.push(`/dashboard/courses/${course.id}/learn`);
      return;
    }
    if (pendingApproval) {
      showError('Your payment proof is pending admin approval.');
      return;
    }

    const priceNum = Number(course.price);
    const isFreeCourse = course.isFree === true || course.price == null || priceNum === 0 || Number.isNaN(priceNum);

    try {
      setEnrolling(true);

      if (isFreeCourse) {
        // Free courses: Enroll directly with ACTIVE status
        await enrollmentApi.enrollInCourse(course.id);
        showSuccess('Successfully enrolled in course!');
        router.push(`/dashboard/courses/${course.id}/learn`);
        return;
      }

      // Paid courses: full or installment
      if (priceNum <= 0 || !Number.isFinite(priceNum)) {
        showError('Invalid course price. Please contact support.');
        return;
      }

      let amount = appliedPromo ? appliedPromo.finalAmount : priceNum;
      let installmentId: string | undefined;

      if (payMode === 'installment' && course.installmentPlan?.isActive) {
        const result = await installmentApi.startInstallmentEnrollment(course.id);
        amount = result.firstAmount;
        installmentId = result.firstInstallmentId;
      }

      const paymentResponse = await paymentApi.createPayment({
        courseId: course.id,
        amount,
        paymentMethod: 'MANUAL_QR',
        couponCode: appliedPromo?.code || undefined,
        referralClickId: referralClickId || undefined,
        successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`,
        failureUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/failure`,
        installmentId,
      });

      const pd = paymentResponse?.paymentDetails;
      if (pd?.qrImageUrl && paymentResponse?.paymentId) {
        setManualPayment({
          paymentId: paymentResponse.paymentId,
          qrImageUrl: pd.qrImageUrl,
          instructions: typeof pd.instructions === 'string' ? pd.instructions : undefined,
          amountLabel: `Rs. ${Number(paymentResponse.amount ?? amount).toLocaleString()}`,
        });
        showSuccess('Scan the QR to pay, then upload your proof below.');
        return;
      }
      throw new Error('Payment could not be started. Ask an admin to configure the payment QR in Admin settings.');
    } catch (error: unknown) {
      const msg = Object(error).message || 'Enrollment failed';
      if (typeof msg === 'string' && msg.toLowerCase().includes('already enrolled')) {
        await fetchCourse(course.id);
        showSuccess('You are already enrolled. Taking you to the course.');
        router.push(`/dashboard/courses/${course.id}/learn`);
      } else {
        showError(msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleChapter = (title: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedChapters(newExpanded);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
    }
    return minutes > 0 ? `${minutes} min` : 'N/A';
  };

  // Safe lesson grouping
  const groupedLessons = (lessons || []).reduce((acc, lesson) => {
    if (!lesson || !lesson.title) return acc;
    const match = lesson.title.match(/^(Day\s*\d+|Pre-Assignment|DAY-\d+)/i);
    const chapterTitle = match ? match[1].toUpperCase() : 'Other';

    if (!acc[chapterTitle]) {
      acc[chapterTitle] = [];
    }
    acc[chapterTitle].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const courseTitle = course?.title || '';

  const nestedCurriculum = chapters.length > 0
    ? chapters.map(chapter => ({
      ...chapter,
      lessons: (lessons || []).filter(l => l.chapterId === chapter.id)
    }))
    : Object.entries(groupedLessons).map(([title, chLessons]) => ({
      id: title,
      title,
      lessons: chLessons
    } as any));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--muted)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-900 font-medium text-lg">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--muted)]">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-semibold text-gray-900">Course not found</h2>
          <Link href="/courses">
            <Button variant="primary">Browse all courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total video duration with safety checks
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const totalVideoDuration = safeLessons
    .filter(l => l && l.lessonType === 'VIDEO' && l.videoDuration)
    .reduce((sum, l) => sum + (l.videoDuration || 0), 0);

  const videoLessons = safeLessons.filter(l => l && l.lessonType === 'VIDEO').length;
  const totalLessons = safeLessons.length;

  // Calculate total hours and minutes for display
  const totalHours = Math.floor(totalVideoDuration / 3600);
  const totalMinutes = Math.floor((totalVideoDuration % 3600) / 60);

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Top Header / Breadcrumbs */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-xs sm:text-sm font-medium gap-1 sm:gap-2 min-w-0">
            <Link href="/" className="text-gray-500 hover:text-[var(--primary-700)] transition-colors shrink-0">Home</Link>
            <span className="text-gray-400 shrink-0">/</span>
            <Link href="/courses" className="text-gray-500 hover:text-[var(--primary-700)] transition-colors shrink-0">Courses</Link>
            <span className="text-gray-400 shrink-0">/</span>
            <span className="text-gray-900 truncate min-w-0">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title and Description - Above both columns */}
        <div className="space-y-3 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight">
            {course.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            {course.shortDescription}
          </p>
          {/* Course Category */}
          {course.category && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Category:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary-100)] text-[var(--primary-800)]">
                {course.category.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT COLUMN - Scrollable Content */}
          <div className="flex-1 w-full lg:w-2/3 space-y-8">
            {/* Main Course Media */}
            <div className={`relative aspect-video rounded-lg overflow-hidden bg-black ${!demoVideoPlaying ? 'cursor-pointer' : ''}`}
              onClick={() => !demoVideoPlaying && setDemoVideoPlaying(true)}>
              {effectiveVideoUrl && getYouTubeEmbedUrl(effectiveVideoUrl) && demoVideoPlaying ? (
                <iframe
                  src={`${getYouTubeEmbedUrl(effectiveVideoUrl)}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
              {effectiveVideoUrl && getGoogleDriveEmbedUrl(effectiveVideoUrl) && demoVideoPlaying ? (
                <iframe
                  src={getGoogleDriveEmbedUrl(effectiveVideoUrl)!}
                  className="w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                />
              ) : null}
              {effectiveVideoUrl && !getYouTubeEmbedUrl(effectiveVideoUrl) && !getGoogleDriveEmbedUrl(effectiveVideoUrl) && promoStreamError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                  <HiVideoCamera className="w-16 h-16 opacity-20" />
                  <p className="font-medium">{promoStreamError}</p>
                </div>
              ) : null}
              {effectiveVideoUrl && !getYouTubeEmbedUrl(effectiveVideoUrl) && !getGoogleDriveEmbedUrl(effectiveVideoUrl) && !promoStreamError && (isSecureStreamPath(effectiveVideoUrl) || effectiveVideoUrl.startsWith('http')) ? (
                promoStreamUrl ? (
                  <video
                    ref={promoVideoRef}
                    key={promoStreamUrl}
                    src={promoStreamUrl}
                    preload="metadata"
                    playsInline
                    controls
                    className={`w-full h-full absolute inset-0 object-contain ${!demoVideoPlaying ? 'opacity-0 pointer-events-none' : 'z-10'}`}
                    onCanPlay={() => demoVideoPlaying && promoVideoRef.current?.play().catch(() => { })}
                    autoPlay
                    onError={(e) => {
                      const v = e.currentTarget;
                      const msg = v.error?.message || 'Video failed to play';
                      console.warn('Promo video error:', msg);
                      setPromoStreamError(`Playback error: ${msg}. Refreshing might help.`);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                    <HiVideoCamera className="w-16 h-16 opacity-20 animate-pulse" />
                    <p className="font-medium">Loading video...</p>
                  </div>
                )
              ) : null}
              {demoVideoPlaying && effectiveVideoUrl && !getYouTubeEmbedUrl(effectiveVideoUrl) && !getGoogleDriveEmbedUrl(effectiveVideoUrl) && !promoStreamError && !isSecureStreamPath(effectiveVideoUrl) && (
                <video
                  src={effectiveVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  playsInline
                />
              )}
              {!effectiveVideoUrl && !promoStreamUrl && !promoStreamError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                  <HiVideoCamera className="w-16 h-16 opacity-20" />
                  <p className="font-medium">Preview video not available</p>
                </div>
              ) : null}
              {!demoVideoPlaying && (
                <>
                  {course.thumbnail && (
                    <StorageImage
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      className="object-cover"
                      priority
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                    <button className="flex items-center gap-3 px-8 py-4 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold text-lg rounded-lg transition-colors">
                      <HiPlay className="w-6 h-6" />
                      Play Preview
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg sticky top-0 z-10">
              <div className="flex overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'chapters', label: 'Chapters' },
                  { id: 'instructors', label: 'Instructors' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'comments', label: 'Comments' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'text-[var(--primary-700)] border-[var(--primary-700)]'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Panels */}
            <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Learning Outcomes */}
                  {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        What you&apos;ll learn
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.learningOutcomes.map((outcome, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-[var(--muted)] rounded-lg">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-0.5">
                              <HiCheck className="w-3 h-3" />
                            </div>
                            <span className="text-gray-700 text-sm leading-relaxed">{outcome}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Skills */}
                  {course.skills && course.skills.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Skills you&apos;ll gain
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {course.skills.map((skill, index) => (
                          <span key={index} className="px-4 py-2 bg-[var(--muted)] text-gray-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Description */}
                  {course.description && (
                    <section>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        About this course
                      </h2>
                      <div className="prose max-w-none text-gray-700 leading-relaxed ql-editor px-0"
                        dangerouslySetInnerHTML={{ __html: course.description }} />
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'chapters' && (
                <div className="space-y-3 animate-fadeIn">
                  {nestedCurriculum.map((chapter: any, index: number) => (
                    <div key={chapter.id} className="bg-[var(--muted)] rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${expandedChapters.has(chapter.id) ? 'bg-white' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-gray-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><HiPlay className="w-3 h-3" /> {chapter.lessons?.length || 0} lessons</span>
                              {chapter.lessons?.some((l: any) => l.videoDuration) && (
                                <span className="flex items-center gap-1">
                                  <HiClock className="w-3 h-3" />
                                  {formatDuration(chapter.lessons.reduce((acc: number, l: any) => acc + (l.videoDuration || 0), 0))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedChapters.has(chapter.id) ? <FaChevronUp className="w-4 h-4 text-gray-400" /> : <FaChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {expandedChapters.has(chapter.id) && (
                        <div className="bg-white border-t border-gray-100">
                          <div className="divide-y divide-gray-100">
                            {chapter.lessons && chapter.lessons.length > 0 ? (
                              chapter.lessons.map((lesson: any) => (
                                <div key={lesson.id} className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-50 text-[var(--primary-700)] flex items-center justify-center">
                                      <LessonTypeIcon lesson={lesson} variant="marketing" size="md" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 text-sm">
                                        {lesson.title}
                                      </h4>
                                      {lesson.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{lesson.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.videoDuration && (
                                      <span className="text-xs text-gray-400">{formatDuration(lesson.videoDuration)}</span>
                                    )}
                                    {lesson.isPreview && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 text-center text-gray-500 text-sm">
                                No lessons available in this chapter.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'instructors' && course.instructor && (
                <div className="animate-fadeIn">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
                      {course.instructor.image ? (
                        <StorageImage
                          src={course.instructor.image}
                          alt={course.instructor.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--primary-700)] flex items-center justify-center text-white text-3xl font-semibold">
                          {course.instructor.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900">
                          {course.instructor.name}
                        </h3>
                        {course.instructor.designation && (
                          <p className="text-lg text-[var(--primary-700)] mt-1">
                            {course.instructor.designation}
                          </p>
                        )}
                      </div>
                      <div className="prose max-w-none text-gray-700 leading-relaxed">
                        {course.instructor.bio}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6 animate-fadeIn">
                  {course.isEnrolled && (
                    <div className="p-6 bg-[var(--muted)] rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Share your experience</h4>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Your rating</label>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-3xl text-yellow-400">★</span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Your review</label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-700)] transition-all outline-none min-h-[120px]"
                            placeholder="Tell us what you thought about this course..."
                          />
                        </div>
                        <Button type="submit" isLoading={submittingReview} variant="primary" className="h-11 px-8 rounded-lg">
                          Submit Review
                        </Button>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="p-5 bg-[var(--muted)] rounded-lg">
                          <div className="flex items-start gap-4">
                            <div className="relative w-12 h-12 rounded-full bg-[var(--primary-700)] overflow-hidden flex-shrink-0">
                              {review.user?.profileImage ? (
                                <Image src={review.user.profileImage} alt={review.user.fullName || 'User'} fill className="object-cover" sizes="48px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                                  {(review.user?.fullName || 'U')[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">{review.user?.fullName || 'Anonymous'}</h4>
                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-lg ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                ))}
                              </div>
                              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[var(--muted)] rounded-lg">
                        <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-6 animate-fadeIn">
                  {course.isEnrolled && isAuthenticated && (
                    <div className="p-6 bg-[var(--muted)] rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Add a comment</h4>
                      <form onSubmit={handleSubmitComment} className="space-y-4">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          required
                          maxLength={2000}
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-700)] transition-all outline-none resize-none"
                          placeholder="Share your thoughts about this course..."
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{commentText.length}/2000</span>
                          <Button type="submit" isLoading={submittingComment} variant="primary" className="h-10 px-6 rounded-lg">
                            Post comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                  {!course.isEnrolled && (
                    <p className="text-gray-500 text-sm py-2">Enroll in this course to leave a comment.</p>
                  )}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Comments {commentsPagination.total > 0 && `(${commentsPagination.total})`}
                    </h4>
                    {commentsLoading ? (
                      <div className="py-12 text-center text-gray-500">Loading comments...</div>
                    ) : comments.length > 0 ? (
                      <ul className="space-y-4">
                        {comments.map((comment) => (
                          <li key={comment.id} className="p-5 bg-[var(--muted)] rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="relative w-10 h-10 rounded-full bg-[var(--primary-700)] flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                                {comment.user?.profileImage ? (
                                  <Image src={comment.user.profileImage} alt={comment.user.fullName || 'User'} fill className="object-cover" sizes="40px" />
                                ) : (
                                  (comment.user?.fullName || 'U')[0]
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900">{comment.user?.fullName || 'Anonymous'}</span>
                                  <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                </div>
                                <p className="text-gray-700 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                                {(user?.id === comment.userId || user?.role === 'ADMIN') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="mt-2 text-xs text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-12 bg-[var(--muted)] rounded-lg">
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Enrollment Pad */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-8">
            <div className="bg-white rounded-lg overflow-hidden">
              {/* Card Thumbnail */}
              <div className="relative aspect-[16/9] overflow-hidden">
                {course.thumbnail && (
                  <StorageImage src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                )}
                {course.level && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded text-xs font-medium text-gray-900">
                      {course.level}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Price Display */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    {course.isFree ? (
                      <span className="text-3xl font-semibold text-[var(--primary-700)]">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-semibold text-gray-900">Rs. {course.price.toLocaleString()}</span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-lg text-gray-400 line-through">
                            Rs. {course.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <p className="text-green-600 text-sm font-medium">
                      Save {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                    </p>
                  )}
                </div>

                {/* Promo code (paid courses only) */}
                {!course.isFree && course.price != null && (
                  <div className="space-y-2">
                    {appliedPromo ? (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-green-800">Promo {appliedPromo.code} applied</span>
                          <button
                            type="button"
                            onClick={removePromoCode}
                            className="text-xs text-green-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Discount: Rs. {appliedPromo.discountAmount.toLocaleString()} · You pay: Rs. {appliedPromo.finalAmount.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Have a promo code?</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(null); }}
                            placeholder="Enter code"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={applyPromoCode}
                            isLoading={applyingPromo}
                            disabled={applyingPromo}
                          >
                            Apply
                          </Button>
                        </div>
                        {promoError && <p className="text-sm text-red-600">{promoError}</p>}
                      </>
                    )}
                  </div>
                )}

                {/* Pay mode: full vs installment (when plan available and price high enough) */}
                {!course.isFree && course.price != null && course.installmentPlan?.isActive && (
                  (course.installmentPlan.minAmountForPlan == null || Number(course.price) >= Number(course.installmentPlan.minAmountForPlan)) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Payment option</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPayMode('full')}
                          className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            payMode === 'full'
                              ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Pay full · Rs. {(appliedPromo ? appliedPromo.finalAmount : Number(course.price)).toLocaleString()}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMode('installment')}
                          className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            payMode === 'installment'
                              ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {course.installmentPlan.numberOfInstallments} × Rs. {Math.ceil(Number(course.price) / course.installmentPlan.numberOfInstallments).toLocaleString()}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Main Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-lg"
                    onClick={handleEnroll}
                    isLoading={enrolling}
                    disabled={enrolling || pendingApproval || checkingPending}
                  >
                    {checkingPending
                      ? 'Checking payment status…'
                      : pendingApproval
                        ? 'Payment Pending Approval'
                    : enrolling && !course.isFree
                      ? 'Starting payment…'
                      : course.isEnrolled
                        ? 'Continue Learning'
                        : course.isFree
                          ? 'Enroll for Free'
                          : payMode === 'installment' && course.installmentPlan?.isActive
                            ? `Pay first installment · Rs. ${Math.ceil(Number(course.price) / (course.installmentPlan?.numberOfInstallments || 1)).toLocaleString()}`
                            : 'Enroll Now'}
                  </Button>

                  <ShareButton
                    courseId={course.id}
                    course={{ id: course.id, title: course.title, thumbnail: course.thumbnail }}
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-lg font-medium"
                  />
                </div>

                {manualPayment && (
                  <ManualPaymentFlow
                    paymentId={manualPayment.paymentId}
                    qrImageUrl={manualPayment.qrImageUrl}
                    instructions={manualPayment.instructions}
                    amountLabel={manualPayment.amountLabel}
                    onDone={() => {
                      setManualPayment(null);
                      setPendingApproval(true);
                      fetchCourse(course.id);
                    }}
                  />
                )}

                {/* Course Facts */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-600">Course details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-gray-600">
                        <HiUsers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Students enrolled</p>
                        <p className="font-medium text-gray-900">{course.totalEnrollments || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-gray-600">
                        <HiPlay className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Video lessons</p>
                        <p className="font-medium text-gray-900">{videoLessons}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-gray-600">
                        <HiDocument className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total lessons</p>
                        <p className="font-medium text-gray-900">{totalLessons}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED COURSES SECTION */}
        {relatedCourses.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">You might also like</h2>
                <p className="text-gray-600 mt-1">Similar courses you might enjoy</p>
              </div>
              <Link href="/courses" className="text-sm font-medium text-[var(--primary-700)] hover:underline flex items-center gap-1">
                View all <HiChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCourses.map((rc) => (
                <Card key={rc.id} hover className="overflow-hidden">
                  <Link href={`/courses/${rc.slug || rc.id}`} className="block h-full">
                    {rc.thumbnail && (
                      <div className="relative h-48 w-full">
                        <StorageImage
                          src={rc.thumbnail}
                          alt={rc.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col h-[calc(100%-12rem)]">
                      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        {rc.title}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2 flex-grow">
                        {rc.shortDescription || rc.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto mb-3">
                        <span className="text-lg font-bold text-[var(--primary-700)]">
                          {rc.isFree ? 'Free' : formatCurrency(rc.price)}
                        </span>
                        <Button variant="primary" size="sm">View Details</Button>
                      </div>

                      {user && (
                        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                          <ShareButton
                            courseId={rc.id}
                            course={{
                              id: rc.id,
                              title: rc.title,
                              thumbnail: rc.thumbnail
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

