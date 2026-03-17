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

      {/* More details (DOCX) */}
      <Card padding="lg">
        <div className="space-y-4 text-sm text-slate-700">
          {detail.coreKarakTatva?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">🔱 Karak Tatva (Core)</div>
              <ul className="space-y-1">
                {detail.coreKarakTatva.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {detail.lifeImpactArea?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">🔹 Life Impact Area</div>
              <ul className="space-y-1">
                {detail.lifeImpactArea.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {detail.favourableColours?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">🎨 Favourable Colour</div>
              <div className="flex flex-wrap gap-2">
                {detail.favourableColours.map((c) => (
                  <span key={c} className="px-2 py-1 rounded bg-slate-100 text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
              {detail.avoidColours?.length ? (
                <div className="mt-2">
                  <div className="font-bold text-slate-800 mb-1">❌ Avoid</div>
                  <div className="flex flex-wrap gap-2">
                    {detail.avoidColours.map((c) => (
                      <span key={c} className="px-2 py-1 rounded bg-rose-50 text-rose-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {detail.favourableDays?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">📅 Favourable Day</div>
              <div className="flex flex-wrap gap-2">
                {detail.favourableDays.map((d) => (
                  <span key={d} className="px-2 py-1 rounded bg-slate-100 text-slate-700">
                    {d}
                  </span>
                ))}
              </div>
              {detail.dayUse?.length ? (
                <div className="mt-2">
                  <div className="font-bold text-slate-800 mb-1">👉 Day use</div>
                  <ul className="space-y-1">
                    {detail.dayUse.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {detail.primaryCrystalOrGemstone?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">💎 Crystal / Gemstone</div>
              <div className="font-bold text-slate-800">✅ Primary</div>
              <ul className="space-y-1 mt-1">
                {detail.primaryCrystalOrGemstone.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {detail.alternativeCrystals?.length ? (
                <div className="mt-3">
                  <div className="font-bold text-slate-800">🔹 Alternative</div>
                  <ul className="space-y-1 mt-1">
                    {detail.alternativeCrystals.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {detail.benefits?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">💎 Benefits</div>
              <ul className="space-y-1">
                {detail.benefits.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {detail.moneyFlow?.length || detail.workStyle?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">💼 Money & Work Style</div>
              {detail.moneyFlow?.length ? (
                <div className="mb-3">
                  <div className="font-bold text-slate-800">💰 Money Flow</div>
                  <ul className="space-y-1 mt-1">
                    {detail.moneyFlow.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {detail.workStyle?.length ? (
                <div>
                  <div className="font-bold text-slate-800">🏢 Work Style</div>
                  <ul className="space-y-1 mt-1">
                    {detail.workStyle.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {detail.commonProblems?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">⚠️ Common Problems</div>
              <ul className="space-y-1">
                {detail.commonProblems.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {detail.behavioralRemedy?.length ? (
            <div>
              <div className="text-base font-bold text-gray-900 mb-2">💼 Behavioral Remedy</div>
              <ul className="space-y-1">
                {detail.behavioralRemedy.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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

