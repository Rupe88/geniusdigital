'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { useUnoptimizedForStorage, getStorageImageSrc } from '@/lib/utils/storage';
import { getApiBaseUrl } from '@/lib/api/axios';

/**
 * Next/Image wrapper that sets unoptimized for storage URLs (S3/DataHub or Cloudinary).
 * S3 images use the backend proxy (/api/media/image?url=...) to avoid 403 from private bucket.
 */
export function StorageImage({
  src,
  alt,
  unoptimized: unoptimizedProp,
  ...rest
}: ImageProps) {
  const srcStr = typeof src === 'string' ? src : undefined;
  const fromStorage = useUnoptimizedForStorage(srcStr);
  const unoptimized = unoptimizedProp ?? fromStorage;

  const resolvedSrc =
    typeof src === 'string' && src
      ? getStorageImageSrc(src, getApiBaseUrl()) || src
      : src;

  return <Image src={resolvedSrc} alt={alt} unoptimized={unoptimized} {...rest} />;
}
