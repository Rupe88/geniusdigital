'use client';

import React, { useRef, useState, useId, useMemo } from 'react';
import { HiUpload, HiX, HiPhotograph, HiVideoCamera } from 'react-icons/hi';
import { classNames } from '@/lib/utils/helpers';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  error?: string;
  helperText?: string;
  value?: File | string | null; // File object or image URL
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  className?: string;
  isUploading?: boolean;
  uploadProgress?: number; // 0-100
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*',
  maxSize = 5,
  error,
  helperText,
  value,
  onChange,
  onRemove,
  className,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  );
  const generatedId = useId();

  // Detect file type from accept prop
  const fileTypeInfo = useMemo(() => {
    const acceptLower = accept.toLowerCase();
    
    if (acceptLower.includes('video') || acceptLower.includes('mp4') || acceptLower.includes('webm') || acceptLower.includes('ogg') || acceptLower.includes('quicktime')) {
      return {
        type: 'video',
        icon: HiVideoCamera,
        uploadText: 'Upload video',
        formatText: 'MP4, WebM, OGG, MOV',
        aspectRatio: ''
      };
    } else if (acceptLower.includes('pdf') || acceptLower.includes('doc') || acceptLower.includes('document')) {
      return {
        type: 'document',
        icon: HiUpload,
        uploadText: 'Upload document',
        formatText: 'PDF, DOC, DOCX',
        aspectRatio: ''
      };
    } else {
      return {
        type: 'image',
        icon: HiPhotograph,
        uploadText: 'Upload thumbnail',
        formatText: 'PNG, JPG',
        aspectRatio: '16:9 recommended'
      };
    }
  }, [accept]);

  const handleFile = (file: File) => {
    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      alert(`Invalid file type. Please upload ${accept}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    onChange?.(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (isUploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isUploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) {
      e.preventDefault();
      return;
    }
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange?.(null);
    onRemove?.();
  };

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}

      {preview && fileTypeInfo.type === 'image' ? (
        <div className="relative inline-block">
          <div className="relative w-40 h-24 rounded-none overflow-hidden border-2 border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-none hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
              aria-label="Remove file"
            >
              <HiX className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)] text-center">
            {fileTypeInfo.type === 'image' ? 'Thumbnail Preview' : 'File Preview'}
          </p>
        </div>
      ) : value && typeof value === 'object' && value instanceof File ? (
        <div className="relative inline-block w-full">
          <div className="relative w-full rounded-none overflow-hidden border-2 border-[var(--border)] shadow-sm hover:shadow-md transition-shadow p-4 bg-[var(--muted)]/30">
            <div className="flex items-center gap-3">
              {React.createElement(fileTypeInfo.icon, { className: "h-8 w-8 text-[var(--muted-foreground)]" })}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {value.name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 bg-red-600 text-white rounded-none hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
                  aria-label="Remove file"
                >
                  <HiX className="h-4 w-4" />
                </button>
              )}
            </div>
            {isUploading && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--muted-foreground)]">Uploading...</span>
                  <span className="text-[var(--primary-600)] font-semibold tabular-nums" aria-live="polite">
                    {Math.min(100, Math.round(uploadProgress))}%
                  </span>
                </div>
                <div className="h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-600)] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, uploadProgress)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round(uploadProgress))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={classNames(
            'relative border-2 border-dashed rounded-none p-4 text-center transition-colors',
            isUploading
              ? 'cursor-not-allowed opacity-60 border-[var(--muted)]'
              : 'cursor-pointer',
            !isUploading && dragActive
              ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
              : !isUploading && error
              ? 'border-[var(--error)]'
              : !isUploading
              ? 'border-[var(--border)] hover:border-[var(--primary-300)]'
              : '',
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            id={generatedId}
            disabled={isUploading}
          />
          {React.createElement(fileTypeInfo.icon, { 
            className: classNames(
              "mx-auto h-6 w-6",
              isUploading ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]"
            )
          })}
          <p className="mt-2 text-sm text-[var(--foreground)]">
            <span className={classNames(
              "font-medium",
              isUploading ? "text-[var(--muted-foreground)]" : "text-[var(--primary-600)]"
            )}>
              {isUploading ? 'Uploading...' : fileTypeInfo.uploadText}
            </span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {isUploading 
              ? `Please wait, uploading ${Math.min(100, Math.round(uploadProgress))}%...`
              : `${fileTypeInfo.formatText} up to ${maxSize}MB${fileTypeInfo.aspectRatio ? ` • ${fileTypeInfo.aspectRatio}` : ''}`
            }
          </p>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-[var(--error)]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{helperText}</p>
      )}
    </div>
  );
};

