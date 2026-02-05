'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { getUpcomingEvents } from '@/lib/api/events';
import type { Event } from '@/lib/api/events';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&q=80';

function formatEventDate(startDate: string): string {
  return new Date(startDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const UpcomingEvents: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUpcomingEvents();
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load upcoming events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEvents();
    return () => { cancelled = true; };
  }, []);

  const showCarousel = events.length > 3;

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

  return (
    <section className="pt-16 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-gray-600">
            Hear from those who have experienced the accuracy and guidance of Sanskar Academy
          </p>
        </div>

        {/* Events Grid/Carousel */}
        <div className="relative">
          {/* Navigation Arrows - Only show if more than 3 events */}
          {showCarousel && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                aria-label="Previous events"
              >
                <HiChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                aria-label="Next events"
              >
                <HiChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              showCarousel ? 'scroll-smooth' : 'justify-center'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {loading && (
              <div className="flex gap-6 w-full justify-center py-8">
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
            {!loading && !error && events.length === 0 && (
              <div className="w-full py-12 text-center text-gray-600">
                <p>No upcoming events at the moment. Check back soon!</p>
              </div>
            )}
            {!loading && !error && events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex-shrink-0 w-[400px] block bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
              >
                {/* Thumbnail */}
                <div className="relative w-full h-52 p-2">
                  <img
                    src={event.image || PLACEHOLDER_IMAGE}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Content */}
                <div className="px-5 pt-0 pb-0">
                  {/* Date */}
                  <div className="mb-1">
                    <span className="inline-block pl-0 pr-3 py-0 rounded-none bg-white text-xs font-medium text-gray-700">
                      {formatEventDate(event.startDate)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-bold tracking-wide text-gray-900 mb-1 line-clamp-2 uppercase">
                    {event.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

