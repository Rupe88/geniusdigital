'use client';

import React, { useRef, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

type GalleryItem = { src: string; label?: string; isMore?: boolean };

// Base 5 images
const baseImages: GalleryItem[] = [
  { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80' },
  { src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80' },
  { src: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&auto=format&fit=crop&q=80' },
  { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&auto=format&fit=crop&q=80' },
  { src: 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=1200&auto=format&fit=crop&q=80' },
];

// Create 20 images by repeating base images 4 times, then add "See More"
const allGalleryImages: GalleryItem[] = [
  ...Array(4).fill(baseImages).flat(),
  { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&auto=format&fit=crop&q=80', isMore: true, label: 'See More' },
];

// Distribute 21 items across 3 rows (7 items per row)
const getRowItems = (items: GalleryItem[], rowIndex: number, itemsPerRow: number) => {
  const startIndex = rowIndex * itemsPerRow;
  return items.slice(startIndex, startIndex + itemsPerRow);
};

export const Gallery: React.FC = () => {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLefts, setScrollLefts] = useState({ row1: 0, row2: 0, row3: 0 });

  const itemsPerRow = 7;
  const row1Items = getRowItems(allGalleryImages, 0, itemsPerRow);
  const row2Items = getRowItems(allGalleryImages, 1, itemsPerRow);
  const row3Items = getRowItems(allGalleryImages, 2, itemsPerRow);

  const scrollGallery = (direction: 'left' | 'right') => {
    const scrollAmount = 404; // Card width (400) + gap (24)
    
    [row1Ref, row2Ref, row3Ref].forEach((ref) => {
      if (ref.current) {
        const currentScroll = ref.current.scrollLeft;
        const newScroll = direction === 'left' 
          ? currentScroll - scrollAmount 
          : currentScroll + scrollAmount;
        
        ref.current.scrollTo({
          left: newScroll,
          behavior: 'smooth',
        });
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const clientX = e.pageX;
    setStartX(clientX);
    
    const scrollLefts = {
      row1: row1Ref.current?.scrollLeft || 0,
      row2: row2Ref.current?.scrollLeft || 0,
      row3: row3Ref.current?.scrollLeft || 0,
    };
    setScrollLefts(scrollLefts);

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
    
    const x = e.pageX;
    const walk = (x - startX) * 2; // Scroll speed multiplier

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

  const hasMultipleItems = allGalleryImages.length > itemsPerRow;

  return (
    <section className="pt-8 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Our Gallery</h2>
          <p className="text-lg text-gray-600">
            Moments from our events, trainings, and community gatherings.
          </p>
        </div>

        <div className="relative space-y-6">
          {/* Navigation Arrows - Only show if there are more items than can fit */}
          {hasMultipleItems && (
            <>
              <button
                onClick={() => scrollGallery('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                aria-label="Previous gallery"
              >
                <HiChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scrollGallery('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg"
                aria-label="Next gallery"
              >
                <HiChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Row 1 */}
          <div
            ref={row1Ref}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              hasMultipleItems ? 'scroll-smooth' : 'justify-center'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {row1Items.map((item, index) => (
              <div
                key={`row1-${index}-${item.src}`}
                className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={item.src}
                    alt={item.label || `Gallery item ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {item.isMore && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold">
                      {item.label || 'See More'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div
            ref={row2Ref}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              hasMultipleItems ? 'scroll-smooth' : 'justify-center'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {row2Items.map((item, index) => (
              <div
                key={`row2-${index}-${item.src}`}
                className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={item.src}
                    alt={item.label || `Gallery item ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {item.isMore && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold">
                      {item.label || 'See More'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 */}
          <div
            ref={row3Ref}
            className={`flex gap-6 overflow-x-auto hide-scrollbar ${
              hasMultipleItems ? 'scroll-smooth' : 'justify-center'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {row3Items.map((item, index) => (
              <div
                key={`row3-${index}-${item.src}`}
                className="flex-shrink-0 w-[400px] bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={item.src}
                    alt={item.label || `Gallery item ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {item.isMore && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold">
                      {item.label || 'See More'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
