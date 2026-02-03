'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import * as adminApi from '@/lib/api/admin';
import { InstructorEarning } from '@/lib/api/admin';
import * as instructorsApi from '@/lib/api/instructors';
import { Instructor } from '@/lib/types/course';
import { HiPlus, HiX, HiTrendingUp, HiTrendingDown, HiCash } from 'react-icons/hi';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';

interface SalaryPayment {
  id: string;
  instructorId: string;
  amount: number;
  paymentDate: string;
  description: string;
  status: string;
  instructor?: Instructor;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
}

export default function SalaryManagementPage() {
  const [earnings, setEarnings] = useState<InstructorEarning[]>([]);
  const [salarySummary, setSalarySummary] = useState<adminApi.SalarySummary | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'PENDING',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Create salary form
  const [salaryForm, setSalaryForm] = useState({
    instructorId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'BANK_TRANSFER',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [filters]);

  const fetchInitialData = async () => {
    await Promise.all([
      fetchInstructors(),
      fetchSalarySummary(),
      fetchFinancialSummary(),
      fetchEarnings(),
    ]);
  };

  const fetchInstructors = async () => {
    try {
      const response = await instructorsApi.getAllInstructors();
      setInstructors(response.data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInstructorEarnings(filters);
      setEarnings(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalarySummary = async () => {
    try {
      const data = await adminApi.getSalarySummary();
      setSalarySummary(data);
    } catch (error) {
      console.error('Error fetching salary summary:', error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const dashboard = await adminApi.getDashboardStats();
      const income = dashboard.totalRevenue || 0;
      const expense = (salarySummary?.totalSalaries || 0);
      const netProfit = income - expense;
      const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

      setFinancialSummary({
        totalIncome: income,
        totalExpense: expense,
        netProfit,
        profitMargin,
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salaryForm.instructorId || !salaryForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // This will create both an expense and update instructor earnings
      await adminApi.createManualSalaryPayment({
        instructorId: salaryForm.instructorId,
        amount: parseFloat(salaryForm.amount),
        paymentDate: salaryForm.paymentDate,
        description: salaryForm.description || `Manual salary payment`,
        paymentMethod: salaryForm.paymentMethod,
      });

      toast.success('Salary payment created and recorded as expense');
      setShowCreateModal(false);
      setSalaryForm({
        instructorId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'BANK_TRANSFER',
      });

      fetchInitialData();
    } catch (error) {
      console.error('Error creating salary:', error);
      toast.error(Object(error).message || 'Failed to create salary payment');
    }
  };

  const handleMarkPaid = async () => {
    if (selectedEarnings.length === 0) {
      toast.error('Please select earnings to mark as paid');
      return;
    }

    try {
      await adminApi.markInstructorEarningsPaid({
        earningIds: selectedEarnings,
        paidAt: new Date().toISOString(),
        paymentMethod: 'BANK_TRANSFER',
      });
      setSelectedEarnings([]);
      setShowPaymentModal(false);
      toast.success('Earnings marked as paid successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Error marking earnings as paid:', error);
      toast.error('Failed to mark earnings as paid');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedEarnings((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEarnings.length === earnings.length) {
      setSelectedEarnings([]);
    } else {
      setSelectedEarnings(earnings.map((e) => e.id));
    }
  };

  const totalSelectedAmount = earnings
    .filter((e) => selectedEarnings.includes(e.id))
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Salary Management</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Instructor commission and salary tracking with P/L</p>
        </div>
        <div className="flex gap-3">
          {selectedEarnings.length > 0 && (
            <Button onClick={() => setShowPaymentModal(true)} variant="primary">
              Mark {selectedEarnings.length} as Paid
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            <HiPlus className="h-5 w-5 mr-2" />
            Create Salary Payment
          </Button>
        </div>
      </div>

      {/* Financial Overview with P/L */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card padding="lg" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Income</p>
              <p className="text-3xl font-bold text-green-800 mt-1">
                {formatCurrency(financialSummary.totalIncome)}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <HiTrendingUp className="h-8 w-8 text-green-700" />
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Total Expense</p>
              <p className="text-3xl font-bold text-red-800 mt-1">
                {formatCurrency(financialSummary.totalExpense)}
              </p>
            </div>
            <div className="bg-red-200 p-3 rounded-full">
              <HiTrendingDown className="h-8 w-8 text-red-700" />
            </div>
          </div>
        </Card>

        <Card padding="lg" className={`bg-gradient-to-br ${financialSummary.netProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${financialSummary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Profit/Loss</p>
              <p className={`text-3xl font-bold mt-1 ${financialSummary.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                {formatCurrency(financialSummary.netProfit)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${financialSummary.netProfit >= 0 ? 'bg-blue-200' : 'bg-orange-200'}`}>
              <HiCash className={`h-8 w-8 ${financialSummary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`} />
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div>
            <p className="text-sm text-purple-700 font-medium">Profit Margin</p>
            <p className="text-3xl font-bold text-purple-800 mt-1">
              {financialSummary.profitMargin.toFixed(1)}%
            </p>
            <div className="mt-2 bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.abs(financialSummary.profitMargin), 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Salary Summary */}
      {salarySummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card padding="lg">
            <p className="text-sm text-[var(--muted-foreground)]">Total Salaries</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {formatCurrency(salarySummary.totalSalaries || 0)}
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-sm text-[var(--muted-foreground)]">Paid Salaries</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(salarySummary.paidSalaries || 0)}
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-sm text-[var(--muted-foreground)]">Pending Salaries</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {formatCurrency(salarySummary.pendingSalaries || 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'PAID', label: 'Paid' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </Card>

      {/* Earnings Table */}
      <Card padding="lg">
        {selectedEarnings.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded flex justify-between items-center">
            <span className="font-semibold">
              {selectedEarnings.length} selected • Total: {formatCurrency(totalSelectedAmount)}
            </span>
            <button
              onClick={selectAll}
              className="text-blue-600 hover:underline text-sm"
            >
              {selectedEarnings.length === earnings.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center py-8">Loading earnings...</p>
        ) : earnings.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted-foreground)]">No earnings found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedEarnings.length === earnings.length && earnings.length > 0}
                      onChange={selectAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4">Instructor</th>
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Commission Rate</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning: any) => (
                  <tr key={earning.id} className="border-b hover:bg-[var(--muted)]">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedEarnings.includes(earning.id)}
                        onChange={() => toggleSelection(earning.id)}
                      />
                    </td>
                    <td className="py-3 px-4">{earning.instructor?.name || 'N/A'}</td>
                    <td className="py-3 px-4">{earning.course?.title || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {formatCurrency(parseFloat(earning.amount.toString()))}
                    </td>
                    <td className="py-3 px-4">{earning.commissionRate}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${earning.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : earning.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {earning.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatDate(earning.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="ghost"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Create Salary Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card padding="lg" className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Salary Payment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSalary} className="space-y-4">
              <Select
                label="Instructor *"
                value={salaryForm.instructorId}
                onChange={(e) => setSalaryForm({ ...salaryForm, instructorId: e.target.value })}
                options={[
                  { value: '', label: 'Select Instructor' },
                  ...instructors.map(inst => ({
                    value: inst.id,
                    label: inst.name,
                  })),
                ]}
                required
              />

              <Input
                label="Amount (NPR) *"
                type="number"
                step="0.01"
                value={salaryForm.amount}
                onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                placeholder="Enter amount"
                required
              />

              <Input
                label="Payment Date *"
                type="date"
                value={salaryForm.paymentDate}
                onChange={(e) => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                required
              />

              <Input
                label="Description"
                value={salaryForm.description}
                onChange={(e) => setSalaryForm({ ...salaryForm, description: e.target.value })}
                placeholder="e.g., Monthly salary for January 2026"
              />

              <Select
                label="Payment Method"
                value={salaryForm.paymentMethod}
                onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}
                options={[
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'CASH', label: 'Cash' },
                  { value: 'ESEWA', label: 'eSewa' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This payment will be automatically recorded as an expense in the SALARY category.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Create Payment
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card padding="lg" className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Mark Earnings as Paid</h2>
            <p className="mb-4 text-[var(--muted-foreground)]">
              You are about to mark {selectedEarnings.length} earnings as paid. Total amount: {formatCurrency(totalSelectedAmount)}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleMarkPaid} variant="primary" className="flex-1">
                Confirm Payment
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
