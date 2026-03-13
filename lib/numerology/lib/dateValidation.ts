import { BSToAD, ADToBS } from 'bikram-sambat-js';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonthAD(month: number, year: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function isValidADDate(day: number, month: number, year: number): boolean {
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const maxDay = getDaysInMonthAD(month, year);
  return day <= maxDay;
}

export function isFutureDateAD(day: number, month: number, year: number): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  if (year > y) return true;
  if (year < y) return false;
  if (month > m) return true;
  if (month < m) return false;
  return day > d;
}

export interface ADDate {
  day: number;
  month: number;
  year: number;
}

export interface BSDate {
  day: number;
  month: number;
  year: number;
}

export function bsToADDate(day: number, month: number, year: number): ADDate | null {
  try {
    const bsStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const adStr = BSToAD(bsStr);
    if (!adStr || typeof adStr !== 'string') return null;
    const [y, m, d] = adStr.split('-').map(Number);
    if (!d || !m || !y) return null;
    return { day: d, month: m, year: y };
  } catch {
    return null;
  }
}

export function adToBSDate(day: number, month: number, year: number): BSDate | null {
  try {
    const adStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bsStr = ADToBS(adStr);
    if (!bsStr || typeof bsStr !== 'string') return null;
    const [y, m, d] = bsStr.split('-').map(Number);
    if (!d || !m || !y) return null;
    return { day: d, month: m, year: y };
  } catch {
    return null;
  }
}

export type DobValidationResult =
  | { valid: true; day: number; month: number; year: number }
  | { valid: false; error: string };

export function validateDob(
  day: number | null,
  month: number | null,
  year: number | null,
  calendarType: 'AD' | 'BS'
): DobValidationResult {
  if (day === null || month === null || year === null) {
    return { valid: false, error: 'Enter day, month and year.' };
  }
  if (day < 1 || day > 31) return { valid: false, error: 'Invalid day (1–31).' };
  if (month < 1 || month > 12) return { valid: false, error: 'Invalid month (1–12).' };
  if (year < 1970 || year > 2100) return { valid: false, error: 'Year must be between 1970 and 2100.' };

  if (calendarType === 'AD') {
    if (!isValidADDate(day, month, year)) {
      return { valid: false, error: 'Invalid date (check day for this month).' };
    }
    if (isFutureDateAD(day, month, year)) {
      return { valid: false, error: 'Date of birth cannot be in the future.' };
    }
    return { valid: true, day, month, year };
  }

  const ad = bsToADDate(day, month, year);
  if (!ad) {
    return { valid: false, error: 'Invalid BS date.' };
  }
  if (isFutureDateAD(ad.day, ad.month, ad.year)) {
    return { valid: false, error: 'Date of birth cannot be in the future.' };
  }
  return { valid: true, day: ad.day, month: ad.month, year: ad.year };
}

