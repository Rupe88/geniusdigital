'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalaryManagementPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/finance');
  }, [router]);

  return null;
}
