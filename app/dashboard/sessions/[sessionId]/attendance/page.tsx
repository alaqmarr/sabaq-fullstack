import { auth } from '@/auth';
import { QuickAttendanceForm } from '@/components/attendance/quick-attendance-form';
import { AttendanceList } from '@/components/attendance/attendance-list';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface AttendancePageProps {
    params: Promise<{
        sessionId: string;
    }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
    const { sessionId } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Check permissions
    const userRole = session.user.role;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'];

    if (!allowedRoles.includes(userRole)) {
        return <div className="p-8 text-center text-red-500">Unauthorized: You do not have permission to take attendance.</div>;
    }

    // Verify session exists and get start time
    const sessionData = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            scheduledAt: true,
            startedAt: true,
            sabaq: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!sessionData) {
        notFound();
    }

    const startTime = sessionData.startedAt || sessionData.scheduledAt;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{sessionData.sabaq.name}</h1>
                <p className="text-muted-foreground">Quick attendance entry with auto-detection</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick Entry Form */}
                <div className="lg:col-span-1">
                    <QuickAttendanceForm
                        sessionId={sessionId}
                        sessionStartTime={startTime}
                    />
                </div>

                {/* Real-time Attendance List */}
                <div className="lg:col-span-2">
                    <AttendanceList sessionId={sessionId} />
                </div>
            </div>
        </div>
    );
}
