'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import { GalleryItem, CreateGalleryItemData, GalleryType } from '@/lib/api/gallery';
import { HiVideoCamera, HiPhotograph } from 'react-icons/hi';

const gallerySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['IMAGE', 'VIDEO']),
  category: z.string().max(100, 'Category must be less than 100 characters').optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')).or(z.undefined()),
  videoUrl: z.string().url('Invalid URL').optional().or(z.literal('')).or(z.undefined()),
});

type GalleryFormData = z.infer<typeof gallerySchema> & {
  file?: File | null;
};

interface GalleryFormProps {
  galleryItem?: GalleryItem;
  onSubmit: (data: CreateGalleryItemData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const GalleryForm: React.FC<GalleryFormProps> = React.memo(({
  galleryItem,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: galleryItem
      ? {
          title: galleryItem.title,
          description: galleryItem.description || '',
          type: galleryItem.type,
          category: galleryItem.category || '',
          isPublished: galleryItem.isPublished || false,
          featured: galleryItem.featured || false,
          order: galleryItem.order || 0,
          imageUrl: galleryItem.imageUrl || '',
          videoUrl: galleryItem.videoUrl || '',
        }
      : {
          title: '',
          description: '',
          type: 'IMAGE',
          category: '',
          isPublished: false,
          featured: false,
          order: 0,
          imageUrl: '',
          videoUrl: '',
        },
    mode: 'onBlur',
  });

  const type = watch('type');
  const videoUrl = watch('videoUrl');

  // Image: file required (or existing imageUrl when editing). Video: file or URL
  const isFormValid =
    type === 'IMAGE'
      ? !!file || !!(galleryItem?.type === 'IMAGE' && galleryItem?.imageUrl)
      : !!file || !!(videoUrl && videoUrl.trim());

  useEffect(() => {
    // Set preview from existing URLs
    if (galleryItem) {
      if (galleryItem.type === 'VIDEO' && galleryItem.videoUrl) {
        setFilePreview(galleryItem.videoUrl);
        setFileType('video');
      } else if (galleryItem.type === 'IMAGE' && galleryItem.imageUrl) {
        setFilePreview(galleryItem.imageUrl);
        setFileType('image');
      }
    }
  }, [galleryItem]);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      // Check file size (max 50MB for videos, 10MB for images)
      const maxSize = selectedFile.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        setFile(null);
        return;
      }

      // Determine file type
      if (selectedFile.type.startsWith('video/')) {
        setFileType('video');
        setValue('type', 'VIDEO');
      } else {
        setFileType('image');
        setValue('type', 'IMAGE');
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setFilePreview(null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setFilePreview(galleryItem?.imageUrl || galleryItem?.videoUrl || null);
    }
  }, [galleryItem, setValue]);

  const handleFileRemove = () => {
    setFile(null);
    setFilePreview(galleryItem?.imageUrl || galleryItem?.videoUrl || null);
    setFileType(null);
  };

  const onFormSubmit = useCallback(async (data: GalleryFormData) => {
    try {
      // Image: file required (or keep existing when editing). Video: file or URL
      if (data.type === 'IMAGE') {
        if (!file && !(galleryItem?.type === 'IMAGE' && galleryItem?.imageUrl)) {
          alert('Please upload an image file');
          return;
        }
      } else if (!file && !(data.videoUrl && data.videoUrl.trim())) {
        alert('Please upload a video file or provide a video URL');
        return;
      }

      const submitData: CreateGalleryItemData = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
        category: data.category?.trim() || undefined,
        isPublished: data.isPublished || false,
        featured: data.featured || false,
        order: data.order || 0,
        file: file || undefined,
        imageUrl: data.type === 'IMAGE' && galleryItem?.imageUrl && !file ? galleryItem.imageUrl : undefined,
        videoUrl: data.videoUrl && data.videoUrl.trim() ? data.videoUrl.trim() : undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is handled by parent component
    }
  }, [file, onSubmit]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Gallery Item Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Title *"
                {...register('title')}
                error={errors.title?.message}
                placeholder="Enter gallery item title"
              />

              <Textarea
                label="Description"
                {...register('description')}
                error={errors.description?.message}
                rows={4}
                placeholder="Enter description (optional)"
              />

              <Select
                label="Type *"
                {...register('type')}
                error={errors.type?.message}
                options={[
                  { value: 'IMAGE', label: 'Image' },
                  { value: 'VIDEO', label: 'Video' },
                ]}
              />

              <Input
                label="Category"
                {...register('category')}
                error={errors.category?.message}
                placeholder="e.g., Events, Courses, Testimonials"
              />

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {type === 'VIDEO' ? 'Video File' : 'Image File'} *
                </label>
                <FileUpload
                  accept={type === 'VIDEO' ? 'video/*' : 'image/*'}
                  maxSize={type === 'VIDEO' ? 50 : 10}
                  value={filePreview || file}
                  onChange={handleFileChange}
                  onRemove={handleFileRemove}
                  helperText={`Upload ${type === 'VIDEO' ? 'video' : 'image'} file (max ${type === 'VIDEO' ? '50MB' : '10MB'})`}
                />
                {errors.file && (
                  <p className="mt-1 text-sm text-[var(--error)]">{errors.file.message}</p>
                )}
              </div>

              {/* Video URL (optional alternative to file upload) - only for VIDEO type */}
              {type === 'VIDEO' && (
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Or optionally provide a video URL instead of uploading a file:
                  </p>
                  <Input
                    label="Video URL (Optional)"
                    {...register('videoUrl')}
                    error={errors.videoUrl?.message}
                    placeholder="https://example.com/video.mp4"
                    disabled={!!file}
                  />
                </div>
              )}

              {/* Preview */}
              {filePreview && (
                <div className="border-t border-[var(--border)] pt-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Preview
                  </label>
                  <div className="relative aspect-video bg-gray-100 rounded-none overflow-hidden">
                    {fileType === 'video' || type === 'VIDEO' ? (
                      <video
                        src={filePreview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="lg:col-span-1">
          <Card padding="lg">
            <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  {...register('featured')}
                  className="rounded-none"
                />
                <label htmlFor="featured" className="text-sm font-medium text-[var(--foreground)]">
                  Featured Item
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register('isPublished')}
                  className="rounded-none"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-[var(--foreground)]">
                  Publish Item
                </label>
              </div>

              <Input
                label="Display Order"
                type="number"
                min="0"
                {...register('order', { valueAsNumber: true })}
                error={errors.order?.message}
                helperText="Lower numbers appear first"
                placeholder="0"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-[var(--border)]">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading || !isFormValid} 
          isLoading={isLoading}
        >
          {galleryItem ? 'Update Gallery Item' : 'Create Gallery Item'}
        </Button>
      </div>
    </form>
  );
});
