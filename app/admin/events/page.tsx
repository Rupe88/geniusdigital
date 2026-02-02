'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiPlus, HiPencil, HiTrash, HiEye } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import * as eventsApi from '@/lib/api/events';
import { Event } from '@/lib/api/events';
import { PaginatedResponse } from '@/lib/types/api';
import { ROUTES } from '@/lib/utils/constants';
import { formatDate, formatPrice } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, statusFilter, featuredFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | boolean | undefined> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) params.status = statusFilter as Event['status'];
      if (featuredFilter === 'true') params.featured = true;
      if (featuredFilter === 'false') params.featured = false;

      const response: PaginatedResponse<Event> = await eventsApi.getAllEvents(params);
      setEvents(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching events:', error);
      showError(Object(error).message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    try {
      await eventsApi.deleteEvent(id);
      showSuccess('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      showError(Object(error).message || 'Failed to delete event');
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    const variants: Record<Event['status'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      UPCOMING: 'info',
      ONGOING: 'success',
      COMPLETED: 'default',
      CANCELLED: 'danger',
    };
    return (
      <Badge variant={variants[status] || 'default'} size="sm">
        {status}
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Event Management</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage events and registrations</p>
        </div>
        <Link href={`${ROUTES.ADMIN}/events/new`}>
          <Button variant="primary">
            <HiPlus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'UPCOMING', label: 'Upcoming' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <Select
            label="Featured"
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Featured only' },
              { value: 'false', label: 'Not featured' },
            ]}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Registrations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--foreground)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-[var(--muted-foreground)]">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-[var(--muted)]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.image ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-[var(--muted)] rounded flex items-center justify-center">
                          <span className="text-[var(--muted-foreground)] text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{event.title}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">{event.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(event.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatPrice(event.price, event.isFree)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {event._count?.registrations ?? 0}
                      {event.maxAttendees != null ? ` / ${event.maxAttendees}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.featured ? (
                        <Badge variant="success" size="sm">Yes</Badge>
                      ) : (
                        <span className="text-[var(--muted-foreground)] text-sm">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" title="View public page">
                            <HiEye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`${ROUTES.ADMIN}/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <HiPencil className="h-4 w-4 text-[var(--primary-600)]" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(event.id, event.title)}
                          className="text-red-600 hover:text-red-700"
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

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center">
            <div className="text-sm text-[var(--muted-foreground)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
