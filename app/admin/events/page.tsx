'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import * as eventsApi from '@/lib/api/events';
import { Event } from '@/lib/api/events';
import { PaginatedResponse } from '@/lib/types/api';
import { formatDate, formatDateTime } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiPencil, HiTrash, HiPlus, HiCalendar, HiUserGroup } from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      if (statusFilter) params.status = statusFilter;
      if (featuredFilter === 'true') params.featured = true;
      if (featuredFilter === 'false') params.featured = false;

      const response: PaginatedResponse<Event> = await eventsApi.getAllEvents(params);
      let data = response.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (e) =>
            e.title?.toLowerCase().includes(q) ||
            e.slug?.toLowerCase().includes(q) ||
            e.venue?.toLowerCase().includes(q)
        );
      }
      setEvents(data);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching events:', error);
      showError(Object(error).message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(eventId);
      await eventsApi.deleteEvent(eventId);
      showSuccess('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      showError(Object(error).message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    const map: Record<Event['status'], { variant: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
      UPCOMING: { variant: 'default', label: 'Upcoming' },
      ONGOING: { variant: 'success', label: 'Ongoing' },
      COMPLETED: { variant: 'default', label: 'Completed' },
      CANCELLED: { variant: 'error', label: 'Cancelled' },
    };
    const c = map[status] || { variant: 'default', label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Events</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage workshops, seminars, and special events</p>
        </div>
        <Link href="/admin/events/new">
          <Button variant="primary">
            <HiPlus className="h-5 w-5 mr-2" />
            Add Event
          </Button>
        </Link>
      </div>

      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search by title, slug, venue..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onBlur={() => fetchEvents()}
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            options={STATUS_OPTIONS}
          />
          <Select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Featured' },
              { value: 'true', label: 'Featured' },
              { value: 'false', label: 'Not Featured' },
            ]}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Date / Venue
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    Loading...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-[var(--muted)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.image ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden bg-[var(--muted)]">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-[var(--muted)] flex items-center justify-center">
                          <HiCalendar className="h-8 w-8 text-[var(--muted-foreground)]" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{event.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{event.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{formatDateTime(event.startDate)}</div>
                      {event.venue && (
                        <div className="text-xs text-[var(--muted-foreground)]">{event.venue}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(event.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                      >
                        <HiUserGroup className="h-4 w-4" />
                        {event._count?.registrations ?? 0}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.featured ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <HiPencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id, event.title)}
                          disabled={deletingId === event.id}
                        >
                          <HiTrash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No events found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted-foreground)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
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
