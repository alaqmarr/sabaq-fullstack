import { getSabaqById } from '@/actions/sabaqs';
import { getEnrollmentStatus, getEnrollmentsBySabaq } from '@/actions/enrollments';
import { getUpcomingSessions, getActiveSessions } from '@/actions/sessions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { Users, Calendar, FileDown, ChevronRight } from 'lucide-react';
import { EnrollmentStatusBanner } from '@/components/sabaqs/enrollment-status-banner';
import { SabaqQuickActions } from '@/components/sabaqs/sabaq-quick-actions';
import { RegistrationLink } from '@/components/sabaqs/registration-link';
import { SabaqEnrollmentCards } from '@/components/sabaqs/sabaq-enrollment-cards';

import { requireSabaqAccess } from '@/lib/rbac';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { sabaq } = await getSabaqById(id);

    if (!sabaq) {
        return {
            title: "Sabaq Not Found",
        };
    }

    return {
        title: `${sabaq.name} | Asbaaq Management System`,
    };
}

export default async function SabaqDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    // Enforce Granular Access
    await requireSabaqAccess(id);

    const { sabaq } = await getSabaqById(id);

    if (!sabaq) {
        notFound();
    }

    const isAdmin = session?.user?.role && ([Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.JANAB, Role.ATTENDANCE_INCHARGE] as Role[]).includes(session.user.role);

    const { enrollment } = await getEnrollmentStatus(id);
    const { sessions: upcomingSessions } = await getUpcomingSessions(14); // Fetch next 2 weeks
    const { sessions: activeSessions } = await getActiveSessions();
    const { enrollments } = await getEnrollmentsBySabaq(id);

    const upcomingSession = upcomingSessions?.find((s: any) => s.sabaqId === id);
    const ongoingSession = activeSessions?.find((s: any) => s.sabaqId === id);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {sabaq.name}
                        </h2>
                        <p className="text-muted-foreground">
                            {sabaq.kitaab} • {sabaq.level}
                        </p>
                    </div>
                    <EnrollmentStatusBanner
                        status={enrollment?.status || null}
                        rejectionReason={enrollment?.rejectionReason}
                    />
                </div>
            </div>

            {/* Registration Link (Admin Only) */}
            {isAdmin && (
                <RegistrationLink sabaqId={sabaq.id} />
            )}

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="col-span-full md:col-span-2 lg:col-span-4">
                    <SabaqQuickActions
                        sabaqId={sabaq.id}
                        isEnrolled={enrollment?.status === 'APPROVED'}
                        enrollmentStatus={enrollment?.status || null}
                        enrollmentStartsAt={sabaq.enrollmentStartsAt}
                        enrollmentEndsAt={sabaq.enrollmentEndsAt}
                        upcomingSessionId={upcomingSession?.id}
                        ongoingSessionId={ongoingSession?.id}
                        isAdminOrManager={!!isAdmin}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sabaq._count?.enrollments || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sabaq._count?.sessions || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation / Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href={`/dashboard/sabaqs/${sabaq.id}/enrollments`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Manage Enrollments
                            </CardTitle>
                            <CardDescription>View and approve enrollment requests</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href={`/dashboard/sabaqs/${sabaq.id}/sessions`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Manage Sessions
                            </CardTitle>
                            <CardDescription>Create and manage sabaq sessions</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {isAdmin && (
                    <Link href={`/dashboard/sabaqs/${sabaq.id}/export`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5" />
                                    Export Data
                                </CardTitle>
                                <CardDescription>Download reports and attendance sheets</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
}
