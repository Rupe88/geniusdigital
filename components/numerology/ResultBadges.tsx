'use client';

import React from 'react';

interface ResultBadgesProps {
  firstTwoDigitSum: number | null;
  final: number;
  sumDisplayValue?: number | null;
  size?: 'default' | 'large' | 'hero';
  onPressFinal?: (num: number) => void;
  onPressSum?: (num: number) => void;
}

export function ResultBadges({
  firstTwoDigitSum,
  final,
  sumDisplayValue,
  size = 'default',
  onPressFinal,
  onPressSum,
}: ResultBadgesProps) {
  const showSumValue = firstTwoDigitSum ?? sumDisplayValue ?? null;
  const hasSumCircle = showSumValue !== null;

  const mainSize =
    size === 'hero' ? 'h-44 w-44 sm:h-52 sm:w-52' : size === 'large' ? 'h-24 w-24' : 'h-14 w-14';
  const finalText =
    size === 'hero' ? 'text-5xl sm:text-6xl' : size === 'large' ? 'text-3xl' : 'text-xl';
  const sumSize = size === 'hero' ? 'h-16 w-16 sm:h-20 sm:w-20' : size === 'large' ? 'h-14 w-14' : 'h-10 w-10';

  const Main = (
    <div className={`relative ${mainSize} rounded-full bg-[var(--primary-700)] text-white flex items-center justify-center`}>
      <div className={`font-extrabold ${finalText}`}>{final}</div>

      {hasSumCircle && showSumValue !== null && (
        <button
          type="button"
          onClick={onPressSum ? () => onPressSum(showSumValue) : undefined}
          className={`absolute -right-3 -bottom-3 ${sumSize} rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ${
            onPressSum ? 'hover:brightness-105 active:scale-95 transition-transform' : ''
          }`}
          disabled={!onPressSum}
          aria-label="Sum detail"
        >
          <span className="text-xs sm:text-sm font-bold">Σ {showSumValue}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-center">
      {onPressFinal ? (
        <button
          type="button"
          onClick={() => onPressFinal(final)}
          className="outline-none focus:ring-2 focus:ring-[var(--primary-300)] rounded-full"
          aria-label="Number detail"
        >
          {Main}
        </button>
      ) : (
        Main
      )}
    </div>
  );
}

