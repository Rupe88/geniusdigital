'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/axios';
import { HiSearch, HiRefresh, HiCheck, HiX, HiClock, HiDownload, HiCurrencyDollar, HiTrendingUp, HiUsers } from 'react-icons/hi';

interface Payment {
  id: string;
  transactionId: string;
  userId: string;
  courseId?: string;
  orderId?: string;
  amount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  metadata?: any;
  createdAt: string;
  completedAt?: string;
  user?: {
    fullName: string;
    email: string;
  };
  course?: {
    title: string;
  };
  order?: {
    orderNumber: string;
  };
}

interface PaymentAnalytics {
  overview: {
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successRate: number;
    totalRevenue: number;
    totalRefunded: number;
    netRevenue: number;
    avgTransactionValue: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  PENDING: HiClock,
  COMPLETED: HiCheck,
  FAILED: HiX,
  REFUNDED: HiRefresh,
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get('/payments/admin', { params });

      if (response.data.success) {
        setPayments(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await apiClient.get('/payments/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      // Silently fail if analytics endpoint is not available
      // This prevents UI errors when database is down
      if (error.response?.status !== 404) {
        console.error('Analytics unavailable:', error.response?.data?.message || 'Service unavailable');
      }
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;

    try {
      setRefundingId(paymentId);
      const response = await apiClient.post(`/payments/${paymentId}/refund`, {
        reason: 'Admin initiated refund',
      });

      if (response.data.success) {
        toast.success('Payment refunded successfully');
        fetchPayments();
        fetchAnalytics();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to refund payment');
    } finally {
      setRefundingId(null);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Transaction ID', 'User', 'Amount', 'Method', 'Status', 'Date'].join(','),
      ...payments.map(p =>
        [
          p.transactionId,
          p.user?.email || 'N/A',
          Number(p.finalAmount || 0).toFixed(2),
          p.paymentMethod,
          p.status,
          new Date(p.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={payments.length === 0}
          >
            <HiDownload className="mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => { fetchPayments(); fetchAnalytics(); }}>
            <HiRefresh className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Number(analytics.overview.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <HiCurrencyDollar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalPayments}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <HiUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(analytics.overview.successRate || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <HiTrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Number(analytics.overview.avgTransactionValue || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <HiCurrencyDollar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by transaction ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const StatusIcon = statusIcons[payment.status];
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.user?.fullName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.course?.title || payment.order?.orderNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${Number(payment.finalAmount || 0).toFixed(2)}
                        </div>
                        {Number(payment.discount || 0) > 0 && (
                          <div className="text-xs text-gray-500">
                            -${Number(payment.discount || 0).toFixed(2)} discount
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status]
                            }`}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefund(payment.id)}
                            disabled={refundingId === payment.id}
                          >
                            {refundingId === payment.id ? 'Processing...' : 'Refund'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
