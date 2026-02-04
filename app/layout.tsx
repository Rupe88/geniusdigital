import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import PromotionalPopup from "@/components/layout/PromotionalPopup";
import ContentProtection from "@/components/ContentProtection";

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
                className="antialiased min-h-screen flex flex-col"
                suppressHydrationWarning
            >
                {/* <ContentProtection /> */}
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
