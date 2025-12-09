import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { ManualAttendanceClient } from './manual-attendance-client';
import { formatPPP } from '@/lib/date-utils';
import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';

export const preferredRegion = ["sin1"];

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
    const { sessionId } = await params;
    return {
        title: `Manual Attendance | Session ${sessionId}`,
    };
}

export default async function ManualAttendancePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const authSession = await auth();

    if (!authSession?.user) redirect('/login');

    // STRICT PERMISSION: Only SUPERADMIN and ADMIN can access this page
    const user = await prisma.user.findUnique({
        where: { id: authSession.user.id },
        select: { role: true },
    });

    if (!user || !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
        redirect('/unauthorized');
    }

    // Fetch session details
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            sabaq: {
                select: {
                    id: true,
                    name: true,
                    admins: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (!session) {
        notFound();
    }

    // For non-SUPERADMIN, ensure they are a sabaq admin
    if (user.role === 'ADMIN') {
        const isSabaqAdmin = session.sabaq.admins.some(a => a.userId === authSession.user.id);
        if (!isSabaqAdmin) {
            redirect('/unauthorized');
        }
    }

    // Fetch enrolled users for this sabaq
    const enrollments = await prisma.enrollment.findMany({
        where: {
            sabaqId: session.sabaqId,
            status: 'APPROVED'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    itsNumber: true,
                    email: true
                }
            }
        },
        orderBy: { user: { name: 'asc' } }
    });

    // Fetch existing attendances for this session
    const attendances = await prisma.attendance.findMany({
        where: { sessionId },
        select: { userId: true }
    });
    const attendedUserIds = new Set(attendances.map(a => a.userId));

    const enrolledUsers = enrollments.map(e => ({
        ...e.user,
        hasAttended: attendedUserIds.has(e.user.id)
    }));

    // Fetch pending enrollment requests for this sabaq
    const pendingRequests = await prisma.enrollment.findMany({
        where: {
            sabaqId: session.sabaqId,
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
            }
        },
        orderBy: { requestedAt: 'asc' }
    });

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sessions/${sessionId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Session
                    </Button>
                </Link>
            </div>

            <PageHeader
                title="Manual Attendance"
                description={`Mark attendance for ${session.sabaq.name} - ${formatPPP(session.scheduledAt)}`}
            />

            <div className="glass-panel p-4 rounded-lg flex items-center gap-3 text-sm mb-6">
                <Shield className="h-5 w-5 text-amber-500" />
                <div>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Admin Only:</span>
                    {' '}This page allows direct attendance marking without QR/location. Users will be notified via email.
                </div>
            </div>

            <ManualAttendanceClient
                sessionId={sessionId}
                sabaqName={session.sabaq.name}
                sabaqId={session.sabaqId}
                scheduledAt={session.scheduledAt.toISOString()}
                enrolledUsers={enrolledUsers}
                pendingRequests={pendingRequests.map(req => ({
                    id: req.id,
                    userId: req.userId,
                    name: req.user.name,
                    itsNumber: req.user.itsNumber,
                    email: req.user.email
                }))}
            />
        </div>
    );
}
