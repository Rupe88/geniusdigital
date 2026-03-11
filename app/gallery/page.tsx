'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HiPhotograph } from 'react-icons/hi';
import { getGalleryItems } from '@/lib/api/gallery';
import type { GalleryItem } from '@/lib/api/gallery';
import { ImageLightbox } from '@/components/gallery/ImageLightbox';
import { Modal } from '@/components/ui/Modal';
import { getYouTubeEmbedUrl, getGoogleDriveEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/utils/helpers';

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

const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoCount, setVideoCount] = useState(LOAD_STEP);
  const [imageCount, setImageCount] = useState(LOAD_STEP);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title?: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Fetch all items in one go with a high limit
    getGalleryItems({ page: 1, limit: 1000 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setItems(data);
        const videos = data.filter((item) => !!item.videoUrl && !item.imageUrl);
        const images = data.filter((item) => !!item.imageUrl);
        setVideoCount(Math.min(LOAD_STEP, videos.length || LOAD_STEP));
        setImageCount(Math.min(LOAD_STEP, images.length || LOAD_STEP));
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

  const videoItems = useMemo(
    () => items.filter((item) => !!item.videoUrl && !item.imageUrl),
    [items]
  );

  const imageItems = useMemo(
    () => items.filter((item) => !!item.imageUrl),
    [items]
  );

  const imagesOnly = useMemo(
    () => items.filter((item) => item.imageUrl),
    [items]
  );

  const visibleVideos = useMemo(
    () => videoItems.slice(0, Math.min(videoCount, videoItems.length)),
    [videoItems, videoCount]
  );

  const visibleImages = useMemo(
    () => imageItems.slice(0, Math.min(imageCount, imageItems.length)),
    [imageItems, imageCount]
  );

  const canLoadMoreVideos = videoCount < videoItems.length;
  const canLoadMoreImages = imageCount < imageItems.length;
  const remainingVideos = videoItems.length - videoCount;
  const remainingImages = imageItems.length - imageCount;

  const handleLoadMoreVideos = () => {
    setVideoCount((prev) => Math.min(prev + LOAD_STEP, videoItems.length));
  };

  const handleLoadMoreImages = () => {
    setImageCount((prev) => Math.min(prev + LOAD_STEP, imageItems.length));
  };

  const openLightboxById = (id: string) => {
    const idx = imagesOnly.findIndex((i) => i.id === id);
    if (idx === -1) return;
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setLightboxIndex((prev) =>
      prev + 1 >= imagesOnly.length ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setLightboxIndex((prev) =>
      prev - 1 < 0 ? imagesOnly.length - 1 : prev - 1
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
        ) : (videoItems.length + imageItems.length) === 0 ? (
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
            <Modal
              isOpen={videoModalOpen}
              onClose={() => {
                setVideoModalOpen(false);
                setActiveVideo(null);
              }}
              title={activeVideo?.title || 'Video'}
              size="xl"
            >
              {activeVideo?.url ? (
                <div className="w-full">
                  {getYouTubeEmbedUrl(activeVideo.url) ? (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={getYouTubeEmbedUrl(activeVideo.url) as string}
                        title={activeVideo.title || 'YouTube video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : getGoogleDriveEmbedUrl(activeVideo.url) ? (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={getGoogleDriveEmbedUrl(activeVideo.url) as string}
                        title={activeVideo.title || 'Google Drive video'}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    </div>
                  ) : isDirectVideoUrl(activeVideo.url) ? (
                    <video
                      className="w-full rounded-none bg-black"
                      src={activeVideo.url}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="rounded-none border border-gray-200 p-4">
                      <p className="text-sm text-gray-600 mb-2">Can’t preview this link here. Open it directly:</p>
                      <a
                        href={activeVideo.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[#c01e2e] underline break-words font-medium"
                      >
                        {activeVideo.url}
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </Modal>

            {/* Videos Section */}
            {videoItems.length > 0 && (
              <section className="mb-10">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Videos</h2>
                    <p className="text-sm text-gray-600">Watch highlights from our events and trainings.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
                  {visibleVideos.map((item, index) => {
                    const videoUrl = item.videoUrl as string;
                    const ytThumb = getYouTubeThumbnailUrl(videoUrl, 'hqdefault');
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveVideo({ url: videoUrl, title: item.title });
                          setVideoModalOpen(true);
                        }}
                        className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getCardSize(
                          index
                        )}`}
                      >
                        {ytThumb ? (
                          <>
                            <img
                              src={ytThumb}
                              alt={item.title || 'Video'}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <svg
                              className="w-6 h-6 md:w-7 md:h-7 text-[#c01e2e] ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white line-clamp-2 drop-shadow-md">
                            {item.title || 'Play video'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {canLoadMoreVideos && (
                  <div className="flex items-center justify-center mt-8">
                    <button
                      type="button"
                      onClick={handleLoadMoreVideos}
                      className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium transition-colors"
                    >
                      Load {remainingVideos > LOAD_STEP ? LOAD_STEP : remainingVideos} More
                      {remainingVideos > 1 ? ' Videos' : ' Video'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Images Section */}
            {imageItems.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Gallery Images</h2>
                    <p className="text-sm text-gray-600">Photos from our community moments.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[180px]">
                  {visibleImages.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openLightboxById(item.id)}
                      className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getCardSize(
                        index
                      )}`}
                    >
                      <img
                        src={item.imageUrl as string}
                        alt={item.title || 'Gallery image'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300" />
                    </button>
                  ))}
                </div>

                {canLoadMoreImages && (
                  <div className="flex items-center justify-center mt-8">
                    <button
                      type="button"
                      onClick={handleLoadMoreImages}
                      className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium transition-colors"
                    >
                      Load {remainingImages > LOAD_STEP ? LOAD_STEP : remainingImages} More
                      {remainingImages > 1 ? ' Images' : ' Image'}
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={imagesOnly}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrevious={prevImage}
      />
    </main>
  );
}

