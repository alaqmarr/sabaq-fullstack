import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { getAttendanceStats } from '@/actions/attendance';
import { getQuestionStats } from '@/actions/questions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Users, MessageSquare, ChevronRight, QrCode } from 'lucide-react';
import { ExportButton } from '@/components/exports/export-button';
import { SessionQuickActions } from '@/components/sessions/session-quick-actions';

import { SessionStatsCard } from '@/components/sessions/session-stats-card';

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    // ... (rest of the function start)
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('sessions', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);
    const statsResult = await getAttendanceStats(sessionId);
    const questionStatsResult = await getQuestionStats(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const stats = statsResult.success ? statsResult.stats : null;
    const questionStats = questionStatsResult.success ? questionStatsResult.stats : null;

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role);
    const isActive = sessionData.isActive;
    const allowLocationAttendance = sessionData.sabaq.allowLocationAttendance;

    const getStatusBadge = () => {
        if (sessionData.isActive) {
            return <Badge className="bg-green-500">Active</Badge>;
        } else if (sessionData.endedAt) {
            return <Badge variant="secondary">Ended</Badge>;
        } else {
            return <Badge variant="outline">Scheduled</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/dashboard/sessions">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        {getStatusBadge()}
                        <span className="text-sm text-muted-foreground">
                            {format(new Date(sessionData.scheduledAt), 'PPP')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {sessionData.sabaq.name}
                        </h2>
                        <p className="text-muted-foreground">
                            {sessionData.sabaq.kitaab} • Nisaab {sessionData.sabaq.level}
                        </p>
                    </div>
                    {isAdmin && <ExportButton type="session" id={sessionId} />}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-full md:col-span-2 lg:col-span-4">
                    <SessionQuickActions
                        sessionId={sessionId}
                        isActive={sessionData.isActive}
                        isEnded={!!sessionData.endedAt}
                        hasStarted={!!sessionData.startedAt}
                        isAdmin={isAdmin}
                    />
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {format(new Date(sessionData.scheduledAt), 'p')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cutoff: {format(new Date(sessionData.cutoffTime), 'p')}
                        </p>
                    </CardContent>
                </Card>

                <SessionStatsCard sessionId={sessionId} initialStats={stats ?? null} />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Questions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {questionStats?.totalQuestions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {questionStats?.answeredCount || 0} Answered
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation / Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href={`/dashboard/sessions/${sessionId}/attendance`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Attendance
                            </CardTitle>
                            <CardDescription>Mark and view attendance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="w-full justify-between group">
                                Manage Attendance
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href={`/dashboard/sessions/${sessionId}/questions`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Questions
                            </CardTitle>
                            <CardDescription>View and manage Q&A</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="w-full justify-between group">
                                View Questions
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {isAdmin && (
                    <Link href={`/dashboard/scan?sessionId=${sessionId}`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5" />
                                    Scan QR
                                </CardTitle>
                                <CardDescription>Scan attendee QR codes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-between group">
                                    Open Scanner
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
}
