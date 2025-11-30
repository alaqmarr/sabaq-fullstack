import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EnrollmentRequestsAdmin } from '@/components/enrollments/enrollment-requests-admin';
import { getEnrollmentRequests } from '@/actions/enrollments';

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

    const { enrollments, sabaqs } = await getEnrollmentRequests();

    if (!enrollments || !sabaqs) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Failed to load enrollment requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Enrollments
                </h1>
                <p className="text-cred-label mt-2">Manage user enrollment requests</p>
            </div>

            <EnrollmentRequestsAdmin enrollments={enrollments} sabaqs={sabaqs} />
        </div>
    );
}
