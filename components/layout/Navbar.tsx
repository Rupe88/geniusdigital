'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ROUTES } from '@/lib/utils/constants';
import { generateBreadcrumbs, shouldShowBreadcrumbs } from '@/lib/utils/breadcrumbs';
import { HiUser, HiLogout, HiCog, HiChevronDown, HiHome, HiAcademicCap, HiCalendar, HiPhotograph, HiCash, HiDotsHorizontal } from 'react-icons/hi';

export const Navbar: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const navItems = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Consultation', href: ROUTES.CONSULTATION },
    { label: 'Courses', href: ROUTES.COURSES },
    { label: 'Vastu Product', href: ROUTES.VASTU_PRODUCT },
  ];

  const moreMenuItems = [
    { label: 'Events', href: ROUTES.EVENTS },
    { label: 'Blogs', href: ROUTES.BLOGS },
    { label: 'Gallery', href: ROUTES.GALLERY },
  ];

  const isActive = (href: string) => {
    // Home route should match exactly
    if (href === ROUTES.HOME) {
      return pathname === ROUTES.HOME;
    }
    // Other routes match exactly or if pathname starts with the route
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isMoreMenuActive = () => {
    return moreMenuItems.some((item) => isActive(item.href));
  };

  // Generate breadcrumbs
  const showBreadcrumbs = shouldShowBreadcrumbs(pathname);
  const breadcrumbs = showBreadcrumbs ? generateBreadcrumbs(pathname) : [];

  // Close desktop More dropdown when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileMoreOpen(false);
  }, [pathname]);

  const bottomNavItems = [
    { label: 'Home', href: ROUTES.HOME, icon: HiHome },
    { label: 'Courses', href: ROUTES.COURSES, icon: HiAcademicCap },
    { label: 'Events', href: ROUTES.EVENTS, icon: HiCalendar },
    { label: 'More', icon: HiDotsHorizontal, isMore: true },
  ];

  const mobileMoreMenuItems = [
    { label: 'Gallery', href: ROUTES.GALLERY, icon: HiPhotograph },
    { label: 'Affiliate', href: ROUTES.AFFILIATE, icon: HiCash },
    {
      label: isAuthenticated ? (user?.role === 'ADMIN' ? 'Admin Panel' : 'Account') : 'Login',
      href: isAuthenticated ? (user?.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD) : ROUTES.LOGIN,
      icon: HiUser,
    },
  ];

  return (
    <>
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 lg:h-20">
          {/* Logo - Left (on mobile smaller, no hamburger) */}
          <Link href={ROUTES.HOME} className="flex items-center flex-shrink-0">
            <div className="relative w-10 h-10 lg:w-16 lg:h-16">
              <Image
                src="/sanskar-academy-logo.jpeg"
                alt="Sanskar Academy"
                fill
                className="object-contain rounded-none"
                sizes="(max-width: 768px) 40px, 64px"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1 lg:space-x-6 xl:space-x-8">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors font-sm text-base whitespace-nowrap ${
                    active
                      ? 'text-[var(--primary-700)]'
                      : 'text-gray-700 hover:text-[var(--primary-700)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1 transition-colors font-normal text-base whitespace-nowrap ${
                  isMoreMenuActive() || isMoreMenuOpen
                    ? 'text-[var(--primary-700)]'
                    : 'text-gray-700 hover:text-[var(--primary-700)]'
                }`}
              >
                <span>More</span>
                <HiChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isMoreMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-none shadow-lg py-1 z-50 border border-gray-200">
                  {moreMenuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                          className={`block px-4 py-2 text-sm whitespace-nowrap ${
                            active
                              ? 'text-[var(--primary-700)] bg-[var(--primary-50)]'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        onClick={() => setIsMoreMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Affiliate Program - right of More */}
            <Link
              href={ROUTES.AFFILIATE}
              className={`transition-colors font-normal text-base whitespace-nowrap ${
                isActive(ROUTES.AFFILIATE)
                  ? 'text-[var(--primary-700)]'
                  : 'text-gray-700 hover:text-[var(--primary-700)]'
              }`}
            >
              Affiliate Program
            </Link>
          </div>

          {/* Right Section - Auth */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3 ml-auto flex-shrink-0">
            {/* Auth buttons / user menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[var(--primary-700)] transition-colors"
                >
                  <HiUser className="h-5 w-5" />
                  <span className="hidden xl:inline">{user?.fullName || 'User'}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-none shadow-lg py-1 z-50 border border-gray-200">
                    {user?.role === 'ADMIN' ? (
                      <>
                        <Link
                          href={ROUTES.ADMIN}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <HiCog className="inline mr-2" />
                          Admin Panel
                        </Link>
                        <Link
                          href="/admin/referrals"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          📊 Referral Admin
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={ROUTES.DASHBOARD}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <HiCog className="inline mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/referrals"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          💰 My Referrals
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <HiLogout className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={ROUTES.LOGIN}>
                  <button className="px-4 py-2 text-sm font-medium text-[var(--primary-700)] bg-white border border-[var(--primary-700)] rounded hover:bg-[var(--primary-50)] transition-colors whitespace-nowrap">
                    Login
                  </button>
                </Link>
                <Link href={ROUTES.REGISTER}>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary-700)] rounded hover:bg-[var(--primary-800)] transition-colors whitespace-nowrap">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: no hamburger - navigation is in bottom bar */}
        </div>
      </div>

      {/* Breadcrumbs - desktop only on mobile to save space */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <div className="hidden lg:block border-t border-gray-200 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center py-3 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.href}-${index}`}>
                  {index > 0 && (
                    <span className="mx-2 text-gray-400" aria-hidden="true">
                      &gt;
                    </span>
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-900 hover:text-[var(--primary-700)] transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      )}
    </nav>

      {/* Mobile: Fixed bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            if ('isMore' in item && item.isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setIsMobileMoreOpen((prev) => !prev)}
                  className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 gap-0.5 transition-colors ${
                    isMobileMoreOpen ? 'text-[var(--primary-700)]' : 'text-gray-500'
                  }`}
                  aria-expanded={isMobileMoreOpen}
                  aria-haspopup="true"
                >
                  <HiDotsHorizontal className="w-6 h-6 flex-shrink-0" />
                  <span className="text-[10px] font-medium truncate max-w-full px-0.5">
                    More
                  </span>
                </button>
              );
            }
            const href = (('href' in item ? item.href : undefined) ?? '') as string;
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 gap-0.5 transition-colors ${
                  active ? 'text-[var(--primary-700)]' : 'text-gray-500'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Mobile More menu overlay + panel */}
        {isMobileMoreOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
              aria-hidden="true"
              onClick={() => setIsMobileMoreOpen(false)}
            />
            <div
              className="fixed bottom-16 left-2 right-2 z-[61] bg-white rounded-lg shadow-lg border border-gray-200 py-2 lg:hidden"
              role="menu"
            >
              {mobileMoreMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`flex items-center gap-3 px-4 py-3 text-sm ${
                      active ? 'text-[var(--primary-700)] bg-[var(--primary-50)]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMoreOpen(false)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </>
  );
};

