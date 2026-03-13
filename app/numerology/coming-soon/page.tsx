'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default function NumerologyComingSoonPage() {
  const params = useSearchParams();
  const title = params.get('title') || 'Coming soon';

  return (
    <Card padding="lg" className="border-dashed border-2 bg-[var(--muted)]/10">
      <div className="text-center py-10 space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          This feature is coming soon in the web version.
        </p>
      </div>
    </Card>
  );
}

