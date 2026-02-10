'use client';

import React, { useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface SuccessStory {
  id: number;
  name: string;
  youtubeId: string;
}

const successStories: SuccessStory[] = [
  {
    id: 1,
    name: 'Meera Rajbansi',
    youtubeId: '9Sg7MdWeJlc', // https://www.youtube.com/watch?v=9Sg7MdWeJlc
  },
  {
    id: 2,
    name: 'Pawan Rawal',
    youtubeId: 'Nq8MSEwBolY', // https://www.youtube.com/watch?v=Nq8MSEwBolY
  },
  {
    id: 3,
    name: 'Chandra Ranabhat',
    youtubeId: 'PHjZMrVhyYk', // https://www.youtube.com/watch?v=PHjZMrVhyYk
  },
];

export const SuccessStories: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasCarousel = successStories.length > 1;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 404; // Card width (400) + gap (24)
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="pt-8 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="section-title text-gray-900">
            Success Stories
          </h2>
        </div>

        {/* Stories Carousel with YouTube videos */}
        <div className="relative min-h-[320px] flex items-center">
          {/* Navigation Arrows - Only show if more than 1 story */}
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

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              hasCarousel ? 'scroll-smooth' : 'justify-start'
            }`}
          >
            {successStories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
              >
                {/* YouTube video */}
                <div className="relative w-full h-52 p-2">
                  <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${story.youtubeId}`}
                      title={story.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Name only */}
                <div className="px-5 pt-0 pb-0">
                  <h3 className="text-base md:text-lg font-bold tracking-wide text-gray-900 mb-1 line-clamp-2 uppercase">
                    {story.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};


