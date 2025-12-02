import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { AppHeader } from "@/components/layout/app-header";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



const arabicFont = localFont({
  src: [
    {
      path: "../fonts/kanz-al-marjaan-webfont.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: {
    default: "Asbaaq Management System",
    template: "%s | Asbaaq Management"
  },
  description: "Comprehensive sabaq session management system with attendance tracking, enrollment management, and real-time analytics.",
  keywords: ["sabaq", "attendance", "management", "education", "sessions", "enrollment"],
  authors: [{ name: "Asbaaq Team" }],
  creator: "Asbaaq Management",
  openGraph: {
    type: "website",
    title: "Asbaaq Management System",
    description: "Comprehensive sabaq session management with real-time tracking",
    siteName: "Asbaaq Management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asbaaq Management System",
    description: "Comprehensive sabaq session management with real-time tracking",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
};

import { auth } from "@/auth";
import { getAppConfig } from "@/actions/app-config";
import { MaintenanceGuard } from "@/components/maintenance-guard";

import NextTopLoader from 'nextjs-toploader';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const { config } = await getAppConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${arabicFont.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}>
        <NextTopLoader color="#2563eb" showSpinner={false} />
        <SessionProvider session={session}>
          <SmoothScrollProvider>
            <MaintenanceGuard config={config} userRole={session?.user?.role}>
              <AppHeader />
              <main className="min-h-screen">
                {children}
              </main>
            </MaintenanceGuard>
            <Toaster />
          </SmoothScrollProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
