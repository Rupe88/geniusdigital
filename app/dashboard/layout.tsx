'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  HiHome,
  HiBookOpen,
  HiChartBar,
  HiCreditCard,
  HiCog,
  HiShare,
  HiMenu,
  HiX,
  HiExternalLink,
  HiVideoCamera,
  HiLogout,
  HiCalendar,
  HiDocumentText,
} from 'react-icons/hi';
import { ROUTES } from '@/lib/utils/constants';

const menuItems = [
  { href: ROUTES.DASHBOARD, label: 'Overview', icon: HiHome },
  { href: `${ROUTES.DASHBOARD}/my-courses`, label: 'My Courses', icon: HiBookOpen },
  { href: `${ROUTES.DASHBOARD}/progress`, label: 'Progress', icon: HiChartBar },
  { href: `${ROUTES.DASHBOARD}/quiz-reports`, label: 'Quiz Reports', icon: HiDocumentText },
  { href: `${ROUTES.DASHBOARD}/live-classes`, label: 'Live Classes', icon: HiVideoCamera },
  { href: `${ROUTES.DASHBOARD}/referrals`, label: 'Referrals', icon: HiShare },
  { href: `${ROUTES.DASHBOARD}/payments`, label: 'Payments', icon: HiCreditCard },
  { href: `${ROUTES.DASHBOARD}/installments`, label: 'Installments', icon: HiCalendar },
  { href: `${ROUTES.DASHBOARD}/settings`, label: 'Settings', icon: HiCog },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN;
    } catch {
      if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN;
    } finally {
      setLoggingOut(false);
    }
  };
  const isLearnRoute = pathname.startsWith('/dashboard/courses/') && pathname.includes('/learn');

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--muted)]">
        <div className="inline-block w-8 h-8 border-2 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN;
    return null;
  }

  const navContent = (
    <nav className="p-4 flex-1 overflow-y-auto">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-[var(--primary-700)] text-white'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <div className="flex">
        {/* Mobile menu overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: hidden on mobile, drawer on open */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col
            bg-[var(--background)] border-r border-[var(--border)] shadow-lg
            transform transition-transform duration-200 ease-out
            lg:translate-x-0 lg:shadow-md
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between gap-2 py-3 px-4 border-b border-[var(--border)] flex-shrink-0 min-h-[52px]">
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 flex-1 min-w-0 justify-center lg:justify-start" aria-label="Dashboard">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                <Image
                  src="/sanskar-academy-logo.jpeg"
                  alt="Sanskar Academy"
                  fill
                  className="object-contain"
                  sizes="40px"
                  priority
                />
              </div>
              <span className="font-semibold text-[var(--foreground)] text-sm truncate">Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] lg:hidden flex-shrink-0"
              aria-label="Close menu"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
          {navContent}
          <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <HiLogout className="h-5 w-5 flex-shrink-0" />
              <span>{loggingOut ? 'Logging out…' : 'Log out'}</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 min-w-0 flex flex-col ${isLearnRoute ? 'h-screen overflow-hidden' : ''}`}>
          {/* Mobile: menu button + logo */}
          <div className="sticky top-0 z-30 flex items-center gap-2 py-2.5 px-3 bg-[var(--background)] border-b border-[var(--border)] lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] flex-shrink-0"
              aria-label="Open menu"
            >
              <HiMenu className="h-5 w-5" />
            </button>
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 flex-1 min-w-0 justify-center" aria-label="Dashboard">
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/sanskar-academy-logo.jpeg"
                  alt="Sanskar Academy"
                  fill
                  className="object-contain rounded-none"
                  sizes="36px"
                />
              </div>
              <span className="font-semibold text-[var(--foreground)] text-sm truncate">Dashboard</span>
            </Link>
          </div>

          {/* Top bar - desktop only, hidden on learn routes */}
          {!isLearnRoute && (
            <header className="hidden lg:flex h-14 flex-shrink-0 items-center justify-between px-6 bg-[var(--background)] border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[200px] sm:max-w-none">
                  {user?.fullName ?? user?.email ?? 'User'}
                </span>
              </div>
              <Link
                href={ROUTES.HOME}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-700)] transition-colors inline-flex items-center gap-1"
              >
                <HiExternalLink className="w-4 h-4" />
                View site
              </Link>
            </header>
          )}

          {isLearnRoute ? (
            <div className="flex-1 h-full overflow-hidden">{children}</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
