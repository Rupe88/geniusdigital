'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAllAffiliateApplications, type AffiliateApplication } from '@/lib/api/affiliateApplications';
import { formatDate } from '@/lib/utils/helpers';
import { showError } from '@/lib/utils/toast';
import { HiArrowLeft, HiDocumentText, HiSearch, HiFilter } from 'react-icons/hi';

export default function AdminAffiliateApplicationsPage() {
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllAffiliateApplications({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery }),
      });
      setApplications(res.data || []);
      setPagination((prev) => ({ ...prev, ...res.pagination }));
    } catch (err) {
      console.error('Error fetching affiliate applications:', err);
      showError(err instanceof Error ? err.message : 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-primary-600 transition-colors w-fit"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600">
              <HiDocumentText className="h-5 w-5" />
            </span>
            Affiliate Applications
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1.5 text-sm">
            Applications submitted from the Become A Affiliate form.
          </p>
        </div>
      </div>

      <Card padding="md" className="border border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600">
            <HiDocumentText className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Total applications</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {loading ? '—' : pagination.total.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="border border-[var(--border)] shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiFilter className="h-4 w-4 text-[var(--muted-foreground)]" />
          Search
        </h2>
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, country, occupation..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      <Card padding="none" className="border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[var(--muted)]/80 border-b border-[var(--border)] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Country / City</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Occupation</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Experience</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Occult</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-12" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                  </tr>
                ))
              ) : applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--foreground)]">{app.fullName}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">{app.email}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">{app.phone || '—'}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">
                      {[app.country, app.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)] max-w-[140px] truncate" title={app.currentOccupation || undefined}>
                      {app.currentOccupation || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {app.hasAffiliateExperience ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)]">
                      {app.occultKnowledge || app.occultOther ? (
                        <span>{app.occultKnowledge || 'Other'}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatDate(app.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
                      <HiDocumentText className="h-14 w-14 opacity-60" />
                      <p className="font-medium text-[var(--foreground)]">No applications yet</p>
                      <p className="text-sm max-w-sm">
                        Affiliate applications from the Become A Affiliate form will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
