'use client';

import React, { useEffect, useState } from 'react';
import { FiDownload, FiSmartphone, FiMonitor } from 'react-icons/fi';
import { Modal } from '@/components/ui/Modal';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already running as installed PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      setShowGuide(true);
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
  };

  // Don't show anything if already in standalone (installed) or no install prompt and user hasn't asked for guide
  const showFooterCta = !isStandalone;

  if (!showFooterCta) return null;

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex w-full items-center justify-center gap-3 rounded-none border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/10"
        >
          <FiDownload className="text-2xl shrink-0" />
          <div className="text-left">
            <p className="text-xs text-gray-200/80">Install on this device</p>
            <p className="text-sm font-semibold">
              {installPrompt ? 'Install Sanskar Academy' : 'Install app'}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="w-full text-left text-xs text-gray-200/80 underline underline-offset-2 hover:text-white"
        >
          How to install on mobile or computer
        </button>
      </div>

      <Modal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="How to install Sanskar Academy"
        size="lg"
      >
        <div className="space-y-6 text-sm text-gray-700">
          {/* Android */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <FiSmartphone className="text-lg text-green-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">On Android (Chrome)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Open this site in <strong>Chrome</strong>.</li>
                <li>Tap the <strong>menu</strong> (⋮) or “Install app” banner if you see it.</li>
                <li>Tap <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.</li>
                <li>Confirm. The app icon will appear on your home screen.</li>
              </ol>
            </div>
          </div>

          {/* iOS */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <SiApple className="text-lg text-gray-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">On iPhone / iPad (Safari)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Open this site in <strong>Safari</strong> (not Chrome).</li>
                <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom.</li>
                <li>Scroll and tap <strong>“Add to Home Screen”</strong>.</li>
                <li>Tap <strong>“Add”</strong>. The app icon will appear on your home screen.</li>
              </ol>
            </div>
          </div>

          {/* Windows */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <FiMonitor className="text-lg text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">On Windows (Chrome or Edge)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Open this site in <strong>Chrome</strong> or <strong>Microsoft Edge</strong>.</li>
                <li>Look for the <strong>install icon</strong> (⊕ or computer with plus) in the address bar, or use the menu (⋮) → <strong>“Install Sanskar Academy”</strong> or <strong>“Apps” → “Install this site as an app”</strong>.</li>
                <li>Click <strong>“Install”</strong>. The app will open in its own window like a desktop app.</li>
              </ol>
            </div>
          </div>

          <p className="text-gray-500">
            After installing, open the app from your home screen or Start menu for the best experience.
          </p>
        </div>
      </Modal>
    </>
  );
}

// Simple Apple icon for iOS section (avoid adding whole si package if not present)
function SiApple({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
