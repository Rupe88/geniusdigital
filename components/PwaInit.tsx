'use client';

import { useEffect } from 'react';

export function PwaInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        // console.log('[PWA] Service worker registered');
      } catch (e) {
        console.error('[PWA] Service worker registration failed', e);
      }
    };

    // Delay registration slightly so it doesn't block initial rendering
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}

