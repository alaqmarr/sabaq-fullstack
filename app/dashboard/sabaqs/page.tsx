import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSabaqs } from '@/actions/sabaqs';
import { getLocations } from '@/actions/locations';
import { getUsers } from '@/actions/users';
import { SabaqHeader } from '@/components/sabaqs/sabaq-header';
import { SabaqsClientWrapper } from '@/components/sabaqs/sabaqs-client-wrapper';
import { ViewToggle } from '@/components/ui/view-toggle';
import { requirePermission } from '@/lib/rbac';

export const metadata = {
    title: "Sabaqs",
};

export default async function SabaqsPage({ searchParams }: { searchParams: Promise<{ action?: string; view?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    // RBAC Check
    try {
        await requirePermission('sabaqs', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const { action, view } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';

    const [sabaqsRes, locationsRes, usersRes] = await Promise.all([
        getSabaqs(),
        getLocations(),
        getUsers()
    ]);

    const sabaqs = sabaqsRes.success && sabaqsRes.sabaqs ? sabaqsRes.sabaqs : [];
    const locations = locationsRes.success && locationsRes.locations ? locationsRes.locations : [];
    const users = usersRes.success && usersRes.users ? usersRes.users : [];

    // Filter users who can be Janab (Strictly JANAB role as requested)
    const potentialJanabs = users.filter((u: any) => u.role === 'JANAB');

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <SabaqHeader locations={locations} users={potentialJanabs} defaultOpen={action === 'new'}>
                <ViewToggle defaultView={currentView} />
            </SabaqHeader>

            <SabaqsClientWrapper
                sabaqs={sabaqs}
                locations={locations}
                users={potentialJanabs}
                currentView={currentView}
            />
        </div>
    );
}