
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiArrowLeft, HiCloudUpload, HiX } from 'react-icons/hi';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { productsApi } from '@/lib/api/products';
import { ROUTES } from '@/lib/utils/constants';
import { useUnoptimizedForStorage } from '@/lib/utils/storage';
import toast from 'react-hot-toast';

// Vastu product schema
const vastuProductSchema = z.object({
  // Basic product info
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),

  // Pricing - coerce string to number, then validate
  price: z.coerce
    .number()
    .refine((val) => !isNaN(val), { message: 'Price is required' })
    .refine((val) => val >= 0, { message: 'Price must be a positive number' }),
  
  originalPrice: z.coerce
    .number()
    .refine((val) => isNaN(val) || val >= 0, { message: 'Original price must be a positive number' })
    .transform((val) => isNaN(val) ? undefined : val)
    .optional()
    .or(z.undefined()),

  // Inventory
  stockQuantity: z.coerce
    .number()
    .refine((val) => !isNaN(val), { message: 'Stock quantity is required' })
    .refine((val) => Number.isInteger(val), { message: 'Stock must be an integer' })
    .refine((val) => val >= 0, { message: 'Stock must be a non-negative number' }),

  // Product type (Vastu specific) - with default fallback
  productType: z.enum(['VASTU_ITEM', 'CONSULTATION_PACKAGE', 'DIGITAL_PRODUCT', 'PHYSICAL_PRODUCT'], {
    message: 'Please select a valid product type',
  }),

  // Vastu specific fields
  vastuPurpose: z.string().optional(),
  energyType: z.union([
    z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'BALANCED']),
    z.literal(''),
    z.undefined()
  ]).optional().transform((val) => val === '' ? undefined : val),
  material: z.string().optional(),
  dimensions: z.object({
    length: z.any().optional().transform((val) => {
      if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
        return undefined;
      }
      return typeof val === 'number' ? val : parseFloat(val);
    }).pipe(z.number().min(0).optional()),
    width: z.any().optional().transform((val) => {
      if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
        return undefined;
      }
      return typeof val === 'number' ? val : parseFloat(val);
    }).pipe(z.number().min(0).optional()),
    height: z.any().optional().transform((val) => {
      if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) {
        return undefined;
      }
      return typeof val === 'number' ? val : parseFloat(val);
    }).pipe(z.number().min(0).optional()),
  }).optional(),

  // Category
  category: z.string().optional().or(z.literal('')),

  // Images
  images: z.array(z.string()).optional(),

  // Additional settings
  featured: z.union([z.boolean(), z.undefined()]).optional(),
  published: z.union([z.boolean(), z.undefined()]).optional(),
});

type VastuProductFormData = z.infer<typeof vastuProductSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VastuProductFormData>({
    resolver: zodResolver(vastuProductSchema) as Resolver<VastuProductFormData>,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      price: 0,
      originalPrice: undefined,
      stockQuantity: 0,
      productType: 'VASTU_ITEM',
      energyType: 'POSITIVE',
      vastuPurpose: '',
      material: '',
      category: '',
      dimensions: {
        length: undefined,
        width: undefined,
        height: undefined,
      },
      featured: false,
      published: true,
    },
    mode: 'onBlur', // Changed to onBlur to reduce validation overhead
    shouldFocusError: true, // Focus first error field
  });

  const productType = watch('productType');

  const onSubmit = async (data: VastuProductFormData) => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Safety timeout to prevent stuck loading state
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Form submission taking too long, resetting loading state');
      setLoading(false);
      toast.error('Request is taking longer than expected. Please check your connection and try again.');
    }, 900000); // 15 minutes max

    try {
      setLoading(true);

      console.log('Submitting product data:', {
        name: data.name,
        slug: data.slug,
        price: data.price,
        hasImages: imageFiles.length > 0,
      });

      // Prepare the data for API - map frontend fields to backend fields
      const productData: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        shortDescription: data.shortDescription?.trim() || undefined,
        price: Number(data.price),
        comparePrice: data.originalPrice ? Number(data.originalPrice) : undefined, // Backend expects comparePrice
        stock: Number(data.stockQuantity), // Backend expects stock
        status: data.published ? 'ACTIVE' : 'INACTIVE', // Backend expects status
        featured: data.featured || false,
        category: data.category?.trim() || 'Vastu Products',
        // Vastu specific fields
        productType: data.productType,
        vastuPurpose: data.vastuPurpose?.trim() || undefined,
        energyType: data.energyType || undefined,
        material: data.material?.trim() || undefined,
        dimensions: data.dimensions && (data.dimensions.length || data.dimensions.width || data.dimensions.height) ? data.dimensions : undefined,
        // Images
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
      };

      // Remove undefined values to avoid sending them
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined || productData[key] === '') {
          delete productData[key];
        }
      });

      console.log('Final product data being sent:', {
        name: productData.name,
        slug: productData.slug,
        price: productData.price,
        stock: productData.stock,
        status: productData.status,
        featured: productData.featured,
        imageFilesCount: productData.imageFiles?.length || 0,
      });

      const response = await productsApi.create(productData);

      // Clear safety timeout on success
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (response.success) {
        toast.success('Vastu product created successfully!');
        setLoading(false); // Reset loading before navigation
        router.push(`${ROUTES.ADMIN}/products`);
        return; // Exit early to prevent further execution
      } else {
        const errorMsg = response.message || 'Failed to create product';
        console.error('Product creation failed:', errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      }
    } catch (error: any) {
      // Clear safety timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      console.error('Error creating product:', error);
      let errorMessage = 'An error occurred while creating the product';
      
      if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        const imageCount = imageFiles.length;
        if (imageCount > 0) {
          const totalSizeMB = imageFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
          errorMessage = `Upload timed out after 5+ minutes. You uploaded ${imageCount} image(s) totaling ${totalSizeMB.toFixed(2)}MB. Please try:\n• Reducing image count (max 5 images)\n• Compressing images (max 5MB each)\n• Uploading images one at a time`;
        } else {
          errorMessage = 'Upload timed out. Please try again with smaller images or fewer files.';
        }
      } else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map((e: any) => `${e.param || e.field}: ${e.msg || e.message || 'Invalid value'}`)
          .join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
      setLoading(false); // Always reset loading on error
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Store actual files for upload
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);

    // Create object URLs for preview
    const newImages = newFiles.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const url = prev[index];
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    setValue('slug', slug);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`${ROUTES.ADMIN}/products`}>
            <Button variant="outline" size="sm">
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Vastu Product</h1>
            <p className="text-gray-600">Add a new Vastu product to your store</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        // Extract error messages safely (avoid circular references)
        const errorMessages: string[] = [];
        Object.keys(errors).forEach((field) => {
          const error = errors[field as keyof typeof errors];
          if (error) {
            // Extract message safely - react-hook-form error structure
            const message = 
              (error as any)?.message || 
              (error as any)?.type || 
              'Invalid value';
            errorMessages.push(`${field}: ${message}`);
          }
        });
        
        if (errorMessages.length > 0) {
          console.warn('Form validation failed:', errorMessages.join('; '));
          toast.error(`Please fix the following errors:\n${errorMessages.join('\n')}`, { duration: 8000 });
        } else {
          toast.error('Please check all required fields are filled correctly', { duration: 5000 });
        }
      })} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>

            <div className="space-y-4">
              <Input
                label="Product Name *"
                {...register('name', {
                  onChange: (e) => {
                    handleNameChange(e);
                  },
                })}
                error={errors.name?.message}
                placeholder="e.g., Crystal Pyramid for Positive Energy"
                required
              />

              <Input
                label="Product Slug *"
                {...register('slug')}
                error={errors.slug?.message}
                placeholder="crystal-pyramid-positive-energy"
                required
              />

              <Textarea
                label="Short Description"
                {...register('shortDescription')}
                error={errors.shortDescription?.message}
                placeholder="Brief description for product cards"
                rows={3}
              />

              <Textarea
                label="Full Description *"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Detailed product description"
                rows={5}
                required
              />
            </div>
          </Card>

          {/* Product Type & Vastu Details */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Type & Vastu Details</h3>

            <div className="space-y-4">
              <Select
                label="Product Type"
                {...register('productType')}
                error={errors.productType?.message}
                options={[
                  { value: 'VASTU_ITEM', label: 'Vastu Item' },
                  { value: 'CONSULTATION_PACKAGE', label: 'Consultation Package' },
                  { value: 'DIGITAL_PRODUCT', label: 'Digital Product' },
                  { value: 'PHYSICAL_PRODUCT', label: 'Physical Product' },
                ]}
              />

              {productType === 'VASTU_ITEM' && (
                <>
                  <Input
                    label="Vastu Purpose"
                    {...register('vastuPurpose')}
                    error={errors.vastuPurpose?.message}
                    placeholder="e.g., Remove negative energy, Enhance wealth corner"
                  />

                  <Select
                    label="Energy Type"
                    {...register('energyType')}
                    error={errors.energyType?.message}
                    options={[
                      { value: 'POSITIVE', label: 'Positive Energy' },
                      { value: 'NEGATIVE', label: 'Negative Energy (for correction)' },
                      { value: 'NEUTRAL', label: 'Neutral Energy' },
                      { value: 'BALANCED', label: 'Balanced Energy' },
                    ]}
                  />

                  <Input
                    label="Material"
                    {...register('material')}
                    error={errors.material?.message}
                    placeholder="e.g., Crystal, Wood, Metal, Natural Stone"
                  />
                </>
              )}
            </div>
          </Card>

          {/* Pricing (NPR) */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>

            <div className="space-y-4">
              <Input
                label="Price (NPR) *"
                type="number"
                step="0.01"
                required
                {...register('price')}
                error={errors.price?.message}
                placeholder="0.00"
              />

              <Input
                label="Original Price (Optional, NPR)"
                type="number"
                step="0.01"
                {...register('originalPrice')}
                error={errors.originalPrice?.message}
                placeholder="0.00"
              />
            </div>
          </Card>

          {/* Inventory & Dimensions */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory & Dimensions</h3>

            <div className="space-y-4">
              <Input
                label="Stock Quantity *"
                type="number"
                required
                {...register('stockQuantity')}
                error={errors.stockQuantity?.message}
                placeholder="0"
              />

              {productType === 'PHYSICAL_PRODUCT' && (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Length (cm)"
                    type="number"
                    step="0.1"
                    {...register('dimensions.length')}
                    placeholder="0.0"
                  />
                  <Input
                    label="Width (cm)"
                    type="number"
                    step="0.1"
                    {...register('dimensions.width')}
                    placeholder="0.0"
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    step="0.1"
                    {...register('dimensions.height')}
                    placeholder="0.0"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-none p-6">
                <div className="text-center">
                  <HiCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload product images
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      {image.startsWith('blob:') ? (
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-none"
                        />
                      ) : (
                        <Image
                          src={image}
                          alt={`Product image ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-none"
                          unoptimized={useUnoptimizedForStorage(image)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-none p-1 hover:bg-red-600"
                      >
                        <HiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('featured')}
                    className="rounded-none border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('published')}
                    className="rounded-none border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Published</span>
                </label>
              </div>

              <div className="space-y-4">
                <Input
                  label="Category"
                  {...register('category')}
                  error={errors.category?.message}
                  placeholder="e.g., Vastu Products, Crystals, Yantras"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link href={`${ROUTES.ADMIN}/products`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700"
            isLoading={loading}
          >
            Create Vastu Product
          </Button>
        </div>
      </form>
    </div>
  );
}
