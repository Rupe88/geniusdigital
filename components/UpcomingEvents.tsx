'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';
import { getUpcomingEvents } from '@/lib/api/events';
import type { Event } from '@/lib/api/events';
import { getUpcomingEventCourses } from '@/lib/api/courses';
import type { Course } from '@/lib/types/course';
import { submitUpcomingEventBooking } from '@/lib/api/upcomingEventBookings';
import { getStorageImageSrc } from '@/lib/utils/storage';
import { getApiBaseUrl } from '@/lib/api/axios';
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
  const [popupOpen, setPopupOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    selectedEventOrCourse: '', // "event:id" or "course:id"
    referralSource: '',
    message: '',
  });
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

  const openBookingPopup = (e: React.MouseEvent, item: { type: 'event'; id: string } | { type: 'course'; id: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const value = item.type === 'event' ? `event:${item.id}` : `course:${item.id}`;
    setPopupOpen(true);
    setBookingForm((f) => ({
      ...f,
      name: '',
      email: '',
      phone: '',
      selectedEventOrCourse: value,
      referralSource: '',
      message: '',
    }));
  };

  const closeBookingPopup = () => {
    setPopupOpen(false);
    setBookingSubmitting(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, selectedEventOrCourse, referralSource, message } = bookingForm;
    if (!selectedEventOrCourse) {
      showError('Please select an event or course');
      return;
    }
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
    const [type, id] = selectedEventOrCourse.split(':');
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      referralSource: referralSource?.trim() || undefined,
      message: message?.trim() || undefined,
      ...(type === 'event' ? { eventId: id } : { courseId: id }),
    };
    setBookingSubmitting(true);
    try {
      const result = await submitUpcomingEventBooking(payload);
      if (result.alreadyBooked) {
        showSuccess(result.message);
      } else {
        showSuccess('Booking submitted! We will contact you soon.');
      }
      closeBookingPopup();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
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
              showCarousel ? 'scroll-smooth' : totalItems === 1 ? 'justify-start pl-[calc(50%-200px)]' : 'justify-start'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {loading && (
              <div className="flex gap-4 sm:gap-6 w-full justify-start py-8 overflow-x-auto hide-scrollbar">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] h-72 bg-gray-100 animate-pulse rounded-lg"
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
                className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] sm:w-[360px] lg:w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] overflow-hidden rounded-lg flex flex-col cursor-default"
              >
                <Link href={`/events/${event.slug || event.id}`} className="flex-1 min-h-0 block">
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
                </Link>
                <div className="px-5 pb-4 pt-0">
                  <button
                    type="button"
                    onClick={(e) => openBookingPopup(e, { type: 'event', id: event.id })}
                    className="w-full py-2.5 px-4 rounded-none text-sm font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-colors cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
            {!loading && !error && upcomingCourses.map((course) => (
              <div
                key={`course-${course.id}`}
                className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[260px] sm:w-[360px] lg:w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] overflow-hidden rounded-lg flex flex-col cursor-default"
              >
                <Link href={`/courses/${course.id}`} className="flex-1 min-h-0 block">
                  <div className="relative w-full h-52 p-2">
                    {course.thumbnail ? (
                      <img
                        src={getStorageImageSrc(course.thumbnail, getApiBaseUrl()) || course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
                        <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                          {course.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-5 pt-0 pb-2">
                    {course.startDate && (
                      <div className="mb-1">
                        <span className="inline-block pl-0 pr-3 py-0 rounded-none bg-white text-xs font-medium text-gray-700">
                          {formatEventDate(course.startDate)}
                        </span>
                      </div>
                    )}
                    <h3 className="text-base md:text-lg font-lg tracking-wide text-gray-900 mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                </Link>
                <div className="px-5 pb-4 pt-0">
                  <button
                    type="button"
                    onClick={(e) => openBookingPopup(e, { type: 'course', id: course.id })}
                    className="w-full py-2.5 px-4 rounded-none text-sm font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-colors cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Now popup form */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60"
          aria-modal="true"
          role="dialog"
          onClick={closeBookingPopup}
        >
          <div
            className="bg-white text-gray-900 rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-[min(calc(100vw-1rem),448px)] sm:max-w-md border border-gray-200 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Book Your Seat</h3>
              <button
                type="button"
                onClick={closeBookingPopup}
                className="p-1.5 sm:p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Close"
              >
                <HiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
              <input
                type="text"
                placeholder="Name"
                value={bookingForm.name}
                onChange={(e) => setBookingForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
                required
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select event</label>
                <select
                  value={bookingForm.selectedEventOrCourse}
                  onChange={(e) => setBookingForm((f) => ({ ...f, selectedEventOrCourse: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
                  required
                >
                  <option value="">Select an event or course...</option>
                  {events.map((ev) => (
                    <option key={`event-${ev.id}`} value={`event:${ev.id}`}>
                      Event: {ev.title.length > 40 ? ev.title.slice(0, 40) + '…' : ev.title}
                    </option>
                  ))}
                  {upcomingCourses.map((c) => (
                    <option key={`course-${c.id}`} value={`course:${c.id}`}>
                      Course: {c.title.length > 40 ? c.title.slice(0, 40) + '…' : c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">How did you find us?</label>
                <select
                  value={bookingForm.referralSource}
                  onChange={(e) => setBookingForm((f) => ({ ...f, referralSource: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
                >
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Message"
                value={bookingForm.message}
                onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent resize-none"
              />
              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-3 px-4 rounded font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] disabled:opacity-60 transition-colors"
              >
                {bookingSubmitting ? 'Submitting...' : 'Book your seat'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

