'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createEnrollmentRequest, getEnrollmentStatus } from '@/actions/enrollments';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface EnrollmentButtonProps {
    sabaqId: string;
    enrollmentStartsAt: Date;
    enrollmentEndsAt: Date;
}

export function EnrollmentButton({
    sabaqId,
    enrollmentStartsAt,
    enrollmentEndsAt,
}: EnrollmentButtonProps) {
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        loadEnrollmentStatus();
    }, [sabaqId]);

    const loadEnrollmentStatus = async () => {
        setLoading(true);
        const result = await getEnrollmentStatus(sabaqId);
        if (result.success) {
            setEnrollment(result.enrollment);
        }
        setLoading(false);
    };

    const handleRequestEnrollment = async () => {
        setRequesting(true);
        const result = await createEnrollmentRequest(sabaqId);
        if (result.success) {
            toast.success('Enrollment request submitted successfully');
            await loadEnrollmentStatus();
        } else {
            toast.error(result.error || 'Failed to submit enrollment request');
        }
        setRequesting(false);
    };

    if (loading) {
        return (
            <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
            </Button>
        );
    }

    const now = new Date();
    const isBeforeWindow = now < enrollmentStartsAt;
    const isAfterWindow = now > enrollmentEndsAt;
    const isWithinWindow = !isBeforeWindow && !isAfterWindow;

    // User already has enrollment
    if (enrollment) {
        const statusColors = {
            PENDING: 'bg-yellow-500',
            APPROVED: 'bg-green-500',
            REJECTED: 'bg-red-500',
        };

        return (
            <div className="flex items-center gap-2">
                <Badge className={statusColors[enrollment.status as keyof typeof statusColors]}>
                    {enrollment.status}
                </Badge>
                {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                    <span className="text-sm text-muted-foreground">
                        Reason: {enrollment.rejectionReason}
                    </span>
                )}
            </div>
        );
    }

    // Enrollment window not open yet
    if (isBeforeWindow) {
        return (
            <div className="space-y-2">
                <Button disabled>
                    Enrollment Opens {format(enrollmentStartsAt, 'dd/MM/yy HH:mm')}
                </Button>
                <p className="text-xs text-muted-foreground">
                    Enrollment window: {format(enrollmentStartsAt, 'dd/MM/yy HH:mm')} - {format(enrollmentEndsAt, 'dd/MM/yy HH:mm')}
                </p>
            </div>
        );
    }

    // Enrollment window closed
    if (isAfterWindow) {
        return (
            <div className="space-y-2">
                <Button disabled>
                    Enrollment Closed
                </Button>
                <p className="text-xs text-muted-foreground">
                    Enrollment ended on {format(enrollmentEndsAt, 'dd/MM/yy HH:mm')}
                </p>
            </div>
        );
    }

    // Within enrollment window - allow request
    return (
        <div className="space-y-2">
            <Button onClick={handleRequestEnrollment} disabled={requesting}>
                {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Enrollment
            </Button>
            <p className="text-xs text-muted-foreground">
                Enrollment closes {format(enrollmentEndsAt, 'dd/MM/yy HH:mm')}
            </p>
        </div>
    );
}
