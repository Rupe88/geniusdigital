import React from 'react';
import Link from 'next/link';
import { getStorageImageSrc } from '@/lib/utils/storage';
import { getApiBaseUrl } from '@/lib/api/axios';

interface CourseCardProps {
  id: string | number;
  title: string;
  thumbnail?: string | null;
  price?: string;
  oldPrice?: string;
  rating?: number;
  metaText?: string;
  slug?: string;
  href?: string;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  thumbnail,
  price,
  oldPrice,
  rating = 4,
  metaText,
  slug,
  href,
  className = '',
}) => {
  const linkHref = href || (slug ? `/courses/${slug}` : `/courses/${id}`);
  const safeRating = Math.max(1, Math.min(5, Math.round(rating || 4)));

  return (
    <div
      className={`bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden transition-all duration-200 rounded-lg ${className}`}
    >
      <Link href={linkHref}>
        {/* Thumbnail */}
        <div className="relative w-full h-52 p-2">
          {thumbnail ? (
            <img
              src={getStorageImageSrc(thumbnail, getApiBaseUrl()) || thumbnail}
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--primary-700)] font-semibold text-lg uppercase">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pt-0 pb-3">
          <div className="text-[#f4b400] text-[14px] leading-none tracking-tight">
            {'★'.repeat(safeRating)}
            <span className="text-gray-300">{'★'.repeat(5 - safeRating)}</span>
          </div>
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h3 className="text-base md:text-lg font-lg tracking-wide text-gray-900 line-clamp-2">
              {title}
            </h3>
            {price && (
              <span className="whitespace-nowrap text-xl font-semibold text-[var(--primary-700)]">
                {price}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {oldPrice && (
              <span className="text-xs text-gray-400 line-through">
                {oldPrice}
              </span>
            )}
            {metaText && (
              <span className="text-sm text-gray-500">{metaText}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
