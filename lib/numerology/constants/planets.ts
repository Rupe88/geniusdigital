export const PLANET_NAMES: Record<number, string> = {
  1: 'Sun',
  2: 'Moon',
  3: 'Jupiter',
  4: 'Rahu',
  5: 'Mercury',
  6: 'Venus',
  7: 'Ketu',
  8: 'Saturn',
  9: 'Mars',
};

export function getPlanetName(n: number): string {
  return PLANET_NAMES[n] ?? String(n);
}

