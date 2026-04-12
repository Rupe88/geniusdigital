'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { submitPaymentProof } from '@/lib/api/payments';
import { showSuccess, showError } from '@/lib/utils/toast';

type Props = {
  paymentId: string;
  qrImageUrl: string;
  instructions?: string;
  amountLabel: string;
  onDone?: () => void;
};

export function ManualPaymentFlow({ paymentId, qrImageUrl, instructions, amountLabel, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!file) {
      showError('Please choose a screenshot of your payment');
      return;
    }
    setSending(true);
    try {
      await submitPaymentProof(paymentId, file);
      showSuccess('Proof submitted. An admin will verify your payment shortly.');
      setFile(null);
      onDone?.();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] p-4 bg-[var(--background)]">
      <p className="font-semibold text-[var(--foreground)]">Pay {amountLabel}</p>
      <p className="text-sm text-[var(--muted-foreground)]">
        Scan the QR code with your bank or wallet app, complete the transfer, then upload a screenshot of the success
        screen.
      </p>
      {instructions ? (
        <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap rounded-md bg-[var(--muted)]/50 p-3">
          {instructions}
        </p>
      ) : null}
      <div className="flex justify-center rounded-lg bg-white p-3 border border-[var(--border)]">
        <Image
          src={qrImageUrl}
          alt="Payment QR"
          width={220}
          height={220}
          className="object-contain max-h-[220px] w-auto"
          unoptimized
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Payment screenshot</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-[var(--foreground)]"
        />
      </div>
      <Button type="button" variant="primary" className="w-full" onClick={submit} disabled={sending || !file}>
        {sending ? 'Uploading…' : 'Submit payment proof'}
      </Button>
    </div>
  );
}
