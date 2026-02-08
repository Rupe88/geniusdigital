'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ROUTES } from '@/lib/utils/constants';
import { generateBreadcrumbs, shouldShowBreadcrumbs } from '@/lib/utils/breadcrumbs';
import { HiMenu, HiX, HiUser, HiLogout, HiCog, HiChevronDown } from 'react-icons/hi';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMoreOpen(false);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo - Left */}
          <Link href={ROUTES.HOME} className="flex items-center flex-shrink-0">
            <div className="relative w-12 h-12 md:w-16 md:h-16">
              <Image
                src="/sanskar-academy-logo.jpeg"
                alt="Sanskar Academy"
                fill
                className="object-contain rounded-none"
                sizes="(max-width: 768px) 48px, 64px"
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
                  className={`transition-colors font-medium text-base whitespace-nowrap ${
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
                className={`flex items-center gap-1 transition-colors font-medium text-base whitespace-nowrap ${
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
                    {user?.role === 'ADMIN' && (
                      <>
                        <Link
                          href={ROUTES.ADMIN}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
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

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-700 p-2 ml-auto"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-t border-gray-200 border-b border-gray-200">
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

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-none font-medium ${
                    active
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile More section */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2 rounded-none font-medium text-gray-700 hover:bg-gray-50"
              >
                <span>More</span>
                <HiChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isMobileMoreOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMobileMoreOpen && (
                <div className="mt-1 space-y-1 pl-4">
                  {moreMenuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2 rounded-none text-sm ${
                          active
                            ? 'text-red-600 bg-red-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileMoreOpen(false);
                        }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-none"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href={ROUTES.ADMIN}
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-none"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-none"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-2 space-y-2">
                <Link
                  href={ROUTES.LOGIN}
                  className="block px-3 py-2 text-center text-sm font-medium text-[var(--primary-700)] bg-white border border-[var(--primary-700)] rounded hover:bg-[var(--primary-50)] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="block px-3 py-2 text-center text-sm font-medium text-white bg-[var(--primary-700)] rounded hover:bg-[var(--primary-800)] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

