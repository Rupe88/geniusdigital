'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight, HiChevronUp } from 'react-icons/hi';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { SuccessStories } from '@/components/SuccessStories';
import { Gallery } from '@/components/Gallery';
import { FAQ } from '@/components/FAQ';
import { CourseCard } from '@/components/CourseCard';
import { ROUTES } from '@/lib/utils/constants';
import * as courseApi from '@/lib/api/courses';
import * as testimonialApi from '@/lib/api/testimonials';
import { Course } from '@/lib/types/course';
import { Testimonial } from '@/lib/api/testimonials';

type SimpleCourse = {
  id: string | number;
  title: string;
  thumbnail: string;
  price?: string;
  oldPrice?: string;
  rating?: number;
  metaText?: string;
  slug?: string;
};

export default function HomePage() {
  const [popularCoursesList, setPopularCoursesList] = useState<Course[]>([]);
  const [popularCoursesLoading, setPopularCoursesLoading] = useState(true);
  const [ongoingCoursesList, setOngoingCoursesList] = useState<Course[]>([]);
  const [ongoingCoursesLoading, setOngoingCoursesLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const ongoingCoursesRef = useRef<HTMLDivElement>(null);
  const popularCoursesRef = useRef<HTMLDivElement>(null);

  // Ongoing Courses drag state
  const [ongoingIsDragging, setOngoingIsDragging] = useState(false);
  const [ongoingStartX, setOngoingStartX] = useState(0);
  const [ongoingScrollLeft, setOngoingScrollLeft] = useState(0);

  // Popular Courses drag state
  const [popularIsDragging, setPopularIsDragging] = useState(false);
  const [popularStartX, setPopularStartX] = useState(0);
  const [popularScrollLeft, setPopularScrollLeft] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testimonialsData = await testimonialApi.getTestimonials({ limit: 10, featured: true }).catch(() => ({ data: [] }));
        setTestimonials(testimonialsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPopular = async () => {
      setPopularCoursesLoading(true);
      try {
        const data = await courseApi.getFeaturedCourses();
        if (!cancelled && Array.isArray(data)) setPopularCoursesList(data);
        else if (!cancelled) setPopularCoursesList([]);
      } catch (e) {
        if (!cancelled) setPopularCoursesList([]);
      } finally {
        if (!cancelled) setPopularCoursesLoading(false);
      }
    };
    fetchPopular();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchOngoing = async () => {
      try {
        setOngoingCoursesLoading(true);
        const data = await courseApi.getOngoingCourses();
        if (!cancelled) setOngoingCoursesList(data || []);
      } catch (error) {
        console.error('Error fetching ongoing courses:', error);
        if (!cancelled) setOngoingCoursesList([]);
      } finally {
        if (!cancelled) setOngoingCoursesLoading(false);
      }
    };
    fetchOngoing();
    return () => { cancelled = true; };
  }, []);

  const ongoingCourses: SimpleCourse[] = ongoingCoursesList.map((course) => ({
    id: course.id,
    title: course.title,
    thumbnail: course.thumbnail || '/hero1.png',
    price: course.isFree ? 'Free' : `Rs. ${course.price}`,
    oldPrice: course.originalPrice ? `Rs. ${course.originalPrice}` : undefined,
    rating: course.rating || 4,
    metaText: `${course.chapters?.length || course._count?.lessons || 0} Chapters`,
    slug: course.slug,
  }));

  const popularCourses: SimpleCourse[] = (popularCoursesList || []).map((course) => ({
    id: course.id ?? '',
    title: course.title ?? '',
    thumbnail: course.thumbnail || '/hero1.png',
    price: course.isFree ? 'Free' : `Rs. ${course.price ?? 0}`,
    oldPrice: course.originalPrice != null ? `Rs. ${course.originalPrice}` : undefined,
    rating: course.rating || 4,
    metaText: `${course.chapters?.length || course._count?.lessons || 0} Chapters`,
    slug: course.slug ?? '',
  }));

  // Ongoing Courses scroll function
  const scrollOngoingCourses = (direction: 'left' | 'right') => {
    if (!ongoingCoursesRef.current) return;
    const scrollAmount = 404; // Card width (400) + gap (24)
    const currentScroll = ongoingCoursesRef.current.scrollLeft;
    const newScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    ongoingCoursesRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  // Popular Courses scroll function
  const scrollPopularCourses = (direction: 'left' | 'right') => {
    if (!popularCoursesRef.current) return;
    const scrollAmount = 404; // Card width (400) + gap (24)
    const currentScroll = popularCoursesRef.current.scrollLeft;
    const newScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    popularCoursesRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  // Ongoing Courses mouse handlers
  const handleOngoingMouseDown = (e: React.MouseEvent) => {
    if (!ongoingCoursesRef.current) return;
    setOngoingIsDragging(true);
    setOngoingStartX(e.pageX - ongoingCoursesRef.current.offsetLeft);
    setOngoingScrollLeft(ongoingCoursesRef.current.scrollLeft);
    ongoingCoursesRef.current.style.cursor = 'grabbing';
    ongoingCoursesRef.current.style.userSelect = 'none';
  };

  const handleOngoingMouseMove = (e: React.MouseEvent) => {
    if (!ongoingIsDragging || !ongoingCoursesRef.current) return;
    e.preventDefault();
    const x = e.pageX - ongoingCoursesRef.current.offsetLeft;
    const walk = (x - ongoingStartX) * 2;
    ongoingCoursesRef.current.scrollLeft = ongoingScrollLeft - walk;
  };

  const handleOngoingMouseUp = () => {
    setOngoingIsDragging(false);
    if (ongoingCoursesRef.current) {
      ongoingCoursesRef.current.style.cursor = 'grab';
      ongoingCoursesRef.current.style.userSelect = 'auto';
    }
  };

  const handleOngoingMouseLeave = () => {
    setOngoingIsDragging(false);
    if (ongoingCoursesRef.current) {
      ongoingCoursesRef.current.style.cursor = 'grab';
      ongoingCoursesRef.current.style.userSelect = 'auto';
    }
  };

  // Popular Courses mouse handlers
  const handlePopularMouseDown = (e: React.MouseEvent) => {
    if (!popularCoursesRef.current) return;
    setPopularIsDragging(true);
    setPopularStartX(e.pageX - popularCoursesRef.current.offsetLeft);
    setPopularScrollLeft(popularCoursesRef.current.scrollLeft);
    popularCoursesRef.current.style.cursor = 'grabbing';
    popularCoursesRef.current.style.userSelect = 'none';
  };

  const handlePopularMouseMove = (e: React.MouseEvent) => {
    if (!popularIsDragging || !popularCoursesRef.current) return;
    e.preventDefault();
    const x = e.pageX - popularCoursesRef.current.offsetLeft;
    const walk = (x - popularStartX) * 2;
    popularCoursesRef.current.scrollLeft = popularScrollLeft - walk;
  };

  const handlePopularMouseUp = () => {
    setPopularIsDragging(false);
    if (popularCoursesRef.current) {
      popularCoursesRef.current.style.cursor = 'grab';
      popularCoursesRef.current.style.userSelect = 'auto';
    }
  };

  const handlePopularMouseLeave = () => {
    setPopularIsDragging(false);
    if (popularCoursesRef.current) {
      popularCoursesRef.current.style.cursor = 'grab';
      popularCoursesRef.current.style.userSelect = 'auto';
    }
  };

  // Show back-to-top button after scrolling down a bit
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 240);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fallbackTestimonials: Testimonial[] = [
    {
      id: 'fallback-1',
      name: 'Sushil Shrestha',
      designation: 'Architect',
      company: null,
      comment:
        'As an architect, I’ve found each course, taught by the highly knowledgeable Acharya Raja Babu Shah, to provide deep insights and practical knowledge.',
      rating: 4,
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      isPublished: true,
      featured: true,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-2',
      name: 'Sushil Amatya',
      designation: 'Engineer',
      company: null,
      comment:
        'Sanskar Academy is a training institute of knowledge of occult science. It learns people how to live life with full of joy and energy, making good results.',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop&q=80',
      isPublished: true,
      featured: true,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fallback-3',
      name: 'Karuna Shrestha',
      designation: 'Vastu Consultant',
      company: null,
      comment:
        'Thank you Rajababu Gurudev and Sanskar Academy for giving me a platform to change my life as a Vastu Consultant.',
      rating: 4,
      image:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      isPublished: true,
      featured: true,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const testimonialsToShow =
    (testimonials && testimonials.length ? testimonials : fallbackTestimonials);

  useEffect(() => {
    if (testimonialsToShow.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonialsToShow.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonialsToShow.length]);

  const getWrappedTestimonial = (offset: number) => {
    if (!testimonialsToShow.length) return null;
    const len = testimonialsToShow.length;
    const idx = (testimonialIndex + offset + len) % len;
    return testimonialsToShow[idx];
  };

  const sideLeft = getWrappedTestimonial(-1);
  const center = getWrappedTestimonial(0);
  const sideRight = getWrappedTestimonial(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section (static, no carousel) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef4ff] via-[#f5f8ff] to-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-md border border-[#9cb8f2] bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#1f4fb9]">
                नेपालको अग्रणी डिजिटल लर्निङ प्लेटफर्म
              </span>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#101828] leading-[1.08] font-sans">
                Learn Skills That Shape
                <br />
                Your Future{' '}
                <span className="text-[#2f6fe4]">- Genius Academy</span>
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg text-[#475467] font-sans">
                From Loksewa to SEE and professional skills - Learn anytime, anywhere.
                Everything you need in one platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={ROUTES.COURSES}
                  className="inline-flex items-center justify-center rounded-md bg-[#2f6fe4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#245ec5]"
                >
                  Start Learning
                </Link>
                <Link
                  href={ROUTES.COURSES}
                  className="inline-flex items-center justify-center rounded-md border border-[#7aa3ec] bg-white px-5 py-2.5 text-sm font-semibold text-[#2f6fe4] transition-colors hover:bg-[#eef4ff]"
                >
                  Explore Course
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:max-w-[600px]">
              <div className="relative mx-auto h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px] overflow-hidden rounded-full border-4 border-white shadow-[0_16px_40px_rgba(47,111,228,0.22)]">
                <Image
                  src="/girl.webp"
                  alt="Hero visual"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 45vw"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none w-full overflow-hidden leading-none -mb-px">
          <svg
            className="block w-full h-[90px] sm:h-[110px]"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,110 C70,112 90,95 150,98 C260,102 220,70 330,62 C510,48 600,72 760,42 C900,16 980,54 1120,30 C1250,8 1330,10 1440,24 L1440,120 L0,120 Z"
              fill="#c7d9f5"
            />
            <path
              d="M0,110 C70,112 90,95 150,98 C260,102 220,70 330,62 C510,48 600,72 760,42 C900,16 980,54 1120,30 C1250,8 1330,10 1440,24"
              fill="none"
              stroke="#1f84ea"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="relative mt-0 pt-0 bg-white">
        <UpcomingEvents />
      </section>

      {/* Ongoing Courses - horizontal scrollable carousel */}
      <section className="pt-8 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="section-title text-gray-900">
              Ongoing Courses
            </h2>
          </div>

          <div className="relative min-h-[320px] flex items-center">
            {/* Navigation Arrows - Only show if more than 3 courses */}
            {ongoingCourses.length > 3 && (
              <>
                <button
                  onClick={() => scrollOngoingCourses('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Previous courses"
                >
                  <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => scrollOngoingCourses('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Next courses"
                >
                  <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={ongoingCoursesRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${ongoingCourses.length > 3 ? 'scroll-smooth' : 'justify-start'
                } ${ongoingIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleOngoingMouseDown}
              onMouseMove={handleOngoingMouseMove}
              onMouseUp={handleOngoingMouseUp}
              onMouseLeave={handleOngoingMouseLeave}
            >
              {ongoingCoursesLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] h-72 bg-gray-100 animate-pulse rounded-lg"
                    />
                  ))}
                </>
              )}
              {!ongoingCoursesLoading && ongoingCourses.length === 0 && (
                <div className="w-full py-12 text-center text-gray-600">
                  <p>No ongoing courses at the moment. Check back soon!</p>
                </div>
              )}
              {!ongoingCoursesLoading &&
                ongoingCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    oldPrice={course.oldPrice}
                    rating={course.rating}
                    metaText={course.metaText}
                    slug={course.slug}
                    className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] sm:w-[360px] lg:w-[400px]"
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses - dynamic from API (featured courses) */}
      <section className="pt-8 pb-8 bg-white" data-section="popular-courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="section-title text-gray-900">
              Popular Courses
            </h2>
          </div>

          <div className="relative min-h-[320px] flex items-center">
            {/* Navigation Arrows - Only show if more than 6 courses */}
            {popularCourses.length > 6 && (
              <>
                <button
                  onClick={() => scrollPopularCourses('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Previous courses"
                >
                  <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => scrollPopularCourses('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Next courses"
                >
                  <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={popularCoursesRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${popularCourses.length > 1 ? 'scroll-smooth' : ''} ${popularIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handlePopularMouseDown}
              onMouseMove={handlePopularMouseMove}
              onMouseUp={handlePopularMouseUp}
              onMouseLeave={handlePopularMouseLeave}
            >
              {popularCoursesLoading && (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] sm:w-[320px] lg:w-[360px] h-72 bg-gray-100 animate-pulse rounded-lg"
                    />
                  ))}
                </>
              )}
              {!popularCoursesLoading && popularCourses.length === 0 && (
                <div className="w-full py-12 text-center text-gray-600">
                  <p>No popular courses at the moment. Mark courses as popular (tick) in admin to show them here.</p>
                </div>
              )}
              {!popularCoursesLoading &&
                popularCourses.length > 0 &&
                popularCourses.map((course) => (
                  <CourseCard
                    key={String(course.id)}
                    id={course.id}
                    title={course.title}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    oldPrice={course.oldPrice}
                    rating={course.rating}
                    metaText={course.metaText}
                    slug={course.slug}
                    className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] sm:w-[360px] lg:w-[400px]"
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Our Client Say */}
      <section className="pt-10 pb-10 bg-[#eaf2ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Words from Our Students</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Let&apos;s hear directly from our beloved students about their experience with Genius Academy
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-12 gap-4 items-center">
              {[sideLeft, center, sideRight].map((testimonial, i) => {
                if (!testimonial) return null;
                const isCenter = i === 1;
                return (
                  <div
                    key={`${testimonial.id}-${i}`}
                    className={`${
                      isCenter
                        ? 'col-span-12 md:col-span-8 lg:col-span-6 md:col-start-3 lg:col-start-4'
                        : 'hidden lg:block lg:col-span-3'
                    }`}
                  >
                    <div
                      className={`rounded-xl border transition-all ${
                        isCenter
                          ? 'bg-white border-[#dbeafe] shadow-[0_12px_28px_rgba(24,119,242,0.16)] p-5'
                          : 'bg-white/70 border-[#dbeafe] opacity-45 p-4'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {testimonial.image ? (
                          <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img src={testimonial.image} alt={testimonial.name || 'Student'} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] flex items-center justify-center font-semibold">
                            {(testimonial.name || 'S').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{testimonial.name || 'Student'}</p>
                          <p className="text-xs text-gray-500">{testimonial.designation || testimonial.company || 'Genius Academy'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{testimonial.comment}</p>
                      <div className="mt-3 text-yellow-400 text-lg tracking-tight">
                        {'★'.repeat(Math.max(1, Math.min(5, testimonial.rating || 5)))}
                        <span className="text-gray-300">{'★'.repeat(5 - Math.max(1, Math.min(5, testimonial.rating || 5)))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {testimonialsToShow.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {testimonialsToShow.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-label={`Go to testimonial ${idx + 1}`}
                    onClick={() => setTestimonialIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === testimonialIndex ? 'w-7 bg-[var(--primary-700)]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Static Success Stories Section */}
      <SuccessStories />

      {/* Gallery Section */}
      <Gallery />

      {/* FAQ Section */}
      <FAQ />

      {/* App Promo Section (after FAQ) */}
      <section className="pt-2 pb-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full overflow-hidden">
            <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/6]">
              <Image
                src="/page.png"
                alt="Learn anytime app section"
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1200px"
              />
            </div>
          </div>
        </div>
      </section>

      {showBackToTop && (
        <>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-4 z-40 inline-flex w-10 h-10 md:w-11 md:h-11 items-center justify-center rounded-full bg-[#1877f2] text-white border-2 border-[#1877f2] shadow-lg shadow-black/20 transition hover:bg-[#1668d3] hover:-translate-y-0.5 md:bottom-8 md:right-8"
            style={{ animation: 'backToTopIn 0.35s ease-out forwards' }}
          >
            <HiChevronUp className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <style jsx global>{`
            @keyframes backToTopIn {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
