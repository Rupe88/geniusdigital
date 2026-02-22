'use client';

import React, { use, useState, useEffect } from 'react';
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
import { couponApi, Coupon } from '@/lib/api/coupon';
import { getAllCourses } from '@/lib/api/courses';
import { Course } from '@/lib/types/course';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50, 'Code must be at most 50 characters').optional(),
  description: z.string().optional(),
  couponType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().refine((val) => val > 0, { message: 'Discount value must be a positive number' }),
      z.undefined()
    ])
  ),
  minPurchase: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().refine((val) => val >= 0, { message: 'Minimum purchase must be a non-negative number' }),
      z.undefined()
    ])
  ),
  maxDiscount: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().refine((val) => val >= 0, { message: 'Maximum discount must be a non-negative number' }),
      z.undefined()
    ])
  ),
  usageLimit: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().int().refine((val) => val >= 1, { message: 'Usage limit must be a number and at least 1' }),
      z.undefined()
    ])
  ),
  userLimit: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.union([
      z.number().int().refine((val) => val >= 1, { message: 'User limit must be a number and at least 1' }),
      z.undefined()
    ])
  ),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
  applicableCourses: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.couponType === 'PERCENTAGE' && data.discountValue && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discountValue'],
}).refine((data) => {
  if (data.validFrom && data.validUntil) {
    return new Date(data.validUntil) > new Date(data.validFrom);
  }
  return true;
}, {
  message: 'Valid until date must be after valid from date',
  path: ['validUntil'],
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function EditCouponPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const couponId = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema) as Resolver<CouponFormData>,
  });

  const couponType = watch('couponType');
  const applicableCourses = watch('applicableCourses') ?? [];

  useEffect(() => {
    if (couponId) {
      fetchCoupon();
    }
  }, [couponId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAllCourses({ limit: 500 });
        if (!cancelled && res.data) setCourses(res.data);
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleCourse = (courseId: string) => {
    const current = applicableCourses as string[];
    const next = current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : [...current, courseId];
    setValue('applicableCourses', next);
  };

  const fetchCoupon = async () => {
    try {
      setFetching(true);
      const couponData = await couponApi.getById(couponId);
      setCoupon(couponData);
      
      // Format dates for datetime-local input
      const validFrom = couponData.validFrom ? new Date(couponData.validFrom).toISOString().slice(0, 16) : '';
      const validUntil = couponData.validUntil ? new Date(couponData.validUntil).toISOString().slice(0, 16) : '';
      
      reset({
        code: couponData.code,
        description: couponData.description || '',
        couponType: couponData.couponType,
        discountValue: couponData.discountValue,
        minPurchase: couponData.minPurchase || undefined,
        maxDiscount: couponData.maxDiscount || undefined,
        usageLimit: couponData.usageLimit || undefined,
        userLimit: couponData.userLimit || undefined,
        validFrom,
        validUntil,
        status: couponData.status,
        applicableCourses: couponData.applicableCourses || [],
        applicableProducts: couponData.applicableProducts || [],
      });
    } catch (error: any) {
      console.error('Error fetching coupon:', error);
      toast.error(error?.message || 'Failed to fetch coupon');
      router.push(`${ROUTES.ADMIN}/coupons`);
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true);
      await couponApi.update(couponId, data);
      toast.success('Coupon updated successfully');
      router.push(`${ROUTES.ADMIN}/coupons`);
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast.error(error?.message || 'Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Coupon not found</p>
        <Link href={`${ROUTES.ADMIN}/coupons`}>
          <Button variant="outline" className="mt-4">
            Back to Coupons
          </Button>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Coupon</h1>
          <p className="text-gray-600">Update coupon: {coupon.code}</p>
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
                    label="Coupon Code"
                    {...register('code')}
                    placeholder="e.g., SAVE20"
                    error={errors.code?.message}
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
                      label="Coupon Type"
                      options={[
                        { value: 'PERCENTAGE', label: 'Percentage' },
                        { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
                      ]}
                      {...register('couponType')}
                      error={errors.couponType?.message}
                    />
                  </div>

                  <div>
                    <Input
                      label={`Discount Value (${couponType === 'PERCENTAGE' ? '%' : 'Amount'})`}
                      type="number"
                      step={couponType === 'PERCENTAGE' ? '0.01' : '0.01'}
                      min="0"
                      max={couponType === 'PERCENTAGE' ? '100' : undefined}
                      {...register('discountValue')}
                      placeholder={couponType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 10.00'}
                      error={errors.discountValue?.message}
                    />
                  </div>
                </div>

                <div>
                  <Select
                    label="Status"
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'EXPIRED', label: 'Expired' },
                    ]}
                    {...register('status')}
                    error={errors.status?.message}
                  />
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
                  <p className="mt-1 text-xs text-gray-400">Current usage: {coupon.usedCount || 0}</p>
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
                    label="Valid From"
                    type="datetime-local"
                    {...register('validFrom')}
                    error={errors.validFrom?.message}
                  />
                </div>

                <div>
                  <Input
                    label="Valid Until"
                    type="datetime-local"
                    {...register('validUntil')}
                    error={errors.validUntil?.message}
                  />
                </div>
              </div>
            </Card>

            {/* Applicable to courses */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Applicable to courses</h2>
              <p className="text-sm text-gray-500 mb-4">Select which courses this promo code can be used for. Leave empty to allow all courses.</p>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {courses.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading courses…</p>
                ) : (
                  courses.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(applicableCourses as string[]).includes(c.id)}
                        onChange={() => toggleCourse(c.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-900">{c.title}</span>
                      {c.price != null && <span className="text-xs text-gray-500">Rs. {Number(c.price).toLocaleString()}</span>}
                    </label>
                  ))
                )}
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
                  Update Coupon
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Coupon Statistics</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Used:</span>
                  <span className="text-gray-900 font-medium">{coupon.usedCount || 0}</span>
                </div>
                {coupon._count && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Uses:</span>
                    <span className="text-gray-900 font-medium">{coupon._count.usages || 0}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-none ${
                    coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    coupon.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {coupon.status}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
