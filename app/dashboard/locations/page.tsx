import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getLocations } from '@/actions/locations';
import { LocationTable } from '@/components/locations/location-table';
import { LocationGrid } from '@/components/locations/location-grid';
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
                <LocationHeader />
                <ViewToggle defaultView={currentView} />
            </div>

            {currentView === 'grid' ? (
                <LocationGrid locations={locations} />
            ) : (
                <LocationTable locations={locations} />
            )}
        </div>
    );
}
