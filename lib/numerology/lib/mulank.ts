export interface MulankResult {
  firstTwoDigitSum: number | null;
  final: number;
}

function reduceAndCaptureFirstTwoDigit(n: number): { firstTwoDigitSum: number | null; final: number } {
  const firstTwoDigitSum: number | null = n >= 10 ? n : null;
  let current = n;
  while (current >= 10) {
    const digits = String(current).split('').map(Number);
    current = digits.reduce((a, b) => a + b, 0);
  }
  return { firstTwoDigitSum, final: current };
}

export function calculateMulank(day: number): MulankResult | null {
  if (day < 1 || day > 31) return null;
  if (day < 10) return { firstTwoDigitSum: null, final: day };
  return reduceAndCaptureFirstTwoDigit(day);
}

