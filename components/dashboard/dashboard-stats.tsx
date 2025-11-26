import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserCheck, Calendar } from 'lucide-react';

/**
 * Dashboard Statistics Component
 * Fetches stats with caching
 * Isolated data fetching with own Suspense boundary
 */
export async function DashboardStatsSection() {
    // Fetch stats with optimized queries
    const [totalUsers, activeSabaqs, totalEnrollments, totalSessions] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.sabaq.count({ where: { isActive: true } }),
        prisma.enrollment.count({ where: { status: 'APPROVED' } }),
        prisma.session.count(),
    ]);

    const stats = [
        {
            title: 'Total Users',
            value: totalUsers,
            icon: Users,
            description: 'Active users in system',
        },
        {
            title: 'Active Sabaqs',
            value: activeSabaqs,
            icon: BookOpen,
            description: 'Currently running sabaqs',
        },
        {
            title: 'Enrollments',
            value: totalEnrollments,
            icon: UserCheck,
            description: 'Approved enrollments',
        },
        {
            title: 'Total Sessions',
            value: totalSessions,
            icon: Calendar,
            description: 'All time sessions',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
