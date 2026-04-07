'use client';

import type { NumberDetail } from '@/lib/numerology/constants/numberDetails';

const innerDetailsClass =
  'rounded-md border border-slate-200 bg-white px-3 py-2';
const innerSummaryClass =
  'cursor-pointer select-none text-sm font-semibold text-slate-800';

function BulletList({ lines }: { lines: string[] }) {
  return (
    <ul className="space-y-1 text-sm text-slate-700">
      {lines.map((line, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="mt-1">•</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumerologyMoreDetails({ detail }: { detail: NumberDetail }) {
  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer select-none text-sm font-semibold text-slate-800">
        More Details
      </summary>
      <div className="mt-3 space-y-2">
        {detail.coreKarakTatva?.length ? (
          <details open className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Karak Tatva (Core)</summary>
            <div className="mt-2">
              <BulletList lines={detail.coreKarakTatva} />
            </div>
          </details>
        ) : null}

        {detail.lifeImpactArea?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Life Impact Area</summary>
            <div className="mt-2">
              <BulletList lines={detail.lifeImpactArea} />
            </div>
          </details>
        ) : null}

        {detail.favourableColours?.length || detail.avoidColours?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Favourable Colour</summary>
            <div className="mt-2 space-y-2">
              {detail.favourableColours?.length ? (
                <div className="flex flex-wrap gap-2">
                  {detail.favourableColours.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 rounded bg-white text-slate-700 text-xs border border-slate-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
              {detail.avoidColours?.length ? (
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-1">Avoid</div>
                  <div className="flex flex-wrap gap-2">
                    {detail.avoidColours.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs border border-rose-100"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        {detail.favourableDays?.length || detail.dayUse?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Favourable Day</summary>
            <div className="mt-2 space-y-2">
              {detail.favourableDays?.length ? (
                <div className="flex flex-wrap gap-2">
                  {detail.favourableDays.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-1 rounded bg-white text-slate-700 text-xs border border-slate-200"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : null}
              {detail.dayUse?.length ? (
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-1">Day use</div>
                  <BulletList lines={detail.dayUse} />
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        {detail.primaryCrystalOrGemstone?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Crystal / Gemstone</summary>
            <div className="mt-2 space-y-2">
              <div className="text-xs font-bold text-slate-800">Primary</div>
              <BulletList lines={detail.primaryCrystalOrGemstone} />
              {detail.alternativeCrystals?.length ? (
                <div>
                  <div className="text-xs font-bold text-slate-800 mt-2">Alternative</div>
                  <BulletList lines={detail.alternativeCrystals} />
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        {detail.benefits?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Benefits</summary>
            <div className="mt-2">
              <BulletList lines={detail.benefits} />
            </div>
          </details>
        ) : null}

        {detail.moneyFlow?.length || detail.workStyle?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Money & Work Style</summary>
            <div className="mt-2 space-y-2">
              {detail.moneyFlow?.length ? (
                <div>
                  <div className="text-xs font-bold text-slate-800">Money Flow</div>
                  <BulletList lines={detail.moneyFlow} />
                </div>
              ) : null}
              {detail.workStyle?.length ? (
                <div>
                  <div className="text-xs font-bold text-slate-800">Work Style</div>
                  <BulletList lines={detail.workStyle} />
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        {detail.commonProblems?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Common Problems</summary>
            <div className="mt-2">
              <BulletList lines={detail.commonProblems} />
            </div>
          </details>
        ) : null}

        {detail.behavioralRemedy?.length ? (
          <details className={innerDetailsClass}>
            <summary className={innerSummaryClass}>Behavioral Remedy</summary>
            <div className="mt-2">
              <BulletList lines={detail.behavioralRemedy} />
            </div>
          </details>
        ) : null}

        <details className={innerDetailsClass}>
          <summary className={innerSummaryClass}>Description</summary>
          <div className="mt-2">
            <ul className="space-y-2 text-sm text-slate-700">
              {detail.description.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </details>
  );
}
