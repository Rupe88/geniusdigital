'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPaymentHistory } from '@/lib/api/payments';
import type { Payment } from '@/lib/types/payment';
import type { Pagination } from '@/lib/types/api';
import { HiRefresh, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string = 'NPR'): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: currency || 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    ESEWA: 'eSewa',
    MOBILE_BANKING: 'Mobile Banking',
    VISA_CARD: 'Visa Card',
    MASTERCARD: 'Mastercard',
    KHALTI: 'Khalti',
    RAZORPAY: 'Razorpay',
  };
  return labels[method] ?? method;
}

function statusStyles(status: Payment['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'REFUNDED':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaymentHistory({ page, limit: PAGE_SIZE });
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(pagination.page);
  }, [pagination.page, fetchPayments]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.pages) setPagination((p) => ({ ...p, page }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Payment History</h1>

      {error && (
        <Card padding="lg" className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPayments(pagination.page)} className="gap-2">
            <HiRefresh className="w-4 h-4" /> Retry
          </Button>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--muted-foreground)]">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-[var(--muted-foreground)] mb-4">You don&apos;t have any payments yet.</p>
            <Link href="/courses">
              <Button variant="primary">Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Date</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Description</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Amount</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Method</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-[var(--foreground)] hidden sm:table-cell">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {payment.course?.thumbnail && (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[var(--muted)]">
                              <Image
                                src={payment.course.thumbnail}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          )}
                          <div>
                            {payment.course ? (
                              <Link
                                href={`/courses/${payment.course.id}`}
                                className="font-medium text-[var(--foreground)] hover:text-[var(--primary-700)] hover:underline"
                              >
                                {payment.course.title}
                              </Link>
                            ) : payment.order ? (
                              <span className="font-medium text-[var(--foreground)]">
                                Order #{payment.order.orderNumber}
                              </span>
                            ) : (
                              <span className="text-[var(--muted-foreground)]">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                        {paymentMethodLabel(payment.paymentMethod)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded ${statusStyles(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] font-mono hidden sm:table-cell max-w-[120px] truncate" title={payment.transactionId ?? undefined}>
                        {payment.transactionId ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/20">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="gap-1"
                  >
                    <HiChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="gap-1"
                  >
                    Next <HiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
