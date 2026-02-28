'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { studentSuccessApi, StudentSuccess } from '@/lib/api/studentSuccess';

/** Extract YouTube video ID from URL or return as-is if already an ID */
function getYoutubeId(url: string): string | null {
  if (!url || !url.trim()) return null;
  const s = url.trim();
  const watchMatch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return null;
}

export const SuccessStories: React.FC = () => {
  const [stories, setStories] = useState<StudentSuccess[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasCarousel = stories.length > 1;

  useEffect(() => {
    let cancelled = false;
    const fetchStories = async () => {
      try {
        const res = await studentSuccessApi.getAll({ limit: 50 });
        if (!cancelled && res?.data) {
          setStories(res.data);
        }
      } catch (err) {
        if (!cancelled) setStories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStories();
    return () => { cancelled = true; };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 404;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
    scrollContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  if (loading || stories.length === 0) {
    if (loading) {
      return (
        <section className="pt-8 pb-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="section-title text-gray-900">Success Stories</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[280px] h-72 bg-gray-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="pt-8 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="section-title text-gray-900">Success Stories</h2>
        </div>

        <div className="relative min-h-[320px] flex items-center">
          {hasCarousel && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                aria-label="Previous success story"
              >
                <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center"
                aria-label="Next success story"
              >
                <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </>
          )}

          <div
            ref={scrollContainerRef}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              hasCarousel ? 'scroll-smooth' : 'justify-start'
            }`}
          >
            {stories.map((story) => {
              const youtubeId = story.videoUrl ? getYoutubeId(story.videoUrl) : null;
              return (
                <div
                  key={story.id}
                  className="flex-shrink-0 w-[min(calc(100vw-2rem),400px)] min-w-[280px] sm:w-[360px] lg:w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
                >
                  <div className="relative w-full h-52 p-2">
                    {youtubeId ? (
                      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title={story.studentName}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : story.studentImage ? (
                      <img
                        src={story.studentImage}
                        alt={story.studentName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
                        <span className="text-[var(--primary-700)] font-semibold text-2xl">
                          {story.studentName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-3">
                    <h3 className="text-base md:text-lg font-bold tracking-wide text-gray-900 line-clamp-2 uppercase">
                      {story.studentName}
                    </h3>
                    {story.achievement && (
                      <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">{story.achievement}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
