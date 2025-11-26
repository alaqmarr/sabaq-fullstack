'use client';

import { useState, useEffect } from 'react';
import { getAvailableSabaqs } from '@/actions/public-enrollment';
import { createEnrollmentRequest } from '@/actions/enrollments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, MapPin, Calendar, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EnrollmentInterfaceProps {
    user: {
        id: string;
        itsNumber: string;
        name: string;
        email?: string;
        role: string;
    };
}

export function EnrollmentInterface({ user }: EnrollmentInterfaceProps) {
    const [sabaqs, setSabaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState<string | null>(null);

    useEffect(() => {
        loadSabaqs();
    }, []);

    const loadSabaqs = async () => {
        const result = await getAvailableSabaqs();
        if (result.success && result.sabaqs) {
            setSabaqs(result.sabaqs);
        }
        setLoading(false);
    };

    const handleEnroll = async (sabaqId: string) => {
        setEnrolling(sabaqId);
        const result = await createEnrollmentRequest(sabaqId);

        if (result.success) {
            toast.success('Enrollment request submitted successfully!');
            loadSabaqs(); // Reload to update UI
        } else {
            toast.error(result.error || 'Failed to submit enrollment request');
        }
        setEnrolling(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Welcome Header */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome, {user.name}!</CardTitle>
                    <CardDescription>
                        ITS: {user.itsNumber} • {user.email || 'No email on file'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Select a sabaq below to submit your enrollment request. The admin will review and approve your request.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Available Sabaqs */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Available Sabaqs for Enrollment</h2>

                {sabaqs.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="py-12 text-center">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No sabaqs available for enrollment at the moment</p>
                            <p className="text-sm text-muted-foreground mt-2">Please check back later</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {sabaqs.map((sabaq) => (
                            <Card key={sabaq.id} className="glass hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{sabaq.name}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {sabaq.kitaab}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline">Nisaab {sabaq.level}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {sabaq.location?.name || 'No location'}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Enrollment closes: {format(new Date(sabaq.enrollmentEndsAt), 'PP')}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Users className="h-4 w-4 mr-2" />
                                            {sabaq._count.enrollments} students enrolled
                                        </div>
                                    </div>

                                    {/* Show status badge if enrolled, otherwise show enroll button */}
                                    {sabaq.enrollmentStatus ? (
                                        <div className="flex items-center justify-center gap-2 py-2">
                                            {sabaq.enrollmentStatus === 'APPROVED' && (
                                                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 px-4 py-2 text-sm">
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Enrolled
                                                </Badge>
                                            )}
                                            {sabaq.enrollmentStatus === 'PENDING' && (
                                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 px-4 py-2 text-sm">
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Pending Approval
                                                </Badge>
                                            )}
                                            {sabaq.enrollmentStatus === 'REJECTED' && (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 px-4 py-2 text-sm">
                                                    <span className="mr-2">✕</span>
                                                    Rejected
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => handleEnroll(sabaq.id)}
                                            disabled={enrolling === sabaq.id}
                                            className="w-full"
                                        >
                                            {enrolling === sabaq.id ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Enrolling...
                                                </>
                                            ) : (
                                                <>
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                    Request Enrollment
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
