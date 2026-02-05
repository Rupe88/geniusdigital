'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import * as galleryApi from '@/lib/api/gallery';
import { GalleryItem } from '@/lib/api/gallery';
import { PaginatedResponse } from '@/lib/types/api';
import { formatDate } from '@/lib/utils/helpers';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiPencil, HiTrash, HiPlus, HiPhotograph, HiExclamation } from 'react-icons/hi';

export default function AdminGalleryPage() {
  const router = useRouter();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, [pagination.page, search]);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      const response: PaginatedResponse<GalleryItem> = await galleryApi.getAllGalleryItems(params);
      setGalleryItems(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      showError(Object(error).message || 'Failed to load gallery items');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (itemId: string, itemTitle: string) => {
    setDeleteConfirm({ id: itemId, title: itemTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingId(deleteConfirm.id);
      await galleryApi.deleteGalleryItem(deleteConfirm.id);
      showSuccess('Gallery item deleted successfully');
      setDeleteConfirm(null);
      fetchGalleryItems();
    } catch (error) {
      showError(Object(error).message || 'Failed to delete gallery item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const filteredItems = galleryItems.filter((item) => {
    return (item.title || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Gallery</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage gallery images and videos</p>
        </div>
        <Link href="/admin/gallery/new">
          <Button variant="primary">
            <HiPlus className="h-5 w-5 mr-2" />
            Add Gallery Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          />
        </div>
      </Card>

      {/* Gallery Grid */}
      {loading ? (
        <Card padding="lg">
          <div className="text-center py-12">Loading...</div>
        </Card>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-gray-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title || 'Gallery image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiPhotograph className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[var(--foreground)] mb-1 truncate">{item.title || 'Untitled'}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(item.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/admin/gallery/${item.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <HiPencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(item.id, item.title ?? 'Untitled')}
                      disabled={deletingId === item.id}
                    >
                      <HiTrash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="lg">
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            No gallery items found matching your criteria.
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={handleDeleteCancel}
        title="Confirm Delete"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <HiExclamation className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Are you sure you want to delete this gallery item?
            </h3>
            <p className="text-[var(--muted-foreground)]">
              You are about to delete <strong className="text-[var(--foreground)]">"{deleteConfirm?.title}"</strong>. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleDeleteCancel}
            disabled={deletingId !== null}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteConfirm}
            disabled={deletingId !== null}
            isLoading={deletingId !== null}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deletingId ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
