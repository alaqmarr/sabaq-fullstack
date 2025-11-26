import { getMyEnrollments } from '@/actions/enrollments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default async function MyEnrollmentsPage() {
    const { enrollments } = await getMyEnrollments();

    const statusColors = {
        PENDING: 'bg-yellow-500',
        APPROVED: 'bg-green-500',
        REJECTED: 'bg-red-500',
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Enrollments</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    View all your sabaq enrollment requests and their status.
                </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {enrollments && enrollments.length > 0 ? (
                    enrollments.map((enrollment: any) => (
                        <Link key={enrollment.id} href={`/dashboard/sabaqs/${enrollment.sabaq.id}`}>
                            <Card className="hover:bg-accent transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {enrollment.sabaq.name}
                                    </CardTitle>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground">
                                            {enrollment.sabaq.kitaab} - Nisaab {enrollment.sabaq.level}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge className={statusColors[enrollment.status as keyof typeof statusColors]}>
                                                {enrollment.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(enrollment.requestedAt), 'dd/MM/yy')}
                                            </span>
                                        </div>
                                        {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-2">
                                                Reason: {enrollment.rejectionReason}
                                            </p>
                                        )}
                                        {enrollment.status === 'APPROVED' && enrollment.approvedAt && (
                                            <p className="text-xs text-green-600 mt-2">
                                                Approved on {format(new Date(enrollment.approvedAt), 'dd/MM/yy')}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                You haven't requested enrollment in any sabaqs yet.
                            </p>
                            <Link href="/" className="text-sm text-primary hover:underline mt-2">
                                Browse available sabaqs
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
