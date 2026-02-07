'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { useUnoptimizedForStorage } from '@/lib/utils/storage';

/**
 * Next/Image wrapper that sets unoptimized for storage URLs (S3/DataHub or Cloudinary).
 * Use for any image src that comes from the backend (thumbnails, gallery, products, etc.).
 */
export function StorageImage({
  src,
  alt,
  unoptimized: unoptimizedProp,
  ...rest
}: ImageProps) {
  const fromStorage = useUnoptimizedForStorage(typeof src === 'string' ? src : undefined);
  const unoptimized = unoptimizedProp ?? fromStorage;

  return <Image src={src} alt={alt} unoptimized={unoptimized} {...rest} />;
}
