'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft, HiCloudUpload, HiX } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { eventsApi, CreateEventRequest } from '@/lib/api/events';
import { showSuccess, showError } from '@/lib/utils/toast';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  venue: z.string().optional(),
  location: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  isFree: z.boolean().optional(),
  maxAttendees: z.coerce.number().int().min(1).optional().or(z.nan()),
  featured: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_IMAGE_MB = 10;

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    defaultValues: {
      title: '',
      startDate: '',
      venue: '',
      location: '',
      price: 0,
      isFree: true,
      maxAttendees: undefined,
      featured: false,
    },
    mode: 'onBlur',
  });

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showError(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);
      const payload: CreateEventRequest = {
        title: data.title.trim(),
        startDate: data.startDate,
        venue: data.venue?.trim() || undefined,
        location: data.location?.trim() || undefined,
        price: typeof data.price === 'number' && !isNaN(data.price) ? data.price : undefined,
        isFree: data.isFree,
        maxAttendees:
          typeof data.maxAttendees === 'number' && !isNaN(data.maxAttendees) && data.maxAttendees > 0
            ? data.maxAttendees
            : undefined,
        featured: data.featured,
      };
      if (imageFile) payload.imageFile = imageFile;
      await eventsApi.create(payload);
      showSuccess('Event created successfully');
      router.push('/admin/events');
    } catch (error) {
      showError(Object(error).message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Create Event</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Add a new workshop, seminar, or special event</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Title *</label>
            <Input {...register('title')} placeholder="Event title" />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Start Date *</label>
            <Input type="datetime-local" {...register('startDate')} />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE}
              onChange={onImageChange}
              className="hidden"
            />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full max-w-sm h-40 border-2 border-dashed border-[var(--border)] rounded-md text-[var(--muted-foreground)] hover:border-[var(--primary-500)] hover:bg-[var(--muted)] transition-colors"
              >
                <HiCloudUpload className="h-10 w-10 mb-2" />
                <span className="text-sm">Click to upload image (JPEG, PNG, WebP, GIF, max {MAX_IMAGE_MB}MB)</span>
              </button>
            ) : (
              <div className="relative inline-block">
                <div className="relative w-48 h-32 rounded overflow-hidden bg-[var(--muted)]">
                  {imagePreview.startsWith('blob:') ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="192px" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1 right-1 p-1 rounded bg-red-600 text-white hover:bg-red-700"
                  aria-label="Remove image"
                >
                  <HiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Venue</label>
              <Input {...register('venue')} placeholder="Venue name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Location</label>
              <Input {...register('location')} placeholder="Address or city" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Price</label>
              <Input type="number" step="0.01" min={0} {...register('price')} />
            </div>
            <div className="flex items-end gap-2">
              <input
                type="checkbox"
                id="isFree"
                {...register('isFree')}
                className="rounded border-[var(--border)]"
              />
              <label htmlFor="isFree" className="text-sm text-[var(--foreground)]">
                Free event
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Max Attendees</label>
              <Input type="number" min={1} {...register('maxAttendees')} placeholder="Optional" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              {...register('featured')}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="featured" className="text-sm text-[var(--foreground)]">
              Featured on homepage
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/admin/events')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
