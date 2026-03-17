'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';
import { ROUTES } from '@/lib/utils/constants';
import { generateBreadcrumbs, shouldShowBreadcrumbs } from '@/lib/utils/breadcrumbs';
import { HiUser, HiLogout, HiCog, HiChevronDown, HiHome, HiAcademicCap, HiCalendar, HiPhotograph, HiCash, HiDotsHorizontal, HiShoppingCart, HiMenu, HiX } from 'react-icons/hi';
import { getMyAffiliate } from '@/lib/api/affiliate';

export const Navbar: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [affiliateApproved, setAffiliateApproved] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, itemCount, total } = useCart();
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

  const handleNumerologyClick = () => {
    const target = '/numerology/basic';
    if (!isAuthenticated) {
      const redirectPath = target;
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    router.push(target);
  };

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
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Determine if current user is an approved affiliate (for showing My Referrals entry)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isAuthenticated) {
        setAffiliateApproved(false);
        return;
      }
      try {
        const me = await getMyAffiliate();
        if (!cancelled) setAffiliateApproved(me.status === 'APPROVED');
      } catch {
        if (!cancelled) setAffiliateApproved(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileNavOpen]);

  const bottomNavItems = [
    { label: 'Home', href: ROUTES.HOME, icon: HiHome },
    { label: 'Courses', href: ROUTES.COURSES, icon: HiAcademicCap },
    { label: 'Events', href: ROUTES.EVENTS, icon: HiCalendar },
    { label: 'More', icon: HiDotsHorizontal, isMore: true },
  ];

  const mobileMoreMenuItems = [
    { label: 'Gallery', href: ROUTES.GALLERY, icon: HiPhotograph },
    { label: 'Numerology', href: '/numerology/basic', icon: HiAcademicCap },
    { label: 'Vaastu', href: '/vaastu', icon: HiAcademicCap },
    { label: 'Become A Affiliate', href: ROUTES.AFFILIATE, icon: HiCash },
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

            {/* Calculator dropdown (hover) */}
            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 transition-colors font-normal text-base whitespace-nowrap ${
                  pathname === '/numerology' ||
                  pathname?.startsWith('/numerology/') ||
                  pathname === '/vaastu' ||
                  pathname?.startsWith('/vaastu/')
                    ? 'text-[var(--primary-700)]'
                    : 'text-gray-700 hover:text-[var(--primary-700)]'
                }`}
              >
                <span>Calculator</span>
                <HiChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>

              <div className="absolute left-0 mt-2 w-44 bg-white rounded-none shadow-lg py-1 z-50 border border-gray-200 hidden group-hover:block">
                <button
                  type="button"
                  onClick={handleNumerologyClick}
                  className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap text-gray-700 hover:bg-gray-50`}
                >
                  Numerology
                </button>
                <Link
                  href="/vaastu"
                  className="block px-4 py-2 text-sm whitespace-nowrap text-gray-700 hover:bg-gray-50"
                >
                  Vaastu
                </Link>
              </div>
            </div>

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

          </div>

          {/* Mobile: Hamburger + Cart + Auth */}
          <div className="flex lg:hidden items-center gap-2 ml-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Open cart"
            >
              <HiShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-semibold h-4 min-w-[1rem] px-1">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <Link href={user?.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD} className="p-2 rounded-lg hover:bg-gray-100">
                <HiUser className="h-5 w-5 text-gray-700" />
              </Link>
            ) : (
              <Link href={ROUTES.LOGIN} className="px-3 py-1.5 text-sm font-medium text-[var(--primary-700)]" onClick={() => setIsMobileNavOpen(false)}>
                Login
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
              aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileNavOpen}
            >
              {isMobileNavOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop: Right Section - Become A Affiliate + Auth */}
          <div className="hidden lg:flex lg:items-center lg:gap-4 lg:ml-auto flex-shrink-0">
            <Link
              href={ROUTES.AFFILIATE}
              className="px-4 py-2 text-base font-medium whitespace-nowrap bg-white border border-[var(--primary-700)] text-[var(--primary-700)] hover:bg-[var(--primary-50)] rounded transition-colors"
            >
              Become A Affiliate
            </Link>
            {/* Cart icon */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:text-[var(--primary-700)] hover:border-[var(--primary-300)] transition-colors"
            >
              <HiShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-semibold h-4 min-w-[1rem] px-1">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
            {/* Auth / user menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[var(--primary-700)] transition-colors"
                >
                  <HiUser className="h-5 w-5" />
                  <span className="hidden md:inline">{user?.fullName || user?.email?.split('@')[0] || 'User'}</span>
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
                        {affiliateApproved && (
                          <Link
                            href="/dashboard/referrals"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            💰 My Referrals
                          </Link>
                        )}
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

    {/* Mobile hamburger menu - slide-out panel */}
    {isMobileNavOpen && (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          aria-hidden
          onClick={() => setIsMobileNavOpen(false)}
        />
        <div
          className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-2xl z-[56] lg:hidden flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="font-semibold text-[var(--foreground)]">Menu</span>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close menu"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                      active ? 'text-[var(--primary-700)] bg-[var(--primary-50)]' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Numerology Calculator entry (mobile hamburger) */}
              {/* Calculator section (mobile hamburger) */}
              <div className="px-2 pt-2">
                <p className="px-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Calculator
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleNumerologyClick();
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                    pathname === '/numerology' || pathname?.startsWith('/numerology/')
                      ? 'text-[var(--primary-700)] bg-[var(--primary-50)]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Numerology
                </button>
                <Link
                  href="/vaastu"
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                    pathname === '/vaastu' || pathname?.startsWith('/vaastu/')
                      ? 'text-[var(--primary-700)] bg-[var(--primary-50)]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  Vaastu
                </Link>
              </div>
              {moreMenuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                      active ? 'text-[var(--primary-700)] bg-[var(--primary-50)]' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 px-4 space-y-1">
              <Link
                href={ROUTES.AFFILIATE}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                  isActive(ROUTES.AFFILIATE) ? 'text-[var(--primary-700)] bg-[var(--primary-50)]' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileNavOpen(false)}
              >
                <HiCash className="h-5 w-5" />
                Become A Affiliate
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href={user?.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <HiUser className="h-5 w-5" />
                    {user?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMobileNavOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <HiLogout className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href={ROUTES.REGISTER}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-[var(--primary-700)] bg-[var(--primary-50)]"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  Register
                </Link>
              )}
            </div>
          </nav>
        </div>
      </>
    )}

    {/* Cart slide-over - z-[60] to sit above bottom nav (z-50) on mobile */}
    <div
      className={`fixed inset-0 z-[60] transition-opacity ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setIsCartOpen(false)}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
          <button
            type="button"
            className="p-1 -m-1 text-gray-500 hover:text-gray-800 text-xl leading-none"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">Your cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.product?.name || 'Item'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    NPR {(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-4 space-y-3 shrink-0 bg-white"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between text-base font-medium">
                <span className="text-gray-700">Total</span>
                <span className="font-semibold text-gray-900 text-lg">
                  NPR {total.toFixed(0)}
                </span>
              </div>
              <Link href="/dashboard/checkout" className="block" onClick={() => setIsCartOpen(false)}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center rounded-md bg-[var(--primary-700)] px-4 py-3 text-base font-medium text-white hover:bg-[var(--primary-800)] transition-colors"
                >
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>

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
                const isNumerology = item.href === '/numerology';
                const active = !isNumerology ? isActive(item.href) : pathname === '/numerology' || pathname?.startsWith('/numerology/');

                if (isNumerology) {
                  return (
                    <button
                      key="numerology"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleNumerologyClick();
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${
                        active ? 'text-[var(--primary-700)] bg-[var(--primary-50)]' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                }

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

