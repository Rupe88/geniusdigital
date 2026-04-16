import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiFacebook, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { PwaInstall } from '@/components/PwaInstall';
import { ROUTES } from '@/lib/utils/constants';

const categories = [
  'Academic Counseling',
  'Career Guidance',
  'Exam Preparation',
  'Skill Development',
  'Higher Study Guidance',
  'Mental Wellness',
  'Parent/Teacher Counseling',
  'Scholarship & Fees',
  'Communication Skills',
  'General Inquiry',
];

const usefulLinks = [
  { label: 'About Us', href: ROUTES.ABOUT },
  { label: 'Courses', href: ROUTES.COURSES },
  { label: 'Privacy Statement', href: '/privacy' },
  { label: 'Terms & Condition', href: '/terms' },
  { label: 'Articles', href: ROUTES.BLOG },
  { label: 'Contact Us', href: ROUTES.CONTACT },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto mb-20 lg:mb-0 bg-[#0d1625] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand + Social */}
          <div className="flex flex-col items-start gap-6">
            <div className="relative h-28 w-28">
              <Image
                src="/logo.png"
                alt="Genius Digi logo"
                fill
                className="object-contain"
                sizes="112px"
              />
            </div>
            <div className="flex items-center gap-3 text-xl">
              <a
                href="https://www.facebook.com/pshambhupaswan"
                aria-label="Facebook"
                className="transition hover:text-white/70"
              >
                <FiFacebook />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="transition hover:text-white/70"
              >
                <FiInstagram />
              </a>
              <a
                href="https://youtube.com"
                aria-label="YouTube"
                className="transition hover:text-white/70"
              >
                <FiYoutube />
              </a>
              <a
                href="https://tiktok.com"
                aria-label="TikTok"
                className="transition hover:text-white/70"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4 text-sm">
            <h4 className="text-lg font-semibold tracking-wide relative">
              Categories
              <span className="mt-2 block h-0.5 w-16 bg-white/60" />
            </h4>
            <ul className="space-y-2 text-gray-100/80">
              {categories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Useful links */}
          <div className="space-y-4 text-sm">
            <h4 className="text-lg font-semibold tracking-wide relative">
              Useful Links
              <span className="mt-2 block h-0.5 w-16 bg-white/60" />
            </h4>
            <ul className="space-y-2 text-gray-100/80">
              {usefulLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Student Support */}
          <div className="space-y-4 text-sm">
            <h4 className="text-lg font-semibold tracking-wide relative">
              Student Support
              <span className="mt-2 block h-0.5 w-16 bg-white/60" />
            </h4>
            <div className="space-y-3 text-gray-100/80">
              <div className="flex items-start gap-2">
                <FiMail className="mt-0.5 text-base" />
                <a
                  href="mailto:pshambhu608@gmail.com"
                  className="transition hover:text-white"
                >
                  pshambhu608@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <FiPhone className="mt-0.5 text-base" />
                <div className="space-y-1">
                  <a href="tel:+9779816798026" className="transition hover:text-white">
                    +977 981-6798026
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 text-base" />
                <p>
                  Kathmandu, Nepal
                </p>
              </div>
            </div>
          </div>

          {/* Install our app (PWA) */}
          <div className="space-y-4 text-sm">
            <h4 className="text-lg font-semibold tracking-wide relative">
              Install Our App
              <span className="mt-2 block h-0.5 w-16 bg-white/60" />
            </h4>
            <p className="text-gray-100/80">
              Install Genius Shiksha on your phone or computer for quick access.
            </p>
            <PwaInstall />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#0a111d]">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-[18px] text-gray-300 sm:px-6 lg:px-8">
          <p>
            &copy; {year} Genius Digi. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};
