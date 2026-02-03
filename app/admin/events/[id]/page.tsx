'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  eventsApi,
  Event,
  EventRegistration,
  getEventRegistrations,
  markEventAttendance,
} from '@/lib/api/events';
import { formatDate, formatDateTime } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiArrowLeft, HiPencil, HiUserGroup, HiCheck } from 'react-icons/hi';

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [regPagination, setRegPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchRegistrations();
    }
  }, [eventId, regPagination.page]);

  const fetchEvent = async () => {
    try {
      setLoadingEvent(true);
      const data = await eventsApi.getById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      showError(Object(error).message || 'Failed to load event');
      router.push('/admin/events');
    } finally {
      setLoadingEvent(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoadingRegs(true);
      const res = await getEventRegistrations(eventId, {
        page: regPagination.page,
        limit: regPagination.limit,
      });
      setRegistrations(res.data || []);
      setRegPagination(res.pagination || regPagination);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showError(Object(error).message || 'Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleMarkAttendance = async (registrationId: string) => {
    try {
      setMarkingId(registrationId);
      await markEventAttendance(eventId, registrationId);
      showSuccess('Attendance marked');
      fetchRegistrations();
    } catch (error) {
      showError(Object(error).message || 'Failed to mark attendance');
    } finally {
      setMarkingId(null);
    }
  };

  if (loadingEvent) {
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

  const statusVariant: Record<Event['status'], 'success' | 'warning' | 'default' | 'error'> = {
    UPCOMING: 'default',
    ONGOING: 'success',
    COMPLETED: 'default',
    CANCELLED: 'error',
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

      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{event.title}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">{event.slug}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
            {event.featured && <Badge variant="success">Featured</Badge>}
          </div>
        </div>
        <Link href={`/admin/events/${eventId}/edit`}>
          <Button variant="primary">
            <HiPencil className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
        </Link>
      </div>

      <Card padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {event.image && (
            <div className="relative w-full aspect-video rounded overflow-hidden bg-[var(--muted)]">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--muted-foreground)]">Start</span>
              <p className="font-medium">{formatDateTime(event.startDate)}</p>
            </div>
            {event.endDate && (
              <div>
                <span className="text-sm text-[var(--muted-foreground)]">End</span>
                <p className="font-medium">{formatDateTime(event.endDate)}</p>
              </div>
            )}
            {event.venue && (
              <div>
                <span className="text-sm text-[var(--muted-foreground)]">Venue</span>
                <p className="font-medium">{event.venue}</p>
              </div>
            )}
            {event.location && (
              <div>
                <span className="text-sm text-[var(--muted-foreground)]">Location</span>
                <p className="font-medium">{event.location}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-[var(--muted-foreground)]">Pricing</span>
              <p className="font-medium">{event.isFree ? 'Free' : `Rs. ${event.price}`}</p>
            </div>
            {event.maxAttendees && (
              <div>
                <span className="text-sm text-[var(--muted-foreground)]">Max Attendees</span>
                <p className="font-medium">{event.maxAttendees}</p>
              </div>
            )}
          </div>
        </div>
        {event.shortDescription && (
          <p className="mt-4 text-[var(--muted-foreground)]">{event.shortDescription}</p>
        )}
        {event.description && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">Description</span>
            <div className="mt-1 text-sm text-[var(--foreground)] whitespace-pre-wrap">{event.description}</div>
          </div>
        )}
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <HiUserGroup className="h-5 w-5" />
            Registrations ({regPagination.total})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loadingRegs ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--muted-foreground)]">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[var(--muted)]">
                    <td className="px-6 py-4 font-medium text-[var(--foreground)]">{reg.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{reg.email}</td>
                    <td className="px-6 py-4 text-sm">{reg.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.attended ? (
                        <Badge variant="success">Attended</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAttendance(reg.id)}
                          disabled={markingId === reg.id}
                        >
                          <HiCheck className="h-4 w-4 mr-1" />
                          {markingId === reg.id ? 'Marking...' : 'Mark attended'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {regPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted-foreground)]">
              Page {regPagination.page} of {regPagination.pages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={regPagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={regPagination.page >= regPagination.pages}
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
