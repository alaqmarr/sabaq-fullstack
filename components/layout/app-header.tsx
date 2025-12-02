'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Home, Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/signout-button';

import Image from 'next/image';

export function AppHeader() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-strong backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                            <Image src="/logo.jpg" alt="Logo" fill className="object-contain" sizes="(max-width: 640px) 32px, 40px" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                Asbaaq Management
                            </span>
                            {session?.user && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    {session.user.role}
                                </span>
                            )}
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
                                home
                            </Button>
                        </Link>
                        {session?.user ? (
                            <>
                                {['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE'].includes(session.user.role) && (
                                    <Link href="/dashboard">
                                        <Button variant="ghost" size="sm">
                                            dashboard
                                        </Button>
                                    </Link>
                                )}
                                <SignOutButton variant="frosted-red">
                                    sign out
                                </SignOutButton>
                            </>
                        ) : (
                            <Link href="/login">
                                <Button variant="frosted-blue" size="sm" className="gap-2">
                                    <LogIn className="h-4 w-4" />
                                    login
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden py-4 space-y-2 border-t border-border/40">
                        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                                home
                            </Button>
                        </Link>
                        {session?.user ? (
                            <>
                                {['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE'].includes(session.user.role) && (
                                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start">
                                            dashboard
                                        </Button>
                                    </Link>
                                )}
                                <div className="pt-2">
                                    <SignOutButton variant="frosted-red" className="w-full justify-start">
                                        sign out
                                    </SignOutButton>
                                </div>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button variant="frosted-blue" className="w-full justify-start gap-2">
                                    <LogIn className="h-4 w-4" />
                                    login
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
