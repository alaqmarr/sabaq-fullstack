'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    MapPin,
    BookOpen,
    Calendar,
    ClipboardCheck,
    MessageCircle,
    UserCheck,
    Menu,
    X
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'Users',
        href: '/dashboard/users',
        icon: Users,
        roles: [Role.SUPERADMIN, Role.ADMIN],
    },
    {
        title: 'Locations',
        href: '/dashboard/locations',
        icon: MapPin,
        roles: [Role.SUPERADMIN],
    },
    {
        title: 'Sabaqs',
        href: '/dashboard/sabaqs',
        icon: BookOpen,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MUMIN],
    },
    {
        title: 'Enrollments',
        href: '/dashboard/enrollments',
        icon: UserCheck,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'My Enrollments',
        href: '/dashboard/my-enrollments',
        icon: BookOpen,
        roles: [Role.MUMIN, Role.ADMIN, Role.SUPERADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB],
    },
    {
        title: 'Sessions',
        href: '/dashboard/sessions',
        icon: Calendar,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER],
    },
    {
        title: 'Attendance',
        href: '/dashboard/attendance',
        icon: ClipboardCheck,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.MUMIN],
    },
    {
        title: 'Questions',
        href: '/dashboard/questions',
        icon: MessageCircle,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.JANAB, Role.MUMIN],
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
