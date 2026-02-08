import { ROUTES } from './constants';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Route to label mapping for breadcrumbs
 */
const routeLabels: Record<string, string> = {
  [ROUTES.COURSES]: 'All Courses',
  [ROUTES.CONSULTATION]: 'Consultation',
  [ROUTES.VASTU_PRODUCT]: 'Vastu Product',
  [ROUTES.EVENTS]: 'Events',
  [ROUTES.BLOGS]: 'Blogs',
  [ROUTES.BLOG]: 'Blogs',
  [ROUTES.GALLERY]: 'Gallery',
  [ROUTES.CONTACT]: 'Contact',
  [ROUTES.LIVE_CLASSES]: 'Live Classes',
};

/**
 * Check if breadcrumbs should be shown for a given pathname
 */
export function shouldShowBreadcrumbs(pathname: string | null): boolean {
  if (!pathname) return false;

  // Don't show on landing page
  if (pathname === ROUTES.HOME) return false;

  // Don't show on auth pages
  if (
    pathname.startsWith(ROUTES.LOGIN) ||
    pathname.startsWith(ROUTES.REGISTER) ||
    pathname.startsWith(ROUTES.FORGOT_PASSWORD) ||
    pathname.startsWith(ROUTES.RESET_PASSWORD)
  ) {
    return false;
  }

  // Don't show on dashboard or admin pages
  if (pathname.startsWith(ROUTES.DASHBOARD) || pathname.startsWith(ROUTES.ADMIN)) {
    return false;
  }

  // Don't show on payment pages
  if (pathname.startsWith('/payment')) {
    return false;
  }

  // Show on all other marketing pages
  return true;
}

/**
 * Generate breadcrumb items from pathname
 */
export function generateBreadcrumbs(pathname: string | null): BreadcrumbItem[] {
  if (!pathname) return [];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: ROUTES.HOME },
  ];

  // Remove leading slash and split path into segments
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return breadcrumbs;
  }

  // Build path incrementally to handle nested routes
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Check if this is a dynamic route segment (UUID, slug, etc.)
    const isDynamicSegment = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
      (segment.length > 20 && !routeLabels[currentPath]); // Likely a slug or ID if not in routeLabels

    if (isDynamicSegment) {
      // For dynamic segments, we don't add them to breadcrumbs
      // The parent route label should have been added in the previous iteration
      continue;
    }

    // Get label for this route
    const label = routeLabels[currentPath] || formatLabel(segment);

    // Add the breadcrumb if we have a valid label
    if (label) {
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Format a route segment into a readable label
 */
function formatLabel(segment: string): string {
  // Convert kebab-case or snake_case to Title Case
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
