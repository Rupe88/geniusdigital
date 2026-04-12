'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCart, Cart, CartItem } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/orders';
import { createPayment } from '@/lib/api/payments';
import { applyCoupon } from '@/lib/api/cart';
import { useCart } from '@/lib/context/CartContext';
import { showSuccess, showError } from '@/lib/utils/toast';
import { HiShoppingCart, HiArrowLeft } from 'react-icons/hi';
import { ManualPaymentFlow } from '@/components/payments/ManualPaymentFlow';

const defaultShipping = {
  fullName: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Nepal',
  phone: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(defaultShipping);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [manualPayment, setManualPayment] = useState<{
    paymentId: string;
    qrImageUrl: string;
    instructions?: string;
    amountLabel: string;
  } | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
      if (data.couponCode) setCouponCode(data.couponCode);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to load cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const updated = await applyCoupon(couponCode.trim());
      setCart(updated);
      showSuccess('Coupon applied');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      showError('Your cart is empty');
      return;
    }
    const { fullName, address, city, state, postalCode, country, phone } = shipping;
    if (!fullName?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim() || !country?.trim() || !phone?.trim()) {
      showError('Please fill in all shipping address fields');
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        shippingAddress: {
          fullName: fullName.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          phone: phone.trim(),
        },
        couponCode: couponCode.trim() || undefined,
      });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const paymentResponse = await createPayment({
        orderId: order.id,
        amount: Number(order.total),
        paymentMethod: 'MANUAL_QR',
        successUrl: `${origin}/payment/success?type=order`,
        failureUrl: `${origin}/payment/failure`,
      });
      const pd = paymentResponse?.paymentDetails;
      if (pd?.qrImageUrl && paymentResponse?.paymentId) {
        setManualPayment({
          paymentId: paymentResponse.paymentId,
          qrImageUrl: pd.qrImageUrl,
          instructions: typeof pd.instructions === 'string' ? pd.instructions : undefined,
          amountLabel: `NPR ${Number(paymentResponse.amount ?? order.total).toLocaleString()}`,
        });
        showSuccess('Scan the QR to pay, then upload your proof below.');
        refreshCart?.();
        return;
      }
      throw new Error('Payment could not be started. Ask an admin to configure the payment QR.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse" />
        <Card padding="lg">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[var(--muted)] rounded animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Checkout</h1>
        <Card padding="lg" className="text-center py-12">
          <HiShoppingCart className="mx-auto h-12 w-12 text-[var(--muted-foreground)] mb-4" />
          <p className="text-[var(--muted-foreground)]">Your cart is empty.</p>
          <Link href="/products">
            <Button variant="primary" className="mt-4">
              Browse products
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={shipping.fullName}
                  onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={shipping.address}
                  onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">City</label>
                <input
                  type="text"
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">State / Province</label>
                <input
                  type="text"
                  required
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={shipping.phone}
                  onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                />
              </div>
            </div>
          </Card>
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Coupon Code</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
              >
                {applyingCoupon ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card padding="lg" className="sticky top-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Order Summary</h2>
            <ul className="space-y-3 mb-6">
              {cart.items.map((item: CartItem) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">
                    {item.product?.name || `Product ${item.productId}`} × {item.quantity}
                  </span>
                  <span className="text-[var(--muted-foreground)]">
                    NPR {(item.price * item.quantity).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span className="text-[var(--foreground)]">NPR {cart.subtotal.toFixed(0)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>- NPR {cart.discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[var(--foreground)]">
                <span>Total</span>
                <span>NPR {cart.total.toFixed(0)}</span>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6"
              disabled={submitting || !!manualPayment}
            >
              {submitting ? 'Processing...' : manualPayment ? 'Complete payment below' : 'Pay with QR'}
            </Button>
            {manualPayment && (
              <div className="mt-6">
                <ManualPaymentFlow
                  paymentId={manualPayment.paymentId}
                  qrImageUrl={manualPayment.qrImageUrl}
                  instructions={manualPayment.instructions}
                  amountLabel={manualPayment.amountLabel}
                  onDone={() => {
                    setManualPayment(null);
                    refreshCart?.();
                    router.push('/dashboard/orders');
                  }}
                />
              </div>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
