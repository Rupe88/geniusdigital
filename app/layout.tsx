import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ToasterProvider } from "@/components/ToasterProvider";
import ContentProtection from "@/components/ContentProtection";
import { PwaInit } from "@/components/PwaInit";

export const metadata: Metadata = {
    title: "Genius Shiksha",
    description: "Unlock your hidden potential to become your best version with Genius Shiksha.",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/logo.png?v=7", type: "image/png" },
        ],
        shortcut: "/logo.png?v=7",
        apple: "/logo.png?v=7",
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
                <link rel="manifest" href="/manifest.webmanifest?v=7" />
                <meta name="theme-color" content="#1877f2" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Genius Shiksha" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/logo.png?v=7" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/logo.png?v=7" type="image/png" />
                <link rel="shortcut icon" href="/favicon.ico" />
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
