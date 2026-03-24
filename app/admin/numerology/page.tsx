'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as leadsApi from '@/lib/api/leads';
import { HiSearch } from 'react-icons/hi';

export default function AdminNumerologyLeadsPage() {
  const [rows, setRows] = useState<leadsApi.AppLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leadsApi.getNumerologyLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
      });
      setRows(res.data || []);
      setPagination((p) => ({ ...p, ...res.pagination }));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Numerology Users</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Submitted users from the numerology app.
        </p>
      </div>

      <Card padding="md">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by full name, email, phone"
            className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Message</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-52" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded w-24" /></td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--muted)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.fullName}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.email}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.phone || '—'}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[360px] truncate">{r.message || '—'}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                    No numerology users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-4 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
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
