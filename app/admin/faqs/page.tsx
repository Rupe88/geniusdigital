'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiPlus, HiPencil, HiTrash, HiSearch } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { getAllFAQs, deleteFAQ, type FAQ } from '@/lib/api/faq';
import { ROUTES } from '@/lib/utils/constants';
import { getFAQCategoryDisplayName, getFAQCategoryOptions, ALL_FAQ_CATEGORIES } from '@/lib/utils/faqCategories';

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, [categoryFilter]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const data = await getAllFAQs();
      
      // Filter by category if selected
      let filtered = data;
      if (categoryFilter) {
        filtered = data.filter((faq) => faq.category === categoryFilter);
      }
      
      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchLower) ||
            faq.answer.toLowerCase().includes(searchLower)
        );
      }
      
      setFaqs(filtered);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFAQs();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (faqId: string, question: string) => {
    if (!confirm(`Are you sure you want to delete "${question}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(faqId);
      await deleteFAQ(faqId);
      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return <Badge variant="default">Uncategorized</Badge>;
    const displayName = getFAQCategoryDisplayName(category);
    return <Badge variant="info">{displayName}</Badge>;
  };

  const getStatusBadge = (faq: FAQ) => {
    const isActive = (faq as any).isActive !== false;
    const isPublished = faq.published !== false;
    
    if (isActive && isPublished) {
      return <Badge variant="success">Active</Badge>;
    }
    return <Badge variant="warning">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600">Create, edit, and manage frequently asked questions</p>
        </div>
        <Link href={`${ROUTES.ADMIN}/faqs/new`}>
          <Button>
            <HiPlus className="w-5 h-5 mr-2" />
            Create New FAQ
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <HiSearch className="text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...getFAQCategoryOptions(),
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs found. Create your first FAQ to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Question</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq) => (
                  <tr key={faq.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="max-w-md">
                        <p className="font-medium text-gray-900 truncate">{faq.question}</p>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {faq.answer.substring(0, 80)}...
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getCategoryBadge(faq.category)}</td>
                    <td className="py-3 px-4">{getStatusBadge(faq)}</td>
                    <td className="py-3 px-4 text-gray-600">{faq.order}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`${ROUTES.ADMIN}/faqs/${faq.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <HiPencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(faq.id, faq.question)}
                          disabled={deletingId === faq.id}
                        >
                          <HiTrash className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
