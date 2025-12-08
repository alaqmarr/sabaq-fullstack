'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, MapPin, QrCode, UserPlus, Eye, Users, Square, CheckCircle, MessageCircle, Navigation, Play, Calendar } from 'lucide-react';
import { startSession, endSession } from '@/actions/sessions';
import { markAttendanceLocation } from '@/actions/attendance';
import { toast } from 'sonner';
import { MyQRDialog } from '@/components/attendance/my-qr-dialog';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/date-utils';
import { AddToCalendarBtn } from '@/components/calendar/add-to-calendar-btn';
import { EndSessionDialog } from '@/components/sessions/end-session-dialog';

interface SessionCardProps {
    session: any;
    userRole: string;
    isAttended?: boolean;
    variant: 'active' | 'upcoming';
}

export function SessionCard({ session, userRole, isAttended = false, variant }: SessionCardProps) {
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const router = useRouter();

    const canStartStop = ['SUPERADMIN', 'ADMIN'].includes(userRole);
    const canScan = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(userRole);
    const allowLocation = session.sabaq.allowLocationAttendance;
    const isMumin = userRole === 'MUMIN';
    const isActive = session.isActive;
    const hasStarted = !!session.startedAt;

    const handleStartSession = async () => {
        if (!confirm('Are you sure you want to start this session?')) return;
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



    const handleLocationAttendance = async () => {
        if (!navigator.geolocation) {
            playErrorSound();
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Fetching location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const result = await markAttendanceLocation(
                    session.id,
                    position.coords.latitude,
                    position.coords.longitude
                );
                if (result.success) {
                    playSuccessSound();
                    toast.success('Attendance marked successfully!', { id: toastId });
                    router.refresh();
                } else {
                    playErrorSound();
                    toast.error(result.error || 'Failed to mark attendance', { id: toastId });
                }
                setLoading(false);
            },
            (error) => {
                playErrorSound();
                toast.error('Failed to get your location. Please enable location services.', { id: toastId });
                setLoading(false);
            }
        );
    };

    const attendanceCount = session._count?.attendances || 0;

    return (
        <Card className={cn(
            "glass group relative overflow-hidden transition-all hover:shadow-lg border-white/20 dark:border-white/10",
            variant === 'active' ? "border-l-4 border-l-primary" : "border-l-4 border-l-muted"
        )}>
            <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-0" />
            <CardContent className="p-0 relative z-10 pointer-events-none">
                <div className="flex flex-col lg:flex-row lg:items-center">
                    {/* Left: Details */}
                    <div className="p-4 sm:p-5 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-semibold line-clamp-1 pointer-events-auto">
                                {session.sabaq.name}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                {isActive && <Badge variant="frosted-green" className="animate-pulse">Live</Badge>}
                                {hasStarted && !isActive && <Badge variant="secondary">Ended</Badge>}
                                {!hasStarted && <Badge variant="outline">Upcoming</Badge>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span className="truncate">
                                    {formatDate(session.scheduledAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span className="truncate">
                                    {formatTime(session.scheduledAt)}
                                </span>
                            </div>
                            {session.sabaq.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                    <span className="truncate">{session.sabaq.location.name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span>Attendance: <strong>{attendanceCount}</strong></span>
                            </div>
                        </div>

                        {isAttended && (
                            <div className="flex items-center gap-2 text-green-600 font-medium text-xs sm:text-sm bg-green-500/10 p-2 rounded-md w-fit">
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span>Attendance Marked</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Controls */}
                    <div className="p-4 sm:p-5 bg-muted/30 lg:bg-transparent lg:border-l border-t lg:border-t-0 flex flex-wrap lg:flex-col gap-2 justify-end lg:w-48 pointer-events-auto">
                        {/* Admin Controls */}
                        {canStartStop && !hasStarted && (
                            <Button size="sm" variant="frosted-green" onClick={handleStartSession} disabled={loading} className="w-fit justify-start">
                                <Play className="h-3.5 w-3.5 mr-2" /> Start
                            </Button>
                        )}
                        {canStartStop && isActive && (
                            <EndSessionDialog
                                sessionId={session.id}
                                sabaqName={session.sabaq.name}
                                onSuccess={() => {
                                    router.refresh();
                                }}
                            >
                                <Button size="sm" variant="frosted-red" disabled={loading} className="w-fit justify-start">
                                    <Square className="h-3.5 w-3.5 mr-2" /> End
                                </Button>
                            </EndSessionDialog>
                        )}

                        {/* QR Scanner for active sessions - available to all scan-capable roles */}
                        {canScan && isActive && (
                            <Button size="sm" variant="frosted-teal" asChild className="w-fit justify-start">
                                <Link href={`/dashboard/sessions/${session.id}/scan`}>
                                    <QrCode className="h-3.5 w-3.5 mr-2" /> Take Attendance
                                </Link>
                            </Button>
                        )}

                        {/* Manual Attendance for NON-ACTIVE sessions - ONLY for ADMINs/SUPERADMINs */}
                        {canStartStop && !isActive && (
                            <Button size="sm" variant="frosted-amber" asChild className="w-fit justify-start">
                                <Link href={`/dashboard/sessions/${session.id}/manual-attendance`}>
                                    <UserPlus className="h-3.5 w-3.5 mr-2" /> Manual Attendance
                                </Link>
                            </Button>
                        )}

                        {/* Attendance Controls (All Roles) */}
                        {isActive && !isAttended && (
                            <>
                                <Button size="sm" variant="frosted-green" onClick={() => setShowQR(true)} className="w-fit justify-start">
                                    <QrCode className="h-3.5 w-3.5 mr-2" /> My QR
                                </Button>
                                {allowLocation && (
                                    <Button size="sm" variant="frosted-green" onClick={handleLocationAttendance} disabled={loading} className="w-fit justify-start">
                                        <Navigation className="h-3.5 w-3.5 mr-2" /> Mark Present
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Actions for attended users */}
                        {isAttended && (
                            <>
                                <Button size="sm" variant="frosted-amber" asChild className="w-fit justify-start">
                                    <Link href={`/sessions/${session.id}/ask`}>
                                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> Ask Question
                                    </Link>
                                </Button>
                                <Button size="sm" variant="frosted-blue" asChild className="w-fit justify-start">
                                    <Link href={`/sessions/${session.id}/feedback`}>
                                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> Add Feedback
                                    </Link>
                                </Button>
                            </>
                        )}

                        {!isActive && !hasStarted && <AddToCalendarBtn session={session} />}

                        <Button size="sm" variant="ghost" asChild className="w-fit justify-start">
                            <Link href={`/dashboard/sessions/${session.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
            <MyQRDialog open={showQR} onOpenChange={setShowQR} />
        </Card>
    );
}
