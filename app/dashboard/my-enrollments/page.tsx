import { getMyEnrollments } from '@/actions/enrollments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { BookOpen, MapPin, UserCheck, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const preferredRegion = ["sin1"];

export default async function MyEnrollmentsPage() {
    const { enrollments } = await getMyEnrollments();

    const statusConfig = {
        PENDING: {
            color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
            icon: Clock,
            text: 'pending'
        },
        APPROVED: {
            color: 'bg-green-500/10 text-green-600 border-green-500/30',
            icon: CheckCircle,
            text: 'approved'
        },
        REJECTED: {
            color: 'bg-red-500/10 text-red-600 border-red-500/30',
            icon: XCircle,
            text: 'rejected'
        },
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lowercase">my enrollments</h2>
                <p className="text-sm sm:text-base text-muted-foreground lowercase">
                    view all your sabaq enrollment requests and their status.
                </p>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {enrollments && enrollments.length > 0 ? (
                    enrollments.map((enrollment: any) => {
                        const status = enrollment.status as keyof typeof statusConfig;
                        const StatusIcon = statusConfig[status].icon;

                        return (
                            <Link key={enrollment.id} href={`/dashboard/sabaqs/${enrollment.sabaq.id}`}>
                                <Card className="glass-card hover-lift transition-all cursor-pointer h-full uppercase">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg font-bold lowercase flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                                                    {enrollment.sabaq.name}
                                                </CardTitle>
                                            </div>
                                            <Badge variant="outline" className={`${statusConfig[status].color} flex items-center gap-1 lowercase shrink-0`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusConfig[status].text}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        {/* Janab */}
                                        {enrollment.sabaq.janab && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <UserCheck className="h-4 w-4 shrink-0" />
                                                <span className="lowercase">{enrollment.sabaq.janab.name}</span>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {enrollment.sabaq.location && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4 shrink-0" />
                                                <span className="lowercase">{enrollment.sabaq.location.name}</span>
                                            </div>
                                        )}

                                        {/* Request Date */}
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4 shrink-0" />
                                            <span className="lowercase">
                                                requested on {format(new Date(enrollment.requestedAt), 'dd MMM yyyy')}
                                            </span>
                                        </div>

                                        {/* Status Messages */}
                                        {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-red-600 lowercase">
                                                    <span className="font-semibold">reason:</span> {enrollment.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                        {enrollment.status === 'APPROVED' && enrollment.approvedAt && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-green-600 lowercase flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    raza granted on {format(new Date(enrollment.approvedAt), 'dd MMM yyyy')}
                                                </p>
                                            </div>
                                        )}
                                        {enrollment.status === 'PENDING' && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-orange-600 lowercase flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    awaiting approval from janab
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                ) : (
                    <Card className="col-span-full glass-card">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground lowercase text-center">
                                you haven't requested enrollment in any sabaqs yet.
                            </p>
                            <Link href="/" className="text-sm text-primary hover:underline mt-2 lowercase">
                                browse available sabaqs
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
