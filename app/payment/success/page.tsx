'use client';

import React, { use, useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiCheckCircle, HiXCircle, HiRefresh, HiInformationCircle } from 'react-icons/hi';
import { ROUTES } from '@/lib/utils/constants';
type SearchParamsLike = Record<string, string | string[] | undefined>;
function getParam(sp: SearchParamsLike | null, key: string): string | null {
    if (!sp || !(key in sp)) return null;
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? null : (v ?? null);
}

function PaymentSuccessContent({ searchParams }: { searchParams: SearchParamsLike }) {
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);
    const [status, setStatus] = useState<'success' | 'failed' | 'error' | 'info'>('info');
    const [message, setMessage] = useState('Verifying your payment...');
    const [paymentData, setPaymentData] = useState<any>(null);

    const isInstallment = getParam(searchParams, 'type') === 'installment';
    const courseId = paymentData?.courseId ?? paymentData?.course?.id;
    const courseTitle = paymentData?.course?.title;

    useEffect(() => {
        const data = getParam(searchParams, 'data');
        if (data) {
            setVerifying(false);
            setStatus('error');
            setMessage(
                'eSewa redirects are disabled. Pay using the QR on the course or checkout page, then upload your payment screenshot.'
            );
            return;
        }
        setVerifying(false);
        setStatus('info');
        setMessage(
            'Payments use QR + screenshot upload. Complete payment from the course, cart checkout, or installments page, then wait for admin approval.'
        );
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center p-8 bg-white shadow-xl rounded-none border border-gray-100">
                {verifying ? (
                    <div className="space-y-6">
                        <HiRefresh className="w-16 h-16 text-[var(--primary-700)] animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-gray-900">Verifying Payment</h1>
                        <p className="text-gray-600">{message}</p>
                    </div>
                ) : status === 'info' ? (
                    <div className="space-y-6">
                        <div className="bg-[var(--primary-50)] w-24 h-24 rounded-none flex items-center justify-center mx-auto">
                            <HiInformationCircle className="w-16 h-16 text-[var(--primary-700)]" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Pay with QR</h1>
                        <p className="text-gray-600 leading-relaxed">{message}</p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full h-12 text-lg"
                                onClick={() => router.push(ROUTES.COURSES)}
                            >
                                Browse courses
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-12 text-lg"
                                onClick={() => router.push(`${ROUTES.DASHBOARD}/orders`)}
                            >
                                Orders & checkout
                            </Button>
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div className="space-y-6">
                        <div className="bg-green-50 w-24 h-24 rounded-none flex items-center justify-center mx-auto">
                            <HiCheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isInstallment ? 'Installment Paid!' : 'Payment Successful!'}
                        </h1>
                        <p className="text-gray-600 leading-relaxed">{message}</p>

                        {paymentData && (
                            <div className="bg-gray-50 rounded-none p-4 text-left space-y-2 mb-6 border border-gray-200">
                                {courseTitle && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Course:</span>
                                        <span className="font-semibold text-gray-900 truncate max-w-[200px]" title={courseTitle}>{courseTitle}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Transaction ID:</span>
                                    <span className="font-semibold text-gray-900">{(paymentData as any).transactionId ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount Paid:</span>
                                    <span className="font-semibold text-gray-900">Rs. {Number((paymentData as any).finalAmount ?? (paymentData as any).amount ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {courseId && !isInstallment && (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full h-12 text-lg shadow-lg shadow-primary-500/20"
                                    onClick={() => router.push(`/dashboard/courses/${courseId}/learn`)}
                                >
                                    Continue to course
                                </Button>
                            )}
                            {isInstallment && (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full h-12 text-lg shadow-lg shadow-primary-500/20"
                                    onClick={() => router.push(`${ROUTES.DASHBOARD}/installments`)}
                                >
                                    Back to Installments
                                </Button>
                            )}
                            <Button
                                variant={courseId && !isInstallment ? 'outline' : 'primary'}
                                size="lg"
                                className="w-full h-12 text-lg"
                                onClick={() => router.push(ROUTES.DASHBOARD)}
                            >
                                Go to My Courses
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-red-50 w-24 h-24 rounded-none flex items-center justify-center mx-auto">
                            <HiXCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Verification Failed</h1>
                        <p className="text-red-600 bg-red-50 p-4 rounded-none border border-red-100">{message}</p>

                        <div className="pt-4 space-y-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full h-12 text-lg"
                                onClick={() => router.push(ROUTES.COURSES)}
                            >
                                Back to Courses
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-12 text-lg"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<SearchParamsLike>;
}) {
    const searchParams = use(searchParamsPromise);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 bg-white shadow-xl rounded-none border border-gray-100">
                    <div className="space-y-6">
                        <HiRefresh className="w-16 h-16 text-[var(--primary-700)] animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
                    </div>
                </Card>
            </div>
        }>
            <PaymentSuccessContent searchParams={searchParams} />
        </Suspense>
    );
}
