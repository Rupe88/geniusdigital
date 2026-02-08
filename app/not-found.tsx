'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HiHome, HiArrowLeft } from 'react-icons/hi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--muted)] px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-[var(--primary-700)]">404</h1>
          <h2 className="text-4xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              <HiHome className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <HiArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="pt-8 space-y-2">
          <p className="text-sm text-gray-500">You might want to visit:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/courses" className="text-[var(--primary-700)] hover:text-[var(--primary-800)] underline">
              Courses
            </Link>
            <Link href="/events" className="text-[var(--primary-700)] hover:text-[var(--primary-800)] underline">
              Events
            </Link>
            <Link href="/blog" className="text-[var(--primary-700)] hover:text-[var(--primary-800)] underline">
              Blog
            </Link>
            <Link href="/contact" className="text-[var(--primary-700)] hover:text-[var(--primary-800)] underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
