import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import { UsersClientWrapper } from '@/components/users/users-client-wrapper';
import { UserDialogManager } from '@/components/users/user-dialog-manager';
import { ViewToggle } from '@/components/ui/view-toggle';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { UserHeader } from '@/components/users/user-header';

export const metadata = {
    title: "Users",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ view?: string; action?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('users', 'read');
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const { view, action } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';
    const isDialogOpen = action === 'new';


    const res = await getUsers(1, 20);
    const users = res.success && res.users ? res.users : [];
    const total = res.success && res.total ? res.total : 0;

    return (
        <div className="space-y-6 sm:space-y-8">
            <UserHeader>
                <ViewToggle defaultView={currentView} />
            </UserHeader>

            <UsersClientWrapper
                initialUsers={users}
                initialTotal={total}
                currentView={currentView}
                currentUserRole={session?.user?.role || undefined}
            />

            <UserDialogManager isOpen={isDialogOpen} />
        </div>
    );
}
