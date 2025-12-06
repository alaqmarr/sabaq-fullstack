import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSabaqById } from '@/actions/sabaqs';
import { getSabaqAdmins, getEligibleAdmins } from '@/actions/sabaq-admins';
import { SabaqAdminsView } from '@/components/sabaqs/sabaq-admins-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const preferredRegion = ["sin1"];

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const sabaqResult = await getSabaqById(id);
    const sabaqName = sabaqResult.success && sabaqResult.sabaq ? sabaqResult.sabaq.name : 'Sabaq';
    return {
        title: `${sabaqName} - Admins`,
    };
}

export default async function SabaqAdminsPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const { id } = await params;

    // Only SUPERADMINs can manage sabaq admins
    if (session.user.role !== 'SUPERADMIN') {
        redirect('/unauthorized?reason=insufficient_permissions');
    }

    // Fetch sabaq details
    const sabaqResult = await getSabaqById(id);
    if (!sabaqResult.success || !sabaqResult.sabaq) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Sabaq not found.</p>
            </div>
        );
    }

    const sabaq = sabaqResult.sabaq;

    // Fetch current admins and eligible users
    let currentAdmins: Awaited<ReturnType<typeof getSabaqAdmins>> = [];
    let eligibleAdmins: Awaited<ReturnType<typeof getEligibleAdmins>> = [];

    try {
        currentAdmins = await getSabaqAdmins(id);
        eligibleAdmins = await getEligibleAdmins();
    } catch (error) {
        console.error('Failed to fetch admins:', error);
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Custom Header with Back Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/sabaqs/${id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">{sabaq.name} - Admins</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage administrators for this sabaq
                        </p>
                    </div>
                </div>
            </div>

            <SabaqAdminsView
                sabaqId={id}
                sabaqName={sabaq.name}
                currentAdmins={currentAdmins}
                eligibleAdmins={eligibleAdmins}
            />
        </div>
    );
}
