import { ProcessEmailsButton } from '@/components/admin/process-emails-button';
import { MobileNav } from '@/components/mobile-nav';
import { UserNav } from '@/components/user-nav';
import { DashboardNav } from '@/components/dashboard-nav';

// ...

import { auth } from '@/auth';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    const role = session?.user?.role as string;
    const isAdminOrManager = role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER' || role === 'ATTENDANCE_INCHARGE';
    const isMumin = role === 'MUMIN' || role === 'JANAB' || role === 'USER'; // Assuming USER maps to Mumin behavior

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-xl">
                <div className="w-full flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {isAdminOrManager && <MobileNav />}
                        <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase">
                            {session?.user?.role} module
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {(role === 'SUPERADMIN' || role === 'ADMIN') && <ProcessEmailsButton />}
                        {session?.user && <UserNav user={session.user} />}
                    </div>
                </div>
            </header>
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex gap-6 lg:gap-12 py-6">
                    {isAdminOrManager && (
                        <aside className="hidden md:flex md:w-[200px] lg:w-[240px] flex-col rounded-2xl border border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-lg p-4 h-[calc(100vh-8rem)] sticky top-24">
                            <DashboardNav />
                        </aside>
                    )}
                    <main className="flex-1 min-w-0 scrollbar-gutter-stable">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
