'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';
import { createEnrollmentRequest } from '@/actions/enrollments';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AvailableSabaqsProps {
    sabaqs: any[];
}

export function AvailableSabaqs({ sabaqs }: AvailableSabaqsProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleEnroll = async (sabaqId: string, sabaqName: string) => {
        setLoading(sabaqId);
        try {
            const result = await createEnrollmentRequest(sabaqId);
            if (result.success) {
                toast.success(`Enrollment requested for ${sabaqName}`);
            } else {
                toast.error(result.error || 'Failed to request enrollment');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to request enrollment');
        } finally {
            setLoading(null);
        }
    };

    if (sabaqs.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        No sabaqs available for enrollment at this time.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sabaqs.map((sabaq) => (
                <Card key={sabaq.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{sabaq.name}</CardTitle>
                        <CardDescription>
                            {sabaq.kitaab} • Nisaab {sabaq.level}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {sabaq.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {sabaq.description}
                            </p>
                        )}

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Enrollment Window:</span>
                            </div>
                            <div className="pl-6 text-xs">
                                <div>{format(new Date(sabaq.enrollmentStartsAt), 'dd MMM yyyy, hh:mm a')}</div>
                                <div className="text-muted-foreground">to</div>
                                <div>{format(new Date(sabaq.enrollmentEndsAt), 'dd MMM yyyy, hh:mm a')}</div>
                            </div>

                            {sabaq.allowLocationAttendance && sabaq.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{sabaq.location.name}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {sabaq._count.enrollments} enrolled
                                </span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Badge variant="outline">{sabaq.criteria}</Badge>
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => handleEnroll(sabaq.id, sabaq.name)}
                            disabled={loading === sabaq.id}
                        >
                            {loading === sabaq.id ? 'Requesting...' : 'Request Enrollment'}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
