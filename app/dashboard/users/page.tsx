import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
    title: "Users",
};

export default async function UsersPage() {
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

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Users
                </h1>
                <p className="text-muted-foreground mt-2">Manage system users and roles</p>
            </div>

            <div className="glass p-8 rounded-lg text-center">
                <p className="text-muted-foreground">User management interface - coming soon</p>
            </div>
        </div>
    );
}
