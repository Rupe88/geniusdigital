'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StorageImage } from '@/components/ui/StorageImage';
import * as liveClassApi from '@/lib/api/liveClasses';
import type { LiveClass } from '@/lib/api/liveClasses';
import { extractSeriesIdFromLiveClass, stripSeriesMarkerFromDescription } from '@/lib/api/liveClasses';
import { showError } from '@/lib/utils/toast';
import {
  HiCalendar,
  HiUser,
  HiVideoCamera,
  HiChevronLeft,
  HiChevronRight,
  HiRefresh,
  HiBookOpen,
} from 'react-icons/hi';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:
    'bg-blue-50 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
  LIVE:
    'bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
  COMPLETED:
    'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900/70 dark:text-gray-200 dark:border-gray-600',
  CANCELLED:
    'bg-red-50 text-red-900 border border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-700',
};

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeeklyTimeRows(dateString: string) {
  const date = new Date(dateString);
  const activeDay = Number.isNaN(date.getTime()) ? -1 : date.getDay();
  const activeTime = Number.isNaN(date.getTime()) ? '-' : formatTime(dateString);
  return WEEK_DAYS.map((day, idx) => ({
    day,
    time: idx === activeDay ? activeTime : 'Not scheduled',
    active: idx === activeDay,
  }));
}

function LiveClassCard({
  item,
}: {
  item: LiveClass;
}) {
  const statusStyle = STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-700';
  const joinUrl = item.zoomJoinUrl || item.meetingUrl;

  return (
    <Card className="overflow-hidden border border-[var(--border)] hover:border-[var(--primary-200)] transition-colors flex flex-col h-full">
      <div className="relative h-40 w-full bg-[var(--muted)] p-2">
        {item.course?.thumbnail ? (
          <StorageImage
            src={item.course.thumbnail}
            alt={item.course?.title || item.title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--muted-foreground)] text-sm">
            No course thumbnail
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-semibold text-[var(--foreground)] line-clamp-2 flex-1 min-w-0">
            {item.title}
          </h3>
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle}`}>
            {item.status}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4">
            {stripSeriesMarkerFromDescription(item.description)}
          </p>
        )}
        {!!item.adminNotes?.trim() && (
          <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 px-3 py-2.5 shadow-sm dark:border-blue-700 dark:bg-blue-950/35">
            <div className="text-sm font-bold mb-1 text-blue-900 dark:text-blue-100">Admin note</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-100">{item.adminNotes}</p>
          </div>
        )}
        <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
          {item.instructor?.name && (
            <div className="flex items-center gap-2">
              <HiUser className="w-4 h-4 flex-shrink-0" />
              <span>{item.instructor.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <HiCalendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(item.scheduledAt)} · {formatTime(item.scheduledAt)}</span>
          </div>
          {item.course?.title && (
            <div className="flex items-center gap-2">
              <HiBookOpen className="w-4 h-4 flex-shrink-0" />
              <span>{item.course.title}</span>
            </div>
          )}
        </div>
        <div className="mt-3 rounded-md border border-[var(--border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Day</th>
                <th className="px-2 py-1.5 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {getWeeklyTimeRows(item.scheduledAt).map((row) => (
                <tr
                  key={row.day}
                  className={`border-t border-[var(--border)] ${
                    row.active ? 'bg-blue-100/80 dark:bg-blue-900/35' : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <td className={`px-2 py-1.5 ${row.active ? 'text-blue-900 dark:text-blue-200 font-semibold' : ''}`}>{row.day}</td>
                  <td className={`px-2 py-1.5 ${row.active ? 'text-blue-900 dark:text-blue-200 font-semibold' : ''}`}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2">
          {joinUrl && (item.status === 'SCHEDULED' || item.status === 'LIVE') && (
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="primary" size="sm">
                Join meeting
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[var(--muted)] rounded w-3/4" />
        <div className="h-4 bg-[var(--muted)] rounded w-full" />
        <div className="h-4 bg-[var(--muted)] rounded w-1/2" />
        <div className="h-4 bg-[var(--muted)] rounded w-2/3" />
        <div className="h-9 bg-[var(--muted)] rounded w-24 mt-4" />
      </div>
    </Card>
  );
}

export default function DashboardLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

  const fetchClasses = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await liveClassApi.getMyAvailableLiveClasses({
        page: pagination.page,
        limit: pagination.limit,
      });
      const raw = res.data ?? [];
      const seen = new Set<string>();
      const deduped = raw.filter((item) => {
        const seriesId = extractSeriesIdFromLiveClass(item);
        const key = seriesId ? `series:${seriesId}` : `class:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setClasses(deduped);
      setPagination((prev) => ({
        ...prev,
        page: res.pagination?.page ?? prev.page,
        total: res.pagination?.total ?? 0,
        pages: res.pagination?.pages ?? 0,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load live classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">
          Live Classes
        </h1>
      </header>

      {error && (
        <Card padding="md" className="mb-6 border-[var(--error)]/30 bg-[var(--error)]/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[var(--foreground)]">{error}</p>
            <Button variant="primary" size="sm" onClick={fetchClasses} className="gap-2">
              <HiRefresh className="w-4 h-4" />
              Try again
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card padding="lg" className="text-center">
          <HiVideoCamera className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-60" />
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No available live classes</h2>
          <p className="text-[var(--muted-foreground)]">
            There are no live classes available for your enrolled courses at the moment. Check back later for upcoming sessions.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((item) => (
              <LiveClassCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                <HiChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
                <HiChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

