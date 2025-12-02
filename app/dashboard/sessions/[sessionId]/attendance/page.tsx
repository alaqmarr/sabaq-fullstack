
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { requirePermission, requireSessionAccess } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { getSessionById } from '@/actions/sessions';
import { getSessionAttendance, getAttendanceStats } from '@/actions/attendance';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { AttendanceStats } from '@/components/attendance/attendance-stats';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { LocationAttendance } from '@/components/attendance/location-attendance';
import { AttendanceList } from '@/components/attendance/attendance-list';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default async function SessionAttendancePage({ params }: { params: Promise<{ sessionId: string }> }) {
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
    const attendanceResult = await getSessionAttendance(sessionId);
    const statsResult = await getAttendanceStats(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const attendances = attendanceResult.success ? attendanceResult.attendances : [];
    const stats = statsResult.success ? statsResult.stats : null;

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role);
    const isActive = sessionData.isActive;
    const isEnded = !!sessionData.endedAt;
    const hasStarted = !!sessionData.startedAt;
    const allowLocationAttendance = sessionData.sabaq.allowLocationAttendance;

    // Check if user has already marked attendance
    const userAttendance = attendances?.find((a) => a.userId === session.user.id);

    // RBAC Logic for taking attendance
    // "only superadmins and admins can take attendance is session is not started or ended"
    // This implies:
    // 1. If Active: Admins can mark, Users can mark (if location allowed).
    // 2. If Not Active (Scheduled or Ended): Only Admins can mark (Manual Override).
    const canAdminMark = isAdmin;
    const canUserMark = !isAdmin && isActive && allowLocationAttendance && !userAttendance;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/sessions/${sessionId}`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                    <p className="text-muted-foreground">
                        Manage attendance for {sessionData.sabaq.name}
                    </p>
                </div>
            </div>

            {stats && <AttendanceStats stats={stats} />}

            <div className="grid gap-4 md:grid-cols-2">
                {/* Admin Attendance Form */}
                {canAdminMark && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mark Attendance</CardTitle>
                            <CardDescription>
                                {isActive ? "Session is active." : "Manual override for inactive session."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceForm sessionId={sessionId} />
                        </CardContent>
                    </Card>
                )}

                {/* User Location Attendance */}
                {canUserMark && (
                    <LocationAttendance sessionId={sessionId} />
                )}

                {/* Already Marked */}
                {!isAdmin && userAttendance && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Confirmed</CardTitle>
                            <CardDescription>You have already marked your attendance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Time:</span>{' '}
                                    {format(new Date(userAttendance.markedAt), 'PPp')}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Method:</span>{' '}
                                    {userAttendance.method.replace('_', ' ')}
                                </p>
                                {userAttendance.isLate && (
                                    <Badge variant="destructive">
                                        Late by {userAttendance.minutesLate} minutes
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AttendanceList sessionId={sessionId} />
        </div>
    );
}
