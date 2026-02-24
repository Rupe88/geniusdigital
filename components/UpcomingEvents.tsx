'use client';

import React, { useRef, useState, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';
import { getUpcomingEvents, registerForEvent } from '@/lib/api/events';
import type { Event } from '@/lib/api/events';
import { getUpcomingEventCourses } from '@/lib/api/courses';
import type { Course } from '@/lib/types/course';
import { CourseCard } from '@/components/CourseCard';
import { formatPrice } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&q=80';

function formatEventDate(startDate: string): string {
  return new Date(startDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const REFERRAL_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'FRIEND_REFERRAL', label: 'Friend / Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
];

export const UpcomingEvents: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingCourses, setUpcomingCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [bookingEvent, setBookingEvent] = useState<Event | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', eventId: '', referralSource: '', message: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventsData, coursesData] = await Promise.all([
          getUpcomingEvents(),
          getUpcomingEventCourses(),
        ]);
        if (!cancelled) {
          setEvents(eventsData);
          setUpcomingCourses(coursesData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load upcoming events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const totalItems = events.length + upcomingCourses.length;
  const showCarousel = totalItems > 3;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 404; // Card width (360) + gap (~24)
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = 'auto';
    }
  };

  const openBookingPopup = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setBookingEvent(event);
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      eventId: event.id,
      referralSource: '',
      message: '',
    });
  };

  const closeBookingPopup = () => {
    setBookingEvent(null);
    setBookingSubmitting(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent) return;
    const { name, email, phone, eventId, referralSource, message } = bookingForm;
    const eventIdToRegister = eventId || bookingEvent.id;
    if (!name?.trim()) {
      showError('Please enter your name');
      return;
    }
    if (!email?.trim()) {
      showError('Please enter your email');
      return;
    }
    if (!phone?.trim()) {
      showError('Please enter your phone number');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }
    setBookingSubmitting(true);
    try {
      await registerForEvent(eventIdToRegister, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        referralSource: referralSource?.trim() || undefined,
        message: message?.trim() || undefined,
      });
      showSuccess('Successfully registered! We will contact you soon.');
      closeBookingPopup();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <section className="pt-16 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="section-title text-gray-900">
            Upcoming Events
          </h2>
        </div>

        {/* Events Grid/Carousel */}
        <div className="relative min-h-[320px] flex items-center">
          {/* Navigation Arrows - Only show if more than 3 events */}
          {showCarousel && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                aria-label="Previous events"
              >
                <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                aria-label="Next events"
              >
                <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              showCarousel ? 'scroll-smooth' : 'justify-start'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {loading && (
              <div className="flex gap-6 w-full justify-start py-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[400px] h-72 bg-gray-100 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            )}
            {error && !loading && (
              <div className="w-full py-12 text-center text-gray-600">
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && totalItems === 0 && (
              <div className="w-full py-12 text-center text-gray-600">
                <p>No upcoming events at the moment. Check back soon!</p>
              </div>
            )}
            {!loading && !error && events.map((event) => (
              <div
                key={event.id}
                className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] overflow-hidden rounded-lg flex flex-col cursor-default"
              >
                {/* Card content – not clickable */}
                <div className="flex-1 min-h-0">
                  {/* Thumbnail */}
                  <div className="relative w-full h-52 p-2">
                    <img
                      src={event.image || PLACEHOLDER_IMAGE}
                      alt={event.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {event.featured && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 text-xs font-semibold rounded">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-0 pb-2">
                    <div className="mb-1">
                      <span className="inline-block pl-0 pr-3 py-0 rounded-none bg-white text-xs font-medium text-gray-700">
                        {formatEventDate(event.startDate)}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-lg tracking-wide text-gray-900 mb-1 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-0">
                  <button
                    type="button"
                    onClick={(e) => openBookingPopup(e, event)}
                    className="w-full py-2.5 px-4 rounded-none text-sm font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-colors cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
            {!loading && !error && upcomingCourses.map((course) => (
              <div key={`course-${course.id}`} className="flex-shrink-0 w-[400px]">
                <CourseCard
                  id={course.id}
                  title={course.title}
                  thumbnail={course.thumbnail}
                  price={course.isFree ? 'Free' : formatPrice(course.price)}
                  oldPrice={course.originalPrice ? formatPrice(course.originalPrice) : undefined}
                  slug={course.slug}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Now popup form */}
      {bookingEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          aria-modal="true"
          role="dialog"
          onClick={closeBookingPopup}
        >
          <div
            className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-md border border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Fill the Form For More Update</h3>
              <button
                type="button"
                onClick={closeBookingPopup}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Enter your name"
                value={bookingForm.name}
                onChange={(e) => setBookingForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  required
                />
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={bookingForm.eventId}
                  onChange={(e) => setBookingForm((f) => ({ ...f, eventId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title.length > 35 ? ev.title.slice(0, 35) + '…' : ev.title}
                    </option>
                  ))}
                </select>
                <select
                  value={bookingForm.referralSource}
                  onChange={(e) => setBookingForm((f) => ({ ...f, referralSource: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                >
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Enter your message"
                value={bookingForm.message}
                onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] resize-none"
              />
              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-3 px-4 rounded-none font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] disabled:opacity-60 transition-colors"
              >
                {bookingSubmitting ? 'Submitting...' : 'Book Your Seat Now'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

