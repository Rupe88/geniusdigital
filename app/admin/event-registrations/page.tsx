'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAllEventRegistrations, getAllEvents, type EventRegistration, type Event } from '@/lib/api/events';
import { formatDate } from '@/lib/utils/helpers';
import { showError } from '@/lib/utils/toast';
import { HiArrowLeft, HiUserGroup, HiSearch, HiFilter, HiCalendar } from 'react-icons/hi';

const REFERRAL_FILTER_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'FRIEND_REFERRAL', label: 'Friend / Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
];

export default function AdminEventRegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventIdFilter, setEventIdFilter] = useState('');
  const [referralFilter, setReferralFilter] = useState('');

  // Debounce search; reset to page 1 when applied
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      setSearchQuery(q);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await getAllEvents({ limit: 200 });
        setEvents(res.data || []);
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllEventRegistrations({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery }),
        ...(eventIdFilter && { eventId: eventIdFilter }),
        ...(referralFilter && { referralSource: referralFilter }),
      });
      setRegistrations(res.data || []);
      setPagination((prev) => res.pagination || prev);
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      showError(Object(error).message || 'Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, eventIdFilter, referralFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setEventIdFilter('');
    setReferralFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = searchInput.trim() || eventIdFilter || referralFilter;

  const handleEventFilterChange = (value: string) => {
    setEventIdFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleReferralFilterChange = (value: string) => {
    setReferralFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-primary-600 transition-colors w-fit"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600">
                <HiUserGroup className="h-5 w-5" />
              </span>
              Event Registrations
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1.5 text-sm">
              View and manage all registrations from the Book Now form.
            </p>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md" className="border border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600">
              <HiUserGroup className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Total registrations</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {loading ? '—' : pagination.total.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" className="border border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600">
              <HiCalendar className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Events</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{events.length}</p>
            </div>
          </div>
        </Card>
        {hasActiveFilters && (
          <Card padding="md" className="border border-primary-200 bg-primary-50/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-primary-800">Filters active</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary-700 hover:bg-primary-100">
                Clear all
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Search and filters */}
      <Card padding="lg" className="border border-[var(--border)] shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
          Search & filters
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 relative">
            <label className="sr-only">Search registrations</label>
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, event, or message..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:block">
              Event
            </label>
            <select
              value={eventIdFilter}
              onChange={(e) => handleEventFilterChange(e.target.value)}
              className="min-w-[180px] px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:block">
              Source
            </label>
            <select
              value={referralFilter}
              onChange={(e) => handleReferralFilterChange(e.target.value)}
              className="min-w-[140px] px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {REFERRAL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-[var(--muted)]/80 border-b border-[var(--border)] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Event
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Source
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider max-w-[220px]">
                  Message
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-4/5 max-w-[180px]" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-32 max-w-[220px]" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                  </tr>
                ))
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-5 py-4">
                      {reg.event ? (
                        <Link
                          href={`/admin/events/${reg.eventId}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {reg.event.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-[var(--foreground)]">{reg.name}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">{reg.email}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">{reg.phone || '—'}</td>
                    <td className="px-5 py-4">
                      {reg.referralSource ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]">
                          {reg.referralSource}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)] max-w-[220px]">
                      <span className="block truncate" title={reg.message || undefined}>
                        {reg.message || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatDate(reg.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
                      <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--muted)]">
                        <HiUserGroup className="h-7 w-7 opacity-60" />
                      </span>
                      <p className="font-medium text-[var(--foreground)]">No registrations yet</p>
                      <p className="text-sm max-w-sm">
                        Event registrations from the Book Now form will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              {pagination.total === 0 ? (
                'No results'
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium text-[var(--foreground)]">
                    {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium text-[var(--foreground)]">{pagination.total}</span> results
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--muted-foreground)] px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
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
