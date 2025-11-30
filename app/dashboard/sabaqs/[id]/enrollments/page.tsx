import { getSabaqById } from '@/actions/sabaqs';
import { getEnrollmentsBySabaq } from '@/actions/enrollments';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { EnrollmentsTab } from '@/components/enrollments/enrollments-tab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function SabaqEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const { sabaq } = await getSabaqById(id);
    const { enrollments } = await getEnrollmentsBySabaq(id);

    if (!sabaq) {
        notFound();
    }

    const isAdmin = session?.user?.role && ([Role.SUPERADMIN, Role.ADMIN, Role.MANAGER] as any[]).includes(session.user.role);

    if (!isAdmin) {
        return <div className="p-8 text-center">Unauthorized</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sabaqs/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {sabaq.name}
                    </Button>
                </Link>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-cred-heading lowercase">Manage Enrollments</h2>
            </div>

            <EnrollmentsTab
                enrollments={enrollments || []}
                sabaqId={sabaq.id}
                sabaqName={sabaq.name}
            />
        </div>
    );
}
