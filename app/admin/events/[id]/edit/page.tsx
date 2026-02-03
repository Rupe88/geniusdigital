'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft, HiCloudUpload, HiX } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { eventsApi, Event, UpdateEventRequest } from '@/lib/api/events';
import { showSuccess, showError } from '@/lib/utils/toast';

const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_IMAGE_MB = 10;

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  isFree: z.boolean().optional(),
  maxAttendees: z.coerce.number().int().min(1).optional().or(z.nan()),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  featured: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (eventId) fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setFetching(true);
      const data = await eventsApi.getById(eventId);
      setEvent(data);
      setValue('title', data.title);
      setValue('slug', data.slug);
      setValue('startDate', toLocalDateTime(data.startDate));
      setValue('endDate', data.endDate ? toLocalDateTime(data.endDate) : '');
      setValue('description', data.description || '');
      setValue('shortDescription', data.shortDescription || '');
      setValue('venue', data.venue || '');
      if (data.image) setImagePreview(data.image);
      setValue('location', data.location || '');
      setValue('price', typeof data.price === 'number' ? data.price : parseFloat(String(data.price || 0)) || 0);
      setValue('isFree', data.isFree ?? true);
      setValue('maxAttendees', data.maxAttendees ?? undefined);
      setValue('status', data.status);
      setValue('featured', data.featured ?? false);
    } catch (error) {
      console.error('Error fetching event:', error);
      showError(Object(error).message || 'Failed to load event');
      router.push('/admin/events');
    } finally {
      setFetching(false);
    }
  };

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
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(event?.image || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: EventFormData) => {
    if (!eventId) return;
    try {
      setLoading(true);
      const payload: UpdateEventRequest = {
        title: data.title,
        slug: data.slug,
        startDate: data.startDate,
        description: data.description || undefined,
        shortDescription: data.shortDescription || undefined,
        venue: data.venue || undefined,
        location: data.location || undefined,
        endDate: data.endDate || undefined,
        price: typeof data.price === 'number' && !isNaN(data.price) ? data.price : undefined,
        isFree: data.isFree,
        maxAttendees:
          typeof data.maxAttendees === 'number' && !isNaN(data.maxAttendees) && data.maxAttendees > 0
            ? data.maxAttendees
            : undefined,
        status: data.status,
        featured: data.featured,
      };
      if (imageFile) payload.imageFile = imageFile;
      await eventsApi.update(eventId, payload);
      showSuccess('Event updated successfully');
      router.push('/admin/events');
    } catch (error) {
      showError(Object(error).message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-[var(--muted-foreground)]">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <Card padding="lg">
        <div className="text-center py-8 text-[var(--muted-foreground)]">Event not found</div>
      </Card>
    );
  }

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
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit Event</h1>
        <p className="text-[var(--muted-foreground)] mt-2">{event.title}</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Title *</label>
              <Input {...register('title')} placeholder="Event title" />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Slug *</label>
              <Input {...register('slug')} placeholder="event-slug" />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Start Date *</label>
              <Input type="datetime-local" {...register('startDate')} />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">End Date</label>
              <Input type="datetime-local" {...register('endDate')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
            <Select
              value={watch('status')}
              {...register('status')}
              options={[
                { value: 'UPCOMING', label: 'Upcoming' },
                { value: 'ONGOING', label: 'Ongoing' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Short Description (max 500)</label>
            <Textarea {...register('shortDescription')} rows={2} placeholder="Brief summary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
            <Textarea {...register('description')} rows={4} placeholder="Full description" />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/admin/events')}>
              Cancel
            </Button>
            <Link href={`/admin/events/${eventId}`}>
              <Button type="button" variant="ghost">View & Registrations</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
