export type PaymentMethod =
  | 'MANUAL_QR'
  | 'ESEWA'
  | 'MOBILE_BANKING'
  | 'VISA_CARD'
  | 'MASTERCARD'
  | 'OTHER'
  | 'KHALTI'
  | 'RAZORPAY';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  orderId?: string;
  courseId?: string;
  productIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** Included when fetched from history/list API */
  course?: { id: string; title: string; thumbnail?: string };
  /** Included when fetched from history/list API */
  order?: { id: string; orderNumber: string };
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  paymentMethodDistribution: Array<{
    method: PaymentMethod;
    count: number;
    total: number;
  }>;
}

export interface PaymentTrend {
  date: string;
  revenue: number;
  transactions: number;
}

