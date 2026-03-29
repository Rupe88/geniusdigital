'use client';

import React from 'react';
import {
  HiVideoCamera,
  HiClipboardList,
  HiPencilAlt,
  HiPlay,
  HiClipboardCheck,
  HiDocument,
  HiPresentationChartBar,
} from 'react-icons/hi';
import type { Lesson } from '@/lib/types/course';
import { isPresentationAttachmentUrl } from '@/lib/utils/helpers';

export type LessonTypeIconVariant = 'dashboard' | 'marketing';

type Props = {
  lesson: Pick<Lesson, 'lessonType' | 'attachmentUrl'>;
  variant: LessonTypeIconVariant;
  /** sm = sidebar (16px), md = curriculum cards (20px) */
  size?: 'sm' | 'md';
  className?: string;
};

const sizeImg = { sm: 16, md: 20 };

/**
 * Consistent lesson type icons across dashboard learn sidebar, public playlist, progress, and course page.
 * PDF lessons use a presentation icon when `attachmentUrl` ends with .ppt / .pptx.
 */
export function LessonTypeIcon({ lesson, variant, size = 'sm', className }: Props) {
  const { lessonType, attachmentUrl } = lesson;
  const isPresentation = lessonType === 'PDF' && isPresentationAttachmentUrl(attachmentUrl);
  const iconSm = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const imgDim = sizeImg[size];
  const mergedClass = [iconSm, 'flex-shrink-0 object-contain', className].filter(Boolean).join(' ');

  if (variant === 'dashboard') {
    switch (lessonType) {
      case 'VIDEO':
        return <HiVideoCamera className={mergedClass} aria-hidden />;
      case 'QUIZ':
        return <HiClipboardList className={mergedClass} aria-hidden />;
      case 'PDF':
        if (isPresentation) {
          return (
            <HiPresentationChartBar
              className={`${mergedClass} text-amber-600 dark:text-amber-400`}
              aria-label="Presentation"
            />
          );
        }
        return (
          <img
            src="/pdf.png"
            alt=""
            width={imgDim}
            height={imgDim}
            className={mergedClass}
          />
        );
      case 'TEXT':
      case 'ASSIGNMENT':
      default:
        return <HiPencilAlt className={mergedClass} aria-hidden />;
    }
  }

  // marketing: public learn playlist + course landing curriculum
  switch (lessonType) {
    case 'VIDEO':
      return <HiPlay className={mergedClass} aria-hidden />;
    case 'QUIZ':
    case 'ASSIGNMENT':
      return <HiClipboardCheck className={mergedClass} aria-hidden />;
    case 'PDF':
      if (isPresentation) {
        return (
          <HiPresentationChartBar
            className={`${mergedClass} text-orange-600`}
            aria-label="Presentation"
          />
        );
      }
      return (
        <img
          src="/pdf.png"
          alt=""
          width={imgDim}
          height={imgDim}
          className={mergedClass}
        />
      );
    case 'TEXT':
    default:
      return <HiDocument className={mergedClass} aria-hidden />;
  }
}
