'use client';

import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { getNumberDetail, type NumberDetailSource } from '@/lib/numerology/constants/numberDetails';

export default function NumerologyNumberDetailPage({
  params,
}: {
  // In app router client components, params is a Promise and must be unwrapped with React.use
  params: Promise<{ num: string }>;
}) {
  const resolvedParams = React.use(params);

  const search = useSearchParams();
  const source = (search.get('source') as NumberDetailSource | null) ?? null;

  const num = useMemo(() => {
    const n = parseInt(resolvedParams.num, 10);
    return Number.isNaN(n) ? null : n;
  }, [resolvedParams.num]);

  const detail = useMemo(() => (num != null ? getNumberDetail(num) : null), [num]);

  const sourceLabel =
    source === 'pythagorean'
      ? 'Pythagorean'
      : source === 'chaldean'
      ? 'Chaldean'
      : source === 'mulank'
      ? 'Mulank'
      : source === 'bhagyank'
      ? 'Bhagyank'
      : null;

  if (!detail) {
    return (
      <Card padding="lg" className="max-w-3xl mx-auto">
        <p className="text-sm text-[var(--muted-foreground)]">No details for this number.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        {sourceLabel ? (
          <div className="text-xs font-bold tracking-wider text-slate-600 uppercase mb-1">
            {sourceLabel}
          </div>
        ) : null}
        <h2 className="text-2xl font-bold text-gray-900">
          #{detail.number} — {detail.title}
        </h2>
      </div>

      <Card padding="lg">
        <div className="space-y-2 text-gray-800">
          <div>
            <span className="font-bold">Ruling Planet:</span> {detail.rulingPlanet}
          </div>
          <div>
            <span className="font-bold">Good:</span> {detail.good}
          </div>
          <div>
            <span className="font-bold">Bad:</span> {detail.bad}
          </div>
          <div>
            <span className="font-bold">Famous Personalities:</span> {detail.famousPersonalities}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="text-base font-bold text-gray-900 mb-3">Description</div>
        <ul className="space-y-2 text-sm text-slate-700">
          {detail.description.map((line, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-1">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

