import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EnrollmentRequestsAdmin } from '@/components/enrollments/enrollment-requests-admin';
import { getEnrollmentRequests } from '@/actions/enrollments';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = {
    title: "Enrollments",
};

export default async function EnrollmentsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const role = session.user.role;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'JANAB'];

    if (!allowedRoles.includes(role)) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Unauthorized: You do not have permission to manage enrollments.</p>
            </div>
        );
    }

    const { enrollments, sabaqs, total } = await getEnrollmentRequests(1, 20);

    if (!enrollments || !sabaqs) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Failed to load enrollment requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <PageHeader
                title="Enrollments"
                description="Manage user enrollment requests"
            />

            <EnrollmentRequestsAdmin
                initialEnrollments={enrollments}
                sabaqs={sabaqs}
                initialTotal={total || 0}
            />
        </div>
    );
}
