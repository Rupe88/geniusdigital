'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import PromotionalPopup from '@/components/layout/PromotionalPopup';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isAdmin || isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <PromotionalPopup />
      <Navbar />
      <main className="flex-grow pb-20 lg:pb-0">{children}</main>
      <Footer />
    </>
  );
}
