'use client';

import React, { useState, useEffect } from 'react';
import {
  getReferralAnalytics,
  getReferralConversions,
  prepareReferralPayout,
  confirmReferralPayout,
  getReferralSecurityReport,
  ReferralAnalytics,
  ReferralConversion,
  ReferralPayoutPreparation,
  ReferralSecurityReport,
} from '@/lib/api/referrals';
import { Pagination } from '@/lib/types/api';
import {
  FaLink,
  FaEye,
  FaUsers,
  FaDollarSign,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showSuccess, showError } from '@/lib/utils/toast';

export const AdminReferralDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedConversions, setSelectedConversions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityReport, setSecurityReport] = useState<ReferralSecurityReport | null>(null);
  const [preparingPayout, setPreparingPayout] = useState(false);
  const [confirmingPayout, setConfirmingPayout] = useState(false);
  const [preparedPayout, setPreparedPayout] = useState<ReferralPayoutPreparation | null>(null);
  const [confirmPayload, setConfirmPayload] = useState({
    payoutBatchId: '',
    confirmationToken: '',
    idempotencyKey: '',
  });
  const [filters, setFilters] = useState({
    status: '',
    isFraudulent: '',
    page: 1,
    limit: 10
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadConversions();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [analyticsResult, conversionsResult] = await Promise.all([
        getReferralAnalytics(),
        getReferralConversions(filters)
      ]);

      setAnalytics(analyticsResult);
      setConversions(conversionsResult.data);
      setPagination(conversionsResult.pagination);
      try {
        const report = await getReferralSecurityReport(24);
        setSecurityReport(report);
      } catch {
        setSecurityReport(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      showError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const loadConversions = async () => {
    try {
      const result = await getReferralConversions(filters);
      setConversions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      showError('Failed to load conversions');
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSelectConversion = (conversionId: string) => {
    setSelectedConversions(prev =>
      prev.includes(conversionId)
        ? prev.filter(id => id !== conversionId)
        : [...prev, conversionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedConversions.length === conversions.length) {
      setSelectedConversions([]);
    } else {
      setSelectedConversions(conversions.map(c => c.id));
    }
  };

  const resetPreparedPayout = () => {
    setPreparedPayout(null);
    setConfirmPayload({
      payoutBatchId: '',
      confirmationToken: '',
      idempotencyKey: '',
    });
  };

  const handlePreparePayout = async () => {
    if (selectedConversions.length === 0) return;

    try {
      setPreparingPayout(true);
      const prep = await prepareReferralPayout(selectedConversions);
      setPreparedPayout(prep);
      setConfirmPayload({
        payoutBatchId: prep.payoutBatchId,
        confirmationToken: prep.confirmationToken,
        idempotencyKey:
          (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `idemp-${Date.now()}`,
      });
      showSuccess('Payout batch prepared. Confirm payout after external transfer is done.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to prepare payout batch');
    } finally {
      setPreparingPayout(false);
    }
  };

  const handleConfirmPayout = async () => {
    if (!confirmPayload.payoutBatchId || !confirmPayload.confirmationToken || !confirmPayload.idempotencyKey) {
      showError('Payout batch ID, confirmation token, and idempotency key are required');
      return;
    }
    try {
      setConfirmingPayout(true);
      const result = await confirmReferralPayout(confirmPayload);
      showSuccess(`Payout executed for ${result.conversionsUpdated} conversions (NPR ${(result.totalAmount || 0).toFixed(2)})`);
      setSelectedConversions([]);
      resetPreparedPayout();
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to confirm payout batch');
    } finally {
      setConfirmingPayout(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-600',
      },
      PAID: {
        label: 'Paid',
        className: 'bg-green-100 text-green-900 border border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-600',
      },
      CANCELLED: {
        label: 'Cancelled',
        className: 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-600/40 dark:text-slate-200 dark:border-slate-500',
      },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${className}`}>
        {label}
      </span>
    );
  };

  const getFraudBadge = (isFraudulent: boolean) => {
    return isFraudulent ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-red-400 bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100 dark:border-red-600">
        <FaExclamationTriangle className="w-3 h-3 shrink-0" />
        Fraudulent
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-green-400 bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-100 dark:border-green-600">
        <FaCheck className="w-3 h-3 shrink-0" />
        Clean
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded border border-[var(--border)] bg-[var(--muted)]/20" />
          ))}
        </div>
        <div className="h-96 rounded border border-[var(--border)] bg-[var(--muted)]/20" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50/50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-red-500">
            <FaExclamationTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading referral data</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={loadData}>
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Referral System Admin</h1>
        <p className="mt-1 text-[var(--muted-foreground)]">Manage referral conversions, commissions, and analytics</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaLink className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-[var(--muted-foreground)] truncate">Total Links</dt>
                  <dd className="text-xl font-bold text-[var(--foreground)]">{analytics.totalLinks.toLocaleString()}</dd>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <FaEye className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-[var(--muted-foreground)] truncate">Total Clicks</dt>
                  <dd className="text-xl font-bold text-[var(--foreground)]">{analytics.totalClicks.toLocaleString()}</dd>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FaUsers className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-[var(--muted-foreground)] truncate">Conversions</dt>
                  <dd className="text-xl font-bold text-[var(--foreground)]">{analytics.totalConversions.toLocaleString()}</dd>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FaDollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-[var(--muted-foreground)] truncate">Total Commission</dt>
                  <dd className="text-xl font-bold text-[var(--foreground)]">{`NPR ${Number(analytics.totalCommission || 0).toFixed(0)}`}</dd>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center">
                  <FaCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">Conversion Rate</dt>
                  <dd className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                    {analytics.totalClicks > 0 ? ((analytics.totalConversions / analytics.totalClicks) * 100).toFixed(1) : '0'}%
                  </dd>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {securityReport && (
        <Card>
          <div className="p-5">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Referral Security (Last {securityReport.windowHours}h)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-xs text-[var(--muted-foreground)]">Clicks</p>
                <p className="text-xl font-semibold">{securityReport.clicksTotal}</p>
              </div>
              <div className="rounded border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-xs text-[var(--muted-foreground)]">Invalid Clicks</p>
                <p className="text-xl font-semibold">{securityReport.invalidClicks}</p>
              </div>
              <div className="rounded border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-xs text-[var(--muted-foreground)]">Invalid Rate</p>
                <p className="text-xl font-semibold">{(securityReport.invalidClickRate * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded border border-[var(--border)] p-3 bg-[var(--muted)]/20">
                <p className="text-xs text-[var(--muted-foreground)]">Flagged Events</p>
                <p className="text-xl font-semibold">{securityReport.flaggedReferralAuditEvents}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Conversions Management */}
      <Card padding="none">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Referral Conversions</h3>
            {selectedConversions.length > 0 && (
              <Button onClick={handlePreparePayout} size="sm" disabled={preparingPayout || confirmingPayout}>
                <FaCheck className="w-4 h-4 mr-2" />
                {preparingPayout ? 'Preparing...' : `Prepare Payout (${selectedConversions.length})`}
              </Button>
            )}
          </div>

          {(preparedPayout || confirmPayload.payoutBatchId) && (
            <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-900">Payout Confirmation</h4>
              {preparedPayout && (
                <p className="text-xs text-amber-800">
                  Prepared {preparedPayout.conversionsCount} conversions for NPR {preparedPayout.totalAmount.toFixed(2)}.
                  Expires at {new Date(preparedPayout.expiresAt).toLocaleString()}.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-amber-900">Payout Batch ID</label>
                  <input
                    value={confirmPayload.payoutBatchId}
                    onChange={(e) => setConfirmPayload((prev) => ({ ...prev, payoutBatchId: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-amber-900">Confirmation Token</label>
                  <input
                    value={confirmPayload.confirmationToken}
                    onChange={(e) => setConfirmPayload((prev) => ({ ...prev, confirmationToken: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-amber-900">Idempotency Key</label>
                  <input
                    value={confirmPayload.idempotencyKey}
                    onChange={(e) => setConfirmPayload((prev) => ({ ...prev, idempotencyKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleConfirmPayout} disabled={confirmingPayout || preparingPayout}>
                  {confirmingPayout ? 'Confirming...' : 'Confirm Payout'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetPreparedPayout} disabled={confirmingPayout}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
                className="w-full min-w-[140px] px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:outline-none text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Fraud Status</label>
              <select
                value={filters.isFraudulent}
                onChange={(e) => handleFilterChange({ isFraudulent: e.target.value })}
                className="w-full min-w-[140px] px-4 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-500)] focus:outline-none text-sm"
              >
                <option value="">All</option>
                <option value="false">Clean</option>
                <option value="true">Fraudulent</option>
              </select>
            </div>
          </div>

          {/* Conversions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="bg-[var(--muted)]/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedConversions.length === conversions.length && conversions.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary-700)] focus:ring-[var(--primary-500)]"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Referrer</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Course</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Converted User</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Fraud Check</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {conversions.map((conversion) => (
                  <tr key={conversion.id} className="hover:bg-[var(--muted)]/20">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedConversions.includes(conversion.id)}
                        onChange={() => handleSelectConversion(conversion.id)}
                        disabled={conversion.status !== 'PENDING' || conversion.isFraudulent}
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary-700)] focus:ring-[var(--primary-500)] disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--foreground)]">{conversion.referralLink?.user?.fullName || '—'}</div>
                      <div className="text-sm text-[var(--muted-foreground)] truncate max-w-[180px]" title={conversion.referralLink?.user?.email}>{conversion.referralLink?.user?.email || '—'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--foreground)]">{conversion.referralLink?.course?.title || '—'}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">NPR {conversion.referralLink?.course?.price ?? '—'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--foreground)]">{conversion.convertedBy?.fullName || '—'}</div>
                      <div className="text-sm text-[var(--muted-foreground)] truncate max-w-[180px]" title={conversion.convertedBy?.email}>{conversion.convertedBy?.email || '—'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
                      {`NPR ${Number(conversion.commissionAmount || 0).toFixed(2)}`}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{getStatusBadge(conversion.status)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getFraudBadge(conversion.isFraudulent)}
                      {conversion.fraudReason && (
                        <div className="text-xs text-red-600 mt-1 max-w-[160px] truncate" title={conversion.fraudReason}>{conversion.fraudReason}</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                      {new Date(conversion.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {conversions.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-[var(--muted-foreground)] opacity-50" />
              <h3 className="mt-3 text-sm font-medium text-[var(--foreground)]">No conversions found</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {filters.status || filters.isFraudulent ? 'Try adjusting your filters' : 'Conversions will appear here when users enroll through referral links'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-[var(--border)] mt-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Page {pagination.page} of {pagination.pages} • {pagination.total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  <HiChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">{pagination.page} / {pagination.pages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                >
                  <HiChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminReferralDashboard;
