import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllSessions } from '@/actions/sessions';
import { getSabaqs } from '@/actions/sabaqs';
import { SessionGrid } from '@/components/sessions/session-grid';
import { SessionTable } from '@/components/sessions/session-table';
import { ViewToggle } from '@/components/ui/view-toggle';

export const metadata = {
    title: "Sessions",
};

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const role = session.user.role;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB', 'ATTENDANCE_INCHARGE'];

    if (!allowedRoles.includes(role)) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Unauthorized: You do not have permission to view sessions.</p>
            </div>
        );
    }

    const { view } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';

    const [sessionsRes, sabaqsRes] = await Promise.all([
        getAllSessions(),
        getSabaqs()
    ]);

    const sessions = sessionsRes.success && sessionsRes.sessions ? sessionsRes.sessions : [];
    const sabaqs = sabaqsRes.success && sabaqsRes.sabaqs ? sabaqsRes.sabaqs : [];

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Sessions
                    </h1>
                    <p className="text-cred-label mt-2">Manage sabaq sessions</p>
                </div>
                <ViewToggle defaultView={currentView} />
            </div>

            {currentView === 'grid' ? (
                <SessionGrid sessions={sessions} sabaqs={sabaqs} />
            ) : (
                <SessionTable sessions={sessions} sabaqs={sabaqs} />
            )}
        </div>
    );
}
