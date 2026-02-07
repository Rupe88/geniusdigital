'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FAQForm } from '@/components/admin/FAQForm';
import { UpdateFAQRequest, getFAQById, type FAQ } from '@/lib/api/faq';
import * as faqApi from '@/lib/api/faq';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQ();
  }, [id]);

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      const data = await getFAQById(id);
      setFaq(data);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      showError('Failed to load FAQ');
      router.push('/admin/faqs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateFAQRequest) => {
    try {
      await faqApi.updateFAQ(id, data);
      showSuccess('FAQ updated successfully!');
      router.push('/admin/faqs');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      showError(Object(error).message || 'Failed to update FAQ');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/faqs');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">FAQ not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit FAQ</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Update the frequently asked question</p>
      </div>

      <FAQForm
        initialData={faq}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
