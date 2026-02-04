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
};

const dummyOngoingCourses: SimpleCourse[] = [
  {
    id: 'ongoing-1',
    title: 'VASTU GURU COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 2999',
    oldPrice: 'Rs. 6000',
  },
  {
    id: 'ongoing-2',
    title: 'MEDICAL ASTROLOGY ADVANCE COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 1999',
    oldPrice: 'Rs. 5000',
  },
  {
    id: 'ongoing-3',
    title: 'VEDIC ASTROLOGY ADVANCE COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 3999',
    oldPrice: 'Rs. 8000',
  },
  {
    id: 'ongoing-4',
    title: 'PALMISTRY BASIC COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 999',
    oldPrice: 'Rs. 3000',
  },
  {
    id: 'ongoing-5',
    title: 'FENG SHUI PRACTICAL COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 1499',
    oldPrice: 'Rs. 4000',
  },
  {
    id: 'ongoing-6',
    title: 'NUMEROLOGY MASTER COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 2499',
    oldPrice: 'Rs. 5500',
  },
];

const dummyPopularCourses: SimpleCourse[] = [
  {
    id: 'popular-1',
    title: '7 DAYS BASIC VASTU COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 399',
    oldPrice: 'Rs. 4000',
  },
  {
    id: 'popular-2',
    title: '9 DAYS BASIC VEDIC ASTROLOGY COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 999',
    oldPrice: 'Rs. 4000',
  },
  {
    id: 'popular-3',
    title: 'MOBILE NUMEROLOGY 4 DAYS BASIC COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 99',
    oldPrice: 'Rs. 3000',
  },
  {
    id: 'popular-4',
    title: 'VEDIC ASTROLOGY ADVANCE COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 3999',
    oldPrice: 'Rs. 8000',
  },
  {
    id: 'popular-5',
    title: 'MOBILE NUMEROLOGY 15 DAYS ADVANCE COURSE',
    thumbnail: '/hero1.png',
    price: 'Rs. 2999',
    oldPrice: 'Rs. 6000',
  },
  {
    id: 'popular-6',
    title: 'BUSINESS SUCCESS BLUEPRINT 7 DAYS COURSE',
    thumbnail: '/hero2.png',
    price: 'Rs. 399',
    oldPrice: 'Rs. 6000',
  },
];

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const testimonialsScrollRef = useRef<HTMLDivElement | null>(null);
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
        const [coursesData, testimonialsData] = await Promise.all([
          courseApi.filterCourses({ featured: true, limit: 6 }).catch(() => ({ data: [] })),
          testimonialApi.getTestimonials({ limit: 3, featured: true }).catch(() => ({ data: [] })),
        ]);
        setFeaturedCourses(coursesData.data || []);
        setTestimonials(testimonialsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const ongoingCourses: SimpleCourse[] =
    featuredCourses.length > 0
      ? featuredCourses.slice(0, 6).map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail || '/hero1.png',
        price: course.isFree ? 'Free' : `Rs. ${course.price}`,
        oldPrice: course.originalPrice ? `Rs. ${course.originalPrice}` : undefined,
      }))
      : dummyOngoingCourses;

  const popularCourses: SimpleCourse[] =
    featuredCourses.length > 0
      ? featuredCourses.slice(0, 6).map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail || '/hero1.png',
        price: course.isFree ? 'Free' : `Rs. ${course.price}`,
      }))
      : dummyPopularCourses;


  const hasTestimonialsCarousel = testimonials.length > 1;

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (!testimonialsScrollRef.current) return;
    const cardWidthWithGap = 404;
    const current = testimonialsScrollRef.current.scrollLeft;
    const next =
      direction === 'left' ? current - cardWidthWithGap : current + cardWidthWithGap;

    testimonialsScrollRef.current.scrollTo({
      left: next,
      behavior: 'smooth',
    });
  };

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
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
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
      scrollTestimonials('right');
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
    (testimonials && testimonials.length ? testimonials : fallbackTestimonials).slice(0, 3);

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
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ongoing Courses
            </h2>
            <p className="text-lg text-gray-600">
              Continue learning with the courses you&apos;re currently enrolled in. Track your
              progress, revisit lessons, and stay on top of your studies with ease.
            </p>
          </div>

          <div className="relative">
            {/* Navigation Arrows - Only show if more than 3 courses */}
            {ongoingCourses.length > 3 && (
              <>
                <button
                  onClick={() => scrollOngoingCourses('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Previous courses"
                >
                  <HiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => scrollOngoingCourses('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Next courses"
                >
                  <HiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={ongoingCoursesRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                ongoingCourses.length > 3 ? 'scroll-smooth' : 'justify-center'
              } ${ongoingIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleOngoingMouseDown}
              onMouseMove={handleOngoingMouseMove}
              onMouseUp={handleOngoingMouseUp}
              onMouseLeave={handleOngoingMouseLeave}
            >
              {ongoingCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  thumbnail={course.thumbnail}
                  price={course.price}
                  oldPrice={course.oldPrice}
                  className="flex-shrink-0 w-[400px]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses - horizontal scrollable carousel */}
      <section className="pt-8 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-lg text-gray-600">
              Explore our most sought-after courses, loved by students across Nepal for their
              comprehensive content and practical approach. Start your journey to success today!
            </p>
          </div>

          <div className="relative">
            {/* Navigation Arrows - Only show if more than 3 courses */}
            {popularCourses.length > 3 && (
              <>
                <button
                  onClick={() => scrollPopularCourses('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Previous courses"
                >
                  <HiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => scrollPopularCourses('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Next courses"
                >
                  <HiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={popularCoursesRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                popularCourses.length > 3 ? 'scroll-smooth' : 'justify-center'
              } ${popularIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handlePopularMouseDown}
              onMouseMove={handlePopularMouseMove}
              onMouseUp={handlePopularMouseUp}
              onMouseLeave={handlePopularMouseLeave}
            >
              {popularCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-52 p-2">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-0 pb-0">
                    <h3 className="text-base md:text-lg font-bold tracking-wide text-gray-900 mb-1 line-clamp-2 uppercase">
                      {course.title}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      {course.price && (
                        <span className="text-lg font-bold text-[var(--primary-700)]">
                          {course.price}
                        </span>
                      )}
                      {course.oldPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {course.oldPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Our Client Say - horizontal scrollable carousel */}
      <section className="pt-8 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Client Say
            </h2>
            <p className="text-lg text-gray-600">
              Hear from those who have experienced the accuracy and guidance of Sanskar Academy.
            </p>
          </div>

          <div className="relative">
            {/* Navigation Arrows - Only show if more than 1 testimonial */}
            {testimonialsToShow.length > 1 && (
              <>
                <button
                  onClick={() => scrollClientSay('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Previous testimonial"
                >
                  <HiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => scrollClientSay('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                  aria-label="Next testimonial"
                >
                  <HiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={clientSayRef}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                testimonialsToShow.length > 1 ? 'scroll-smooth' : 'justify-center'
              } ${clientSayIsDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={handleClientSayMouseDown}
              onMouseMove={handleClientSayMouseMove}
              onMouseUp={handleClientSayMouseUp}
              onMouseLeave={handleClientSayMouseLeave}
            >
              {testimonialsToShow.map((testimonial: Testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
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

      {showBackToTop && (
        <>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-none bg-[#c01e2e] text-white shadow-lg shadow-black/20 transition hover:bg-[#a81826] hover:-translate-y-0.5 md:bottom-8 md:right-8"
            style={{ animation: 'backToTopIn 0.35s ease-out forwards' }}
          >
            <HiChevronUp className="h-6 w-6" />
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
