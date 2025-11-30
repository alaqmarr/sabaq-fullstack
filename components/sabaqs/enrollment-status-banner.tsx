'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createEnrollmentRequest, getEnrollmentStatus } from '@/actions/enrollments';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnrollmentStatusBannerProps {
    sabaqId: string;
    enrollmentStartsAt: Date;
    enrollmentEndsAt: Date;
}

export function EnrollmentStatusBanner({
    sabaqId,
    enrollmentStartsAt,
    enrollmentEndsAt,
}: EnrollmentStatusBannerProps) {
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        loadEnrollmentStatus();
    }, [sabaqId]);

    const loadEnrollmentStatus = async () => {
        setLoading(true);
        try {
            const result = await getEnrollmentStatus(sabaqId);
            if (result.success) {
                setEnrollment(result.enrollment);
            }
        } catch (error) {
            console.error('Failed to load enrollment status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestEnrollment = async () => {
        setRequesting(true);
        try {
            const result = await createEnrollmentRequest(sabaqId);
            if (result.success) {
                toast.success('Enrollment request submitted successfully');
                await loadEnrollmentStatus();
            } else {
                toast.error(result.error || 'Failed to submit enrollment request');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return <div className="h-16 w-full animate-pulse bg-muted/20 rounded-lg" />;
    }

    const now = new Date();
    const isBeforeWindow = now < new Date(enrollmentStartsAt);
    const isAfterWindow = now > new Date(enrollmentEndsAt);

    // User already has enrollment
    if (enrollment) {
        if (enrollment.status === 'APPROVED') {
            return (
                <Alert className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Enrolled</AlertTitle>
                    <AlertDescription>
                        You are successfully enrolled in this sabaq.
                    </AlertDescription>
                </Alert>
            );
        }

        if (enrollment.status === 'PENDING') {
            return (
                <Alert className="border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Pending Approval</AlertTitle>
                    <AlertDescription>
                        Your enrollment request is pending approval from the admin.
                    </AlertDescription>
                </Alert>
            );
        }

        if (enrollment.status === 'REJECTED') {
            return (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Request Rejected</AlertTitle>
                    <AlertDescription>
                        {enrollment.rejectionReason ? `Reason: ${enrollment.rejectionReason}` : 'Your enrollment request was rejected.'}
                    </AlertDescription>
                </Alert>
            );
        }
    }

    // Enrollment window not open yet
    if (isBeforeWindow) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Enrollment Not Started</AlertTitle>
                <AlertDescription>
                    Enrollment opens on {format(new Date(enrollmentStartsAt), 'PPP p')}
                </AlertDescription>
            </Alert>
        );
    }

    // Enrollment window closed
    if (isAfterWindow) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Enrollment Closed</AlertTitle>
                <AlertDescription>
                    The enrollment window for this sabaq closed on {format(new Date(enrollmentEndsAt), 'PPP p')}
                </AlertDescription>
            </Alert>
        );
    }

    // Within enrollment window - allow request
    return (
        <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                <div>
                    <AlertTitle className="text-blue-600 dark:text-blue-400">Enrollment Open</AlertTitle>
                    <AlertDescription className="text-blue-600/90 dark:text-blue-400/90">
                        Enrollment closes on {format(new Date(enrollmentEndsAt), 'PPP p')}
                    </AlertDescription>
                </div>
                <Button
                    onClick={handleRequestEnrollment}
                    disabled={requesting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                    {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Enrollment
                </Button>
            </div>
        </Alert>
    );
}
