import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    BookOpen,
    MapPin,
    UserCheck,
    Clock,
    CheckCircle,
    ArrowLeft,
    CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const preferredRegion = ["sin1"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sabaq = await prisma.sabaq.findUnique({
        where: { id },
        select: { name: true, kitaab: true },
    });

    if (!sabaq) {
        return { title: "Sabaq Not Found" };
    }

    return {
        title: `${sabaq.name} | My Sabaq`,
    };
}

export default async function MySabaqDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { id: sabaqId } = await params;

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
        where: {
            sabaqId,
            userId: session.user.id,
            status: 'APPROVED',
        },
    });

    // Also allow admins to view
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'JANAB'].includes(session.user.role);

    if (!enrollment && !isAdmin) {
        redirect('/unauthorized?reason=You are not enrolled in this Sabaq.');
    }

    // Get sabaq details
    const sabaq = await prisma.sabaq.findUnique({
        where: { id: sabaqId },
        include: {
            janab: {
                select: { name: true },
            },
            location: {
                select: { name: true },
            },
        },
    });

    if (!sabaq) notFound();

    // Get user's attendance for this sabaq
    const attendances = await prisma.attendance.findMany({
        where: {
            userId: session.user.id,
            session: {
                sabaqId,
            },
        },
        include: {
            session: {
                select: {
                    id: true,
                    scheduledAt: true,
                    isActive: true,
                },
            },
        },
        orderBy: { markedAt: 'desc' },
        take: 50,
    });

    // Get total sessions for this sabaq
    const totalSessions = await prisma.session.count({
        where: { sabaqId },
    });

    // Calculate stats
    const attendedCount = attendances.length;
    const lateCount = attendances.filter(a => a.isLate).length;
    const attendancePercentage = totalSessions > 0
        ? Math.round((attendedCount / totalSessions) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/my-enrollments">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight lowercase">{sabaq.name}</h1>
                    {sabaq.kitaab && (
                        <p className="text-sm text-muted-foreground lowercase">{sabaq.kitaab}</p>
                    )}
                </div>
            </div>

            {/* Sabaq Info Card */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 lowercase">
                        <BookOpen className="h-5 w-5 text-primary" />
                        sabaq details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    {sabaq.description && (
                        <div className="sm:col-span-2">
                            <p className="text-sm text-muted-foreground lowercase">{sabaq.description}</p>
                        </div>
                    )}

                    {sabaq.level && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="lowercase">nisaab {sabaq.level}</Badge>
                        </div>
                    )}

                    {sabaq.janab && (
                        <div className="flex items-center gap-2 text-sm">
                            <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground lowercase">{sabaq.janab.name}</span>
                        </div>
                    )}

                    {sabaq.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground lowercase">{sabaq.location.name}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-500">{attendancePercentage}%</div>
                        <p className="text-xs text-muted-foreground lowercase">attendance</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{attendedCount}</div>
                        <p className="text-xs text-muted-foreground lowercase">attended</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{totalSessions}</div>
                        <p className="text-xs text-muted-foreground lowercase">total sessions</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-500">{lateCount}</div>
                        <p className="text-xs text-muted-foreground lowercase">late</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance History */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 lowercase">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        my attendance history
                    </CardTitle>
                    <CardDescription className="lowercase">
                        your attendance records for this sabaq
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {attendances.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm lowercase">
                            no attendance records yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attendances.map((attendance) => (
                                <div
                                    key={attendance.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${attendance.isLate
                                                ? 'bg-orange-500/20 text-orange-500'
                                                : 'bg-green-500/20 text-green-500'
                                            }`}>
                                            {attendance.isLate ? (
                                                <Clock className="h-4 w-4" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium lowercase">
                                                {format(attendance.session.scheduledAt, 'EEEE, dd MMM yyyy')}
                                            </p>
                                            <p className="text-xs text-muted-foreground lowercase">
                                                marked at {format(attendance.markedAt, 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={attendance.isLate ? "destructive" : "secondary"}
                                        className="lowercase"
                                    >
                                        {attendance.isLate ? 'late' : 'present'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
