import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocations } from '@/actions/locations';
import { LocationsClientWrapper } from '@/components/locations/locations-client-wrapper';
import { LocationHeader } from '@/components/locations/location-header';
import { ViewToggle } from '@/components/ui/view-toggle';
import { requirePermission } from '@/lib/rbac';

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('locations', 'read');
    } catch (error) {
        // requirePermission now handles redirect, but we keep try/catch for safety
        redirect('/unauthorized');
    }

    const { view } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';

    const res = await getLocations();
    const locations = res.success && res.locations ? res.locations : [];

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase">
                        locations
                    </h1>
                    <p className="text-cred-label mt-2 lowercase">manage attendance locations</p>
                </div>
                <div className="flex items-center gap-2">
                    <LocationHeader />
                    <ViewToggle defaultView={currentView} />
                </div>
            </div>

            <LocationsClientWrapper locations={locations} currentView={currentView} />
        </div>
    );
}
