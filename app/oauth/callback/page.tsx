'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';
import * as authApi from '@/lib/api/auth';
import { storageClearTokens, storageSetTokens } from '@/lib/utils/safeStorage';

function getHashTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
  const sp = hash ? new URLSearchParams(hash) : null;
  return {
    accessToken: sp?.get('accessToken') ?? null,
    refreshToken: sp?.get('refreshToken') ?? null,
  };
}

export default function OAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { accessToken, refreshToken } = getHashTokens();
    if (!accessToken || !refreshToken) {
      setError('Missing login tokens. Please try again.');
      return;
    }

    const saved = storageSetTokens(accessToken, refreshToken);
    if (!saved) {
      setError('Unable to save session on this device. Please try again.');
      return;
    }
    // Clean URL (remove tokens from hash)
    window.history.replaceState({}, '', window.location.pathname);

    authApi
      .getMe()
      .then((user) => {
        if (user?.role === 'ADMIN') window.location.replace(ROUTES.ADMIN);
        else window.location.replace(ROUTES.HOME);
      })
      .catch(() => {
        storageClearTokens();
        setError('Session could not be restored. Please try logging in again.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-none border border-gray-200 bg-white shadow-md p-6">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Google login failed</h1>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Link className="text-sm font-medium text-[#c01e2e] hover:underline" href={ROUTES.LOGIN}>
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Signing you in…</h1>
            <p className="text-sm text-gray-600">Please wait.</p>
          </>
        )}
      </div>
    </div>
  );
}

