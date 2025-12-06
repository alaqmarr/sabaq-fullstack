import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ActiveSessionsSection } from '@/components/dashboard/active-sessions';
import { UpcomingSessionsSection } from '@/components/dashboard/upcoming-sessions';
import { RecentlyEndedSessionsSection } from '@/components/dashboard/recently-ended-sessions';
import { ActiveSessionsSkeleton, UpcomingSessionsSkeleton, RecentlyEndedSessionsSkeleton } from '@/components/dashboard/skeletons';
import { AdminQuickActions } from '@/components/dashboard/admin-quick-actions';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';

export const metadata = {
    title: "Admin Dashboard",
};

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    try {
        await requirePermission('sabaqs', 'read');
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const role = session.user.role;
    const isAdminOrManager = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(role);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Dashboard
                </h1>
                <p className="text-cred-label mt-2">Welcome back, {session.user.name}</p>
            </div>

            {/* SESSION CARDS AT THE VERY TOP - Priority #1 */}
            <div className="space-y-6">
                {/* Active Sessions - Highest Priority */}
                <Suspense fallback={<ActiveSessionsSkeleton />}>
                    <ActiveSessionsSection />
                </Suspense>

                {/* Recently Ended Sessions - Shows quick actions for feedback/questions */}
                <Suspense fallback={<RecentlyEndedSessionsSkeleton />}>
                    <RecentlyEndedSessionsSection />
                </Suspense>

                {/* Upcoming Sessions - Second Priority */}
                <Suspense fallback={<UpcomingSessionsSkeleton />}>
                    <UpcomingSessionsSection />
                </Suspense>
            </div>

            {/* Quick Actions - Last (Admin only) */}
            {isAdminOrManager && <AdminQuickActions />}
        </div>
    );
}

