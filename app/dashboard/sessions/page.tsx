import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { getAllSessions } from '@/actions/sessions';
import { getSabaqs } from '@/actions/sabaqs';
import { SessionGrid } from '@/components/sessions/session-grid';
import { SessionTable } from '@/components/sessions/session-table';
import { ViewToggle } from '@/components/ui/view-toggle';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = {
    title: "Sessions",
};

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('sessions', 'read');
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
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
            <PageHeader
                title="Sessions"
                description="Manage sabaq sessions"
            >
                <ViewToggle defaultView={currentView} />
            </PageHeader>

            {currentView === 'grid' ? (
                <SessionGrid sessions={sessions} sabaqs={sabaqs} />
            ) : (
                <SessionTable sessions={sessions} sabaqs={sabaqs} />
            )}
        </div>
    );
}
