'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { couponApi, Coupon } from '@/lib/api/coupon';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

export default function CouponDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const couponId = params?.id as string;
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (couponId) {
      fetchCoupon();
    }
  }, [couponId]);

  const fetchCoupon = async () => {
    try {
      setLoading(true);
      const couponData = await couponApi.getById(couponId);
      setCoupon(couponData);
    } catch (error: any) {
      console.error('Error fetching coupon:', error);
      toast.error(error?.message || 'Failed to fetch coupon');
      router.push(`${ROUTES.ADMIN}/coupons`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await couponApi.delete(couponId);
      toast.success('Coupon deleted successfully');
      router.push(`${ROUTES.ADMIN}/coupons`);
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error(error?.message || 'Failed to delete coupon');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Coupon['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.couponType === 'PERCENTAGE') {
      return `${coupon.discountValue}%`;
    }
    return formatPrice(coupon.discountValue);
  };

  const isExpired = (validUntil: string) => {
    if (typeof window === 'undefined') return false; // SSR-safe
    return new Date(validUntil) < new Date();
  };

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`${ROUTES.ADMIN}/coupons`}>
            <Button variant="outline" size="sm">
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Details</h1>
            <p className="text-gray-600">View coupon: {coupon.code}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href={`${ROUTES.ADMIN}/coupons/${coupon.id}/edit`}>
            <Button variant="primary">
              <HiPencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDeleteCoupon}
            className="text-red-600 hover:text-red-700"
          >
            <HiTrash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <p className="text-lg font-mono font-semibold text-gray-900">{coupon.code}</p>
              </div>

              {coupon.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{coupon.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Type</label>
                  <p className="text-gray-900">{coupon.couponType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <p className="text-lg font-semibold text-gray-900">{getDiscountDisplay(coupon)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-none ${getStatusColor(coupon.status)}`}>
                  {coupon.status}
                </span>
              </div>
            </div>
          </Card>

          {/* Discount Limits */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount Limits</h2>
            <div className="space-y-3">
              {coupon.minPurchase ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase</label>
                  <p className="text-gray-900">{formatPrice(coupon.minPurchase)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No minimum purchase requirement</p>
              )}

              {coupon.couponType === 'PERCENTAGE' && coupon.maxDiscount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount</label>
                  <p className="text-gray-900">{formatPrice(coupon.maxDiscount)}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Usage Limits */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <p className="text-gray-900">{coupon.usageLimit ? `${coupon.usedCount || 0} / ${coupon.usageLimit}` : 'Unlimited'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Limit</label>
                <p className="text-gray-900">{coupon.userLimit || 'Unlimited'}</p>
              </div>
            </div>
            {coupon._count && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Uses</label>
                <p className="text-gray-900">{coupon._count.usages || 0}</p>
              </div>
            )}
          </Card>

          {/* Validity Period */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Validity Period</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                <p className="text-gray-900">{formatDate(coupon.validFrom)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <p className="text-gray-900">{formatDate(coupon.validUntil)}</p>
                {isExpired(coupon.validUntil) && (
                  <p className="text-sm text-red-600 mt-1">This coupon has expired</p>
                )}
              </div>
            </div>
          </Card>

          {/* Applicable Items */}
          {(coupon.applicableCourses?.length || coupon.applicableProducts?.length) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicable Items</h2>
              <div className="space-y-3">
                {coupon.applicableCourses && coupon.applicableCourses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Courses</label>
                    <p className="text-gray-900">{coupon.applicableCourses.length} course(s)</p>
                  </div>
                )}

                {coupon.applicableProducts && coupon.applicableProducts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Products</label>
                    <p className="text-gray-900">{coupon.applicableProducts.length} product(s)</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Times Used:</span>
                <span className="text-gray-900 font-medium">{coupon.usedCount || 0}</span>
              </div>
              {coupon._count && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Uses:</span>
                  <span className="text-gray-900 font-medium">{coupon._count.usages || 0}</span>
                </div>
              )}
              {coupon.usageLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="text-gray-900 font-medium">
                    {Math.max(0, coupon.usageLimit - (coupon.usedCount || 0))}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(coupon.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(coupon.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
