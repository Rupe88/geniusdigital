'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Rating = 1 | 2 | 3 | 4 | 5;

type LimitingBeliefResult = {
  totalScore: number;
  maxScore: number;
  label: string;
};

const ratingOptions: Array<{ value: Rating; label: string }> = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const buildResult = (totalScore: number): LimitingBeliefResult => {
  const maxScore = 125;
  let label = '';
  if (totalScore >= 100) {
    label = 'Strong Limiting Belief System 🚨';
  } else if (totalScore >= 75) {
    label = 'Moderate Limitation ⚠️';
  } else if (totalScore >= 50) {
    label = 'Awareness Stage 🔄';
  } else {
    label = 'Low Limiting Belief ✅';
  }
  return { totalScore, maxScore, label };
};

const STATEMENTS: Array<{ idx: number; text: string; section: 'A' | 'B' | 'C' | 'D' | 'E' }> = [
  { idx: 1, section: 'A', text: 'म आफूलाई अरूभन्दा कम capable मान्छु' },
  { idx: 2, section: 'A', text: 'म ठूलो success achieve गर्न सक्दिन जस्तो लाग्छ' },
  { idx: 3, section: 'A', text: 'म आफ्नो decision मा doubt गर्छु' },
  { idx: 4, section: 'A', text: 'म आफ्नो potential fully use गर्न सक्दिन' },
  { idx: 5, section: 'A', text: 'म challenge बाट avoid गर्छु' },

  { idx: 6, section: 'B', text: 'म failure को डरले action लिन ढिलो गर्छु' },
  { idx: 7, section: 'B', text: 'म risk लिन डराउँछु' },
  { idx: 8, section: 'B', text: 'म अरूको judgement बाट डराउँछु' },
  { idx: 9, section: 'B', text: 'म गल्ती हुनबाट बच्न धेरै सोचिरहन्छु' },
  { idx: 10, section: 'B', text: 'म नयाँ opportunity लिन hesitate गर्छु' },

  { idx: 11, section: 'C', text: 'पैसा कमाउन धेरै गाह्रो हुन्छ भन्ने लाग्छ' },
  { idx: 12, section: 'C', text: 'म ठूलो income deserve गर्दिन भन्ने लाग्छ' },
  { idx: 13, section: 'C', text: 'पैसा कमाउँदा risk धेरै हुन्छ भन्ने लाग्छ' },
  { idx: 14, section: 'C', text: 'म financial growth मा limited छु भन्ने लाग्छ' },
  { idx: 15, section: 'C', text: 'म पैसा manage गर्न सक्दिन' },

  { idx: 16, section: 'D', text: 'म change गर्न गाह्रो हुन्छ भन्ने लाग्छ' },
  { idx: 17, section: 'D', text: 'म नयाँ skill सिक्न सक्दिन भन्ने लाग्छ' },
  { idx: 18, section: 'D', text: 'म comfort zone बाट बाहिर जान सक्दिन' },
  { idx: 19, section: 'D', text: 'म slow learner हुँ भन्ने लाग्छ' },
  { idx: 20, section: 'D', text: 'म life मा धेरै improve गर्न सक्दिन' },

  { idx: 21, section: 'E', text: 'म काम सुरु गर्न ढिलो गर्छु' },
  { idx: 22, section: 'E', text: 'म consistent रहन सक्दिन' },
  { idx: 23, section: 'E', text: 'म discipline maintain गर्न सक्दिन' },
  { idx: 24, section: 'E', text: 'म काम पूरा गर्न गाह्रो हुन्छ' },
  { idx: 25, section: 'E', text: 'म motivation बिना action लिन सक्दिन' },
];

export default function LimitingBeliefCheck({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const totalQuestions = 25;
  const maxScore = 125;

  const [answers, setAnswers] = useState<Record<number, Rating>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<LimitingBeliefResult | null>(null);

  const isComplete = useMemo(() => Object.keys(answers).length === totalQuestions, [answers]);

  const totalScore = useMemo(() => {
    return STATEMENTS.reduce((sum, s) => sum + (answers[s.idx] ?? 0), 0);
  }, [answers]);

  const submit = () => {
    if (!isComplete) return;
    const r = buildResult(totalScore);
    setResult(r);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

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
          <div className="text-xs text-[var(--muted-foreground)]">
            Strong (100–125), Moderate (75–99), Awareness (50–74), Low (&lt; 50)
          </div>
          <div className="pt-1">
            <Button variant="outline" onClick={reset}>
              Retake Test
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {STATEMENTS.map((s, i) => {
          const sectionLabel =
            s.section === 'A'
              ? 'SECTION A – Self-Limitation Belief'
              : s.section === 'B'
                ? 'SECTION B – Fear-Based Belief'
                : s.section === 'C'
                  ? 'SECTION C – Money Limiting Belief'
                  : s.section === 'D'
                    ? 'SECTION D – Growth Limiting Belief'
                    : 'SECTION E – Action Limiting Belief';

          // Show section header only at the first question of that section.
          const showSectionHeader = s.idx === 1 || s.idx === 6 || s.idx === 11 || s.idx === 16 || s.idx === 21;

          const current = answers[s.idx] ?? null;

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

          return (
            <div
              key={s.idx}
              className={[
                'border-t border-[var(--border)]/60 pt-4',
                i === 0 ? 'border-t-0 pt-0' : '',
              ].join(' ')}
            >
              {showSectionHeader && (
                <div className="text-xs font-semibold text-[var(--primary-700)] mb-2">{sectionLabel}</div>
              )}

              <div className="text-sm font-medium text-[var(--foreground)] mb-2 leading-snug">
                {s.idx}. {s.text}
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
                        name={`q-${s.idx}`}
                        value={o.value}
                        checked={checked}
                        disabled={submitted}
                        onChange={() => setAnswers((prev) => ({ ...prev, [s.idx]: o.value }))}
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
          Score range: 1–5 for each statement. Total marks: {totalQuestions * 5} / {maxScore}.
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

