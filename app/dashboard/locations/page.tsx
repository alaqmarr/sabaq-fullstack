import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { getLocations } from '@/actions/locations';
import { LocationsClientWrapper } from '@/components/locations/locations-client-wrapper';
import { LocationHeader } from '@/components/locations/location-header';
import { ViewToggle } from '@/components/ui/view-toggle';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('locations', 'read');
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const { view } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';

    const res = await getLocations();
    const locations = res.success && res.locations ? res.locations : [];

    return (
        <div className="space-y-4 sm:space-y-6">
            <LocationHeader>
                <ViewToggle defaultView={currentView} />
            </LocationHeader>

            <LocationsClientWrapper locations={locations} currentView={currentView} />
        </div>
    );
}
