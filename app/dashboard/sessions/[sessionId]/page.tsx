import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect, notFound } from 'next/navigation';
import { requirePermission, requireSessionAccess, checkPermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { getSessionById } from '@/actions/sessions';
import { getAttendanceStats } from '@/actions/attendance';
import { getQuestionStats } from '@/actions/questions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatShortDate, formatPPP, formatTime24 } from '@/lib/date-utils';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Users, MessageSquare, ChevronRight, QrCode } from 'lucide-react';
import { ExportButton } from '@/components/exports/export-button';
import { SessionQuickActions } from '@/components/sessions/session-quick-actions';

import { SessionStatsCard } from '@/components/sessions/session-stats-card';
import { PageHeader } from '@/components/ui/page-header';

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
    try {
        const { sessionId } = await params;
        const result = await getSessionById(sessionId);

        if (!result.success || !result.session) {
            return {
                title: "Session Not Found",
            };
        }

        const date = formatShortDate(result.session.scheduledAt);
        return {
            title: `${date} | ${result.session.sabaq.name}`,
        };
    } catch (error) {
        console.error("Metadata generation failed:", error);
        return {
            title: "Login",
        };
    }
}

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('sessions', 'read');
        await requireSessionAccess(sessionId);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);
    const statsResult = await getAttendanceStats(sessionId);
    const questionStatsResult = await getQuestionStats(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session!;
    const stats = statsResult.success ? statsResult.stats : null;
    const questionStats = questionStatsResult.success ? questionStatsResult.stats : null;

    // Check if user can update sessions (implies admin/manager rights for this session)
    const canManageSession = await checkPermission(session.user.id, 'sessions', 'update');

    // Also check if they can scan (for the scan button)
    const canScan = await checkPermission(session.user.id, 'scan', 'read');

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
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{sessionData.sabaq.name}</h1>
                        {getStatusBadge()}
                    </div>
                    <p className="text-muted-foreground pl-8 md:pl-0">
                        {sessionData.sabaq.kitaab} • Nisaab {sessionData.sabaq.level}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-8 md:pl-0">
                        <Calendar className="h-4 w-4" />
                        {formatPPP(sessionData.scheduledAt)}
                    </div>
                </div>
                <div className="flex items-center gap-2 pl-8 md:pl-0">
                    {canManageSession && (
                        <>
                            <ExportButton type="session" id={sessionId} />
                        </>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-full md:col-span-2 lg:col-span-4">
                    <SessionQuickActions
                        sessionId={sessionId}
                        sabaqName={sessionData.sabaq.name}
                        isActive={sessionData.isActive}
                        isEnded={!!sessionData.endedAt}
                        hasStarted={!!sessionData.startedAt}
                        isAdmin={canManageSession}
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
                            {formatTime24(sessionData.scheduledAt)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cutoff: {formatTime24(sessionData.cutoffTime)}
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
                    </Card>
                </Link>

                {canScan && (
                    <Link href={`/dashboard/sessions/${sessionId}/scan`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5" />
                                    Scan
                                </CardTitle>
                                <CardDescription>Take mumineen attendance</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
}
