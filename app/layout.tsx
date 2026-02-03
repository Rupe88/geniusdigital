import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import PromotionalPopup from "@/components/layout/PromotionalPopup";

// Use system fonts as fallback when Google Fonts is unavailable
let fontClasses = "";

try {
    const { Roboto, Inter } = require("next/font/google");

    const roboto = Roboto({
        weight: ['300', '400', '500', '700'],
        subsets: ["latin"],
        variable: "--font-roboto",
        display: 'swap',
    });

    const inter = Inter({
        weight: ['300', '400', '500', '600', '700'],
        subsets: ["latin"],
        variable: "--font-inter",
        display: 'swap',
    });

    fontClasses = `${roboto.variable} ${inter.variable}`;
} catch (error) {
    // Fallback to system fonts if Google Fonts fails
    console.warn('Google Fonts unavailable, using system fonts');
}

export const metadata: Metadata = {
    title: "Sanskar Academy - Master in Scientific Vastu & Modern Numerology",
    description: "Unlock your hidden potential to become your best version. Master in Scientific Vastu & Modern Numerology.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${fontClasses} antialiased min-h-screen flex flex-col`}
                suppressHydrationWarning
            >
                <AuthProvider>
                    <CartProvider>
                        <LayoutWrapper>
                            {children}
                        </LayoutWrapper>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
