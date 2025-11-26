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
    QrCode
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

const navItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'Scan QR',
        href: '/dashboard/scan',
        icon: QrCode,
        roles: [Role.MUMIN, Role.JANAB, Role.ATTENDANCE_INCHARGE, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN],
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
        roles: [Role.SUPERADMIN, Role.ADMIN],
    },
    {
        title: 'Enrollments',
        href: '/dashboard/enrollments',
        icon: UserCheck,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB],
    },
    {
        title: 'My Enrollments',
        href: '/dashboard/my-enrollments',
        icon: BookOpen,
        roles: [Role.MUMIN, Role.JANAB, Role.ATTENDANCE_INCHARGE, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN],
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
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE],
    },
    {
        title: 'Questions',
        href: '/dashboard/questions',
        icon: MessageCircle,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.JANAB, Role.MUMIN],
    },
];

export function DashboardNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    if (!userRole) return null;

    return (
        <nav className="grid items-start gap-1">
            {navItems.map((item, index) => {
                if (!item.roles.includes(userRole)) return null;

                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={index}
                        href={item.href}
                    >
                        <span
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.title}</span>
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
