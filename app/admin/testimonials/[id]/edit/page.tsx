'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestimonialForm } from '@/components/admin/TestimonialForm';
import { Testimonial, UpdateTestimonialData } from '@/lib/api/testimonials';
import * as testimonialApi from '@/lib/api/testimonials';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Card } from '@/components/ui/Card';

export default function EditTestimonialPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const testimonialId = params?.id as string;
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testimonialId) {
      fetchTestimonial();
    }
  }, [testimonialId]);

  const fetchTestimonial = async () => {
    try {
      setLoading(true);
      const data = await testimonialApi.getTestimonialById(testimonialId);
      setTestimonial(data);
    } catch (error) {
      console.error('Error fetching testimonial:', error);
      showError(Object(error).message || 'Failed to load testimonial');
      router.push('/admin/testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateTestimonialData) => {
    try {
      if (!testimonialId) {
        throw new Error('Testimonial ID is required');
      }
      await testimonialApi.updateTestimonial(testimonialId, data);
      showSuccess('Testimonial updated successfully!');
      router.push('/admin/testimonials');
    } catch (error) {
      console.error('Error updating testimonial:', error);
      showError(Object(error).message || 'Failed to update testimonial');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/testimonials');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-[var(--muted-foreground)]">Loading testimonial...</div>
        </div>
      </div>
    );
  }

  if (!testimonial) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <p className="text-[var(--muted-foreground)]">Testimonial not found</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit Testimonial</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Update testimonial details</p>
      </div>

      <TestimonialForm
        testimonial={testimonial}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
