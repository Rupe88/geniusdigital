'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/axios';
import { toast } from 'react-hot-toast';
import { ROUTES } from '@/lib/utils/constants';

interface ManualSettings {
  id: string;
  qrImageUrl: string | null;
  instructions: string | null;
}

export default function AdminManualPaymentSettingsPage() {
  const [settings, setSettings] = useState<ManualSettings | null>(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await apiClient.get<{ success: boolean; data: ManualSettings }>(
        '/payments/admin/manual-payment-settings'
      );
      if (r.data?.success && r.data.data) {
        setSettings(r.data.data);
        setInstructions(r.data.data.instructions ?? '');
      }
    } catch {
      toast.error('Failed to load QR payment settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveInstructions = async () => {
    setSaving(true);
    try {
      const r = await apiClient.put<{ success: boolean; data: ManualSettings }>(
        '/payments/admin/manual-payment-settings',
        { instructions }
      );
      if (r.data?.success && r.data.data) {
        setSettings(r.data.data);
        toast.success('Instructions saved');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setSaving(true);
    try {
      const r = await apiClient.post<{ success: boolean; data: ManualSettings }>(
        '/payments/admin/manual-payment-settings/qr',
        fd
      );
      if (r.data?.success && r.data.data) {
        setSettings(r.data.data);
        toast.success('QR image updated');
      }
    } catch {
      toast.error('QR upload failed');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-600">Loading…</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">QR manual payments</h1>
        <Link
          href={`${ROUTES.ADMIN}/payments`}
          className="text-sm font-medium text-[var(--primary-700)] hover:underline"
        >
          Review pending proofs →
        </Link>
      </div>

      <Card padding="lg" className="space-y-4">
        <p className="text-sm text-gray-600">
          Students pay by scanning this QR, then upload a screenshot on checkout or course enrollment.
          Approve or reject payments from{' '}
          <Link href={`${ROUTES.ADMIN}/payments`} className="font-medium text-[var(--primary-700)] underline">
            Payments
          </Link>
          .
        </p>

        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">QR image</p>
          {settings?.qrImageUrl ? (
            <div className="relative mb-3 h-48 w-48 border border-gray-200 bg-gray-50">
              <Image
                src={settings.qrImageUrl}
                alt="Payment QR"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-sm text-amber-700 mb-3">No QR uploaded yet.</p>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onQrFile}
            disabled={saving}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-none file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium"
          />
        </div>

        <div>
          <label htmlFor="manual-instructions" className="block text-sm font-medium text-gray-900 mb-2">
            Instructions for students
          </label>
          <textarea
            id="manual-instructions"
            className="w-full min-h-[140px] rounded-none border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
            placeholder="e.g. Bank name, account name, reference to use in transfer…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <Button type="button" variant="primary" onClick={saveInstructions} disabled={saving}>
          {saving ? 'Saving…' : 'Save instructions'}
        </Button>
      </Card>
    </div>
  );
}
