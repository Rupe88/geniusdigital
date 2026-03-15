'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { getCarouselSlides } from '@/lib/api/carousel';
import { useUnoptimizedForStorage } from '@/lib/utils/storage';
import type { HeroCarouselSlide } from '@/lib/api/carousel';
import { getVideoEmbedUrl } from '@/lib/utils/helpers';

/** Uploaded video that autoplays when its slide is active */
const CarouselVideo: React.FC<{
  src: string;
  poster?: string;
  isActive: boolean;
}> = ({ src, poster, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isActive]);
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className="hero-slide-video absolute inset-0 w-full h-full object-cover"
      muted
      loop
      playsInline
      autoPlay
    />
  );
};

const FALLBACK_SLIDES = [
  { image: '/hero1.png', altText: 'Numerology Course - Nepal\'s First ISO Certified Institute in Vastu, Numerology & Astrology', videoEmbedUrl: null, videoUrl: null },
  { image: '/hero2.png', altText: 'Vastu Shastra Course - Learn from Renowned Occult Master', videoEmbedUrl: null, videoUrl: null },
  { image: '/hero3.png', altText: 'Astrology Course - Transform Your Life with Ancient Wisdom', videoEmbedUrl: null, videoUrl: null },
];

export const HeroCarousel: React.FC = () => {
  const [slides, setSlides] = useState<HeroCarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCarouselSlides().then((data) => {
      if (!cancelled && Array.isArray(data) && data.length > 0) setSlides(data);
      if (!cancelled) setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const heroSlides = slides.length > 0 ? slides : FALLBACK_SLIDES;
  const totalSlides = heroSlides.length;

  // Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  // Next slide
  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, totalSlides]);

  // Previous slide
  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, totalSlides]);

  // Auto-slide effect - 4 seconds
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div
      className="hero-carousel-wrapper mt-0 pt-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Full-bleed on mobile, no top gap; constrained on larger screens. No border/shadow. */}
      <div className="hero-carousel-outer-wrap max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-0 pb-3 sm:py-6">
        <div className="hero-carousel-outer">
          <div className="hero-carousel-wrap">
          <div className="hero-carousel-container">
            {/* Slides wrapper with smooth transition */}
            <div
              ref={slideRef}
              className="hero-slides-wrapper"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
            {heroSlides.map((slide, index) => {
              const s = slide as HeroCarouselSlide & { altText?: string };
              const alt = s.altText ?? '';
              const embedUrl = getVideoEmbedUrl(s.videoEmbedUrl, { autoplay: true });
              return (
                <div key={s.id || `fallback-${index}`} className="hero-slide">
                  {embedUrl ? (
                    <div className="absolute inset-0 w-full h-full min-w-full min-h-full">
                      <iframe
                        src={embedUrl}
                        title={alt || `Slide ${index + 1}`}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : s.videoUrl ? (
                    <CarouselVideo
                      src={s.videoUrl}
                      poster={s.image ?? undefined}
                      isActive={index === currentSlide}
                    />
                  ) : s.image ? (
                    <Image
                      src={s.image}
                      alt={alt}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      className="hero-slide-image"
                      quality={90}
                      unoptimized={useUnoptimizedForStorage(s.image)}
                    />
                  ) : null}
                  <div className="hero-slide-overlay" />
                </div>
              );
            })}
          </div>

          {/* Pagination Dots */}
          <div className="hero-pagination">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`hero-pagination-dot ${index === currentSlide ? 'hero-pagination-dot-active' : ''
                  }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? 'true' : 'false'}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="hero-progress-bar">
            <div
              className="hero-progress-fill"
              style={{
                animation: isPaused ? 'none' : 'progressFill 4s linear infinite',
              }}
              key={currentSlide}
            />
          </div>
          </div>
          <button
            onClick={prevSlide}
            className="hero-nav-btn hero-nav-btn-left"
            aria-label="Previous slide"
            disabled={isTransitioning}
          >
            <HiChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="hero-nav-btn hero-nav-btn-right"
            aria-label="Next slide"
            disabled={isTransitioning}
          >
            <HiChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          </div>
        </div>
      </div>

      {/* Scoped styles */}
      <style jsx>{`
        .hero-carousel-wrapper {
          width: 100%;
          margin-top: 0;
          padding-top: 0;
          background: transparent;
        }

        .hero-carousel-outer {
          width: 100%;
        }

        .hero-carousel-wrap {
          position: relative;
          width: 100%;
          overflow: visible;
          display: flex;
          align-items: center;
        }

        .hero-carousel-container {
          position: relative;
          width: 100%;
          /* Mobile: taller so full image/video fits with object-contain */
          height: min(420px, 60vh);
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .hero-carousel-container {
            height: 340px;
          }
        }

        @media (min-width: 768px) {
          .hero-carousel-container {
            height: 380px;
          }
        }

        @media (min-width: 1024px) {
          .hero-carousel-container {
            height: 440px;
          }
        }

        @media (min-width: 1280px) {
          .hero-carousel-container {
            height: 500px;
          }
        }

        .hero-slides-wrapper {
          display: flex;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        .hero-slide {
          position: relative;
          flex-shrink: 0;
          width: 100%;
          height: 100%;
        }

        :global(.hero-slide-image) {
          object-fit: cover;
          object-position: center;
        }

        /* Mobile: show full image/video without cropping */
        @media (max-width: 639px) {
          :global(.hero-slide-image),
          :global(.hero-slide-video) {
            object-fit: contain;
            object-position: center;
          }
        }

        .hero-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            transparent 60%,
            rgba(0, 0, 0, 0.3) 100%
          );
          pointer-events: none;
        }

        .hero-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(190, 18, 60, 0.95); /* primary-700 red */
          backdrop-filter: blur(4px);
          color: white;
          border: 2px solid rgba(190, 18, 60, 1);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .hero-nav-btn-left {
          left: 10px;
        }

        .hero-nav-btn-right {
          right: 10px;
        }

        @media (min-width: 768px) {
          .hero-nav-btn {
            width: 40px;
            height: 40px;
          }
          .hero-nav-btn-left {
            left: 16px;
          }
          .hero-nav-btn-right {
            right: 16px;
          }
        }

        /* Ensure consistent desktop size to visually match other carousels */
        @media (min-width: 1024px) {
          .hero-nav-btn {
            width: 40px;
            height: 40px;
          }
        }

        .hero-nav-btn:hover:not(:disabled) {
          background: rgba(224, 36, 72, 1);
          border-color: rgba(224, 36, 72, 1);
          transform: translateY(-50%) scale(1.1);
        }

        .hero-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hero-pagination {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          border-radius: 24px;
        }

        .hero-pagination-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .hero-pagination-dot:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .hero-pagination-dot-active {
          width: 32px;
          border-radius: 10px;
          background: linear-gradient(90deg, #c01e2e, #d4a853);
        }

        .hero-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          z-index: 20;
        }

        @media (max-width: 639px) {
          .hero-pagination {
            bottom: 12px;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 14px;
          }
          .hero-pagination-dot {
            width: 6px;
            height: 6px;
          }
          .hero-pagination-dot-active {
            width: 18px;
            border-radius: 6px;
          }
          .hero-progress-bar {
            height: 3px;
          }
        }

        .hero-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #c01e2e, #d4a853);
          width: 0%;
        }

        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
