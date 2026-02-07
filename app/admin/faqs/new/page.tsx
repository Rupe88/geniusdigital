'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FAQForm } from '@/components/admin/FAQForm';
import { CreateFAQRequest } from '@/lib/api/faq';
import * as faqApi from '@/lib/api/faq';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function NewFAQPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateFAQRequest) => {
    try {
      await faqApi.createFAQ(data);
      showSuccess('FAQ created successfully!');
      router.push('/admin/faqs');
    } catch (error) {
      console.error('Error creating FAQ:', error);
      showError(Object(error).message || 'Failed to create FAQ');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/faqs');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Create New FAQ</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Add a new frequently asked question</p>
      </div>

      <FAQForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
