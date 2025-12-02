import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { SecurityLogsTable } from '@/components/admin/security-logs-table';

export default async function SecurityLogsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('users', 'delete'); // Assuming SUPERADMIN has this
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const logs = await prisma.securityLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true,
                    itsNumber: true,
                },
            },
        },
        take: 100,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Security Logs</h1>
                <p className="text-muted-foreground">
                    Monitor unauthorized access attempts and security events.
                </p>
            </div>

            <SecurityLogsTable logs={logs} />
        </div>
    );
}
