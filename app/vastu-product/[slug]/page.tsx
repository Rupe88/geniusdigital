'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiArrowLeft, HiShoppingCart, HiCheckCircle } from 'react-icons/hi';
import { StorageImage } from '@/components/ui/StorageImage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';

type PageParams = {
  slug?: string;
};

export default function VastuProductDetailPage({
  params: paramsPromise,
}: {
  params: Promise<PageParams>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Backend product controller supports ID or slug; we pass slug here.
        const response = await productsApi.getById(slug);
        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Failed to load product', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea] flex flex-col items-center justify-center space-y-4">
        <p className="text-xl font-semibold text-gray-800">Product not found</p>
        <Button variant="outline" onClick={() => router.push('/vastu-product')}>
          Go back to Vastu Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f6] to-[#fde8ea]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/vastu-product')}
          className="mb-6 inline-flex items-center text-sm font-medium text-[var(--primary-700)] hover:text-[var(--primary-900)]"
        >
          <HiArrowLeft className="mr-2" />
          Back to Vastu Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <Card className="p-4 flex flex-col gap-4 rounded-2xl shadow-sm border border-gray-100 bg-white">
            <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <StorageImage
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400 text-sm">
                  No Image Available
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <StorageImage src={img} alt={`${product.name} ${idx + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Product info */}
          <div className="space-y-6">
            <Card className="p-6 md:p-7 space-y-4 rounded-2xl shadow-sm border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">
                    {product.name}
                  </h1>
                  {product.vastuPurpose && (
                    <p className="text-sm font-medium text-red-600">{product.vastuPurpose}</p>
                  )}
                </div>
                {product.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-none bg-red-600 text-white text-xs font-semibold">
                    <HiCheckCircle className="w-4 h-4 mr-1" />
                    Featured
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm text-gray-700">
                {product.material && <p><span className="font-medium">Material:</span> {product.material}</p>}
                {product.category && <p><span className="font-medium">Category:</span> {product.category}</p>}
                {product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height) && (
                  <p>
                    <span className="font-medium">Dimensions:</span>{' '}
                    {[product.dimensions.length, product.dimensions.width, product.dimensions.height]
                      .filter(Boolean)
                      .join(' × ')}{' '}
                    (approx.)
                  </p>
                )}
                <p className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 flex items-center justify-center"
                  disabled={product.stockQuantity <= 0}
                >
                  <HiShoppingCart className="h-5 w-5 mr-2" />
                  {product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </div>
            </Card>

            {product.description && (
              <Card className="p-6 md:p-7 space-y-3 rounded-2xl shadow-sm border border-gray-100 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

