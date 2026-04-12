/**
 * Paths where we skip session bootstrap / aggressive token refresh (login flows, OAuth callback).
 */
export function isAuthRoutePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/verify-otp') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/reset-password') ||
    pathname.includes('/oauth/callback')
  );
}
