'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StorageImage } from '@/components/ui/StorageImage';
import { getMyInstallments, type MyInstallmentItem } from '@/lib/api/installments';
import { createPayment } from '@/lib/api/payments';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiCalendar, HiBookOpen } from 'react-icons/hi';
import { ManualPaymentFlow } from '@/components/payments/ManualPaymentFlow';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(amount);
}

export default function InstallmentsPage() {
  const [list, setList] = useState<MyInstallmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [manualInstallment, setManualInstallment] = useState<{
    installmentId: string;
    paymentId: string;
    qrImageUrl: string;
    instructions?: string;
    amountLabel: string;
  } | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getMyInstallments();
      setList(data);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to load installments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handlePayNow = async (item: MyInstallmentItem) => {
    if (item.status !== 'PENDING' && item.status !== 'OVERDUE') return;
    setPayingId(item.id);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await createPayment({
        amount: item.amount,
        paymentMethod: 'MANUAL_QR',
        installmentId: item.id,
        successUrl: `${origin}/payment/success?type=installment`,
        failureUrl: `${origin}/payment/failure`,
      });
      const pd = res?.paymentDetails;
      if (pd?.qrImageUrl && res?.paymentId) {
        setManualInstallment({
          installmentId: item.id,
          paymentId: res.paymentId,
          qrImageUrl: pd.qrImageUrl,
          instructions: typeof pd.instructions === 'string' ? pd.instructions : undefined,
          amountLabel: formatCurrency(Number(res.amount ?? item.amount)),
        });
        showSuccess('Scan the QR to pay, then upload your proof.');
        return;
      }
      throw new Error('Payment could not be started. Ask an admin to configure the payment QR.');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Payment could not be started');
    } finally {
      setPayingId(null);
    }
  };

  const pending = list.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const paid = list.filter((i) => i.status === 'PAID');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Installments</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          View and pay your course installments (EMI). Pay due installments to keep access.
        </p>
      </div>

      {loading ? (
        <Card padding="lg">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                <div className="w-14 h-14 rounded bg-[var(--muted)] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-[var(--muted)] rounded animate-pulse" />
                </div>
                <div className="h-9 w-24 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      ) : list.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <HiCalendar className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-[var(--muted-foreground)]">You have no installments.</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Installment plans are available on selected high-value courses when you enroll.
          </p>
          <Link href="/courses">
            <Button variant="primary" className="mt-4">Browse courses</Button>
          </Link>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Due / Upcoming</h2>
              <ul className="space-y-4">
                {pending.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-[var(--muted)]">
                        {i.course?.thumbnail ? (
                          <StorageImage src={i.course.thumbnail} alt={i.course.title} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                            <HiBookOpen className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">{i.course?.title ?? 'Course'}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Installment {i.installmentNumber} · Due {formatDate(i.dueDate)}
                          {i.status === 'OVERDUE' && (
                            <span className="ml-2 text-amber-600 font-medium">Overdue</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(i.amount)}</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePayNow(i)}
                        disabled={payingId !== null}
                        isLoading={payingId === i.id}
                      >
                        Pay now
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {manualInstallment && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Complete payment</h2>
              <ManualPaymentFlow
                paymentId={manualInstallment.paymentId}
                qrImageUrl={manualInstallment.qrImageUrl}
                instructions={manualInstallment.instructions}
                amountLabel={manualInstallment.amountLabel}
                onDone={() => {
                  setManualInstallment(null);
                  fetchList();
                }}
              />
            </Card>
          )}

          {paid.length > 0 && (
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Paid</h2>
              <ul className="space-y-3">
                {paid.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)]/50 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[var(--muted)]">
                      {i.course?.thumbnail ? (
                        <StorageImage src={i.course.thumbnail} alt={i.course.title} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                          <HiBookOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate">{i.course?.title ?? 'Course'}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Installment {i.installmentNumber} · Paid {i.paidAt ? formatDate(i.paidAt) : '—'}
                      </p>
                    </div>
                    <span className="font-medium text-emerald-600">{formatCurrency(i.amount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
