'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight, HiChevronUp } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroCarousel } from '@/components/HeroCarousel';
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
  slug?: string;
};

export default function HomePage() {
  const [popularCoursesList, setPopularCoursesList] = useState<Course[]>([]);
  const [popularCoursesLoading, setPopularCoursesLoading] = useState(true);
  const [ongoingCoursesList, setOngoingCoursesList] = useState<Course[]>([]);
  const [ongoingCoursesLoading, setOngoingCoursesLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const ongoingCoursesRef = useRef<HTMLDivElement>(null);
  const popularCoursesRef = useRef<HTMLDivElement>(null);
  const clientSayRef = useRef<HTMLDivElement>(null);

  // Ongoing Courses drag state
  const [ongoingIsDragging, setOngoingIsDragging] = useState(false);
  const [ongoingStartX, setOngoingStartX] = useState(0);
  const [ongoingScrollLeft, setOngoingScrollLeft] = useState(0);

  // Popular Courses drag state
  const [popularIsDragging, setPopularIsDragging] = useState(false);
  const [popularStartX, setPopularStartX] = useState(0);
  const [popularScrollLeft, setPopularScrollLeft] = useState(0);

  // Client Say drag state
  const [clientSayIsDragging, setClientSayIsDragging] = useState(false);
  const [clientSayStartX, setClientSayStartX] = useState(0);
  const [clientSayScrollLeft, setClientSayScrollLeft] = useState(0);

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
    slug: course.slug,
  }));

  const popularCourses: SimpleCourse[] = (popularCoursesList || []).map((course) => ({
    id: course.id ?? '',
    title: course.title ?? '',
    thumbnail: course.thumbnail || '/hero1.png',
    price: course.isFree ? 'Free' : `Rs. ${course.price ?? 0}`,
    oldPrice: course.originalPrice != null ? `Rs. ${course.originalPrice}` : undefined,
    slug: course.slug ?? '',
  }));

  const hasTestimonialsCarousel = testimonials.length > 1;

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

  // Client Say scroll function
  const scrollClientSay = (direction: 'left' | 'right') => {
    if (!clientSayRef.current) return;
    const scrollAmount = 404; // Card width (400) + gap (24)
    const currentScroll = clientSayRef.current.scrollLeft;
    const maxScroll = clientSayRef.current.scrollWidth - clientSayRef.current.clientWidth;

    let newScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    if (direction === 'right' && currentScroll >= maxScroll - 10) {
      newScroll = 0;
    } else if (direction === 'left' && currentScroll <= 10) {
      newScroll = maxScroll;
    }

    clientSayRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  // Client Say mouse handlers
  const handleClientSayMouseDown = (e: React.MouseEvent) => {
    if (!clientSayRef.current) return;
    setClientSayIsDragging(true);
    setClientSayStartX(e.pageX - clientSayRef.current.offsetLeft);
    setClientSayScrollLeft(clientSayRef.current.scrollLeft);
    clientSayRef.current.style.cursor = 'grabbing';
    clientSayRef.current.style.userSelect = 'none';
  };

  const handleClientSayMouseMove = (e: React.MouseEvent) => {
    if (!clientSayIsDragging || !clientSayRef.current) return;
    e.preventDefault();
    const x = e.pageX - clientSayRef.current.offsetLeft;
    const walk = (x - clientSayStartX) * 2;
    clientSayRef.current.scrollLeft = clientSayScrollLeft - walk;
  };

  const handleClientSayMouseUp = () => {
    setClientSayIsDragging(false);
    if (clientSayRef.current) {
      clientSayRef.current.style.cursor = 'grab';
      clientSayRef.current.style.userSelect = 'auto';
    }
  };

  const handleClientSayMouseLeave = () => {
    setClientSayIsDragging(false);
    if (clientSayRef.current) {
      clientSayRef.current.style.cursor = 'grab';
      clientSayRef.current.style.userSelect = 'auto';
    }
  };

  useEffect(() => {
    if (!hasTestimonialsCarousel || !testimonials.length) return;

    const interval = setInterval(() => {
      scrollClientSay('right');
    }, 5000);

    return () => clearInterval(interval);
  }, [hasTestimonialsCarousel, testimonials.length]);

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

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section - Full Width */}
      <section className="relative w-full">
        <HeroCarousel />
      </section>

      {/* Upcoming Events */}
      <section className="relative">
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
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${popularCourses.length > 6 ? 'overflow-x-auto' : ''}`}
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
                      className="w-full h-72 bg-gray-100 animate-pulse rounded-lg"
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
                    slug={course.slug}
                    className="w-full"
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Our Client Say - horizontal scrollable carousel */}
      <section className="pt-8 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="section-title text-gray-900">
              What Our Client Say
            </h2>
          </div>

          <div className="relative min-h-[320px] flex items-center">
            {/* Navigation Arrows - Only show if more than 1 testimonial */}
            {testimonialsToShow.length > 1 && (
              <>
                <button
                  onClick={() => scrollClientSay('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Previous testimonial"
                >
                  <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => scrollClientSay('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                  aria-label="Next testimonial"
                >
                  <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={clientSayRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${testimonialsToShow.length > 1 ? 'scroll-smooth' : 'justify-start'
                } ${clientSayIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleClientSayMouseDown}
              onMouseMove={handleClientSayMouseMove}
              onMouseUp={handleClientSayMouseUp}
              onMouseLeave={handleClientSayMouseLeave}
            >
              {testimonialsToShow.map((testimonial: Testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[280px] sm:w-[360px] lg:w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
                >
                  <div className="px-5 pt-3 pb-0">
                    <div>
                      <div className="flex items-center mb-4">
                        {testimonial.image ? (
                          <div className="mr-4 h-12 w-12 overflow-hidden rounded-lg">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name || 'Client'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary-700)] text-white text-lg font-semibold">
                            {testimonial.name?.[0] || 'S'}
                          </div>
                        )}
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {testimonial.name || 'Student'}
                          </p>
                          <p className="text-sm font-medium text-orange-500">
                            {testimonial.designation || testimonial.company || 'Sanskar Academy Learner'}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-gray-700 mb-1">
                        "{testimonial.comment}"
                      </p>

                      <div className="flex items-center space-x-1 text-yellow-400 text-lg">
                        {'★'.repeat(testimonial.rating || 5)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Static Success Stories Section */}
      <SuccessStories />

      {/* Gallery Section */}
      <Gallery />

      {/* FAQ Section */}
      <FAQ />

      {showBackToTop && (
        <>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-4 z-40 inline-flex w-10 h-10 md:w-11 md:h-11 items-center justify-center rounded-full bg-[#c01e2e] text-white border-2 border-[#c01e2e] shadow-lg shadow-black/20 transition hover:bg-[#a81826] hover:-translate-y-0.5 md:bottom-8 md:right-8"
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
