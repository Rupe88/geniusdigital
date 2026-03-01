'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiPlus, HiPencil, HiTrash, HiEye, HiSearch, HiFilter, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { couponApi, Coupon } from '@/lib/api/coupon';
import { ROUTES } from '@/lib/utils/constants';
import { Pagination } from '@/lib/types/api';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter, pagination.page]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await couponApi.getAllCoupons(params);
      setCoupons(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error(error?.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await couponApi.delete(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
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
      month: 'short',
      day: 'numeric',
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

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 skeleton-shimmer rounded" />
            <div className="h-4 w-56 skeleton-shimmer rounded" />
          </div>
          <div className="h-10 w-36 skeleton-shimmer rounded" />
        </div>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 skeleton-shimmer rounded" />
            ))}
          </div>
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Description', 'Discount', 'Usage', 'Valid Period', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-20 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-14 skeleton-shimmer rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-20 skeleton-shimmer rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-600">Manage discount coupons and promotional codes</p>
        </div>
        <Link href={`${ROUTES.ADMIN}/coupons/new`}>
          <Button className="bg-red-600 hover:bg-red-700">
            <HiPlus className="h-4 w-4 mr-2" />
            Add New Coupon
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="flex items-center justify-center"
          >
            <HiFilter className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {coupon.code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {coupon.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getDiscountDisplay(coupon)}
                    </div>
                    {coupon.couponType === 'PERCENTAGE' && coupon.maxDiscount && (
                      <div className="text-xs text-gray-500">
                        Max: {formatPrice(coupon.maxDiscount)}
                      </div>
                    )}
                    {coupon.minPurchase && (
                      <div className="text-xs text-gray-500">
                        Min: {formatPrice(coupon.minPurchase)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                    </div>
                    {coupon._count && (
                      <div className="text-xs text-gray-500">
                        {coupon._count.usages} total uses
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                    </div>
                    {isExpired(coupon.validUntil) && (
                      <div className="text-xs text-red-600">Expired</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-none ${getStatusColor(coupon.status)}`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`${ROUTES.ADMIN}/coupons/${coupon.id}`}>
                        <Button variant="outline" size="sm">
                          <HiEye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`${ROUTES.ADMIN}/coupons/${coupon.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <HiPencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCoupons.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {coupons.length === 0 ? 'No coupons found. Create your first coupon!' : 'No coupons match your filters.'}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} coupons
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <HiChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
                <HiChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
