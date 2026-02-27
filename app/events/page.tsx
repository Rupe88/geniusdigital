'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { eventsApi, Event } from '@/lib/api/events';
import { PaginatedResponse } from '@/lib/types/api';
import { formatCurrency } from '@/lib/utils/helpers';
import { HiCalendar, HiLocationMarker, HiUsers, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (statusFilter === 'upcoming') {
        params.upcoming = true;
      } else if (statusFilter === 'past') {
        params.past = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const data: PaginatedResponse<Event> = await eventsApi.getAllEvents(params);
      setEvents(data.data || []);
      setPagination({
        page: data.pagination?.page || pagination.page,
        limit: data.pagination?.limit || pagination.limit,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return ''; // SSR-safe
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!mounted) return ''; // SSR-safe
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase()) ||
      event.venue?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--muted)] py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">Events</h1>
          <p className="text-base sm:text-lg text-[var(--muted-foreground)] mb-4 sm:mb-6">
            Discover upcoming workshops, seminars, and special events
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={handleSearch}
              className="max-w-md"
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                All Events
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={statusFilter === 'ONGOING' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('ONGOING')}
              >
                Ongoing
              </Button>
              <Button
                variant={statusFilter === 'past' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('past')}
              >
                Past Events
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {filteredEvents.map((event) => (
                <Card key={event.id} hover className="overflow-hidden flex flex-col">
                  {event.image && (
                    <Link href={`/events/${event.slug || event.id}`}>
                      <div className="relative h-48 w-full">
                        <StorageImage
                          src={event.image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                        {event.featured && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs font-semibold rounded">
                            Featured
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/events/${event.slug || event.id}`}>
                      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2 hover:text-[var(--primary-700)]">
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2 flex-1">
                      {event.shortDescription || event.description}
                    </p>
                    
                      <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-[var(--muted-foreground)]">
                        <HiCalendar className="h-4 w-4 mr-2" />
                        {mounted ? (
                          <>
                            <span>{formatDate(event.startDate)}</span>
                            {event.endDate && (
                              <span className="ml-1">- {formatDate(event.endDate)}</span>
                            )}
                          </>
                        ) : (
                          <span>Loading date...</span>
                        )}
                      </div>
                      {(event.location || event.venue) && (
                        <div className="flex items-center text-sm text-[var(--muted-foreground)]">
                          <HiLocationMarker className="h-4 w-4 mr-2" />
                          <span>{event.venue || event.location}</span>
                        </div>
                      )}
                      {event.maxAttendees && (
                        <div className="flex items-center text-sm text-[var(--muted-foreground)]">
                          <HiUsers className="h-4 w-4 mr-2" />
                          <span>
                            {event._count?.registrations || 0} / {event.maxAttendees} attendees
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-[var(--primary-700)]">
                        {event.isFree ? 'Free' : formatCurrency(event.price)}
                      </span>
                      <Link href={`/events/${event.slug || event.id}`}>
                        <Button variant="primary" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  <HiChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <HiChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)] text-lg">
              {search ? 'No events match your search.' : 'No events found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
