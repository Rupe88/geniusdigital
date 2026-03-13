'use client';

import React from 'react';
import Link from 'next/link';
import { HiDocumentText, HiPhone, HiUser, HiHeart, HiHome } from 'react-icons/hi';

const items: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { title: 'Advance Numerology Report', href: '/numerology/coming-soon?title=Advance%20Numerology%20Report', icon: HiDocumentText },
  { title: 'Mobile Numerology', href: '/numerology/coming-soon?title=Mobile%20Numerology', icon: HiPhone },
  { title: 'Name Numerology Advance Report', href: '/numerology/coming-soon?title=Name%20Numerology%20Advance%20Report', icon: HiUser },
  { title: 'Medical Numerology', href: '/numerology/coming-soon?title=Medical%20Numerology', icon: HiHeart },
  { title: 'Numero Vastu', href: '/numerology/coming-soon?title=Numero%20Vastu', icon: HiHome },
];

export default function NumerologyAdvancePage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold tracking-wider text-[var(--primary-700)] uppercase">
          Advanced tools
        </div>
        <div className="text-sm text-[var(--muted-foreground)] mt-1">Explore deeper numerology services</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.title}
              href={it.href}
              className="group flex items-center gap-4 bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-1.5 self-stretch bg-[var(--primary-700)]" />
              <div className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-xl bg-[var(--primary-700)]/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[var(--primary-700)]" />
                </div>
                <div className="font-semibold text-gray-900">{it.title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

