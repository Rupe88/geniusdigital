import React from 'react';
import Link from 'next/link';

interface CourseCardProps {
  id: string | number;
  title: string;
  thumbnail?: string | null;
  price?: string;
  oldPrice?: string;
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
  slug,
  href,
  className = '',
}) => {
  const linkHref = href || (slug ? `/courses/${slug}` : `/courses/${id}`);

  return (
    <div
      className={`bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.10)] overflow-hidden hover:-translate-y-1 transition-all duration-200 rounded-lg ${className}`}
    >
      <Link href={linkHref}>
        {/* Thumbnail */}
        <div className="relative w-full h-52 p-2">
          {thumbnail ? (
            <img
              src={thumbnail}
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
        <div className="px-5 pt-0 pb-1">
          <h3 className="text-base font-[550] md:text-lg leading-6 antialiased tracking-[0.05em] text-gray-900 mb-1 line-clamp-2 ">
            {title}
          </h3>
          <div className="flex items-baseline space-x-2">
            {price && (
              <span className="text-lg font-bold text-[var(--primary-700)]">
                {price}
              </span>
            )}
            {oldPrice && (
              <span className="text-sm text-gray-500 line-through">
                {oldPrice}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
