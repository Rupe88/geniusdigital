'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import * as eventsApi from '@/lib/api/events';
import { Event, UpdateEventRequest } from '@/lib/api/events';
import { ROUTES } from '@/lib/utils/constants';
import { showSuccess, showError } from '@/lib/utils/toast';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug must be less than 255 characters'),
  description: z.string().optional().or(z.literal('')),
  shortDescription: z.string().max(500).optional().or(z.literal('')),
  image: z.string().url('Invalid URL').optional().or(z.literal('')),
  venue: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price must be non-negative').optional(),
  isFree: z.boolean().optional(),
  maxAttendees: z.coerce.number().int().min(1).optional().or(z.nan()),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  featured: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

type EventFormData = z.infer<typeof eventSchema>;

function toDateTimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      image: '',
      venue: '',
      location: '',
      startDate: '',
      endDate: '',
      price: 0,
      isFree: false,
      maxAttendees: undefined,
      status: 'UPCOMING',
      featured: false,
    },
  });

  const isFree = watch('isFree');

  useEffect(() => {
    if (eventId) fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setFetching(true);
      const data = await eventsApi.getEventById(eventId);
      setEvent(data);
      reset({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        image: data.image || '',
        venue: data.venue || '',
        location: data.location || '',
        startDate: toDateTimeLocal(data.startDate),
        endDate: data.endDate ? toDateTimeLocal(data.endDate) : '',
        price: typeof data.price === 'number' ? data.price : parseFloat(String(data.price)) || 0,
        isFree: data.isFree ?? false,
        maxAttendees: data.maxAttendees ?? undefined,
        status: data.status,
        featured: data.featured ?? false,
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      showError(Object(error).message || 'Failed to load event');
      router.push(`${ROUTES.ADMIN}/events`);
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);
      const payload: UpdateEventRequest = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
        shortDescription: data.shortDescription?.trim() || undefined,
        image: data.image?.trim() || undefined,
        venue: data.venue?.trim() || undefined,
        location: data.location?.trim() || undefined,
        startDate: data.startDate,
        endDate: data.endDate?.trim() || undefined,
        price: data.isFree ? 0 : (data.price ?? 0),
        isFree: data.isFree ?? false,
        maxAttendees: data.maxAttendees && !isNaN(data.maxAttendees) ? data.maxAttendees : undefined,
        status: data.status,
        featured: data.featured ?? false,
      };
      await eventsApi.updateEvent(eventId, payload);
      showSuccess('Event updated successfully');
      router.push(`${ROUTES.ADMIN}/events`);
    } catch (error) {
      console.error('Error updating event:', error);
      showError(Object(error).message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`${ROUTES.ADMIN}/events`}>
          <Button variant="outline" size="sm">
            <HiArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Edit Event</h1>
          <p className="text-[var(--muted-foreground)]">Update event: {event.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Event Details</h2>
              <div className="space-y-4">
                <Input
                  label="Title *"
                  {...register('title')}
                  error={errors.title?.message}
                  placeholder="Event title"
                />
                <Input
                  label="Slug *"
                  {...register('slug')}
                  error={errors.slug?.message}
                  placeholder="event-slug"
                />
                <Textarea
                  label="Description"
                  {...register('description')}
                  error={errors.description?.message}
                  rows={4}
                  placeholder="Full description"
                />
                <Input
                  label="Short description"
                  {...register('shortDescription')}
                  error={errors.shortDescription?.message}
                  placeholder="Brief summary (max 500 chars)"
                />
                <Input
                  label="Image URL"
                  {...register('image')}
                  error={errors.image?.message}
                  placeholder="https://example.com/image.jpg"
                />
                <Input label="Venue" {...register('venue')} placeholder="Venue name" />
                <Input label="Location" {...register('location')} placeholder="Address or place" />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Date & Time</h2>
              <div className="space-y-4">
                <Input
                  label="Start date *"
                  type="datetime-local"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                />
                <Input
                  label="End date"
                  type="datetime-local"
                  {...register('endDate')}
                  error={errors.endDate?.message}
                />
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Status</h2>
              <Select
                label="Status"
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { value: 'UPCOMING', label: 'Upcoming' },
                  { value: 'ONGOING', label: 'Ongoing' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Pricing & Capacity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isFree" {...register('isFree')} className="rounded" />
                  <label htmlFor="isFree" className="text-sm font-medium text-[var(--foreground)]">
                    Free event
                  </label>
                </div>
                {!isFree && (
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price')}
                    error={errors.price?.message}
                  />
                )}
                <Input
                  label="Max attendees"
                  type="number"
                  min="1"
                  {...register('maxAttendees', { valueAsNumber: true })}
                  error={errors.maxAttendees?.message}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" {...register('featured')} className="rounded" />
                <label htmlFor="featured" className="text-sm font-medium text-[var(--foreground)]">
                  Featured event
                </label>
              </div>
            </Card>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading} disabled={loading}>
              Update Event
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
