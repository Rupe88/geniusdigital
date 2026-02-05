'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiPhotograph, HiVideoCamera } from 'react-icons/hi';
import * as carouselApi from '@/lib/api/carousel';
import { showSuccess, showError } from '@/lib/utils/toast';
import { ROUTES } from '@/lib/utils/constants';

type MediaType = 'image' | 'video' | null;

export default function NewCarouselSlidePage() {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [altText, setAltText] = useState('');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoFile(e.target.files?.[0] || null);
  };

  const canSubmit =
    mediaType === 'image' && imageFile ||
    mediaType === 'video' && (videoEmbedUrl.trim() || videoFile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await carouselApi.createCarouselSlide({
        imageFile: mediaType === 'image' ? imageFile || undefined : undefined,
        altText: altText.trim(),
        videoEmbedUrl: mediaType === 'video' ? videoEmbedUrl.trim() || undefined : undefined,
        videoFile: mediaType === 'video' ? videoFile || undefined : undefined,
      });
      showSuccess('Slide created');
      router.push(`${ROUTES.ADMIN}/carousel`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create slide');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Add Carousel Slide</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Choose one type first, then upload.</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Step 1: Choose Image or Video */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Choose slide type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setMediaType('image');
                  setVideoEmbedUrl('');
                  setVideoFile(null);
                }}
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 transition-all ${
                  mediaType === 'image'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--muted-foreground)]/40'
                }`}
              >
                <HiPhotograph className="h-8 w-8" />
                <span className="font-medium">Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaType('video');
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 transition-all ${
                  mediaType === 'video'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--muted-foreground)]/40'
                }`}
              >
                <HiVideoCamera className="h-8 w-8" />
                <span className="font-medium">Video</span>
              </button>
            </div>
          </div>

          {/* Step 2: Only show the selected section */}
          {mediaType === 'image' && (
            <div className="rounded-lg border border-[var(--border)] p-6 bg-[var(--muted)]/20">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Upload image</label>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-white"
              />
              {imagePreview && (
                <div className="mt-3 relative w-full max-w-md h-40 rounded overflow-hidden bg-gray-100">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {mediaType === 'video' && (
            <div className="rounded-lg border border-[var(--border)] p-6 bg-[var(--muted)]/20 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Video embed URL</label>
                <Input
                  value={videoEmbedUrl}
                  onChange={(e) => setVideoEmbedUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/embed/..."
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">YouTube or Vimeo embed URL.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Or upload video file</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={onVideoFileChange}
                  className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--muted)]"
                />
              </div>
            </div>
          )}

          {/* Alt text – show after type is chosen */}
          {mediaType && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Alt text (for accessibility)</label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="e.g. Numerology Course - Nepal's First ISO Certified Institute"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting || !canSubmit}>
              {submitting ? 'Creating...' : 'Create Slide'}
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
