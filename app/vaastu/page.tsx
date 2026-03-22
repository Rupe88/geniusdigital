'use client';

import Link from 'next/link';

export default function VaastuComingSoonPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]">Vastu</h1>
        <p className="text-[var(--muted-foreground)]">
          Coming soon.
        </p>
        <div className="pt-2">
          <Link
            href="/numerology/basic"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary-700)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-800)] transition-colors"
          >
            Go to Numerology
          </Link>
        </div>
      </div>
    </div>
  );
}

