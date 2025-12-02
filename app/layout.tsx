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
    default: "Asbaaq | Umoor Talimiyah",
    template: "%s | Asbaaq Management"
  },
  icons: {
    icon: "/logo.jpg",
  },
  description: "Realtime attendance marking, user intimations, session management, and much more.",
  keywords: ["sabaq", "attendance", "management", "education", "sessions", "enrollment"],
  authors: [{ name: "Al Aqmar" }],
  creator: "Al Aqmar [alaqmar.dev]",
  openGraph: {
    type: "website",
    title: "Asbaaq | Umoor Talimiyah",
    description: "Realtime attendance marking, user intimations, session management, and much more.",
    siteName: "Asbaaq | Umoor Talimiyah",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Asbaaq | Umoor Talimiyah",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Asbaaq | Umoor Talimiyah",
    description: "Realtime attendance marking, user intimations, session management, and much more.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Asbaaq | Umoor Talimiyah",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    // blue style theme colors
    { media: "(prefers-color-scheme: light)", color: "#85a3e2ff" },

    { media: "(prefers-color-scheme: dark)", color: "#85a3e2ff" }
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
