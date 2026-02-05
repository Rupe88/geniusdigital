'use client';

import React, { useEffect } from 'react';
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import type { GalleryItem } from '@/lib/api/gallery';

interface ImageLightboxProps {
  images: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrevious();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || images.length === 0) return null;

  const image = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/90 text-gray-800 rounded-full shadow-lg hover:bg-white transition-colors"
        aria-label="Close gallery image"
      >
        <HiX className="w-5 h-5" />
      </button>

      {/* Previous */}
      {images.length > 1 && (
        <button
          onClick={onPrevious}
          className="absolute left-4 md:left-8 p-3 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
          aria-label="Previous image"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 md:right-8 p-3 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
          aria-label="Next image"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[90vh] w-full mx-4 flex flex-col items-center">
        <div className="relative w-full flex-1 flex items-center justify-center">
          <img
            src={image.imageUrl}
            alt={image.title || 'Gallery image'}
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 w-full text-sm text-gray-200">
          <div className="truncate">
            {image.title && <span className="font-medium">{image.title}</span>}
          </div>
          <div className="text-xs uppercase tracking-wide opacity-80">
            {currentIndex + 1} of {images.length}
          </div>
        </div>
      </div>
    </div>
  );
};

