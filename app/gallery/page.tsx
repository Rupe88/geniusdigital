'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getGalleryItems } from '@/lib/api/gallery';
import type { GalleryItem } from '@/lib/api/gallery';

const PER_PAGE = 24;

const getDisplayUrl = (item: GalleryItem): string => item.imageUrl || item.videoUrl || '';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGalleryItems({ page, limit: PER_PAGE })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data || []);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page,
            pages: res.pagination.pages || 1,
            total: res.pagination.total || 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const displayItems = items.filter((item) => getDisplayUrl(item));

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No gallery items yet.</p>
            <Link href="/" className="text-[#c01e2e] hover:underline mt-2 inline-block">
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {item.type === 'VIDEO' && item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        poster={item.imageUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={getDisplayUrl(item)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  {item.title && (
                    <div className="p-3">
                      <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      {item.category && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.category}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
