'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { getGalleryItems } from '@/lib/api/gallery';
import type { GalleryItem } from '@/lib/api/gallery';

const ITEMS_PER_ROW = 7;
const HOMEPAGE_LIMIT = 21;

const getRowItems = <T,>(items: T[], rowIndex: number, itemsPerRow: number): T[] => {
  const startIndex = rowIndex * itemsPerRow;
  return items.slice(startIndex, startIndex + itemsPerRow);
};

export const Gallery: React.FC = () => {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLefts, setScrollLefts] = useState({ row1: 0, row2: 0, row3: 0 });
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getGalleryItems({ limit: HOMEPAGE_LIMIT, page: 1 })
      .then((res) => {
        if (!cancelled && res.data) setItems(res.data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Track window width to calculate scrollable content
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const displayItems = items.filter((item) => item.imageUrl);
  
  // Add "See More" if we have items
  const withSeeMore = displayItems.length > 0 
    ? [...displayItems, { id: 'see-more', isMore: true } as GalleryItem & { isMore?: boolean }]
    : [];
  
  const itemsPerRow = ITEMS_PER_ROW;
  const row1Items = getRowItems(withSeeMore, 0, itemsPerRow);
  const row2Items = getRowItems(withSeeMore, 1, itemsPerRow);
  const row3Items = getRowItems(withSeeMore, 2, itemsPerRow);

  // Calculate if any row can scroll
  // Card width: 400px (lg) or min(400px, calc(100vw - 2rem)) on smaller screens
  // Gap: 24px (gap-6)
  // On typical screens: ~2-3 cards fit without scrolling
  const cardWidth = windowWidth >= 1024 ? 400 : Math.min(400, windowWidth - 32);
  const gap = 24;
  const cardsPerScreen = windowWidth > 0 ? Math.floor((windowWidth - 64) / (cardWidth + gap)) : 2; // 64px for container padding
  const hasScrollableContent = withSeeMore.length > cardsPerScreen;
  
  // Always show buttons if we have items
  const showButtons = withSeeMore.length > 0;

  const scrollGallery = (direction: 'left' | 'right') => {
    // Only scroll if there's scrollable content
    if (!hasScrollableContent) return;
    
    const scrollAmount = 404;
    [row1Ref, row2Ref, row3Ref].forEach((ref) => {
      if (ref.current) {
        const currentScroll = ref.current.scrollLeft;
        const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
        ref.current.scrollTo({ left: newScroll, behavior: 'smooth' });
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLefts({
      row1: row1Ref.current?.scrollLeft || 0,
      row2: row2Ref.current?.scrollLeft || 0,
      row3: row3Ref.current?.scrollLeft || 0,
    });
    [row1Ref, row2Ref, row3Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.style.cursor = 'grabbing';
        ref.current.style.userSelect = 'none';
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 2;
    [row1Ref, row2Ref, row3Ref].forEach((ref, index) => {
      if (ref.current) {
        const key = index === 0 ? 'row1' : index === 1 ? 'row2' : 'row3';
        ref.current.scrollLeft = scrollLefts[key] - walk;
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    [row1Ref, row2Ref, row3Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.style.cursor = 'grab';
        ref.current.style.userSelect = 'auto';
      }
    });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    [row1Ref, row2Ref, row3Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.style.cursor = 'grab';
        ref.current.style.userSelect = 'auto';
      }
    });
  };


  const cardClass =
    'flex-shrink-0 w-[min(400px,calc(100vw-2rem))] lg:w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg';

  const renderCard = (
    item: GalleryItem | (GalleryItem & { isMore?: boolean }),
    rowKey: string,
    index: number
  ) => {
    const isSeeMore = 'isMore' in item && item.isMore;
    const src = isSeeMore ? '' : (item as GalleryItem).imageUrl;
    const alt = isSeeMore ? 'See more' : (item as GalleryItem).title || `Gallery ${index + 1}`;

    const content = (
      <div className="aspect-[4/3] relative">
        {isSeeMore ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300 text-gray-700 text-lg font-semibold">
            See More
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
    );

    return (
      <Link
        key={`${rowKey}-${(item as GalleryItem).id || 'see-more'}-${index}`}
        href="/gallery"
        className={`block ${cardClass}`}
      >
        {content}
      </Link>
    );
  };

  if (loading) {
    return (
      <section className="pt-8 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="section-title text-gray-900 mb-3">Our Gallery</h2>
            <p className="text-lg text-gray-600">Moments from our events, trainings, and community gatherings.</p>
          </div>
        <div className="flex justify-start py-12">
            <div className="animate-pulse rounded-lg bg-gray-200 h-64 w-full max-w-4xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="section-title text-gray-900">Our Gallery</h2>
        </div>

        <div className="relative min-h-[320px] flex items-center">
        {showButtons && (
          <>
            <button
              onClick={() => scrollGallery('left')}
              disabled={!hasScrollableContent}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center ${
                !hasScrollableContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Previous gallery"
            >
              <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={() => scrollGallery('right')}
              disabled={!hasScrollableContent}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-[var(--primary-700)] text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-[var(--primary-700)] hover:bg-[var(--primary-800)] transition-all shadow-lg flex items-center justify-center ${
                !hasScrollableContent ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Next gallery"
            >
              <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </>
        )}

          <div className="space-y-6 w-full">
            <div
              ref={row1Ref}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                hasScrollableContent ? 'scroll-smooth' : 'justify-start'
              } ${isDragging ? 'cursor-grabbing' : hasScrollableContent ? 'cursor-grab' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {row1Items.map((item, index) => renderCard(item, 'row1', index))}
            </div>
            <div
              ref={row2Ref}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                hasScrollableContent ? 'scroll-smooth' : 'justify-start'
              } ${isDragging ? 'cursor-grabbing' : hasScrollableContent ? 'cursor-grab' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {row2Items.map((item, index) => renderCard(item, 'row2', index))}
            </div>
            <div
              ref={row3Ref}
              className={`flex gap-6 overflow-x-auto hide-scrollbar ${
                hasScrollableContent ? 'scroll-smooth' : 'justify-start'
              } ${isDragging ? 'cursor-grabbing' : hasScrollableContent ? 'cursor-grab' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {row3Items.map((item, index) => renderCard(item, 'row3', index))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
