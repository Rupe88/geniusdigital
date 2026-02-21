'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HiArrowLeft, HiCheckCircle, HiXCircle, HiTruck, HiCreditCard } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ordersApi, Order } from '@/lib/api/orders';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

export default function OrderDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id?: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('PENDING');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const orderData = await ordersApi.getById(orderId);
      
      // Parse JSON addresses if they're strings
      let parsedOrder = { ...orderData };
      if (typeof orderData.shippingAddress === 'string') {
        try {
          parsedOrder.shippingAddress = JSON.parse(orderData.shippingAddress);
        } catch (e) {
          console.warn('Failed to parse shippingAddress JSON:', e);
        }
      }
      if (orderData.billingAddress && typeof orderData.billingAddress === 'string') {
        try {
          parsedOrder.billingAddress = JSON.parse(orderData.billingAddress);
        } catch (e) {
          console.warn('Failed to parse billingAddress JSON:', e);
        }
      }
      
      setOrder(parsedOrder as Order);
      setNewStatus(parsedOrder.status);
      setTrackingNumber(parsedOrder.trackingNumber || '');
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error(error?.message || 'Failed to fetch order');
      router.push(`${ROUTES.ADMIN}/orders`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      const updatedOrder = await ordersApi.updateOrderStatus(order.id, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
      });
      
      // Parse JSON addresses if they're strings
      let parsedOrder = { ...updatedOrder };
      if (typeof updatedOrder.shippingAddress === 'string') {
        try {
          parsedOrder.shippingAddress = JSON.parse(updatedOrder.shippingAddress);
        } catch (e) {
          console.warn('Failed to parse shippingAddress JSON:', e);
        }
      }
      if (updatedOrder.billingAddress && typeof updatedOrder.billingAddress === 'string') {
        try {
          parsedOrder.billingAddress = JSON.parse(updatedOrder.billingAddress);
        } catch (e) {
          console.warn('Failed to parse billingAddress JSON:', e);
        }
      }
      
      setOrder(parsedOrder as Order);
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await ordersApi.cancelOrder(order.id);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error?.message || 'Failed to cancel order');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <HiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <HiXCircle className="h-5 w-5 text-red-600" />;
      case 'SHIPPED':
        return <HiTruck className="h-5 w-5 text-indigo-600" />;
      default:
        return <HiCreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const canCancel = (status: Order['status']) => {
    return ['PENDING', 'CONFIRMED'].includes(status);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`${ROUTES.ADMIN}/orders`)}
          className="mt-4"
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${ROUTES.ADMIN}/orders`)}
          >
            <HiArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {canCancel(order.status) && (
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              className="text-red-600 hover:text-red-700"
            >
              Cancel Order
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-none ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order Date:</span>
                <span className="ml-2 text-gray-900">{formatDate(order.createdAt)}</span>
              </div>
              {order.shippedAt && (
                <div>
                  <span className="text-gray-600">Shipped Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(order.shippedAt)}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <span className="text-gray-600">Delivered Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(order.deliveredAt)}</span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="col-span-2">
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="ml-2 text-gray-900 font-mono">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 && 
                       Array.isArray(item.product.images) && 
                       item.product.images[0] &&
                       (item.product.images[0].startsWith('http') || item.product.images[0].startsWith('/')) ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-none object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-none bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No items found</p>
              )}
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            {order.shippingAddress && (
              <div className="text-sm text-gray-700">
                {typeof order.shippingAddress === 'object' ? (
                  <>
                    <p className="font-medium">{order.shippingAddress.fullName || 'N/A'}</p>
                    <p>{order.shippingAddress.address || 'N/A'}</p>
                    <p>
                      {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode || ''}
                    </p>
                    <p>{order.shippingAddress.country || 'N/A'}</p>
                    {order.shippingAddress.phone && (
                      <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">Address information not available</p>
                )}
              </div>
            )}
          </Card>

          {/* Billing Address */}
          {order.billingAddress && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
              {typeof order.billingAddress === 'object' ? (
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{order.billingAddress.fullName || 'N/A'}</p>
                  <p>{order.billingAddress.address || 'N/A'}</p>
                  <p>
                    {order.billingAddress.city || ''}, {order.billingAddress.state || ''} {order.billingAddress.postalCode || ''}
                  </p>
                  <p>{order.billingAddress.country || 'N/A'}</p>
                  {order.billingAddress.phone && (
                    <p className="mt-2">Phone: {order.billingAddress.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Billing address information not available</p>
              )}
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-{formatPrice(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatPrice(order.shipping)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-base font-semibold text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            {order.user ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-900">{order.user.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 text-gray-900">{order.user.email}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Customer information not available</p>
            )}
          </Card>

          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <span className="ml-2 text-gray-900">{order.paymentMethod}</span>
              </div>
              {order.paymentId && (
                <div>
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">{order.paymentId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setNewStatus(order.status);
          setTrackingNumber(order.trackingNumber || '');
        }}
        title="Update Order Status"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Order: {order.orderNumber}</p>
            <p className="text-sm text-gray-600">
              Current Status: <span className={`px-2 py-1 text-xs font-semibold rounded-none ${getStatusColor(order.status)}`}>{order.status}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as Order['status'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {(newStatus === 'SHIPPED' || newStatus === 'DELIVERED') && (
            <div>
              <Input
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setNewStatus(order.status);
                setTrackingNumber(order.trackingNumber || '');
              }}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              disabled={updatingStatus}
              isLoading={updatingStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
