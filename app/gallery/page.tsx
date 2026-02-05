'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HiPhotograph } from 'react-icons/hi';
import { getGalleryItems } from '@/lib/api/gallery';
import type { GalleryItem } from '@/lib/api/gallery';
import { ImageLightbox } from '@/components/gallery/ImageLightbox';

const LOAD_STEP = 16;

// Helper function to determine card size for asymmetric collage layout
const getCardSize = (index: number) => {
  // Every 5th item: large featured card (2x2)
  if (index % 5 === 0) {
    return 'col-span-2 row-span-2';
  }
  // Every 3rd item: tall card (1x2)
  if (index % 3 === 0) {
    return 'col-span-1 row-span-2';
  }
  // Others: regular card (1x1)
  return 'col-span-1 row-span-1';
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(LOAD_STEP);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Fetch all items in one go with a high limit
    getGalleryItems({ page: 1, limit: 1000 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setItems(data);
        const withImages = data.filter((item) => item.imageUrl);
        setDisplayCount(Math.min(LOAD_STEP, withImages.length || LOAD_STEP));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayItems = useMemo(
    () => items.filter((item) => item.imageUrl),
    [items]
  );

  const visibleItems = useMemo(
    () => displayItems.slice(0, Math.min(displayCount, displayItems.length)),
    [displayItems, displayCount]
  );

  const canLoadMore = displayCount < displayItems.length;
  const remaining = displayItems.length - displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + LOAD_STEP, displayItems.length));
  };

  const openLightbox = (indexInVisible: number) => {
    const item = visibleItems[indexInVisible];
    const globalIndex = displayItems.findIndex((i) => i.id === item.id);
    setLightboxIndex(globalIndex === -1 ? 0 : globalIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setLightboxIndex((prev) =>
      prev + 1 >= displayItems.length ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setLightboxIndex((prev) =>
      prev - 1 < 0 ? displayItems.length - 1 : prev - 1
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Our Gallery</h1>
            <p className="text-gray-600 mt-1">All moments from our events, trainings, and community.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center text-[#c01e2e] hover:underline font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-100 ${getCardSize(
                  i
                )}`}
              >
                <div className="w-full h-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          // Empty state
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <HiPhotograph className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              No gallery items yet.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Once images are added, they will appear here.
            </p>
            <Link
              href="/"
              className="text-[#c01e2e] hover:underline font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Asymmetric collage grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
              {visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getCardSize(
                    index
                  )}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'Gallery image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300" />
                </button>
              ))}
            </div>

            {/* Load More */}
            {canLoadMore && (
              <div className="flex items-center justify-center mt-10">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium transition-colors"
                >
                  Load {remaining > LOAD_STEP ? LOAD_STEP : remaining} More
                  {remaining > 1 ? ' Images' : ' Image'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={displayItems}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrevious={prevImage}
      />
    </main>
  );
}

