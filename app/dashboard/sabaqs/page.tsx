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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase">
                        sabaqs
                    </h1>
                    <p className="text-cred-label mt-2 lowercase">manage sabaq programs</p>
                </div>
                <div className="flex items-center gap-2">
                    <SabaqHeader locations={locations} users={potentialJanabs} defaultOpen={action === 'new'} />
                    <ViewToggle defaultView={currentView} />
                </div>
            </div>

            <SabaqsClientWrapper
                sabaqs={sabaqs}
                locations={locations}
                users={potentialJanabs}
                currentView={currentView}
            />
        </div>
    );
}