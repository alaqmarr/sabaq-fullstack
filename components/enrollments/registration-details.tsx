'use client';

import { useEffect, useState } from 'react';
import { Calendar, Info, MapPin } from 'lucide-react';
import { formatShortDateTime } from '@/lib/date-utils';
import Link from 'next/link';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { MapWrapper } from '@/components/ui/map-wrapper';
import { getPublicEnrollmentStatus } from '@/actions/enrollments';
import { useSession } from 'next-auth/react';

interface RegistrationDetailsProps {
    sabaqId: string;
    sabaq: {
        enrollmentStartsAt: Date | null;
        enrollmentEndsAt: Date;
        description: string | null;
        allowLocationAttendance: boolean;
        location?: {
            name: string;
            latitude: any;
            longitude: any;
        } | null;
    };
}

export function RegistrationDetails({ sabaqId, sabaq }: RegistrationDetailsProps) {
    const { data: session } = useSession();
    const [hasEnrollment, setHasEnrollment] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkEnrollment = async () => {
            if (session?.user) {
                // For logged-in users, check immediately
                const result = await getPublicEnrollmentStatus(sabaqId);
                setHasEnrollment(!!result.enrollment);
                setIsLoading(false);
            } else {
                // For guest users, we'll check when they enter ITS
                setIsLoading(false);
            }
        };

        checkEnrollment();
    }, [session, sabaqId]);

    // Show enrollment period only if:
    // 1. Not loading
    // 2. User doesn't have an enrollment status
    // 3. Registration period hasn't ended
    const showEnrollmentPeriod = !isLoading && !hasEnrollment && new Date(sabaq.enrollmentEndsAt) > new Date();

    return (
        <div className="w-full bg-card/50 backdrop-blur-sm border rounded-lg p-4 space-y-4 text-sm">
            {showEnrollmentPeriod && (
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <div className="text-left w-full">
                        <p className="font-medium text-foreground">Enrollment Period</p>
                        <div className="text-xs space-y-1 text-muted-foreground">
                            <p>Starts: {sabaq.enrollmentStartsAt ? formatShortDateTime(sabaq.enrollmentStartsAt) : 'N/A'}</p>
                            <p>Ends: {formatShortDateTime(sabaq.enrollmentEndsAt)}</p>
                        </div>
                        {new Date(sabaq.enrollmentEndsAt) > new Date() && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs font-medium mb-2 text-foreground">Time Remaining:</p>
                                <CountdownTimer targetDate={new Date(sabaq.enrollmentEndsAt)} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {sabaq.description && (
                <div className={`flex items-start gap-3 text-muted-foreground ${showEnrollmentPeriod ? 'border-t pt-3' : ''}`}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <p className="font-medium text-foreground">Description</p>
                        <p>{sabaq.description}</p>
                    </div>
                </div>
            )}

            {sabaq.allowLocationAttendance && sabaq.location && (
                <div className={`flex items-start gap-3 text-muted-foreground ${(showEnrollmentPeriod || sabaq.description) ? 'border-t pt-3' : ''}`}>
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="text-left w-full space-y-2">
                        <div>
                            <p className="font-medium text-foreground">Location</p>
                            <p>{sabaq.location.name}</p>
                        </div>
                        <div className="rounded-md overflow-hidden border">
                            <MapWrapper
                                latitude={Number(sabaq.location.latitude)}
                                longitude={Number(sabaq.location.longitude)}
                                popupText={sabaq.location.name}
                            />
                        </div>
                        <Link
                            href={`https://www.google.com/maps/search/?api=1&query=${sabaq.location.latitude},${sabaq.location.longitude}`}
                            target="_blank"
                            className="text-xs text-blue-500 hover:underline inline-block"
                        >
                            View on Google Maps
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
