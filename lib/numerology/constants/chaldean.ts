const CHALDEAN_MAP: Record<string, number> = {};
const PAIRS: [string[], number][] = [
  [['A', 'I', 'J', 'Q', 'Y'], 1],
  [['B', 'K', 'R'], 2],
  [['C', 'G', 'L', 'S'], 3],
  [['D', 'M', 'T'], 4],
  [['E', 'H', 'N', 'X'], 5],
  [['U', 'V', 'W'], 6],
  [['O', 'Z'], 7],
  [['F', 'P'], 8],
];

PAIRS.forEach(([letters, num]) => {
  letters.forEach((c) => {
    CHALDEAN_MAP[c] = num;
  });
});

export function getChaldeanValue(letter: string): number | undefined {
  const upper = letter.toUpperCase();
  return CHALDEAN_MAP[upper];
}

export function getChaldeanMap(): Record<string, number> {
  return { ...CHALDEAN_MAP };
}

