'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as carouselApi from '@/lib/api/carousel';
import type { HeroCarouselSlide } from '@/lib/api/carousel';
import { showSuccess, showError } from '@/lib/utils/toast';
import { ROUTES } from '@/lib/utils/constants';

export default function EditCarouselSlidePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [slide, setSlide] = useState<HeroCarouselSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [altText, setAltText] = useState('');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await carouselApi.getCarouselSlidesAdmin();
        const found = Array.isArray(data) ? data.find((s) => s.id === id) : null;
        setSlide(found || null);
        if (found) {
          setAltText(found.altText || '');
          setVideoEmbedUrl(found.videoEmbedUrl || '');
          setImagePreview(found.image || null);
        }
      } catch (e) {
        showError('Failed to load slide');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await carouselApi.updateCarouselSlide(id, {
        altText: altText.trim(),
        videoEmbedUrl: videoEmbedUrl.trim() || undefined,
        imageFile: imageFile || undefined,
        videoFile: videoFile || undefined,
      });
      showSuccess('Slide updated');
      router.push(`${ROUTES.ADMIN}/carousel`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update slide');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (!slide) return <div className="py-8 text-center">Slide not found.</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit Carousel Slide</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Slide must have either an image OR a video, not both.</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Image (optional – use for image-only slide)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                  setVideoEmbedUrl('');
                  setVideoFile(null);
                } else {
                  setImageFile(null);
                  if (!slide?.videoEmbedUrl && !slide?.videoUrl) setImagePreview(slide?.image || null);
                }
              }}
              className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-white"
            />
            {imagePreview && (
              <div className="mt-2 relative w-full max-w-md h-40 rounded overflow-hidden bg-gray-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Or video (embed or upload)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">Video embed URL</label>
                <Input
                  value={videoEmbedUrl}
                  onChange={(e) => {
                    setVideoEmbedUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setImageFile(null);
                      setImagePreview(null);
                      setVideoFile(null);
                    } else if (slide?.image) setImagePreview(slide.image);
                  }}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">Or upload video</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setVideoFile(file || null);
                    if (file) {
                      setImageFile(null);
                      setImagePreview(null);
                    } else if (slide?.image) setImagePreview(slide.image);
                  }}
                  className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--muted)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Alt text</label>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text for accessibility"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
            <Link href={`${ROUTES.ADMIN}/carousel`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
