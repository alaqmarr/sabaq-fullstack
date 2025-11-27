import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EnrollmentRequestsAdmin } from '@/components/enrollments/enrollment-requests-admin';

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

    // Fetch all sabaqs for filtering
    // Admins/Superadmins see all, Janabs see their own
    let sabaqWhere = {};
    if (role === 'JANAB') {
        sabaqWhere = { janabId: session.user.id };
    } else if (role === 'ADMIN') {
        // Admins see assigned sabaqs
        const assigned = await prisma.sabaqAdmin.findMany({
            where: { userId: session.user.id },
            select: { sabaqId: true }
        });
        sabaqWhere = { id: { in: assigned.map(a => a.sabaqId) } };
    }

    const sabaqs = await prisma.sabaq.findMany({
        where: {
            isActive: true,
            ...sabaqWhere
        },
        select: { id: true, name: true, level: true, kitaab: true },
        orderBy: { name: 'asc' }
    });

    // Fetch all pending enrollments for these sabaqs
    const enrollments = await prisma.enrollment.findMany({
        where: {
            sabaqId: { in: sabaqs.map(s => s.id) },
            status: 'PENDING'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    itsNumber: true,
                    email: true
                }
            },
            sabaq: {
                select: {
                    id: true,
                    name: true,
                    level: true,
                    kitaab: true
                }
            }
        },
        orderBy: { requestedAt: 'desc' }
    });

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
