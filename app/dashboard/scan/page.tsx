import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import ScanClient from './scan-client';

export default async function ScanPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('scan', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    return <ScanClient />;
}
