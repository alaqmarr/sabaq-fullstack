'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutGrid,
    UsersRound,
    Map,
    BookOpenText,
    CalendarClock,
    CheckCircle2,
    MessageSquareText,
    FileSignature,
    UserCheck,
    Menu,
    X,
    ShieldAlert,
    CalendarDays,
    QrCode
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
    {
        title: 'dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'scan qr',
        href: '/dashboard/scan',
        icon: QrCode,
        roles: [Role.MUMIN, Role.JANAB, Role.ATTENDANCE_INCHARGE, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN],
    },
    {
        title: 'users',
        href: '/dashboard/users',
        icon: UsersRound,
        roles: [Role.SUPERADMIN, Role.ADMIN],
    },
    {
        title: 'locations',
        href: '/dashboard/locations',
        icon: Map,
        roles: [Role.SUPERADMIN],
    },
    {
        title: 'sabaqs',
        href: '/dashboard/sabaqs',
        icon: BookOpenText,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MUMIN],
    },
    {
        title: 'enrollments',
        href: '/dashboard/enrollments',
        icon: FileSignature,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'my enrollments',
        href: '/dashboard/my-enrollments',
        icon: BookOpenText,
        roles: [Role.MUMIN, Role.ADMIN, Role.SUPERADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB],
    },
    {
        title: 'sessions',
        href: '/dashboard/sessions',
        icon: CalendarClock,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER],
    },
    {
        title: 'attendance',
        href: '/dashboard/attendance',
        icon: CheckCircle2,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.MUMIN],
    },
    {
        title: 'questions',
        href: '/dashboard/questions',
        icon: MessageSquareText,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'calendar',
        href: '/dashboard/calendar',
        icon: CalendarDays,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'logs',
        href: '/dashboard/logs',
        icon: ShieldAlert,
        roles: [Role.SUPERADMIN],
    },
];

export function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const [open, setOpen] = useState(false);

    if (!userRole) return null;

    const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="md:hidden"
                    size="icon"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">Navigation</h2>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4">
                        <div className="grid gap-2">
                            {filteredNavItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    );
}
