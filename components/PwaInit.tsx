'use client';

import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 60 * 1000; // Check for SW update every 60s

export function PwaInit() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let reloaded = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateBanner(true);
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && registration.waiting) {
              setWaitingWorker(registration.waiting);
              setShowUpdateBanner(true);
            }
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          window.location.reload();
        });
        const checkForUpdates = () => registration.update();
        const interval = setInterval(checkForUpdates, CHECK_INTERVAL_MS);
        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') checkForUpdates();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisibilityChange);
        };
      } catch (e) {
        console.error('[PWA] Service worker registration failed', e);
        return () => {};
      }
    };

    let cleanup: (() => void) | void;
    const onLoad = () => {
      register().then((fn) => { cleanup = fn; });
    };
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', onLoad);
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
      setWaitingWorker(null);
    }
  };

  if (!showUpdateBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex justify-center sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border border-[#c01e2e]/30 bg-[#0d1625] px-4 py-3 text-white shadow-lg">
        <span className="text-sm">New version available</span>
        <button
          type="button"
          onClick={handleRefresh}
          className="shrink-0 rounded bg-[#c01e2e] px-3 py-1.5 text-sm font-medium hover:bg-[#a01926]"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

