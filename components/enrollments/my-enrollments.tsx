'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface MyEnrollmentsProps {
    enrollments: any[];
}

export function MyEnrollments({ enrollments }: MyEnrollmentsProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'REJECTED':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            PENDING: 'secondary',
            APPROVED: 'default',
            REJECTED: 'destructive',
        };
        return (
            <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
                {getStatusIcon(status)}
                {status}
            </Badge>
        );
    };

    if (enrollments.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        You haven't requested enrollment for any sabaqs yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Enrollment Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sabaq</TableHead>
                                <TableHead>Kitaab</TableHead>
                                <TableHead>Nisaab</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                    <TableCell className="font-medium">
                                        {enrollment.sabaq.name}
                                    </TableCell>
                                    <TableCell>{enrollment.sabaq.kitaab}</TableCell>
                                    <TableCell>{enrollment.sabaq.level}</TableCell>
                                    <TableCell>
                                        {format(new Date(enrollment.requestedAt), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                                    <TableCell>
                                        {enrollment.status === 'APPROVED' && enrollment.approvedAt && (
                                            <span className="text-sm text-muted-foreground">
                                                Approved on {format(new Date(enrollment.approvedAt), 'dd MMM yyyy')}
                                            </span>
                                        )}
                                        {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                                            <div className="text-sm">
                                                <span className="text-red-600 font-medium">Reason: </span>
                                                <span className="text-muted-foreground">
                                                    {enrollment.rejectionReason}
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
