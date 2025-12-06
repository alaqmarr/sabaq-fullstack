import { getRecentlyEndedSessions } from '@/actions/sessions';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RecentlyEndedCarousel } from './recently-ended-carousel';
import { Clock } from 'lucide-react';

export async function RecentlyEndedSessionsSection() {
    const session = await auth();
    const result = await getRecentlyEndedSessions();
    const sessions = result.success && result.sessions ? result.sessions : [];

    if (sessions.length === 0) {
        return null;
    }

    // Fetch user's attendance for these sessions if logged in
    let attendanceMap = new Map<string, { attended: boolean; isLate: boolean }>();
    if (session?.user?.id) {
        const attendances = await prisma.attendance.findMany({
            where: {
                userId: session.user.id,
                sessionId: { in: sessions.map((s: any) => s.id) }
            },
            select: { sessionId: true, isLate: true }
        });
        for (const att of attendances) {
            attendanceMap.set(att.sessionId, { attended: true, isLate: att.isLate });
        }
    }

    const userRole = session?.user?.role || 'MUMIN';
    const showAdminActions = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(userRole);

    // Prepare sessions with attendance data
    const sessionsWithAttendance = sessions.map((sess: any) => ({
        ...sess,
        userAttendance: attendanceMap.has(sess.id)
            ? attendanceMap.get(sess.id)!
            : { attended: false, isLate: false },
    }));

    return (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl text-cred-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recently Ended
            </h2>
            <RecentlyEndedCarousel
                sessions={sessionsWithAttendance}
                showAdminActions={showAdminActions}
            />
        </div>
    );
}

