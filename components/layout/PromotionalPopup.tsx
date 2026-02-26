'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiX } from 'react-icons/hi';
import { popupsApi, Popup } from '@/lib/api/popups';

export default function PromotionalPopup() {
    const [popup, setPopup] = useState<Popup | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchPopup = async () => {
            try {
                const response = await popupsApi.getActive();
                if (response.success && response.data) {
                    setPopup(response.data);
                    // Show after brief delay on every refresh/first visit
                    setTimeout(() => setIsVisible(true), 500);
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to fetch promotional popup', error);
                }
            }
        };

        fetchPopup();
    }, [mounted]);

    const handleClose = () => {
        setIsVisible(false);
    };

    // Don't render until mounted to prevent hydration mismatch
    if (!mounted || !popup || !isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
            onClick={handleClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            aria-label="Close popup"
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl animate-in fade-in duration-300 cursor-pointer overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
            >
                <button
                    onClick={handleClose}
                    className="absolute -top-3 -right-3 p-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
                    aria-label="Close"
                >
                    <HiX className="w-5 h-5" />
                </button>

                <div className="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden rounded-lg">
                    {popup.linkUrl ? (
                        <Link
                            href={popup.linkUrl}
                            onClick={handleClose}
                            className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 rounded-lg"
                        >
                            <Image
                                src={popup.imageUrl}
                                alt={popup.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 500px"
                                priority
                            />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={handleClose}
                            className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 rounded-lg text-left"
                        >
                            <Image
                                src={popup.imageUrl}
                                alt={popup.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 500px"
                                priority
                            />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
