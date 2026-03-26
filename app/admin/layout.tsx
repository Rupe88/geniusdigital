'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { HiHome, HiUsers, HiBookOpen, HiFolder, HiUserGroup, HiCreditCard, HiTag, HiShoppingBag, HiDocumentText, HiPhotograph, HiChat, HiCalendar, HiVideoCamera, HiChartBar, HiStar, HiMail, HiShieldCheck, HiCash, HiCurrencyDollar, HiTrendingUp, HiOfficeBuilding, HiChevronDown, HiChevronRight, HiShare, HiExternalLink, HiLogout, HiQuestionMarkCircle, HiSparkles, HiLocationMarker } from 'react-icons/hi';
import { ROUTES } from '@/lib/utils/constants';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const adminMenuCategories: MenuCategory[] = [
  {
    label: 'User Management',
    icon: HiUsers,
    items: [
      { href: `${ROUTES.ADMIN}/users`, label: 'Users', icon: HiUsers },
      { href: `${ROUTES.ADMIN}/instructors`, label: 'Instructors', icon: HiUserGroup },
    ],
  },
  {
    label: 'Course Management',
    icon: HiBookOpen,
    items: [
      { href: `${ROUTES.ADMIN}/courses`, label: 'Courses', icon: HiBookOpen },
      { href: `${ROUTES.ADMIN}/categories`, label: 'Categories', icon: HiFolder },
      { href: `${ROUTES.ADMIN}/enrollments`, label: 'Enrollments', icon: HiBookOpen },
      { href: `${ROUTES.ADMIN}/reviews`, label: 'Reviews', icon: HiStar },
      { href: `${ROUTES.ADMIN}/live-classes`, label: 'Live Classes', icon: HiVideoCamera },
      { href: `${ROUTES.ADMIN}/student-success`, label: 'Student Success', icon: HiStar },
    ],
  },
  {
    label: 'Content Management',
    icon: HiDocumentText,
    items: [
      { href: `${ROUTES.ADMIN}/blogs`, label: 'Blog', icon: HiDocumentText },
      { href: `${ROUTES.ADMIN}/testimonials`, label: 'Testimonials', icon: HiStar },
      { href: `${ROUTES.ADMIN}/gallery`, label: 'Gallery', icon: HiPhotograph },
      { href: `${ROUTES.ADMIN}/carousel`, label: 'Carousel', icon: HiPhotograph },
      { href: `${ROUTES.ADMIN}/events`, label: 'Events', icon: HiCalendar },
      { href: `${ROUTES.ADMIN}/event-bookings`, label: 'Event Bookings', icon: HiUserGroup },
      { href: `${ROUTES.ADMIN}/popups`, label: 'Popups', icon: HiPhotograph },
      { href: `${ROUTES.ADMIN}/faqs`, label: 'FAQs', icon: HiQuestionMarkCircle },
    ],
  },
  {
    label: 'E-commerce',
    icon: HiShoppingBag,
    items: [
      { href: `${ROUTES.ADMIN}/products`, label: 'Products', icon: HiShoppingBag },
      { href: `${ROUTES.ADMIN}/orders`, label: 'Orders', icon: HiShoppingBag },
      { href: `${ROUTES.ADMIN}/coupons`, label: 'Coupons', icon: HiTag },
    ],
  },
  {
    label: 'Finance',
    icon: HiCurrencyDollar,
    items: [
      { href: `${ROUTES.ADMIN}/finance`, label: 'Finance Overview', icon: HiCurrencyDollar },
      { href: `${ROUTES.ADMIN}/payments`, label: 'Payments', icon: HiCreditCard },
      { href: `${ROUTES.ADMIN}/expenses`, label: 'Expenses', icon: HiCash },
      { href: `${ROUTES.ADMIN}/income`, label: 'Income', icon: HiTrendingUp },
      { href: `${ROUTES.ADMIN}/finance/salaries`, label: 'Salaries', icon: HiOfficeBuilding },
    ],
  },
  {
    label: 'Communication',
    icon: HiChat,
    items: [
      { href: `${ROUTES.ADMIN}/consultations`, label: 'Consultations', icon: HiChat },
      { href: `${ROUTES.ADMIN}/mass-email`, label: 'Mass Email', icon: HiMail },
    ],
  },
  {
    label: 'Analytics & Tools',
    icon: HiChartBar,
    items: [
      { href: `${ROUTES.ADMIN}/affiliate-applications`, label: 'Affiliate Applications', icon: HiDocumentText },
      { href: `${ROUTES.ADMIN}/referrals`, label: 'Referrals', icon: HiShare },
      { href: `${ROUTES.ADMIN}/audit-logs`, label: 'Audit Logs', icon: HiShieldCheck },
      { href: `${ROUTES.ADMIN}/quiz-attempts`, label: 'Quiz Attempts', icon: HiDocumentText },
      { href: `${ROUTES.ADMIN}/certificates`, label: 'Certificates', icon: HiDocumentText },
      { href: `${ROUTES.ADMIN}/numerology`, label: 'Numerology', icon: HiSparkles },
      { href: `${ROUTES.ADMIN}/compass`, label: 'Compass', icon: HiLocationMarker },
    ],
  },
  { label: 'Account', icon: HiShieldCheck, items: [{ href: `${ROUTES.ADMIN}/account`, label: 'Account Settings', icon: HiShieldCheck }] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Dashboard']));

  const toggleCategory = (categoryLabel: string) => {
    setOpenCategories((prev) => (prev.has(categoryLabel) ? new Set() : new Set([categoryLabel])));
  };

  const isCategoryActive = (category: MenuCategory) =>
    category.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'));

  React.useEffect(() => {
    const activeCategory = adminMenuCategories.find((c) => isCategoryActive(c));
    setOpenCategories(activeCategory ? new Set([activeCategory.label]) : new Set());
  }, [pathname]);

  if (pathname === `${ROUTES.ADMIN}/login`) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    window.location.href = '/login';
    return null;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-slate-200">
          <div className="h-14 flex items-center px-5 border-b border-slate-200 flex-shrink-0">
            <span className="text-base font-semibold text-slate-800 tracking-tight">Admin</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            <ul className="space-y-0.5">
              <li>
                <Link
                  href={ROUTES.ADMIN}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === ROUTES.ADMIN ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <HiHome className="h-4 w-4 flex-shrink-0 opacity-80" />
                  Overview
                </Link>
              </li>
              {adminMenuCategories.map((category) => {
                const CategoryIcon = category.icon;
                const isOpen = openCategories.has(category.label);
                const categoryActive = isCategoryActive(category);
                return (
                  <li key={category.label}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.label)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-md transition-colors ${
                        categoryActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <CategoryIcon className="h-4 w-4 flex-shrink-0 opacity-80" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </span>
                      {isOpen ? <HiChevronDown className="h-4 w-4 text-slate-400" /> : <HiChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <ul className="mt-0.5 ml-2 pl-4 border-l border-slate-200 space-y-0.5">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                                  isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <ItemIcon className="h-4 w-4 flex-shrink-0 opacity-80" />
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-3 border-t border-slate-200 flex-shrink-0 space-y-0.5">
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <HiLogout className="h-4 w-4" />
              Logout
            </button>
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-md transition-colors"
            >
              <HiExternalLink className="h-4 w-4" />
              Back to site
            </Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none">
                {user?.fullName ?? user?.email ?? 'Admin'}
              </span>
            </div>
            <Link
              href={ROUTES.HOME}
              className="text-sm text-slate-500 hover:text-primary-600 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <HiExternalLink className="h-4 w-4" />
              View site
            </Link>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}
