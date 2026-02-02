'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { couponApi } from '@/lib/api/coupon';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50, 'Code must be at most 50 characters'),
  description: z.string().optional(),
  couponType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
    message: 'Please select a coupon type',
  }),
  discountValue: z.coerce
    .number()
    .refine((val) => !isNaN(val), { message: 'Discount value is required' })
    .refine((val) => val > 0, { message: 'Discount value must be a positive number' }),
  minPurchase: z.coerce
    .number()
    .refine((val) => isNaN(val) || val >= 0, { message: 'Minimum purchase must be a non-negative number' })
    .transform((val) => isNaN(val) ? undefined : val)
    .optional()
    .or(z.undefined()),
  maxDiscount: z.coerce
    .number()
    .refine((val) => isNaN(val) || val >= 0, { message: 'Maximum discount must be a non-negative number' })
    .transform((val) => isNaN(val) ? undefined : val)
    .optional()
    .or(z.undefined()),
  usageLimit: z.coerce
    .number()
    .refine((val) => isNaN(val) || val >= 1, { message: 'Usage limit must be a number and at least 1' })
    .transform((val) => isNaN(val) ? undefined : val)
    .optional()
    .or(z.undefined()),
  userLimit: z.coerce
    .number()
    .refine((val) => isNaN(val) || val >= 1, { message: 'User limit must be a number and at least 1' })
    .transform((val) => isNaN(val) ? undefined : val)
    .optional()
    .or(z.undefined()),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  applicableCourses: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.couponType === 'PERCENTAGE' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discountValue'],
}).refine((data) => {
  return new Date(data.validUntil) > new Date(data.validFrom);
}, {
  message: 'Valid until date must be after valid from date',
  path: ['validUntil'],
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema) as Resolver<CouponFormData>,
    defaultValues: {
      couponType: 'PERCENTAGE',
    },
  });

  const couponType = watch('couponType');

  const onSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true);
      await couponApi.create(data);
      toast.success('Coupon created successfully');
      router.push(`${ROUTES.ADMIN}/coupons`);
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast.error(error?.message || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`${ROUTES.ADMIN}/coupons`}>
          <Button variant="outline" size="sm">
            <HiArrowLeft className="h-4 w-4 mr-2" />
            Back to Coupons
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Coupon</h1>
          <p className="text-gray-600">Add a new discount coupon</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Coupon Code *"
                    {...register('code')}
                    placeholder="e.g., SAVE20"
                    error={errors.code?.message}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Code will be automatically converted to uppercase</p>
                </div>

                <div>
                  <Textarea
                    label="Description"
                    {...register('description')}
                    placeholder="Describe what this coupon is for..."
                    rows={3}
                    error={errors.description?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Coupon Type *"
                      options={[
                        { value: 'PERCENTAGE', label: 'Percentage' },
                        { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
                      ]}
                      {...register('couponType')}
                      error={errors.couponType?.message}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label={`Discount Value * (${couponType === 'PERCENTAGE' ? '%' : 'Amount'})`}
                      type="number"
                      step={couponType === 'PERCENTAGE' ? '0.01' : '0.01'}
                      min="0"
                      max={couponType === 'PERCENTAGE' ? '100' : undefined}
                      {...register('discountValue')}
                      placeholder={couponType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 10.00'}
                      error={errors.discountValue?.message}
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Discount Limits */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount Limits</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Minimum Purchase Amount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('minPurchase')}
                    placeholder="e.g., 50.00"
                    error={errors.minPurchase?.message}
                  />
                  <p className="mt-1 text-sm text-gray-500">Minimum order amount required to use this coupon</p>
                </div>

                {couponType === 'PERCENTAGE' && (
                  <div>
                    <Input
                      label="Maximum Discount Amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('maxDiscount')}
                      placeholder="e.g., 100.00"
                      error={errors.maxDiscount?.message}
                    />
                    <p className="mt-1 text-sm text-gray-500">Maximum discount amount (for percentage coupons)</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Usage Limits */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Usage Limit"
                    type="number"
                    min="1"
                    {...register('usageLimit')}
                    placeholder="e.g., 100"
                    error={errors.usageLimit?.message}
                  />
                  <p className="mt-1 text-sm text-gray-500">Total number of times this coupon can be used</p>
                </div>

                <div>
                  <Input
                    label="User Limit"
                    type="number"
                    min="1"
                    {...register('userLimit')}
                    placeholder="e.g., 1"
                    error={errors.userLimit?.message}
                  />
                  <p className="mt-1 text-sm text-gray-500">Number of times a single user can use this coupon</p>
                </div>
              </div>
            </Card>

            {/* Validity Period */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Validity Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Valid From *"
                    type="datetime-local"
                    {...register('validFrom')}
                    error={errors.validFrom?.message}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Valid Until *"
                    type="datetime-local"
                    {...register('validUntil')}
                    error={errors.validUntil?.message}
                    required
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                  disabled={loading}
                >
                  Create Coupon
                </Button>
                <Link href={`${ROUTES.ADMIN}/coupons`}>
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Coupon Information</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Coupon codes are automatically converted to uppercase</p>
                <p>• Percentage coupons can have a maximum discount cap</p>
                <p>• Leave usage limits empty for unlimited usage</p>
                <p>• Coupons are set to ACTIVE status by default</p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
