import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSabaqs } from '@/actions/sabaqs';
import { getLocations } from '@/actions/locations';
import { getUsers } from '@/actions/users';
import { SabaqGrid } from '@/components/sabaqs/sabaq-grid';
import { SabaqTable } from '@/components/sabaqs/sabaq-table';
import { SabaqHeader } from '@/components/sabaqs/sabaq-header';
import { ViewToggle } from '@/components/ui/view-toggle';
import { SabaqQuickActions } from '@/components/sabaqs/sabaq-quick-actions';
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
    const potentialJanabs = users.filter(u => u.role === 'JANAB');

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Sabaqs
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage sabaq programs</p>
                </div>
                <div className="flex items-center gap-2">
                    <SabaqQuickActions />
                    <ViewToggle defaultView={currentView} />
                </div>
            </div>

            <SabaqHeader locations={locations} users={potentialJanabs} defaultOpen={action === 'new'} />

            {currentView === 'grid' ? (
                <SabaqGrid sabaqs={sabaqs} locations={locations} users={potentialJanabs} />
            ) : (
                <SabaqTable sabaqs={sabaqs} locations={locations} users={potentialJanabs} />
            )}
        </div>
    );
}