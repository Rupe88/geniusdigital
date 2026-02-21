'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryForm } from '@/components/admin/GalleryForm';
import { GalleryItem, UpdateGalleryItemData } from '@/lib/api/gallery';
import * as galleryApi from '@/lib/api/gallery';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Card } from '@/components/ui/Card';

export default function EditGalleryPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const galleryId = params?.id as string;
  const [galleryItem, setGalleryItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (galleryId) {
      fetchGalleryItem();
    }
  }, [galleryId]);

  const fetchGalleryItem = async () => {
    try {
      setLoading(true);
      const data = await galleryApi.getGalleryItemById(galleryId);
      setGalleryItem(data);
    } catch (error) {
      console.error('Error fetching gallery item:', error);
      showError(Object(error).message || 'Failed to load gallery item');
      router.push('/admin/gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateGalleryItemData) => {
    try {
      if (!galleryId) {
        throw new Error('Gallery item ID is required');
      }
      await galleryApi.updateGalleryItem(galleryId, data);
      showSuccess('Gallery item updated successfully!');
      router.push('/admin/gallery');
    } catch (error) {
      console.error('Error updating gallery item:', error);
      showError(Object(error).message || 'Failed to update gallery item');
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/gallery');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-[var(--muted-foreground)]">Loading gallery item...</div>
        </div>
      </div>
    );
  }

  if (!galleryItem) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <p className="text-[var(--muted-foreground)]">Gallery item not found</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit Gallery Item</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Update gallery item details</p>
      </div>

      <GalleryForm
        galleryItem={galleryItem}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
