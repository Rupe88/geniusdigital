
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as courseApi from '@/lib/api/courses';
import * as lessonApi from '@/lib/api/lessons';
import * as enrollmentApi from '@/lib/api/enrollments';
import * as paymentApi from '@/lib/api/payments';
import * as chapterApi from '@/lib/api/chapters';
import { reviewsApi } from '@/lib/api/reviews';
import { Course, Lesson, Review, Chapter } from '@/lib/types/course';
import { formatPrice, formatCurrency, getYouTubeEmbedUrl } from '@/lib/utils/helpers';
import { useAuth } from '@/lib/context/AuthContext';
import { getVideoStreamUrl, isSecureStreamPath } from '@/lib/api/media';
import { ROUTES } from '@/lib/utils/constants';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiCheck, HiClock, HiUsers, HiPlay, HiDocument, HiClipboardCheck, HiChevronRight, HiVideoCamera } from 'react-icons/hi';
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { ShareButton } from '@/components/referrals/ShareButton';

type TabType = 'overview' | 'chapters' | 'instructors' | 'reviews';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [demoVideoPlaying, setDemoVideoPlaying] = useState(false);
  const [promoStreamUrl, setPromoStreamUrl] = useState<string | null>(null);
  const [promoStreamError, setPromoStreamError] = useState<string | null>(null);
  const promoFetchedForCourseId = useRef<string | null>(null);
  const promoVideoRef = useRef<HTMLVideoElement>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    try {
      setSubmittingReview(true);
      const data = await reviewsApi.create({
        courseId: course.id,
        rating: reviewRating,
        title: 'Course Review', // Added because API type requires it
        comment: reviewComment,
      } as any);

      if (data.success) {
        showSuccess('Review submitted successfully!');
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

  // Clear promo URL when switching to a different course so we don't show the previous course's video
  useEffect(() => {
    if (course?.id && promoFetchedForCourseId.current !== null && promoFetchedForCourseId.current !== course.id) {
      setPromoStreamUrl(null);
      setPromoStreamError(null);
      promoFetchedForCourseId.current = null;
    }
  }, [course?.id]);

  // Use promo URL from course when API already returns signed URL (faster); otherwise fetch from video-token
  useEffect(() => {
    if (!course?.id || !course?.videoUrl) return;
    if (course.videoUrl.startsWith('http')) {
      setPromoStreamUrl(course.videoUrl);
      setPromoStreamError(null);
      promoFetchedForCourseId.current = course.id;
      return;
    }
    if (!isSecureStreamPath(course.videoUrl)) return;
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
  }, [course?.id, course?.videoUrl]);

  useEffect(() => {
    if (demoVideoPlaying && promoVideoRef.current) {
      promoVideoRef.current.play().catch(() => {});
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
    } catch (error) {
      console.error('Error fetching course:', error);
      showError('Failed to load course');
    } finally {
      setLoading(false);
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

  const fetchLessons = async (courseId: string) => {
    try {
      const data = await lessonApi.getCourseLessons(courseId);
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  };

  const submitEsewaForm = (paymentDetails: { paymentUrl?: string; formData?: Record<string, string> }) => {
    const url = paymentDetails.paymentUrl;
    const formData = paymentDetails.formData || {};
    if (!url || typeof url !== 'string') {
      showError('Invalid payment redirect URL');
      return;
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    for (const key of Object.keys(formData)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(formData[key] ?? '');
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  /* --------------------------------------------------------------------------------
   * REFERRAL TRACKING LOGIC
   * -------------------------------------------------------------------------------- */
  const searchParams = useSearchParams();
  const [referralClickId, setReferralClickId] = useState<string | null>(null);

  useEffect(() => {
    const handleReferral = async () => {
      const refCode = searchParams.get('ref');
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


  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/courses/${params.id}`)}`);
      return;
    }

    if (!course) return;

    if (course.isEnrolled) {
      router.push(`/courses/${course.id}/learn`);
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
        router.push(`/courses/${course.id}/learn`);
        return;
      }

      // Paid courses: Skip enrollment API, go directly to payment
      // Enrollment will be created automatically after payment verification
      // Paid course – initiate eSewa payment
      if (priceNum <= 0 || !Number.isFinite(priceNum)) {
        showError('Invalid course price. Please contact support.');
        return;
      }

      const paymentResponse = await paymentApi.createPayment({
        courseId: course.id,
        amount: priceNum,
        paymentMethod: 'ESEWA',
        referralClickId: referralClickId || undefined,
        successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`,
        failureUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/failure`,
      });

      if (paymentResponse?.paymentDetails?.paymentUrl) {
        showSuccess('Redirecting to eSewa...');
        submitEsewaForm(paymentResponse.paymentDetails);
      } else if (paymentResponse?.paymentDetails) {
        submitEsewaForm(paymentResponse.paymentDetails);
      } else {
        throw new Error('Payment gateway did not return redirect details');
      }
    } catch (error: unknown) {
      const msg = Object(error).message || 'Enrollment failed';
      if (typeof msg === 'string' && msg.toLowerCase().includes('already enrolled')) {
        await fetchCourse(course.id);
        showSuccess('You are already enrolled. Taking you to the course.');
        router.push(`/courses/${course.id}/learn`);
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

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <HiPlay className="w-5 h-5" />;
      case 'PDF':
        return <HiDocument className="w-5 h-5" />;
      case 'QUIZ':
      case 'ASSIGNMENT':
        return <HiClipboardCheck className="w-5 h-5" />;
      default:
        return <HiDocument className="w-5 h-5" />;
    }
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
          <nav className="flex items-center text-sm font-medium">
            <Link href="/" className="text-gray-500 hover:text-[var(--primary-700)] transition-colors">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/courses" className="text-gray-500 hover:text-[var(--primary-700)] transition-colors">Courses</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Description - Above both columns */}
        <div className="space-y-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
            {course.title}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
            {course.shortDescription}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT COLUMN - Scrollable Content */}
          <div className="flex-1 w-full lg:w-2/3 space-y-8">
            {/* Main Course Media */}
            <div className={`relative aspect-video rounded-lg overflow-hidden bg-black ${!demoVideoPlaying ? 'cursor-pointer' : ''}`}
              onClick={() => !demoVideoPlaying && setDemoVideoPlaying(true)}>
              {course.videoUrl && getYouTubeEmbedUrl(course.videoUrl) && demoVideoPlaying ? (
                <iframe
                  src={`${getYouTubeEmbedUrl(course.videoUrl)}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
              {course.videoUrl && !getYouTubeEmbedUrl(course.videoUrl) && promoStreamError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                  <HiVideoCamera className="w-16 h-16 opacity-20" />
                  <p className="font-medium">{promoStreamError}</p>
                </div>
              ) : null}
              {course.videoUrl && !getYouTubeEmbedUrl(course.videoUrl) && !promoStreamError && (isSecureStreamPath(course.videoUrl) || course.videoUrl.startsWith('http')) ? (
                promoStreamUrl ? (
                  <video
                    ref={promoVideoRef}
                    key={promoStreamUrl}
                    src={promoStreamUrl}
                    preload="metadata"
                    playsInline
                    controls
                    crossOrigin="anonymous"
                    className={`w-full h-full absolute inset-0 object-contain ${!demoVideoPlaying ? 'opacity-0 pointer-events-none' : 'z-10'}`}
                    onCanPlay={() => demoVideoPlaying && promoVideoRef.current?.play().catch(() => {})}
                    onError={(e) => {
                      const v = e.currentTarget;
                      if (typeof window !== 'undefined') console.warn('Video error:', v.error?.message || 'Video failed to play');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                    <HiVideoCamera className="w-16 h-16 opacity-20 animate-pulse" />
                    <p className="font-medium">Loading video...</p>
                  </div>
                )
              ) : null}
              {demoVideoPlaying && course.videoUrl && !getYouTubeEmbedUrl(course.videoUrl) && !promoStreamError && !isSecureStreamPath(course.videoUrl) && (
                <video
                  src={course.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  playsInline
                />
              )}
              {!course.videoUrl && !promoStreamUrl && !promoStreamError ? (
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
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 min-w-[100px] py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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
            <div className="bg-white rounded-lg p-6 md:p-8 min-h-[400px]">
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
                                      {getLessonIcon(lesson.lessonType)}
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
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className={`text-3xl transition-colors ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                              >
                                ★
                              </button>
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
                            <div className="w-12 h-12 rounded-full bg-[var(--primary-700)] overflow-hidden flex-shrink-0">
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

                {/* Main Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-lg"
                    onClick={handleEnroll}
                    isLoading={enrolling}
                  >
                    {course.isEnrolled ? 'Continue Learning' : course.isFree ? 'Enroll for Free' : 'Enroll Now'}
                  </Button>

                  <ShareButton
                    courseId={course.id}
                    course={{ id: course.id, title: course.title, thumbnail: course.thumbnail }}
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-lg font-medium"
                  />
                </div>

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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-gray-600">
                        <HiClock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Access</p>
                        <p className="font-medium text-gray-900">Lifetime</p>
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

