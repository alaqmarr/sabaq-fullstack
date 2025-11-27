'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, MapPin, QrCode, UserPlus, Eye, Users, Square, CheckCircle, MessageCircle, Navigation } from 'lucide-react';
import { endSession } from '@/actions/sessions';
import { markAttendanceLocation } from '@/actions/attendance';
import { toast } from 'sonner';
import { MyQRDialog } from '@/components/attendance/my-qr-dialog';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';

interface ActiveSessionCardProps {
    session: any;
    userRole: string;
    isAttended: boolean;
}

export function ActiveSessionCard({ session, userRole, isAttended }: ActiveSessionCardProps) {
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const router = useRouter();

    const canEndSession = ['SUPERADMIN', 'ADMIN'].includes(userRole);
    const canScan = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE'].includes(userRole);
    const allowLocation = session.sabaq.allowLocationAttendance;
    const isMumin = userRole === 'MUMIN';

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this session?')) return;

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

    const handleLocationAttendance = async () => {
        if (!confirm('Are you sure you want to mark attendance at your current location?')) return;

        if (!navigator.geolocation) {
            playErrorSound();
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const result = await markAttendanceLocation(
                    session.id,
                    position.coords.latitude,
                    position.coords.longitude
                );
                if (result.success) {
                    playSuccessSound();
                    toast.success('Attendance marked successfully!');
                    router.refresh();
                } else {
                    playErrorSound();
                    toast.error(result.error || 'Failed to mark attendance');
                }
                setLoading(false);
            },
            (error) => {
                playErrorSound();
                toast.error('Failed to get your location. Please enable location services.');
                setLoading(false);
            }
        );
    };

    const attendanceCount = session._count?.attendance || 0;

    return (
        <Card className="glass lift-lg session-card-active relative overflow-hidden">
            <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-0" />
            <CardHeader className="pb-3 relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1 pointer-events-auto">{session.sabaq.name}</CardTitle>
                    <Badge variant="default" className="shrink-0 animate-pulse">Live</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 relative z-10 pointer-events-none">
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate lowercase">
                            started {session.startedAt ? new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'n/a'}
                        </span>
                    </div>
                    {session.sabaq.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span className="truncate lowercase">{session.sabaq.location.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="lowercase">attendance: <strong>{attendanceCount}</strong></span>
                    </div>
                    {isAttended && (
                        <div className="flex items-center gap-2 text-green-600 font-medium lowercase">
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span>attendance marked</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pointer-events-auto">
                    {/* Admin Controls */}
                    {canEndSession && (
                        <Button size="sm" variant="frosted-red" onClick={handleEndSession} disabled={loading} className="gap-2">
                            <Square className="h-3.5 w-3.5" />
                            end
                        </Button>
                    )}

                    {canScan && (
                        <>
                            <Button size="sm" variant="frosted-teal" asChild className="gap-2">
                                <Link href={`/dashboard/scan?sessionId=${session.id}`}>
                                    <QrCode className="h-3.5 w-3.5" />
                                    scan qr
                                </Link>
                            </Button>
                            {!isAttended && (
                                <Button size="sm" variant="frosted-blue" asChild className="gap-2">
                                    <Link href={`/dashboard/sessions/${session.id}/attendance`}>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        manual
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}

                    {/* Mumin Controls */}
                    {isMumin && !isAttended && (
                        <>
                            <Button size="sm" variant="frosted-green" onClick={() => setShowQR(true)} className="gap-2">
                                <QrCode className="h-3.5 w-3.5" />
                                my qr
                            </Button>
                            {allowLocation && (
                                <Button size="sm" variant="frosted-green" onClick={handleLocationAttendance} disabled={loading} className="gap-2">
                                    <Navigation className="h-3.5 w-3.5" />
                                    mark attendance
                                </Button>
                            )}
                        </>
                    )}

                    {isAttended && (
                        <Button size="sm" variant="frosted-amber" asChild className="gap-2">
                            <Link href={`/dashboard/sessions/${session.id}?tab=questions`}>
                                <MessageCircle className="h-3.5 w-3.5" />
                                ask question
                            </Link>
                        </Button>
                    )}

                    <Button size="sm" variant="frosted-teal" asChild className="gap-2">
                        <Link href={`/dashboard/sessions/${session.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            view
                        </Link>
                    </Button>
                </div>
            </CardContent>
            <MyQRDialog open={showQR} onOpenChange={setShowQR} />
        </Card>
    );
}
