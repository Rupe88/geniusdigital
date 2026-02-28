'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAllAuditLogs, AuditLog, AuditLogFilters } from '@/lib/api/auditLogs';
import { formatDateTime } from '@/lib/utils/helpers';
import { HiSearch, HiFilter, HiChevronLeft, HiChevronRight, HiExclamation, HiOutlineDocument } from 'react-icons/hi';
import type { Pagination } from '@/lib/types/api';

const ACTION_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'PAYMENT', 'REFUND', 'LOGIN', 'CREATE', 'UPDATE'];
const ENTITY_OPTIONS = ['USER', 'PAYMENT', 'COURSE', 'ENROLLMENT', 'COUPON', 'ORDER', 'AUTH', 'ADMIN', 'UNKNOWN'];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState<Partial<AuditLogFilters>>({
    page: 1,
    limit: 20,
  });
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterVersion, setFilterVersion] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.limit, filterVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildFilters = (): AuditLogFilters => ({
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    ...(actionFilter && { action: actionFilter }),
    ...(entityTypeFilter && { entityType: entityTypeFilter }),
    ...(userIdFilter.trim() && { userId: userIdFilter.trim() }),
    ...(entityIdFilter.trim() && { entityId: entityIdFilter.trim() }),
    ...(flaggedFilter === 'true' && { flagged: true }),
    ...(flaggedFilter === 'false' && { flagged: false }),
    ...(startDate && { startDate: new Date(startDate).toISOString() }),
    ...(endDate && { endDate: new Date(endDate).toISOString() }),
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = buildFilters();
      const result = await getAllAuditLogs(params);
      setLogs(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      alert(Object(error).message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    setFilterVersion((v) => v + 1);
  };

  const handleResetFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setUserIdFilter('');
    setEntityIdFilter('');
    setFlaggedFilter('');
    setStartDate('');
    setEndDate('');
    setFilters({ page: 1, limit: 20 });
    setExpandedId(null);
    setFilterVersion((v) => v + 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const hasActiveFilters =
    actionFilter ||
    entityTypeFilter ||
    userIdFilter.trim() ||
    entityIdFilter.trim() ||
    flaggedFilter ||
    startDate ||
    endDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Audit Logs</h1>
          <p className="text-[var(--muted-foreground)] mt-1">View system activity and user actions</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
            >
              <option value="">All</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
            >
              <option value="">All</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">User ID</label>
            <Input
              placeholder="UUID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Flagged</label>
            <select
              value={flaggedFilter}
              onChange={(e) => setFlaggedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-none bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={handleApplyFilters} className="flex items-center gap-2">
            <HiFilter className="h-4 w-4" />
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary-500)] border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
            <HiOutlineDocument className="h-12 w-12 mb-3 opacity-50" />
            <p>No audit logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Action</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Entity</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Description</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Risk</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--foreground)]">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.user ? (
                          <span title={log.user.email}>
                            {log.user.fullName || log.user.email || '—'}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-[var(--muted)] text-[var(--foreground)]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-[var(--foreground)]">{log.entityType}</span>
                        {log.entityId && (
                          <span className="block text-xs text-[var(--muted-foreground)] truncate max-w-[120px]" title={log.entityId}>
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] max-w-[200px] truncate" title={log.description || ''}>
                        {log.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.riskScore != null && log.riskScore > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${
                              log.flagged ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}
                          >
                            {log.flagged && <HiExclamation className="h-3 w-3" />}
                            {log.riskScore}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(log.changes || log.metadata) && (
                          <span className="text-xs text-[var(--primary-600)]">
                            {expandedId === log.id ? 'Hide' : 'View'}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && (log.changes || log.metadata || log.requestPath) && (
                      <tr className="bg-[var(--muted)]/10 border-b border-[var(--border)]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-2 text-xs font-mono overflow-x-auto">
                            {log.requestPath && (
                              <p><span className="text-[var(--muted-foreground)]">Path:</span> {log.requestPath}</p>
                            )}
                            {log.ipAddress && (
                              <p><span className="text-[var(--muted-foreground)]">IP:</span> {log.ipAddress}</p>
                            )}
                            {log.changes && (
                              <div>
                                <span className="text-[var(--muted-foreground)]">Changes:</span>
                                <pre className="mt-1 p-2 bg-[var(--background)] rounded border border-[var(--border)] overflow-x-auto max-h-40 overflow-y-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.metadata && (
                              <div>
                                <span className="text-[var(--muted-foreground)]">Metadata:</span>
                                <pre className="mt-1 p-2 bg-[var(--background)] rounded border border-[var(--border)] overflow-x-auto max-h-40 overflow-y-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && pagination.pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">
              Page {pagination.page} of {pagination.pages} • {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <HiChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                <HiChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
