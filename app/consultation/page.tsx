'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { consultationApi, getConsultationCategories } from '@/lib/api/consultation';
import type { ConsultationCategory, CreateConsultationRequest } from '@/lib/api/consultation';
import { Button } from '@/components/ui/Button';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiArrowLeft, HiChevronRight, HiRefresh } from 'react-icons/hi';

export default function ConsultationPage() {
  const [categories, setCategories] = useState<ConsultationCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ConsultationCategory | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateConsultationRequest>();

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await getConsultationCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch consultation categories', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategory) {
      setValue('categoryId', selectedCategory.id);
    }
  }, [selectedCategory, setValue]);

  const onSubmit = async (data: CreateConsultationRequest) => {
    setSubmitting(true);
    try {
      const topic = data.topic ? `Topic: ${data.topic}\n` : '';
      const rawCategoryId = selectedCategory?.id ?? data.categoryId;
      const categoryId = rawCategoryId && !String(rawCategoryId).startsWith('fallback-') ? rawCategoryId : undefined;
      const payload: CreateConsultationRequest = {
        ...data,
        message: `${topic}${data.message}`,
        consultationType: isOnline ? 'ONLINE' : 'OFFLINE',
        categoryId,
      };
      await consultationApi.create(payload);
      showSuccess('Consultation request submitted successfully! We will contact you soon.');
      reset();
      setSelectedCategory(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consultation</h1>
          <p className="mt-2 text-gray-600">Get expert advice from our professionals. Choose a category and submit your request.</p>
        </div>

        <div>
          {/* Main: Categories list OR Form */}
          <div>
            {selectedCategory == null ? (
              /* Step 1: Show categories */
              <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-800">Choose consultation type</h2>
                  <p className="text-sm text-gray-500 mt-1">Select a category to open the booking form.</p>
                </div>
                {categoriesLoading ? (
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 bg-white animate-pulse"
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded-md" />
                            <div className="h-3 w-24 bg-gray-200 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No consultation categories available.</p>
                    <Button variant="outline" size="sm" onClick={fetchCategories} className="mt-4 gap-2">
                      <HiRefresh className="w-4 h-4" /> Retry
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-[var(--primary-300)] hover:bg-[var(--primary-50)]/50 transition-all text-left group"
                        >
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {cat.image ? (
                              <Image
                                src={cat.image}
                                alt={cat.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-gray-900">{cat.name}</span>
                          </div>
                          <HiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--primary-600)] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Form with selected category */
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <button
                  type="button"
                  onClick={goBackToCategories}
                  className="inline-flex items-center gap-2 text-sm text-[var(--primary-700)] hover:underline mb-6"
                >
                  <HiArrowLeft className="w-4 h-4" />
                  Change category
                </button>
                <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-[var(--primary-50)] border border-[var(--primary-100)]">
                  {selectedCategory.image && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={selectedCategory.image} alt={selectedCategory.name} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-[var(--primary-700)] uppercase tracking-wide">Selected</p>
                    <p className="font-semibold text-gray-900">{selectedCategory.name} Consultation</p>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Book a Consultation</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex items-center gap-6 justify-center py-2">
                    <label className="text-gray-700 font-medium">Mode:</label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-[var(--primary-700)]"
                        checked={isOnline}
                        onChange={() => setIsOnline(true)}
                      />
                      <span className="ml-2">Online</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-[var(--primary-700)]"
                        checked={!isOnline}
                        onChange={() => setIsOnline(false)}
                      />
                      <span className="ml-2">Offline</span>
                    </label>
                  </div>

                  <input type="hidden" {...register('categoryId')} value={selectedCategory.id} />

                  <div>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      placeholder="Your name *"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-700)] focus:border-transparent"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                        })}
                        placeholder="Email *"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-700)]"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>}
                    </div>
                    <div>
                      <input
                        {...register('phone', { required: 'Phone is required' })}
                        placeholder="Phone *"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-700)]"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{String(errors.phone.message)}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      {...register('referralSource')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-700)] bg-white"
                    >
                      <option value="">How did you find us?</option>
                      <option value="GOOGLE_SEARCH">Google Search</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="YOUTUBE">Youtube</option>
                      <option value="FRIEND_REFERRAL">Friend Referral</option>
                      <option value="EVENT">Event</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <textarea
                      {...register('message', { required: 'Message is required' })}
                      placeholder="Your message or query *"
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-700)] resize-none"
                    />
                    {errors.message && <p className="text-red-500 text-sm mt-1">{String(errors.message.message)}</p>}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full md:w-auto px-8 py-3 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold rounded-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit request'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
