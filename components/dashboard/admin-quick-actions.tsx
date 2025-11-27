'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Users, BarChart3, FileText, Calendar, MapPin } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function AdminQuickActions() {
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'MUMIN';

    // Define actions with role requirements
    const allActions = [
        {
            title: 'create sabaq',
            description: 'set up a new sabaq',
            icon: Plus,
            href: '/dashboard/sabaqs',
            color: 'text-blue-600',
            allowedRoles: ['SUPERADMIN'] // Only superadmin can create sabaqs
        },
        {
            title: 'user management',
            description: 'manage all users',
            icon: Users,
            href: '/dashboard/users',
            color: 'text-green-600',
            allowedRoles: ['SUPERADMIN'] // Only superadmin can add users
        },
        {
            title: 'manage sessions',
            description: 'view all sessions',
            icon: Calendar,
            href: '/dashboard/sessions',
            color: 'text-purple-600',
            allowedRoles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE']
        },
        {
            title: 'view reports',
            description: 'analytics & insights',
            icon: BarChart3,
            href: '/dashboard/reports',
            color: 'text-orange-600',
            allowedRoles: ['SUPERADMIN', 'ADMIN', 'JANAB', 'MANAGER'] // Managers can view reports
        },
        {
            title: 'enrollments',
            description: 'manage enrollments',
            icon: FileText,
            href: '/dashboard/enrollments',
            color: 'text-indigo-600',
            allowedRoles: ['SUPERADMIN', 'ADMIN', 'JANAB']
        },
        {
            title: 'locations',
            description: 'manage locations',
            icon: MapPin,
            href: '/dashboard/locations',
            color: 'text-red-600',
            allowedRoles: ['SUPERADMIN']
        },
        {
            title: 'bulk upload',
            description: 'import users/enrollments',
            icon: FileText,
            href: '/dashboard/enrollments?action=bulk',
            color: 'text-teal-600',
            allowedRoles: ['SUPERADMIN', 'ADMIN']
        },
    ];

    // Filter actions based on user role
    const actions = allActions.filter(action => action.allowedRoles.includes(userRole));

    if (actions.length === 0) return null;

    return (
        <div>
            <h2 className="text-lg sm:text-xl text-cred-heading mb-3 sm:mb-4 lowercase">quick actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {actions.map((action) => (
                    <Link key={action.href} href={action.href}>
                        <Card className="glass hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                            <CardHeader className="pb-2">
                                <action.icon className={`h-6 w-6 ${action.color} mb-2`} />
                                <CardTitle className="text-sm sm:text-base text-cred-action">{action.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-cred-label">{action.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
