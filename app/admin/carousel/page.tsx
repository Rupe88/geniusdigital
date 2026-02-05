'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import * as carouselApi from '@/lib/api/carousel';
import type { HeroCarouselSlide } from '@/lib/api/carousel';
import { showSuccess, showError } from '@/lib/utils/toast';
import { ROUTES } from '@/lib/utils/constants';

export default function AdminCarouselPage() {
  const [slides, setSlides] = useState<HeroCarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const data = await carouselApi.getCarouselSlidesAdmin();
      setSlides(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to load carousel');
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this carousel slide?')) return;
    try {
      await carouselApi.deleteCarouselSlide(id);
      showSuccess('Slide deleted');
      fetchSlides();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Hero Carousel</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage home page hero slides (image required; video optional)</p>
        </div>
        <Link href={`${ROUTES.ADMIN}/carousel/new`}>
          <Button variant="primary">
            <HiPlus className="h-4 w-4 mr-2 inline" />
            Add Slide
          </Button>
        </Link>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Alt Text</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Video</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--muted-foreground)]">Loading...</td>
                </tr>
              ) : slides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--muted-foreground)]">
                    No slides yet. Add a slide to show on the home page hero.
                  </td>
                </tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide.id} className="hover:bg-[var(--muted)]">
                    <td className="px-6 py-4">
                      <div className="relative w-24 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {slide.image ? (
                          <Image
                            src={slide.image}
                            alt={slide.altText || 'Slide'}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)]">Video</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)] max-w-xs truncate">
                      {slide.altText || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {slide.videoEmbedUrl ? 'Embed link' : slide.videoUrl ? 'Uploaded video' : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">{slide.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`${ROUTES.ADMIN}/carousel/${slide.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <HiPencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(slide.id)}
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
