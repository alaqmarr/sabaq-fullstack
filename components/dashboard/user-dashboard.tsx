import { Suspense } from 'react';
import Link from 'next/link';
import { getMyEnrollments } from '@/actions/enrollments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Calendar, BookOpen, Users } from 'lucide-react';
import { ActiveSessionsSection } from '@/components/dashboard/active-sessions';
import { UpcomingSessionsSection } from '@/components/dashboard/upcoming-sessions';
import { ActiveSessionsSkeleton, UpcomingSessionsSkeleton } from '@/components/dashboard/skeletons';
import { UserQuickActions } from './user-quick-actions';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

interface EnrollmentWithSabaq {
    id: string;
    sabaqId: string;
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: Date;
    approvedAt: Date | null;
    approvedBy: string | null;
    rejectedAt: Date | null;
    rejectedBy: string | null;
    rejectionReason: string | null;
    sabaq: {
        id: string;
        name: string;
        kitaab: string;
        level: string;
        whatsappGroupLink?: string | null;
    };
}

export async function UserDashboard({ user }: { user: any }) {
    const enrollmentsResult = await getMyEnrollments();
    const enrollments = (enrollmentsResult.success && enrollmentsResult.enrollments ? enrollmentsResult.enrollments : []) as unknown as EnrollmentWithSabaq[];

    const approved = enrollments.filter(e => e.status === 'APPROVED');
    const pending = enrollments.filter(e => e.status === 'PENDING');
    const rejected = enrollments.filter(e => e.status === 'REJECTED');

    return (
        <div className="space-y-8">
            {/* Enrollment Overview */}
            <div>
                <h2 className="text-lg sm:text-xl text-cred-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    My Enrollments
                </h2>

                {enrollments.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No enrollments yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Check out available sabaqs below</p>
                            <div className="mt-6">
                                <Link href="/dashboard/sabaqs">
                                    <Button variant="frosted-blue" className="gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Browse Sabaqs
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <Card className="glass border-green-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-cred-label flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Enrolled
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{approved.length}</div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-yellow-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-cred-label flex items-center  gap-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    Pending
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{pending.length}</div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-red-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-cred-label flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{enrollments.length}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Enrolled & Pending Details */}
                {approved.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-md text-cred-heading mb-3 text-green-600">✓ Enrolled Sabaqs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {approved.map(enrollment => (
                                <Link key={enrollment.id} href={`/dashboard/sabaqs/${enrollment.sabaq.id}`}>
                                    <Card className="glass-subtle border-green-500/20 hover:bg-green-500/10 transition-colors cursor-pointer h-full">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">{enrollment.sabaq.name}</CardTitle>
                                                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-600 border-green-500/50">Active</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-1">
                                            <div>{enrollment.sabaq.kitaab}</div>
                                            <div className="flex items-center gap-1 text-xs">
                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                                Raza granted {enrollment.approvedAt && `on ${new Date(enrollment.approvedAt).toLocaleDateString()}`}
                                            </div>
                                            {enrollment.sabaq.whatsappGroupLink && (
                                                <div className="pt-2">
                                                    <a
                                                        href={enrollment.sabaq.whatsappGroupLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 backdrop-blur-sm gap-1.5 w-full"
                                                    >
                                                        <WhatsAppIcon className="h-3.5 w-3.5" />
                                                        Join WhatsApp Group
                                                    </a>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {pending.length > 0 && (
                    <div>
                        <h3 className="text-md text-cred-heading mb-3 text-yellow-600">⏳ Pending Approval</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pending.map(enrollment => (
                                <Link key={enrollment.id} href={`/dashboard/sabaqs/${enrollment.sabaq.id}`}>
                                    <Card className="glass-subtle border-yellow-500/20 hover:bg-yellow-500/10 transition-colors cursor-pointer h-full">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">{enrollment.sabaq.name}</CardTitle>
                                                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-600 border-yellow-500/50">Pending</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-1">
                                            <div>{enrollment.sabaq.kitaab}</div>
                                            <div className="flex items-center gap-1 text-xs">
                                                <Clock className="h-3 w-3 text-yellow-600" />
                                                Requested {new Date(enrollment.requestedAt).toLocaleDateString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Active Sessions */}
            <Suspense fallback={<ActiveSessionsSkeleton />}>
                <ActiveSessionsSection />
            </Suspense>

            {/* Upcoming Sessions */}
            <Suspense fallback={<UpcomingSessionsSkeleton />}>
                <UpcomingSessionsSection />
            </Suspense>

            {/* Quick Actions */}
            <UserQuickActions />
        </div>
    );
}
