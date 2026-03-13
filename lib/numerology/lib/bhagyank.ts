export interface BhagyankResult {
  firstTwoDigitSum: number | null;
  final: number;
}

function getDigits(day: number, month: number, year: number): number[] {
  const parts = [day, month, year];
  const digits: number[] = [];
  for (const p of parts) {
    for (const d of String(p).split('')) {
      const n = parseInt(d, 10);
      if (!isNaN(n)) digits.push(n);
    }
  }
  return digits;
}

function reduceAndCaptureFirstTwoDigit(sum: number): { firstTwoDigitSum: number | null; final: number } {
  const firstTwoDigitSum: number | null = sum >= 10 ? sum : null;
  let current = sum;
  while (current >= 10) {
    const digits = String(current).split('').map(Number);
    current = digits.reduce((a, b) => a + b, 0);
  }
  return { firstTwoDigitSum, final: current };
}

export function calculateBhagyank(day: number, month: number, year: number): BhagyankResult | null {
  const digits = getDigits(day, month, year);
  if (digits.length === 0) return null;
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceAndCaptureFirstTwoDigit(sum);
}

