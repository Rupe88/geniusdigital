'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FAQ, CreateFAQRequest, UpdateFAQRequest } from '@/lib/api/faq';
import { getFAQCategoryOptions, FAQ_CATEGORIES } from '@/lib/utils/faqCategories';

const faqSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be less than 500 characters'),
  answer: z.string().min(1, 'Answer is required'),
  category: z.enum([FAQ_CATEGORIES.GENERAL, FAQ_CATEGORIES.COURSES, FAQ_CATEGORIES.PAYMENTS, FAQ_CATEGORIES.ENROLLMENT, FAQ_CATEGORIES.TECHNICAL, FAQ_CATEGORIES.OTHER] as [string, ...string[]]).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type FAQFormData = z.infer<typeof faqSchema>;

interface FAQFormProps {
  initialData?: FAQ;
  onSubmit: (data: CreateFAQRequest | UpdateFAQRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const FAQForm: React.FC<FAQFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
        defaultValues: initialData
      ? {
          question: initialData.question,
          answer: initialData.answer,
          category: (initialData.category as any) || FAQ_CATEGORIES.GENERAL,
          order: initialData.order || 0,
          isActive: (initialData as any).isActive !== false,
        }
      : {
          question: '',
          answer: '',
          category: FAQ_CATEGORIES.GENERAL,
          order: 0,
          isActive: true,
        },
  });

  const category = watch('category');
  const isActive = watch('isActive');

  const onSubmitForm = async (data: FAQFormData) => {
    await onSubmit({
      question: data.question,
      answer: data.answer,
      category: data.category || FAQ_CATEGORIES.GENERAL,
      order: data.order || 0,
      isActive: data.isActive !== false,
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('question')}
            placeholder="Enter the question..."
            error={errors.question?.message}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {watch('question')?.length || 0} / 500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer <span className="text-red-500">*</span>
          </label>
          <Textarea
            {...register('answer')}
            placeholder="Enter the answer..."
            error={errors.answer?.message}
            rows={6}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={category || FAQ_CATEGORIES.GENERAL}
              onChange={(e) => setValue('category', e.target.value as any)}
              options={getFAQCategoryOptions()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <Input
              type="number"
              {...register('order', { valueAsNumber: true })}
              placeholder="0"
              error={errors.order?.message}
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isActive !== false}
              onChange={(e) => setValue('isActive', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Active (visible on website)</span>
          </label>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update FAQ' : 'Create FAQ'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
