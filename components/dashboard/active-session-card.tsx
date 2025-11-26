'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, MapPin, QrCode, UserPlus, Eye, Users, Square, CheckCircle, MessageCircle } from 'lucide-react';
import { endSession } from '@/actions/sessions';
import { toast } from 'sonner';

interface ActiveSessionCardProps {
    session: any;
    userRole: string;
    isAttended: boolean;
}

export function ActiveSessionCard({ session, userRole, isAttended }: ActiveSessionCardProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const canEndSession = ['SUPERADMIN', 'ADMIN'].includes(userRole);
    const canScan = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE'].includes(userRole);
    const allowLocation = session.sabaq.allowLocationAttendance;

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

    return (
        <Card className="glass lift-lg session-card-active">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1">{session.sabaq.name}</CardTitle>
                    <Badge variant="default" className="shrink-0 animate-pulse">Live</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">
                            Started {session.startedAt ? new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </span>
                    </div>
                    {session.sabaq.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span className="truncate">{session.sabaq.location.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span>Attendance: <strong>{attendanceCount}</strong></span>
                    </div>
                    {isAttended && (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span>Attendance Marked</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {canEndSession && (
                        <Button size="sm" variant="destructive" onClick={handleEndSession} disabled={loading} className="gap-2 flex-1">
                            <Square className="h-3.5 w-3.5" />
                            End
                        </Button>
                    )}

                    {!isAttended && canScan && (
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

                    {isAttended && (
                        <Button size="sm" variant="secondary" asChild className="gap-2 flex-1">
                            <Link href={`/dashboard/sessions/${session.id}?tab=questions`}>
                                <MessageCircle className="h-3.5 w-3.5" />
                                Ask
                            </Link>
                        </Button>
                    )}

                    {allowLocation && !isAttended && (
                        <Button size="sm" variant="outline" asChild className="gap-2">
                            <Link href={`/dashboard/sessions/${session.id}?action=mark-location`}>
                                <MapPin className="h-3.5 w-3.5" />
                                Location
                            </Link>
                        </Button>
                    )}

                    <Button size="sm" variant="outline" asChild className={`gap-2 ${!canEndSession && isAttended ? 'flex-1' : ''}`}>
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
