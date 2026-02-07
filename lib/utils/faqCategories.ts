/**
 * FAQ Category Constants
 * 
 * Centralized definitions for FAQ categories.
 * These match the FAQCategory enum in the backend Prisma schema.
 * 
 * To add/remove categories:
 * 1. Update the enum in vaastu-backend/prisma/schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Update this file
 * 4. Update any hardcoded references in components
 */

export const FAQ_CATEGORIES = {
  GENERAL: 'GENERAL',
  COURSES: 'COURSES',
  PAYMENTS: 'PAYMENTS',
  ENROLLMENT: 'ENROLLMENT',
  TECHNICAL: 'TECHNICAL',
  OTHER: 'OTHER',
} as const;

export type FAQCategory = typeof FAQ_CATEGORIES[keyof typeof FAQ_CATEGORIES];

/**
 * Display names for FAQ categories
 */
export const FAQ_CATEGORY_DISPLAY_NAMES: Record<FAQCategory, string> = {
  [FAQ_CATEGORIES.GENERAL]: 'General',
  [FAQ_CATEGORIES.COURSES]: 'Courses & Learning',
  [FAQ_CATEGORIES.PAYMENTS]: 'Payments & Pricing',
  [FAQ_CATEGORIES.ENROLLMENT]: 'Enrollment & Registration',
  [FAQ_CATEGORIES.TECHNICAL]: 'Technical Support',
  [FAQ_CATEGORIES.OTHER]: 'Other',
};

/**
 * All FAQ categories as an array
 */
export const ALL_FAQ_CATEGORIES: FAQCategory[] = [
  FAQ_CATEGORIES.GENERAL,
  FAQ_CATEGORIES.COURSES,
  FAQ_CATEGORIES.PAYMENTS,
  FAQ_CATEGORIES.ENROLLMENT,
  FAQ_CATEGORIES.TECHNICAL,
  FAQ_CATEGORIES.OTHER,
];

/**
 * Get display name for a category
 */
export const getFAQCategoryDisplayName = (category: string | null | undefined): string => {
  if (!category) return 'Uncategorized';
  return FAQ_CATEGORY_DISPLAY_NAMES[category as FAQCategory] || category;
};

/**
 * Get category options for Select dropdowns
 */
export const getFAQCategoryOptions = () => {
  return ALL_FAQ_CATEGORIES.map((category) => ({
    value: category,
    label: FAQ_CATEGORY_DISPLAY_NAMES[category],
  }));
};
