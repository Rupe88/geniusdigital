'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FileUpload } from '@/components/ui/FileUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { TagInput } from '@/components/ui/TagInput';
import { BulletListInput } from '@/components/ui/BulletListInput';
import { CurriculumBuilder } from './CurriculumBuilder';
import { Course, Category, Instructor } from '@/lib/types/course';
import { CreateCourseData } from '@/lib/api/courses';
import { generateSlug } from '@/lib/utils/helpers';
import { showError } from '@/lib/utils/toast';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const courseSchema = z.object({
  // Step 1 – only title required; thumbnail validated on submit
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  slug: z.string().optional(),
  instructorId: z.string().uuid().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),

  // Step 2
  shortDescription: z.string().max(500, 'Short description must be less than 500 characters').optional(),
  description: z.string().optional(),
  price: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined;
    const n = typeof val === 'string' ? Number(val) : val;
    return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
  }, z.number().min(0, 'Price must be positive').optional()),
  originalPrice: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined;
    const n = typeof val === 'string' ? Number(val) : val;
    return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
  }, z.number().min(0, 'Original price must be positive').optional()),
  isFree: z.boolean().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  duration: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined;
    const n = typeof val === 'string' ? Number(val) : val;
    return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
  }, z.number().min(0, 'Duration must be positive').optional()),
  language: z.enum(['en', 'ne', 'hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'mai', 'bh']).optional(),
  tags: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),

  // Step 3
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'ONGOING', 'UPCOMING_EVENTS', 'POPULAR']).optional(),
  featured: z.boolean().optional(),
  isOngoing: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Allow both full URLs (YouTube, https://...) and internal paths (/api/media/...)
  videoUrl: z
    .string()
    .optional(),
});

type CourseFormData = z.infer<typeof courseSchema> & {
  thumbnailFile?: File | null;
  videoFile?: File | null;
  tags?: string[];
  skills?: string[];
};

interface CourseFormProps {
  course?: Course;
  categories: Category[];
  instructors: Instructor[];
  onSubmit: (data: CreateCourseData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CourseForm: React.FC<CourseFormProps> = React.memo(({
  course,
  categories,
  instructors,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const searchParams = useSearchParams();
  const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
  const safeStep = stepFromUrl >= 1 && stepFromUrl <= 4 ? stepFromUrl : 1;
  const [currentStep, setCurrentStep] = useState(safeStep);

  // Sync step from URL when landing on edit?step=3 (e.g. after creating course)
  useEffect(() => {
    setCurrentStep(safeStep);
  }, [safeStep]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    course?.thumbnail || null
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const MAX_PROMO_VIDEOS = 5;
  // Promo videos use file uploads only, but we still show any existing
  // promo video URLs from the course so admins know something is already saved.
  const initialPromoSlots = (): Array<{ url: string; file: File | null }> => {
    const urls = course?.promoVideos?.length
      ? [...course.promoVideos]
      : course?.videoUrl
        ? [course.videoUrl]
        : [];
    const slots = urls
      .slice(0, MAX_PROMO_VIDEOS)
      .map((url) => ({ url: url || '', file: null as File | null }));
    while (slots.length < MAX_PROMO_VIDEOS) slots.push({ url: '', file: null });
    return slots;
  };
  const [promoSlots, setPromoSlots] = useState<Array<{ url: string; file: File | null }>>(initialPromoSlots);

  useEffect(() => {
    // When course changes, refresh display of existing promo video URLs.
    setPromoSlots(initialPromoSlots());
  }, [course?.id, course?.promoVideos?.length, course?.videoUrl]);

  // Curriculum state
  const [curriculumChapters, setCurriculumChapters] = useState<any[]>([]);
  const [curriculumLessons, setCurriculumLessons] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const isSettingSlugProgrammatically = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
    trigger,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as Resolver<CourseFormData>,
    defaultValues: course
      ? {
        title: course.title,
        slug: course.slug,
        instructorId: course.instructorId,
        categoryId: course.categoryId || '',
        shortDescription: course.shortDescription || '',
        description: course.description || '',
        price: course.price,
        isFree: course.isFree,
        level: course.level || undefined,
        duration: course.duration || undefined,
        language: (course.language && ['en', 'ne', 'hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'mai', 'bh'].includes(course.language) ? course.language as 'en' | 'ne' | 'hi' | 'mr' | 'bn' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'as' | 'mai' | 'bh' : 'ne'),
        tags: course.tags ? (Array.isArray(course.tags) ? course.tags : course.tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
        originalPrice: course.originalPrice || undefined,
        learningOutcomes: Array.isArray(course.learningOutcomes)
          ? course.learningOutcomes
          : (course.learningOutcomes && typeof course.learningOutcomes === 'string')
            ? (course.learningOutcomes as string).split('\n').map(l => l.trim()).filter(Boolean)
            : [],
        skills: Array.isArray(course.skills)
          ? course.skills
          : (course.skills && typeof course.skills === 'string')
            ? (course.skills as string).split(',').map(s => s.trim()).filter(Boolean)
            : [],
        status: course.status,
        featured: course.featured,
        isOngoing: course.isOngoing,
        startDate: course.startDate ? course.startDate.split('T')[0] : '',
        endDate: course.endDate ? course.endDate.split('T')[0] : '',
        videoUrl: course.videoUrl || '',
      }
      : {
        title: '',
        slug: '',
        instructorId: '',
        categoryId: '',
        language: 'ne',
        skills: [],
        tags: [],
        status: 'PUBLISHED',
        isFree: false,
        featured: false,
        isOngoing: false,
      },
    mode: 'onChange', // Changed to onChange to enable real-time slug generation
  });

  const title = watch('title');
  const slug = watch('slug');
  const isFree = watch('isFree');
  const price = watch('price');
  const watchTags = watch('tags');
  const watchSkills = watch('skills');
  const watchLearningOutcomes = watch('learningOutcomes');

  // Auto-generate slug from title when creating a new course (backup via useEffect)
  useEffect(() => {
    // Only auto-generate if:
    // 1. Creating new course (not editing existing one)
    // 2. Title field has content
    // 3. Slug field hasn't been manually edited
    if (!course && title && title.trim() && !slugManuallyEdited) {
      const generatedSlug = generateSlug(title);
      // Only update if the generated slug is different from current
      if (generatedSlug && generatedSlug.trim() && slug !== generatedSlug) {
        // Mark that we're setting this programmatically
        isSettingSlugProgrammatically.current = true;
        setValue('slug', generatedSlug, { 
          shouldValidate: false, 
          shouldDirty: false,
          shouldTouch: false 
        });
        // Reset the flag after a short delay
        setTimeout(() => {
          isSettingSlugProgrammatically.current = false;
        }, 100);
      }
    } else if (!course && (!title || !title.trim()) && slug) {
      // Clear slug if title is cleared
      if (!slugManuallyEdited) {
        isSettingSlugProgrammatically.current = true;
        setValue('slug', '', { 
          shouldValidate: false, 
          shouldDirty: false,
          shouldTouch: false 
        });
        setTimeout(() => {
          isSettingSlugProgrammatically.current = false;
        }, 100);
      }
    }
  }, [title, slug, course, setValue, slugManuallyEdited]);

  const handleFileChange = useCallback((file: File | null) => {
    setThumbnailFile(file);
    if (file) {
      // Check file size before processing (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setThumbnailPreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(course?.thumbnail || null);
    }
  }, [course?.thumbnail]);

  const handleFileRemove = () => {
    setThumbnailFile(null);
    setThumbnailPreview(course?.thumbnail || null);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fields: (keyof CourseFormData)[] = [];

    if (step === 1) {
      fields = ['title', 'instructorId'];
    } else if (step === 2) {
      // Only require price if course is not free
      const baseFields: (keyof CourseFormData)[] = ['shortDescription', 'description', 'level', 'duration', 'language', 'tags'];
      if (!isFree) {
        baseFields.push('price');
      }
      fields = baseFields;
    } else if (step === 4) {
      fields = ['status', 'featured', 'isOngoing', 'startDate', 'endDate'];
    }

    const result = await trigger(fields as (keyof CourseFormData)[]);
    return result;
  };

  const handleNext = async () => {
    // Skip validation for curriculum step (step 3)
    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }

    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onFormSubmit = async (data: CourseFormData) => {
    // Prevent multiple submissions
    if (isSubmitting || isUploading) {
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUploading(true);
      setUploadProgress(0);

      const learningOutcomes = data.learningOutcomes;
      const skills = data.skills;

      // Required: title and thumbnail (for new course)
      if (!data.title || !data.title.trim()) {
        throw new Error('Title is required');
      }
      if (!course && !thumbnailFile) {
        throw new Error('Thumbnail is required');
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (data.instructorId && data.instructorId.trim() && !uuidRegex.test(data.instructorId.trim())) {
        throw new Error('Invalid instructor selected.');
      }

      const submitData: CreateCourseData & { curriculumData?: { chapters: any[], lessons: any[] } } = {
        title: data.title.trim(),
        slug: data.slug?.trim() || undefined,
        instructorId: data.instructorId?.trim() || undefined,
        categoryId: data.categoryId && data.categoryId.trim() ? data.categoryId.trim() : undefined,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        price: data.price !== undefined && !Number.isNaN(Number(data.price)) ? Number(data.price) : undefined,
        originalPrice: data.originalPrice !== undefined && !Number.isNaN(Number(data.originalPrice)) ? Number(data.originalPrice) : undefined,
        isFree: data.isFree || false,
        status: data.status || 'PUBLISHED',
        level: data.level || undefined,
        duration: data.duration !== undefined && !Number.isNaN(Number(data.duration)) ? Number(data.duration) : undefined,
        language: data.language || 'en',
        featured: data.featured || false,
        isOngoing: data.isOngoing || false,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        tags: data.tags && data.tags.length > 0 ? data.tags.join(',') : undefined,
        learningOutcomes,
        skills,
        thumbnailFile: thumbnailFile || undefined,
        onProgress: (progress: number) => {
          requestAnimationFrame(() => setUploadProgress(progress));
        },
      };
      // Backend requires thumbnail on update too; if admin didn't pick a new file,
      // send the existing thumbnail URL (S3/signed URL) so validation passes.
      if (course && !thumbnailFile && course.thumbnail) {
        submitData.thumbnail = course.thumbnail;
      }

      const builtSlots = promoSlots
        .slice(0, MAX_PROMO_VIDEOS)
        .map((s) => (s.file ? ({ type: 'file' } as const) : null))
        .filter((x): x is { type: 'file' } => x != null);
      const builtFiles = promoSlots.filter((s) => s.file).map((s) => s.file!);

      // Only send promo video payload when user has selected new files.
      // Existing promo videos (stored as URLs on the course) are kept as-is by the backend.
      if (builtSlots.length > 0) {
        submitData.promoVideoSlots = builtSlots;
        submitData.videoFiles = builtFiles;
      }

      // Add curriculum data if it exists
      if (curriculumChapters.length > 0) {
        submitData.curriculumData = {
          chapters: curriculumChapters,
          lessons: curriculumLessons,
        };
      }

      // Final validation before submission
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error; // Re-throw to let parent handle error
    } finally {
      // Clean up state
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Removed automatic advance to ensure Step 2 (Details) remains accessible
  // when a course object is already present (e.g., on the Edit page).

  const onValidationError = (errors: Record<string, { message?: string }>) => {
    const firstError = Object.values(errors)[0]?.message;
    showError(firstError || 'Please fix the errors in the form before submitting.');
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit, onValidationError)}
      noValidate
      className="space-y-6"
    >
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={async () => {
                  if (step < currentStep) {
                    setCurrentStep(step);
                  } else if (step > currentStep) {
                    const isValid = await validateStep(currentStep);
                    if (isValid) {
                      setCurrentStep(step);
                    }
                  }
                }}
              >
                <div
                  className={`w-10 h-10 rounded-none flex items-center justify-center font-semibold transition-all group-hover:scale-110 smooth-transition ${currentStep >= step
                    ? 'bg-[var(--primary-700)] text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {step}
                </div>
                <span className="mt-2 text-xs text-[var(--muted-foreground)] text-center">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Details'}
                  {step === 3 && 'Curriculum'}
                  {step === 4 && 'Publish'}
                </span>
              </div>
              {step < 4 && (
                <div
                  className={`flex-1 h-1 mx-4 ${currentStep > step ? 'bg-[var(--primary-700)]' : 'bg-gray-200'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Inline progress (compact) when loading only */}
        {!isUploading && isLoading && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary-600)] rounded-full animate-pulse w-1/3" />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">Processing...</span>
          </div>
        )}
      </div>

      {/* Upload overlay: accurate percentage, clear progress bar */}
      {(isUploading || isLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          aria-modal="true"
          role="dialog"
          aria-label="Upload progress"
          aria-busy="true"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-xl p-8 w-full max-w-md mx-4 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {uploadProgress >= 100 ? 'Finishing...' : uploadProgress >= 95 ? 'Processing on server...' : 'Uploading course'}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {uploadProgress < 5
                  ? 'Preparing files...'
                  : uploadProgress < 95
                    ? 'Sending video & files — please wait'
                    : uploadProgress < 100
                      ? 'Server is saving your video. Do not close this page.'
                      : 'Saving course'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-[var(--foreground)]">Progress</span>
                <span className="tabular-nums text-[var(--primary-600)] font-bold text-base" aria-live="polite">
                  {Math.min(100, Math.round(uploadProgress))}%
                </span>
              </div>
              <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary-600)] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, uploadProgress)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(uploadProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-4 text-center">
              Don&apos;t close this page. Large videos (1GB+) can take 15–30+ min depending on connection.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card padding="lg" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Basic Information</h2>

          <div className="space-y-4">
            <Input
              label="Course Title *"
              {...register('title', {
                onChange: (e) => {
                  // Trigger slug generation immediately when title changes
                  if (!course && !slugManuallyEdited) {
                    const newTitle = e.target.value;
                    if (newTitle && newTitle.trim()) {
                      const generatedSlug = generateSlug(newTitle);
                      if (generatedSlug && generatedSlug.trim()) {
                        const currentSlug = getValues('slug');
                        // Only update if the generated slug is different from current
                        if (currentSlug !== generatedSlug) {
                          isSettingSlugProgrammatically.current = true;
                          setValue('slug', generatedSlug, {
                            shouldValidate: false,
                            shouldDirty: false,
                            shouldTouch: false,
                          });
                          setTimeout(() => {
                            isSettingSlugProgrammatically.current = false;
                          }, 100);
                        }
                      }
                    } else {
                      // Clear slug if title is empty
                      if (!newTitle || !newTitle.trim()) {
                        isSettingSlugProgrammatically.current = true;
                        setValue('slug', '', {
                          shouldValidate: false,
                          shouldDirty: false,
                          shouldTouch: false,
                        });
                        setTimeout(() => {
                          isSettingSlugProgrammatically.current = false;
                        }, 100);
                      }
                    }
                  }
                },
              })}
              error={errors.title?.message}
              placeholder="Enter course title"
            />


            <Input
              label="Slug"
              {...register('slug', {
                onChange: (e) => {
                  // Only mark as manually edited if the change wasn't programmatic
                  if (!isSettingSlugProgrammatically.current) {
                    const inputValue = e.target.value;
                    // If user types something different from auto-generated, mark as edited
                    if (inputValue && inputValue.trim()) {
                      setSlugManuallyEdited(true);
                    }
                  }
                },
              })}
              error={errors.slug?.message}
              helperText="URL-friendly identifier (auto-generated from title)"
              placeholder="course-slug"
            />

            <Select
              label="Instructor"
              {...register('instructorId')}
              error={errors.instructorId?.message}
              options={[
                { value: '', label: 'Select an instructor (optional)' },
                ...instructors.map((inst) => ({ value: inst.id, label: inst.name })),
              ]}
            />

            <Select
              label="Category"
              {...register('categoryId')}
              error={errors.categoryId?.message}
              options={[
                { value: '', label: 'Select a category (optional)' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />

            <FileUpload
              label="Thumbnail *"
              accept="image/*"
              maxSize={10}
              value={thumbnailPreview || thumbnailFile}
              onChange={handleFileChange}
              onRemove={handleFileRemove}
              error={errors.thumbnailFile?.message as string}
              helperText="Upload a course thumbnail image (max 10MB)"
            />
          </div>
        </Card>
      )}

      {/* Step 2: Details & Settings */}
      {currentStep === 2 && (
        <Card padding="lg" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Details & Settings</h2>

          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Promo videos (optional, up to 5) – upload video files for course preview
              </p>
              {promoSlots.map((slot, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-2"
                >
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Video {index + 1}
                  </label>

                  {slot.url && !slot.file && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Existing promo video is already saved for this slot. Upload a new file below only
                      if you want to replace it.
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="block w-full max-w-xs text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:bg-[var(--primary-600)] file:text-white file:font-medium hover:file:bg-[var(--primary-700)]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPromoSlots((prev) => {
                          const next = [...prev];
                          next[index] = { url: slot.url, file: f || null };
                          return next;
                        });
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {slot.file && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Selected: {slot.file.name} ({(slot.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Textarea
              label="Short Description"
              {...register('shortDescription')}
              error={errors.shortDescription?.message}
              helperText="Brief description (max 500 characters)"
              rows={3}
              placeholder="A short summary of the course"
            />

            <Textarea
              label="Full Description"
              {...register('description')}
              error={errors.description?.message}
              helperText="Detailed course description"
              rows={6}
              placeholder="Full course description..."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    {...register('isFree')}
                    className="rounded-none"
                  />
                  <label htmlFor="isFree" className="text-sm font-medium text-[var(--foreground)]">
                    Free Course
                  </label>
                </div>
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { valueAsNumber: true })}
                  error={errors.price?.message}
                  disabled={isFree}
                  placeholder="0.00"
                />
                <Input
                  label="Original Price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('originalPrice', { valueAsNumber: true })}
                  error={errors.originalPrice?.message}
                  disabled={isFree}
                  placeholder="0.00"
                  helperText="Original price to show discount"
                />
              </div>

              <Select
                label="Level"
                {...register('level')}
                error={errors.level?.message}
                options={[
                  { value: '', label: 'Select level (optional)' },
                  { value: 'Beginner', label: 'Beginner' },
                  { value: 'Intermediate', label: 'Intermediate' },
                  { value: 'Advanced', label: 'Advanced' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                min="0"
                {...register('duration', { valueAsNumber: true })}
                error={errors.duration?.message}
                placeholder="60"
              />

              <Select
                label="Language"
                {...register('language')}
                error={errors.language?.message}
                options={[
                  { value: 'ne', label: 'Nepali (नेपाली)' },
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'Hindi (हिन्दी)' },
                  { value: 'mr', label: 'Marathi (मराठी)' },
                  { value: 'bn', label: 'Bengali (বাংলা)' },
                  { value: 'te', label: 'Telugu (తెలుగు)' },
                  { value: 'ta', label: 'Tamil (தமிழ்)' },
                  { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
                  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
                  { value: 'ml', label: 'Malayalam (മലയാളം)' },
                  { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
                  { value: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
                  { value: 'as', label: 'Assamese (অসমীয়া)' },
                  { value: 'mai', label: 'Maithili (मैथिली)' },
                  { value: 'bh', label: 'Bhojpuri (भोजपुरी)' },
                ]}
              />
            </div>

            <TagInput
              label="Tags"
              value={watchTags}
              onChange={(tags) => setValue('tags', tags)}
              placeholder="Add course tags..."
              suggestions={[
                'Vastu Shastra',
                'Numerology',
                'Astrology',
                'Feng Shui',
                'Meditation',
                'Yoga',
                'Spiritual',
                'Wellness',
                'Healing',
                'Energy',
                'Architecture',
                'Design',
                'Construction',
                'Home',
                'Business',
                'Success',
                'Wealth',
                'Health',
                'Relationships',
                'Career',
              ]}
              maxTags={15}
              error={errors.tags?.message}
              helperText="Add relevant tags to help students find your course"
            />

            <BulletListInput
              label="Learning Outcomes"
              value={watchLearningOutcomes || []}
              onChange={(outcomes) => setValue('learningOutcomes', outcomes)}
              placeholder="What you'll learn... (e.g. Master Vastu principles for home)"
              helperText="Enter one learning outcome at a time. Be specific and clear."
              error={errors.learningOutcomes?.message}
            />

            <BulletListInput
              label="Skills You'll Gain"
              value={watchSkills || []}
              onChange={(skills) => setValue('skills', skills)}
              placeholder="Add a skill... (e.g. Vastu Consultation)"
              helperText="Add relevant skills that students will gain from this course."
              error={errors.skills?.message}
            />

            {/* Special button to save basic info and jump to curriculum */}
            {!course && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const isValid = await validateStep(2);
                    if (isValid) {
                      const data = getValues();
                      onFormSubmit(data);
                    }
                  }}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Save & Build Curriculum
                </Button>
              </div>
            )}
            {/* Curriculum placeholder removed from Step 2 for clarity */}
          </div>
        </Card>
      )}

      {/* Step 3: Curriculum Builder */}
      {currentStep === 3 && (
        <Card padding="lg" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Curriculum</h2>
          {course ? (
            <>
              {/* Course Info Banner */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-none flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Course saved successfully!</p>
                    <p className="text-sm text-green-600">Now add chapters and lessons to your course.</p>
                  </div>
                </div>
              </div>
              <CurriculumBuilder key={course.id} courseId={course.id} />
            </>
          ) : (
            <div className="text-center py-12">
              {/* Visual Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-none flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Save Your Course First</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                Before adding chapters and lessons, we need to save your course details.
                Click the button below to save and continue building your curriculum.
              </p>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-none p-4 mb-6 max-w-md mx-auto text-left">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Your course will be saved as a draft
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> You can add chapters and lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Publish when you're ready
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={isLoading || isSubmitting}
                isLoading={isLoading || isSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  // Validate Steps 1 and 2 first
                  const step1Valid = await trigger(['title', 'instructorId']);
                  if (!step1Valid) {
                    setCurrentStep(1);
                    return;
                  }

                  // Validate Step 2 fields
                  const step2Fields: (keyof CourseFormData)[] = ['shortDescription', 'description', 'level', 'duration', 'language', 'tags'];
                  if (!getValues('isFree')) {
                    step2Fields.push('price');
                  }

                  const step2Valid = await trigger(step2Fields);
                  if (!step2Valid) {
                    setCurrentStep(2);
                    return;
                  }

                  // Save as draft
                  setValue('status', 'DRAFT');
                  await handleSubmit(onFormSubmit)(e);
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Course & Build Curriculum
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 4: Publish & Schedule */}
      {currentStep === 4 && (
        <Card padding="lg" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Publish & Schedule</h2>

          <div className="bg-[var(--muted)]/30 rounded-none p-6 border border-[var(--border)] mb-8">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Course Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Title</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{getValues('title') || 'Not set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Instructor</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {instructors.find(i => i.id === getValues('instructorId'))?.name || 'Not selected'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Price</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {getValues('isFree') ? 'Free' : `Rs. ${getValues('price') || 0}`}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Level</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{getValues('level') || 'Not set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Language</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{getValues('language') || 'English'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Status</span>
                <span className="text-sm font-medium">
                  <span className={`px-2 py-0.5 rounded-none text-xs ${getValues('status') === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {getValues('status') || 'PUBLISHED'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Publishing Options</h3>
              <Select
                label="Publish Status"
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'ONGOING', label: 'Ongoing' },
                  { value: 'ARCHIVED', label: 'Archived' },
                  { value: 'UPCOMING_EVENTS', label: 'Upcoming Events' },
                  { value: 'POPULAR', label: 'Popular' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center p-3 rounded-none border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    id="featured"
                    {...register('featured')}
                    className="w-4 h-4 rounded-none text-[var(--primary)] border-[var(--border)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="featured" className="ml-3 text-sm font-semibold text-[var(--foreground)]">
                    Featured Course
                  </label>
                </div>

                <div className="flex items-center p-3 rounded-none border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    id="isOngoing"
                    {...register('isOngoing')}
                    className="w-4 h-4 rounded-none text-[var(--primary)] border-[var(--border)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="isOngoing" className="ml-3 text-sm font-semibold text-[var(--foreground)]">
                    Ongoing Course
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Availability Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                />

                <Input
                  label="End Date"
                  type="date"
                  {...register('endDate')}
                  error={errors.endDate?.message}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Leave dates empty if the course is always available. Start date is required for scheduled courses.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-[var(--border)]">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevious}>
              <HiChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} className="ml-2">
              Cancel
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Next
              <HiChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={async (e) => {
                  e.preventDefault();
                  setValue('status', 'DRAFT');
                  await handleSubmit(onFormSubmit, onValidationError)(e);
                }}
                disabled={isLoading || isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || isSubmitting}
                isLoading={isLoading || isSubmitting}
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(onFormSubmit, onValidationError)(e);
                }}
              >
                {course ? 'Update Course' : 'Create Course'}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
});

