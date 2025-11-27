import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import { UserTable } from '@/components/users/user-table';
import { UserGrid } from '@/components/users/user-grid';
import { UserDialogManager } from '@/components/users/user-dialog-manager';
import { BulkUserDialogManager } from '@/components/users/bulk-user-dialog-manager';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Button } from '@/components/ui/button';
import { UserPlus, Upload } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: "Users",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ view?: string; action?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const role = session.user.role;

    if (role !== 'SUPERADMIN') {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Unauthorized: Only administrators can manage users.</p>
            </div>
        );
    }

    const { view, action } = await searchParams;
    const currentView = view === 'table' ? 'table' : 'grid';
    const isDialogOpen = action === 'new';
    const isBulkOpen = action === 'bulk';

    const res = await getUsers();
    const users = res.success && res.users ? res.users : [];

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Users
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage system users and roles</p>
                </div>
                <div className="flex items-center gap-4">
                    <ViewToggle defaultView={currentView} />
                    <Link href="/dashboard/users?action=bulk">
                        <Button variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" />
                            Bulk Import
                        </Button>
                    </Link>
                    <Link href="/dashboard/users?action=new">
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </Link>
                </div>
            </div>

            {currentView === 'grid' ? (
                <UserGrid users={users} />
            ) : (
                <UserTable users={users} />
            )}

            <UserDialogManager isOpen={isDialogOpen} />
            <BulkUserDialogManager isOpen={isBulkOpen} />
        </div>
    );
}
