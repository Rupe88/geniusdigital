import { getChaldeanValue } from '../constants/chaldean';

export interface ChaldeanResult {
  firstTwoDigitSum: number | null;
  final: number;
  rawSum: number;
}

function reduceAndCaptureFirstTwoDigit(sum: number): {
  firstTwoDigitSum: number | null;
  final: number;
  rawSum: number;
} {
  const firstTwoDigitSum: number | null = sum >= 10 ? sum : null;
  let current = sum;
  while (current >= 10) {
    const digits = String(current).split('').map(Number);
    current = digits.reduce((a, b) => a + b, 0);
  }
  return { firstTwoDigitSum, final: current, rawSum: sum };
}

export function calculateChaldean(input: string): ChaldeanResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let sum = 0;
  for (const char of trimmed) {
    if (/[A-Za-z]/.test(char)) {
      const v = getChaldeanValue(char.toUpperCase());
      if (v !== undefined) sum += v;
    } else if (/[0-9]/.test(char)) {
      sum += parseInt(char, 10);
    }
  }
  if (sum === 0) return null;
  return reduceAndCaptureFirstTwoDigit(sum);
}

