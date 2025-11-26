import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

export default async function AttendancePage() {
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('attendance', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    // Get active sessions (started but not ended)
    const activeSessions = await prisma.session.findMany({
        where: {
            isActive: true,
            startedAt: { not: null },
            endedAt: null,
        },
        include: {
            sabaq: {
                include: {
                    location: true,
                },
            },
            _count: {
                select: {
                    attendances: true,
                },
            },
        },
        orderBy: {
            startedAt: 'desc',
        },
    });

    // Get upcoming sessions (next 24 hours, not yet started)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingSessions = await prisma.session.findMany({
        where: {
            isActive: true,
            startedAt: null,
            scheduledAt: {
                gte: now,
                lte: tomorrow,
            },
        },
        include: {
            sabaq: {
                include: {
                    location: true,
                },
            },
        },
        orderBy: {
            scheduledAt: 'asc',
        },
        take: 5,
    });

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Mark attendance for active sessions
                </p>
            </div>

            {/* Active Sessions */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Active Sessions</h2>
                {activeSessions.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No active sessions at the moment
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {activeSessions.map((sess) => (
                            <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`}>
                                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="text-base">{sess.sabaq.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {sess.sabaq.kitaab} - Nisaab {sess.sabaq.level}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {sess.sabaq.location?.name || 'No location'}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Started {sess.startedAt && format(new Date(sess.startedAt), 'p')}
                                        </div>
                                        <div className="text-sm font-medium text-primary">
                                            {sess._count.attendances} attendees
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Upcoming (Next 24h)</h2>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {upcomingSessions.map((sess) => (
                            <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`}>
                                <Card className="hover:bg-accent transition-colors cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="text-base">{sess.sabaq.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {sess.sabaq.kitaab} - Nisaab {sess.sabaq.level}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {format(new Date(sess.scheduledAt), 'PPp')}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {sess.sabaq.location?.name || 'No location'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
