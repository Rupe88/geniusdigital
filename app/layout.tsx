import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ToasterProvider } from "@/components/ToasterProvider";
import ContentProtection from "@/components/ContentProtection";
import { PwaInit } from "@/components/PwaInit";

export const metadata: Metadata = {
    title: "Genius Digital",
    description: "Unlock your hidden potential to become your best version with Genius Digital.",
    icons: {
        icon: "/favicon.png?v=4",
        shortcut: "/favicon.png?v=4",
        apple: "/logo.png?v=4",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <head>
                <link rel="manifest" href="/manifest.webmanifest?v=4" />
                <meta name="theme-color" content="#1877f2" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Genius Digi" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/logo.png?v=4" />
                <link rel="icon" href="/favicon.png?v=4" type="image/png" />
                <link rel="shortcut icon" href="/favicon.png?v=4" type="image/png" />
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
