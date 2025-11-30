'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { createPublicEnrollmentRequest, createEnrollmentRequest, getPublicEnrollmentStatus } from '@/actions/enrollments';
import { useSession } from 'next-auth/react';

interface PublicRegistrationFormProps {
    sabaqId: string;
    sabaqName: string;
}

export function PublicRegistrationForm({ sabaqId, sabaqName }: PublicRegistrationFormProps) {
    const { data: session } = useSession();
    const [itsNumber, setItsNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // Check enrollment status when ITS number is entered or session changes
    useEffect(() => {
        const checkStatus = async () => {
            if (session?.user || (itsNumber.length === 8)) {
                setIsCheckingStatus(true);
                const result = await getPublicEnrollmentStatus(sabaqId, itsNumber || undefined);
                if (result.success) {
                    setEnrollmentStatus(result.enrollment);
                }
                setIsCheckingStatus(false);
            } else {
                setEnrollmentStatus(null);
            }
        };

        const debounce = setTimeout(checkStatus, 500);
        return () => clearTimeout(debounce);
    }, [sabaqId, itsNumber, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let result;

            if (session?.user) {
                // Logged-in user - direct enrollment
                result = await createEnrollmentRequest(sabaqId);
            } else {
                // Guest user - use ITS number
                if (!itsNumber.trim() || !/^\d{8}$/.test(itsNumber)) {
                    toast.error('Please enter a valid 8-digit ITS number');
                    setIsSubmitting(false);
                    return;
                }
                result = await createPublicEnrollmentRequest(sabaqId, itsNumber);
            }

            if (result.success) {
                setIsSuccess(true);
                toast.success('Enrollment request submitted successfully!');
                // Refresh status
                const statusResult = await getPublicEnrollmentStatus(sabaqId, itsNumber || undefined);
                if (statusResult.success) {
                    setEnrollmentStatus(statusResult.enrollment);
                }
            } else {
                toast.error(result.error || 'Failed to submit request');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show enrollment status if exists
    if (enrollmentStatus) {
        const status = enrollmentStatus.status;
        const rejectionReason = enrollmentStatus.rejectionReason || "Does not meet criteria";

        if (status === 'APPROVED') {
            return (
                <Card className="w-full border-green-500/30 bg-green-500/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                                Already Enrolled!
                            </h3>
                            <p className="text-muted-foreground">
                                You are already enrolled in <strong className="text-foreground">{sabaqName}</strong>.
                            </p>
                            {enrollmentStatus.approvedAt && (
                                <p className="text-sm text-muted-foreground">
                                    Approved on {new Date(enrollmentStatus.approvedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (status === 'PENDING') {
            return (
                <Card className="w-full border-orange-500/30 bg-orange-500/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400">
                                Request Pending
                            </h3>
                            <p className="text-muted-foreground">
                                Your enrollment request for <strong className="text-foreground">{sabaqName}</strong> is awaiting approval.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Requested on {new Date(enrollmentStatus.requestedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (status === 'REJECTED') {
            return (
                <Card className="w-full border-red-500/30 bg-red-500/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                                Request Rejected
                            </h3>
                            <p className="text-muted-foreground">
                                Your enrollment request for <strong className="text-foreground">{sabaqName}</strong> was rejected.
                            </p>
                            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mt-3">
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Reason: {rejectionReason}
                                </p>
                            </div>
                            {enrollmentStatus.rejectedAt && (
                                <p className="text-sm text-muted-foreground">
                                    Rejected on {new Date(enrollmentStatus.rejectedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }
    }

    // Show success message after submission
    if (isSuccess) {
        return (
            <Card className="w-full border-green-500/30 bg-green-500/5">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                            Request Submitted!
                        </h3>
                        <p className="text-muted-foreground">
                            Your enrollment request for <strong className="text-foreground">{sabaqName}</strong> has been submitted successfully.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You will be notified via email once your request is reviewed and approved.
                        </p>
                    </div>
                    {!session?.user && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setIsSuccess(false);
                                setItsNumber('');
                                setEnrollmentStatus(null);
                            }}
                        >
                            Submit Another Request
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Show registration form
    return (
        <Card className="w-full backdrop-blur-sm bg-card/50">
            <CardHeader>
                <CardTitle>Register for Sabaq</CardTitle>
                <CardDescription>
                    {session?.user
                        ? `Register as ${session.user.itsNumber} | ${session.user.name}`
                        : "Enter your ITS number to request enrollment"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!session?.user && (
                        <div className="space-y-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="ITS Number (8 digits)"
                                value={itsNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                    setItsNumber(val);
                                }}
                                className="text-lg"
                                disabled={isSubmitting || isCheckingStatus}
                            />
                            {isCheckingStatus && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Checking enrollment status...
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || isCheckingStatus || (!session?.user && itsNumber.length !== 8)}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Request Enrollment
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
