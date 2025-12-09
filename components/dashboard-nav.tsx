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
    QrCode,
    ShieldAlert,
    CalendarDays,
    Settings,
    Activity,
    BarChart3
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Role } from '@/app/prisma/enums';

const navItems = [
    {
        title: 'dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'profile',
        href: '/dashboard/profile',
        icon: UserCheck,
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
        roles: [Role.SUPERADMIN],  // Only SUPERADMIN can manage users
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
        roles: [Role.SUPERADMIN, Role.ADMIN],
    },
    {
        title: 'enrollments',
        href: '/dashboard/enrollments',
        icon: FileSignature,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.JANAB],  // Removed MANAGER and ATTENDANCE_INCHARGE - they don't have enrollment permissions
    },
    {
        title: 'my enrollments',
        href: '/dashboard/my-enrollments',
        icon: BookOpenText,
        roles: [Role.MUMIN, Role.JANAB, Role.ATTENDANCE_INCHARGE, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN],
    },
    {
        title: 'sessions',
        href: '/dashboard/sessions',
        icon: CalendarClock,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE],  // Added ATTENDANCE_INCHARGE - they mark attendance
    },
    {
        title: 'attendance',
        href: '/dashboard/attendance',
        icon: CheckCircle2,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE],
    },
    {
        title: 'questions',
        href: '/dashboard/questions',
        icon: MessageSquareText,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.JANAB],  // Removed MUMIN - they only have read_self, go to session Q&A instead
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
    {
        title: 'reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.JANAB],
    },
    {
        title: 'system status',
        href: '/system-status',
        icon: Activity,
        roles: [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ATTENDANCE_INCHARGE, Role.JANAB, Role.MUMIN],
    },
    {
        title: 'settings',
        href: '/dashboard/settings',
        icon: Settings,
        roles: [Role.SUPERADMIN],
    },
];

export function DashboardNav({ userRole }: { userRole: string }) {
    const pathname = usePathname();

    if (!userRole) return null;

    return (
        <nav className="grid items-start gap-1">
            {navItems.map((item, index) => {
                if (!item.roles.includes(userRole as Role)) return null;

                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={index}
                        href={item.href}
                    >
                        <span
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold lowercase transition-colors",
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
