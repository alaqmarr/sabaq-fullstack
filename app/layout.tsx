import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { AppHeader } from "@/components/layout/app-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}>
        <SessionProvider>
          <AppHeader />
          <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 max-w-7xl mx-auto">
            {children}
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
