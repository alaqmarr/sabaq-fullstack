import { getActiveSessions } from '@/actions/sessions';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SessionCard } from './session-card';

export async function ActiveSessionsSection() {
    const session = await auth();
    const result = await getActiveSessions();
    const sessions = result.success && result.sessions ? result.sessions : [];

    if (sessions.length === 0) {
        return null;
    }

    // Fetch user's attendance for these sessions if logged in
    let attendedSessionIds = new Set<string>();
    if (session?.user?.id) {
        const attendances = await prisma.attendance.findMany({
            where: {
                userId: session.user.id,
                sessionId: { in: sessions.map(s => s.id) }
            },
            select: { sessionId: true }
        });
        attendedSessionIds = new Set(attendances.map(a => a.sessionId));
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl text-cred-heading text-primary flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Active Sessions
            </h2>
            <div className="flex flex-col gap-4">
                {sessions.map((sess: any) => (
                    <SessionCard
                        key={sess.id}
                        session={sess}
                        userRole={session?.user?.role || 'MUMIN'}
                        isAttended={attendedSessionIds.has(sess.id)}
                        variant="active"
                    />
                ))}
            </div>
        </div>
    );
}
