'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, Clock, Play, Square, QrCode, UserPlus, Eye, Users } from 'lucide-react';
import { startSession, endSession } from '@/actions/sessions';
import { toast } from 'sonner';

interface UpcomingSessionCardProps {
    session: any;
    userRole: string;
}

export function UpcomingSessionCard({ session, userRole }: UpcomingSessionCardProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const canStartStop = ['SUPERADMIN', 'ADMIN'].includes(userRole);
    const canScan = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE'].includes(userRole);

    const handleStartSession = async () => {
        setLoading(true);
        const result = await startSession(session.id);
        if (result.success) {
            toast.success('Session started successfully');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to start session');
        }
        setLoading(false);
    };

    const handleEndSession = async () => {
        setLoading(true);
        const result = await endSession(session.id);
        if (result.success) {
            toast.success('Session ended successfully');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to end session');
        }
        setLoading(false);
    };

    const attendanceCount = session._count?.attendance || 0;
    const isActive = session.isActive;
    const hasStarted = session.startedAt;

    return (
        <Card className="glass lift session-card shadow-medium relative overflow-hidden">
            <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-0" />
            <CardHeader className="pb-3 relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1 pointer-events-auto">{session.sabaq.name}</CardTitle>
                    {isActive && <Badge variant="default" className="shrink-0">Active</Badge>}
                    {hasStarted && !isActive && <Badge variant="secondary" className="shrink-0">Ended</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 relative z-10 pointer-events-none">
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span>Attendance: <strong>{attendanceCount}</strong></span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pointer-events-auto">
                    {canStartStop && !hasStarted && (
                        <Button size="sm" onClick={handleStartSession} disabled={loading} className="gap-2 flex-1">
                            <Play className="h-3.5 w-3.5" />
                            Start
                        </Button>
                    )}

                    {canStartStop && isActive && (
                        <Button size="sm" variant="destructive" onClick={handleEndSession} disabled={loading} className="gap-2 flex-1">
                            <Square className="h-3.5 w-3.5" />
                            End
                        </Button>
                    )}

                    {canScan && isActive && (
                        <>
                            <Button size="sm" variant="outline" asChild className="gap-2">
                                <Link href="/dashboard/scan">
                                    <QrCode className="h-3.5 w-3.5" />
                                    QR Scan
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild className="gap-2">
                                <Link href={`/dashboard/sessions/${session.id}/attendance`}>
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Manual
                                </Link>
                            </Button>
                        </>
                    )}

                    <Button size="sm" variant="outline" asChild className={`gap-2 ${!canStartStop && !canScan ? 'flex-1' : ''}`}>
                        <Link href={`/dashboard/sessions/${session.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
