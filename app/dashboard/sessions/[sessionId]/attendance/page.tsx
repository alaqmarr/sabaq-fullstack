
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { requirePermission, requireSessionAccess } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { getSessionById } from '@/actions/sessions';
import { getSessionAttendance, getAttendanceStats } from '@/actions/attendance';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, QrCode } from 'lucide-react';
import { AttendanceStats } from '@/components/attendance/attendance-stats';
import { AttendanceList } from '@/components/attendance/attendance-list';
import { PageHeader } from '@/components/ui/page-header';

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

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
            <PageHeader
                title="Attendance"
                description={`Manage attendance for ${sessionData.sabaq.name}`}
                actions={isAdmin ? [
                    {
                        label: "Take Attendance",
                        icon: QrCode,
                        href: `/dashboard/scan?sessionId=${sessionId}`,
                        variant: "default"
                    }
                ] : []}
            >
                <Link href={`/dashboard/sessions/${sessionId}`}>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
            </PageHeader>

            {stats && <AttendanceStats stats={stats} />}

            <AttendanceList sessionId={sessionId} />
        </div>
    );
}
