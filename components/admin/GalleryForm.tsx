'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GalleryItem, CreateGalleryItemData, GalleryMediaType } from '@/lib/api/gallery';

const gallerySchema = z.object({
  title: z.string().max(255, 'Title must be less than 255 characters').optional().or(z.literal('')),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

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
  isLoading: externalIsLoading = false,
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<GalleryMediaType>(() => {
    if (galleryItem?.mediaType === 'VIDEO') return 'VIDEO';
    if (galleryItem?.videoUrl) return 'VIDEO';
    return 'IMAGE';
  });
  const [videoInputType, setVideoInputType] = useState<'link' | 'upload'>('link');
  const [videoUrlInput, setVideoUrlInput] = useState<string>(galleryItem?.videoUrl || '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isLoading = externalIsLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: galleryItem?.title || '',
    },
    mode: 'onBlur',
  });

  const handleImageFilesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validate size (10MB per image) and type (image/*)
    const validFiles: File[] = [];
    const nextPreviews: string[] = [];

    selectedFiles.forEach((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (!file.type.startsWith('image/')) return;
      if (fileSizeMB > 10) return;

      validFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    });

    setImageFiles(validFiles);
    setImagePreviews(nextPreviews);
  }, []);

  const handleRemoveAll = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleVideoFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const fileSizeMB = file.size / (1024 * 1024);
    // Basic size guard: reuse ~video max 3GB from backend config, but use a smaller practical limit in UI (e.g. 1024MB)
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }
    if (fileSizeMB > 1024) {
      alert('Video file is too large. Please upload a file smaller than 1GB.');
      return;
    }

    setVideoFile(file);
  }, []);

  const onFormSubmit = useCallback(async (data: GalleryFormData) => {
    const trimmedTitle = data.title?.trim() || '';
    const titleChanged = trimmedTitle !== (galleryItem?.title || '');

    const isVideo = mediaType === 'VIDEO';

    const trimmedVideoUrl = videoUrlInput.trim();
    const hasNewImageMedia = !isVideo && imageFiles.length > 0;
    const hasNewVideoMedia =
      isVideo &&
      ((videoInputType === 'link' && !!trimmedVideoUrl) ||
        (videoInputType === 'upload' && !!videoFile));

    const hasNewMedia = hasNewImageMedia || hasNewVideoMedia;

    if (!hasNewMedia && !titleChanged) {
      alert('Please provide new media or update the title.');
      return;
    }

    if (isVideo && !hasNewVideoMedia && !galleryItem?.videoUrl && !titleChanged) {
      alert('Please provide a video file or a valid YouTube/Google Drive link.');
      return;
    }

    if (isVideo && videoInputType === 'link' && trimmedVideoUrl && !/^https?:\/\//i.test(trimmedVideoUrl)) {
      alert('Please enter a valid video URL (starting with http:// or https://).');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateGalleryItemData = {
        title: trimmedTitle || undefined,
        mediaType,
        files: !isVideo && imageFiles.length ? imageFiles : undefined,
        videoUrl: isVideo && videoInputType === 'link' && trimmedVideoUrl ? trimmedVideoUrl : undefined,
        videoFile: isVideo && videoInputType === 'upload' && videoFile ? videoFile : undefined,
      };

      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  }, [imageFiles, mediaType, videoInputType, videoUrlInput, videoFile, onSubmit, galleryItem]);

  const isEditing = useMemo(() => !!galleryItem, [galleryItem]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
          {isEditing ? 'Update Gallery Item' : 'Create Gallery Items'}
        </h2>

        <div className="space-y-4">
          <Input
            label="Title (optional)"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Enter gallery item title (optional)"
          />

          {/* Media type selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Media Type *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`px-4 py-2 text-sm border rounded-none ${
                  mediaType === 'IMAGE'
                    ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                }`}
                onClick={() => setMediaType('IMAGE')}
              >
                Images
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm border rounded-none ${
                  mediaType === 'VIDEO'
                    ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                }`}
                onClick={() => setMediaType('VIDEO')}
              >
                Video
              </button>
            </div>
          </div>

          {/* Image inputs */}
          {mediaType === 'IMAGE' && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Image Files {isEditing ? '(optional)' : '*'}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
                className="block w-full text-sm text-[var(--foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-100)] file:text-[var(--primary-700)] hover:file:bg-[var(--primary-200)]"
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Upload one or many images (max 10MB each). Title applies to all uploads (optional).
              </p>
              {imageFiles.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {imageFiles.length} file{imageFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={handleRemoveAll}
                    >
                      Remove all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div
                        key={preview + idx}
                        className="relative aspect-square rounded-none overflow-hidden border border-[var(--border)]"
                      >
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video inputs */}
          {mediaType === 'VIDEO' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Video Source *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm border rounded-none ${
                      videoInputType === 'link'
                        ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                        : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                    }`}
                    onClick={() => setVideoInputType('link')}
                  >
                    YouTube / Google Drive Link
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm border rounded-none ${
                      videoInputType === 'upload'
                        ? 'bg-[var(--primary-600)] text-white border-[var(--primary-600)]'
                        : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                    }`}
                    onClick={() => setVideoInputType('upload')}
                  >
                    Upload Video File
                  </button>
                </div>
              </div>

              {videoInputType === 'link' ? (
                <Input
                  label="Video URL *"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Paste YouTube or Google Drive link"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Video File *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="block w-full text-sm text-[var(--foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-100)] file:text-[var(--primary-700)] hover:file:bg-[var(--primary-200)]"
                  />
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Upload a single video file. Large files may take longer to upload.
                  </p>
                  {videoFile && (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Selected file: <span className="font-medium text-[var(--foreground)]">{videoFile.name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between items-center pt-6 border-t border-[var(--border)]">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            isEditing 
              ? 'Update Gallery Item' 
              : 'Create Gallery Items'
          )}
        </Button>
      </div>
    </form>
  );
});
