import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ToasterProvider } from "@/components/ToasterProvider";
import ContentProtection from "@/components/ContentProtection";
import { PwaInit } from "@/components/PwaInit";

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
        <html lang="en" data-scroll-behavior="smooth">
            <head>
                <link rel="manifest" href="/manifest.webmanifest" />
                <meta name="theme-color" content="#c01e2e" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Sanskar Academy" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body
                className="antialiased min-h-screen flex flex-col"
                suppressHydrationWarning
            >
                <AuthProvider>
                    <ContentProtection />
                    <CartProvider>
                        <ToasterProvider />
                        <PwaInit />
                        <LayoutWrapper>
                            {children}
                        </LayoutWrapper>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
