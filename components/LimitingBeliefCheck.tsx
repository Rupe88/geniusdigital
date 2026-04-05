'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getLimitingBeliefCatalog,
  submitLimitingBeliefAttempt,
  type LimitingBeliefCatalog,
  type LimitingBeliefScoreBand,
} from '@/lib/api/limitingBelief';
import { handleApiError } from '@/lib/api/axios';
import toast from 'react-hot-toast';

type Rating = 1 | 2 | 3 | 4 | 5;

type LimitingBeliefResult = {
  totalScore: number;
  maxScore: number;
  label: string;
  description?: string | null;
};

const ratingOptions: Array<{ value: Rating; label: string }> = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

function pickBand(totalScore: number, bands: LimitingBeliefScoreBand[]): LimitingBeliefResult {
  if (!bands.length) {
    return { totalScore, maxScore: 0, label: '—', description: null };
  }
  const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
  for (const b of sorted) {
    if (totalScore >= b.minScore && totalScore <= b.maxScore) {
      return {
        totalScore,
        maxScore: sorted.reduce((m, x) => Math.max(m, x.maxScore), 0) || totalScore,
        label: b.label,
        description: b.description,
      };
    }
  }
  const fb = sorted[sorted.length - 1];
  return {
    totalScore,
    maxScore: sorted.reduce((m, x) => Math.max(m, x.maxScore), 0),
    label: fb.label,
    description: fb.description,
  };
}

type FlatQ = {
  id: string;
  text: string;
  displayIndex: number;
  sectionTitle: string;
};

function flattenSections(catalog: LimitingBeliefCatalog | null): FlatQ[] {
  if (!catalog) return [];
  let n = 0;
  const out: FlatQ[] = [];
  for (const s of catalog.sections) {
    for (const q of s.questions) {
      n += 1;
      out.push({
        id: q.id,
        text: q.text,
        displayIndex: n,
        sectionTitle: s.title,
      });
    }
  }
  return out;
}

export default function LimitingBeliefCheck({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const [catalog, setCatalog] = useState<LimitingBeliefCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<string, Rating>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<LimitingBeliefResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getLimitingBeliefCatalog();
        if (!cancelled) setCatalog(data);
      } catch (e) {
        if (!cancelled) setLoadError(handleApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flatQuestions = useMemo(() => flattenSections(catalog), [catalog]);
  const maxScore = catalog?.maxScore ?? 0;
  const bands = catalog?.bands ?? [];

  const isComplete = useMemo(
    () => flatQuestions.length > 0 && flatQuestions.every((q) => answers[q.id] != null),
    [flatQuestions, answers]
  );

  const totalScore = useMemo(() => {
    return flatQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  }, [flatQuestions, answers]);

  const bandLegend = useMemo(() => {
    if (!bands.length) return '';
    return [...bands]
      .sort((a, b) => a.minScore - b.minScore)
      .map((b) => `${b.minScore}–${b.maxScore}: ${b.label}`)
      .join(' · ');
  }, [bands]);

  const submit = async () => {
    if (!isComplete || !catalog) return;
    const r = pickBand(totalScore, bands);
    r.maxScore = maxScore;
    setResult(r);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const payload: Record<string, number> = {};
    for (const q of flatQuestions) {
      payload[q.id] = answers[q.id]!;
    }
    try {
      await submitLimitingBeliefAttempt(payload);
    } catch {
      toast.error('Could not save your result. Your score is still shown above.');
    }
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const abbrev = (value: Rating) => (value === 1 ? 'SD' : value === 2 ? 'D' : value === 3 ? 'N' : value === 4 ? 'A' : 'SA');
  const full = (value: Rating) =>
    value === 1
      ? 'Strongly Disagree'
      : value === 2
        ? 'Disagree'
        : value === 3
          ? 'Neutral'
          : value === 4
            ? 'Agree'
            : 'Strongly Agree';

  if (loading) {
    return (
      <Card padding="lg" className="max-w-3xl mx-auto">
        <p className="text-sm text-[var(--muted-foreground)]">Loading assessment…</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card padding="lg" className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--error)]">{loadError}</p>
      </Card>
    );
  }

  if (!flatQuestions.length) {
    return (
      <Card padding="lg" className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          This assessment is not available yet. Please check back later or contact support.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-5 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>

      {submitted && result && (
        <div className="rounded-none border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Total Score</div>
              <div className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                {result.totalScore} / {result.maxScore}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--muted-foreground)]">Interpretation</div>
              <div className="text-lg font-semibold text-[var(--foreground)]">{result.label}</div>
            </div>
          </div>
          {result.description ? (
            <p className="text-sm text-[var(--muted-foreground)]">{result.description}</p>
          ) : null}
          {bandLegend ? (
            <div className="text-xs text-[var(--muted-foreground)]">Bands: {bandLegend}</div>
          ) : null}
          <div className="pt-1">
            <Button variant="outline" onClick={reset}>
              Retake Test
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {flatQuestions.map((s, i) => {
          const showSectionHeader = i === 0 || flatQuestions[i - 1].sectionTitle !== s.sectionTitle;
          const current = answers[s.id] ?? null;

          return (
            <div
              key={s.id}
              className={[
                'border-t border-[var(--border)]/60 pt-4',
                i === 0 ? 'border-t-0 pt-0' : '',
              ].join(' ')}
            >
              {showSectionHeader && (
                <div className="text-xs font-semibold text-[var(--primary-700)] mb-2">{s.sectionTitle}</div>
              )}

              <div className="text-sm font-medium text-[var(--foreground)] mb-2 leading-snug">
                {s.displayIndex}. {s.text}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ratingOptions.map((o) => {
                  const checked = current === o.value;
                  return (
                    <label
                      key={o.value}
                      title={full(o.value)}
                      className={[
                        'flex flex-col items-center justify-center gap-1 px-2 py-2 border rounded-none select-none cursor-pointer',
                        checked
                          ? 'bg-[var(--primary-50)] border-[var(--primary-300)]'
                          : 'bg-[var(--background)] border-[var(--border)]',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={`q-${s.id}`}
                        value={o.value}
                        checked={checked}
                        disabled={submitted}
                        onChange={() => setAnswers((prev) => ({ ...prev, [s.id]: o.value }))}
                        className="m-0"
                      />
                      <span className="text-[10px] leading-none text-[var(--muted-foreground)] font-medium">
                        {abbrev(o.value)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs text-[var(--muted-foreground)]">
          Score range: 1–5 per statement. Max total: {maxScore}.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={Object.keys(answers).length === 0 || submitted}>
            Reset
          </Button>
          <Button onClick={submit} disabled={!isComplete || submitted}>
            Submit & Get Result
          </Button>
        </div>
      </div>
    </Card>
  );
}
