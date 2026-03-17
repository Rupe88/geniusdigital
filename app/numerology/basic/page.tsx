'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResultBadges } from '@/components/numerology/ResultBadges';
import { CalculatingView } from '@/components/numerology/CalculatingView';
import { calculatePythagorean } from '@/lib/numerology/lib/pythagorean';
import { calculateChaldean } from '@/lib/numerology/lib/chaldean';
import { calculateMulank } from '@/lib/numerology/lib/mulank';
import { calculateBhagyank } from '@/lib/numerology/lib/bhagyank';
import { getPlanetName } from '@/lib/numerology/constants/planets';
import { validateDob, adToBSDate, bsToADDate } from '@/lib/numerology/lib/dateValidation';
import { getNumberDetail } from '@/lib/numerology/constants/numberDetails';

function parseNum(s: string): number | null {
  const n = parseInt(s.trim(), 10);
  return Number.isNaN(n) ? null : n;
}

type NumberDetailSource = 'pythagorean' | 'chaldean' | 'mulank' | 'bhagyank';

export default function NumerologyBasicPage() {
  const router = useRouter();
  const [nameOrNumber, setNameOrNumber] = useState('');

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [calendarType, setCalendarType] = useState<'AD' | 'BS'>('AD');
  const [showPythagorean, setShowPythagorean] = useState(true);

  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const pythagoreanResult = useMemo(
    () => (nameOrNumber.trim() ? calculatePythagorean(nameOrNumber) : null),
    [nameOrNumber]
  );
  const chaldeanResult = useMemo(
    () => (nameOrNumber.trim() ? calculateChaldean(nameOrNumber) : null),
    [nameOrNumber]
  );

  const d = parseNum(day);
  const m = parseNum(month);
  const y = parseNum(year);
  const dobValidation = useMemo(() => validateDob(d, m, y, calendarType), [d, m, y, calendarType]);
  const hasValidDob = dobValidation.valid;
  const dobError =
    !hasValidDob && (day !== '' || month !== '' || year !== '')
      ? (dobValidation as { valid: false; error: string }).error
      : null;

  const adDay = hasValidDob ? (dobValidation as any).day : null;
  const adMonth = hasValidDob ? (dobValidation as any).month : null;
  const adYear = hasValidDob ? (dobValidation as any).year : null;

  const calcDay = calendarType === 'AD' ? adDay : d;
  const calcMonth = calendarType === 'AD' ? adMonth : m;
  const calcYear = calendarType === 'AD' ? adYear : y;

  const mulankResult = useMemo(
    () => (hasValidDob && calcDay != null ? calculateMulank(calcDay) : null),
    [hasValidDob, calcDay]
  );
  const bhagyankResult = useMemo(
    () =>
      hasValidDob && calcDay != null && calcMonth != null && calcYear != null
        ? calculateBhagyank(calcDay, calcMonth, calcYear)
        : null,
    [hasValidDob, calcDay, calcMonth, calcYear]
  );

  const nameResult = showPythagorean ? pythagoreanResult : chaldeanResult;
  const nameLabel = showPythagorean ? 'Pythagorean Numerology' : 'Chaldean Numerology';

  const hasNameResult = !hasValidDob && nameResult !== null;
  const hasDobResult = hasValidDob && mulankResult !== null && bhagyankResult !== null;
  const hasAnyResult = hasNameResult || hasDobResult;

  const resultKey = hasValidDob
    ? `dob-${calendarType}-${calcDay}-${calcMonth}-${calcYear}`
    : `name-${showPythagorean}-${nameResult?.final ?? ''}`;

  const [displayedKey, setDisplayedKey] = useState<string | null>(null);
  const isCalculating = hasAnyResult && resultKey !== displayedKey;

  useEffect(() => {
    if (!hasAnyResult) {
      setDisplayedKey(null);
      return;
    }
    if (resultKey === displayedKey) return;
    const t = setTimeout(() => setDisplayedKey(resultKey), 500);
    return () => clearTimeout(t);
  }, [hasAnyResult, displayedKey, resultKey]);

  const handleCalendarTypeChange = (newType: 'AD' | 'BS') => {
    if (newType === calendarType) return;
    if (d == null || m == null || y == null) {
      setCalendarType(newType);
      return;
    }
    if (newType === 'BS') {
      const adValidation = validateDob(d, m, y, 'AD');
      if (adValidation.valid) {
        const bs = adToBSDate(adValidation.day, adValidation.month, adValidation.year);
        if (bs) {
          setDay(String(bs.day));
          setMonth(String(bs.month));
          setYear(String(bs.year));
        }
      }
    } else {
      const ad = bsToADDate(d, m, y);
      if (ad) {
        setDay(String(ad.day));
        setMonth(String(ad.month));
        setYear(String(ad.year));
      }
    }
    setCalendarType(newType);
  };

  const clearDate = () => {
    setDay('');
    setMonth('');
    setYear('');
  };

  const handleDayChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setDay(digits);
    if (digits.length === 2) monthRef.current?.focus();
  };
  const handleMonthChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setMonth(digits);
    if (digits.length === 2) yearRef.current?.focus();
  };
  const handleYearChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setYear(digits);
  };

  const goDetail = (num: number, source: NumberDetailSource) => {
    router.push(`/numerology/number/${num}?source=${encodeURIComponent(source)}`);
  };

  const handleViewDobReport = () => {
    if (!hasValidDob) return;
    // Open a detailed report page so users see full details.
    // Prefer Bhagyank as the primary life-path style number.
    if (bhagyankResult) {
      goDetail(bhagyankResult.final, 'bhagyank');
    } else if (mulankResult) {
      goDetail(mulankResult.final, 'mulank');
    }
  };

  const mulankDetail = useMemo(
    () => (mulankResult ? getNumberDetail(mulankResult.final) : null),
    [mulankResult]
  );
  const bhagyankDetail = useMemo(
    () => (bhagyankResult ? getNumberDetail(bhagyankResult.final) : null),
    [bhagyankResult]
  );
  const nameDetail = useMemo(() => (nameResult ? getNumberDetail(nameResult.final) : null), [nameResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold tracking-wider text-slate-700 mb-2">
            Name or Number
          </label>
          <input
            value={nameOrNumber}
            onChange={(e) => setNameOrNumber(e.target.value)}
            placeholder="e.g. Sanskar Academy"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-black outline-none focus:border-[var(--primary-300)]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold tracking-wider text-slate-700">
              Date of Birth
            </label>
            <button
              type="button"
              onClick={clearDate}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Reset
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleCalendarTypeChange('AD')}
              className={`flex-1 py-2.5 rounded-md font-semibold ${
                calendarType === 'AD' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              AD
            </button>
            <button
              type="button"
              onClick={() => handleCalendarTypeChange('BS')}
              className={`flex-1 py-2.5 rounded-md font-semibold ${
                calendarType === 'BS' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              BS
            </button>
          </div>

          {dobError ? <div className="text-sm font-semibold text-[var(--primary-700)] mb-2">{dobError}</div> : null}

          <div className="grid grid-cols-3 gap-2">
            <input
              value={day}
              onChange={(e) => handleDayChange(e.target.value)}
              placeholder="DD"
              inputMode="numeric"
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-black text-center outline-none focus:border-[var(--primary-300)]"
            />
            <input
              ref={monthRef}
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              placeholder="MM"
              inputMode="numeric"
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-black text-center outline-none focus:border-[var(--primary-300)]"
            />
            <input
              ref={yearRef}
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              placeholder="YYYY"
              inputMode="numeric"
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-black text-center outline-none focus:border-[var(--primary-300)]"
            />
          </div>
        </div>

        {!hasValidDob && (
          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold tracking-wider text-slate-700">{nameLabel}</div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1 bg-slate-50 w-fit mb-4">
              <button
                type="button"
                onClick={() => setShowPythagorean(true)}
                aria-pressed={showPythagorean}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  showPythagorean
                    ? 'bg-[var(--primary-600)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Pythagorean
              </button>
              <button
                type="button"
                onClick={() => setShowPythagorean(false)}
                aria-pressed={!showPythagorean}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  !showPythagorean
                    ? 'bg-[var(--primary-600)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Chaldean
              </button>
            </div>

            {!nameResult ? (
              <p className="text-slate-500 text-sm">
                Enter a name or number above to see your result here.
              </p>
            ) : isCalculating ? (
              <CalculatingView message="Calculating your number..." />
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="text-[var(--primary-700)] font-extrabold text-3xl">
                  {getPlanetName(nameResult.final)}
                </div>
                <ResultBadges
                  firstTwoDigitSum={nameResult.firstTwoDigitSum}
                  final={nameResult.final}
                  sumDisplayValue={nameResult.rawSum}
                  size="hero"
                  onPressFinal={(num) => goDetail(num, showPythagorean ? 'pythagorean' : 'chaldean')}
                  onPressSum={(num) => goDetail(num, showPythagorean ? 'pythagorean' : 'chaldean')}
                />

                {nameDetail ? (
                  <div className="pt-4 text-left space-y-3">
                    <div className="grid gap-2 text-sm text-slate-700">
                      <div>
                        <span className="font-bold">Ruling Planet:</span> {nameDetail.rulingPlanet}
                      </div>
                      <div>
                        <span className="font-bold">Good:</span> {nameDetail.good}
                      </div>
                      <div>
                        <span className="font-bold">Bad:</span> {nameDetail.bad}
                      </div>
                      <div>
                        <span className="font-bold">Famous Personalities:</span>{' '}
                        {nameDetail.famousPersonalities}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 mb-2">Description</div>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {nameDetail.description.map((line, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="mt-1">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mulank & Bhagyank appear when DOB is valid.
            </p>
          </div>
        </div>

        {hasValidDob ? (
          isCalculating ? (
            <CalculatingView message="Calculating Mulank & Bhagyank..." />
          ) : (
            <div className="divide-y divide-slate-100">
              {mulankResult && (
                <div className="p-6 text-center space-y-3">
                  <div className="text-slate-600 font-bold text-sm tracking-wide uppercase">Mulank</div>
                  <div className="text-[var(--primary-700)] font-extrabold text-2xl">
                    {getPlanetName(mulankResult.final)}
                  </div>
                  <ResultBadges
                    firstTwoDigitSum={mulankResult.firstTwoDigitSum}
                    final={mulankResult.final}
                    size="large"
                    onPressFinal={(num) => goDetail(num, 'mulank')}
                  />

                  {mulankDetail ? (
                    <div className="pt-4 text-left space-y-3">
                      <div className="grid gap-2 text-sm text-slate-700">
                        <div>
                          <span className="font-bold">Ruling Planet:</span> {mulankDetail.rulingPlanet}
                        </div>
                        <div>
                          <span className="font-bold">Good:</span> {mulankDetail.good}
                        </div>
                        <div>
                          <span className="font-bold">Bad:</span> {mulankDetail.bad}
                        </div>
                        <div>
                          <span className="font-bold">Famous Personalities:</span>{' '}
                          {mulankDetail.famousPersonalities}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 mb-2">Description</div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {mulankDetail.description.map((line, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-1">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {bhagyankResult && (
                <div className="p-6 text-center space-y-3">
                  <div className="text-slate-600 font-bold text-sm tracking-wide uppercase">Bhagyank</div>
                  <div className="text-[var(--primary-700)] font-extrabold text-2xl">
                    {getPlanetName(bhagyankResult.final)}
                  </div>
                  <ResultBadges
                    firstTwoDigitSum={bhagyankResult.firstTwoDigitSum}
                    final={bhagyankResult.final}
                    size="large"
                    onPressFinal={(num) => goDetail(num, 'bhagyank')}
                    onPressSum={(num) => goDetail(num, 'bhagyank')}
                  />

                  {bhagyankDetail ? (
                    <div className="pt-4 text-left space-y-3">
                      <div className="grid gap-2 text-sm text-slate-700">
                        <div>
                          <span className="font-bold">Ruling Planet:</span> {bhagyankDetail.rulingPlanet}
                        </div>
                        <div>
                          <span className="font-bold">Good:</span> {bhagyankDetail.good}
                        </div>
                        <div>
                          <span className="font-bold">Bad:</span> {bhagyankDetail.bad}
                        </div>
                        <div>
                          <span className="font-bold">Famous Personalities:</span>{' '}
                          {bhagyankDetail.famousPersonalities}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 mb-2">Description</div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {bhagyankDetail.description.map((line, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-1">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )
        ) : nameResult && nameDetail ? (
          isCalculating ? (
            <CalculatingView message="Calculating your number..." />
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Final */}
              <div className="p-6 text-center space-y-3">
                <div className="text-slate-600 font-bold text-sm tracking-wide uppercase">Final</div>
                <div className="text-[var(--primary-700)] font-extrabold text-2xl">
                  {getPlanetName(nameResult.final)}
                </div>
                <ResultBadges
                  firstTwoDigitSum={nameResult.firstTwoDigitSum}
                  final={nameResult.final}
                  size="large"
                  onPressFinal={(num) => goDetail(num, showPythagorean ? 'pythagorean' : 'chaldean')}
                />
              </div>

              {/* Sum (show only if we have it) */}
              {nameResult.firstTwoDigitSum ? (
                <div className="p-6 text-center space-y-3">
                  <div className="text-slate-600 font-bold text-sm tracking-wide uppercase">Sum</div>
                  <div className="text-[var(--primary-700)] font-extrabold text-2xl">
                    {getPlanetName(nameResult.firstTwoDigitSum)}
                  </div>
                  <ResultBadges
                    firstTwoDigitSum={null}
                    final={nameResult.firstTwoDigitSum}
                    size="large"
                    onPressFinal={(num) => goDetail(num, showPythagorean ? 'pythagorean' : 'chaldean')}
                  />
                </div>
              ) : null}

              {/* Report */}
              <div className="p-6 text-left space-y-3">
                <div className="grid gap-2 text-sm text-slate-700">
                  <div>
                    <span className="font-bold">Ruling Planet:</span> {nameDetail.rulingPlanet}
                  </div>
                  <div>
                    <span className="font-bold">Good:</span> {nameDetail.good}
                  </div>
                  <div>
                    <span className="font-bold">Bad:</span> {nameDetail.bad}
                  </div>
                  <div>
                    <span className="font-bold">Famous Personalities:</span> {nameDetail.famousPersonalities}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Description</div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {nameDetail.description.map((line, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="p-6 text-sm text-slate-500">
            Enter a valid DOB (AD or BS) or a name/number to see results here.
          </div>
        )}
      </div>
    </div>
  );
}

