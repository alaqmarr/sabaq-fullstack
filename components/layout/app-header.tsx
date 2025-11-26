'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!session?.user) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-strong backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                            <Home className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                Asbaaq Management
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {session.user.role}
                            </span>
                        </div>
                    </Link>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    {/* Desktop Navigation */}
                    <nav className="hidden sm:flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                Home
                            </Button>
                        </Link>
                        {['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE'].includes(session.user.role) && (
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                        )}
                        <Link href="/api/auth/signout">
                            <Button variant="outline" size="sm">
                                Sign Out
                            </Button>
                        </Link>
                    </nav>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden py-4 space-y-2 border-t border-border/40">
                        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                                Home
                            </Button>
                        </Link>
                        {['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE'].includes(session.user.role) && (
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start">
                                    Dashboard
                                </Button>
                            </Link>
                        )}
                        <Link href="/api/auth/signout" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-start">
                                Sign Out
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
