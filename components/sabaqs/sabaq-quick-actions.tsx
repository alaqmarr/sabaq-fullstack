"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { EnrollmentButton } from "@/components/enrollments/enrollment-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endSession } from "@/actions/sessions"; // We need to implement this
import { useState } from "react";

interface SabaqQuickActionsProps {
    sabaqId: string;
    isEnrolled: boolean;
    enrollmentStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
    enrollmentStartsAt: Date;
    enrollmentEndsAt: Date;
    upcomingSessionId?: string;
    ongoingSessionId?: string;
    isAdminOrManager: boolean;
}

export function SabaqQuickActions({
    sabaqId,
    isEnrolled,
    enrollmentStatus,
    enrollmentStartsAt,
    enrollmentEndsAt,
    upcomingSessionId,
    ongoingSessionId,
    isAdminOrManager,
}: SabaqQuickActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleEndSession = async () => {
        if (!ongoingSessionId) return;
        setLoading(true);
        try {
            const result = await endSession(ongoingSessionId);
            if (result.success) {
                toast.success("Session ended successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to end session");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdminOrManager && isEnrolled) {
        return null; // Enrolled users don't need quick actions here (maybe just view schedule?)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap gap-3">
                {/* Admin Actions */}
                {isAdminOrManager && (
                    <>
                        {ongoingSessionId ? (
                            <Button
                                variant="destructive"
                                className="w-full sm:w-auto justify-start"
                                onClick={handleEndSession}
                                disabled={loading}
                            >
                                <Square className="mr-2 h-4 w-4 fill-current" />
                                End Ongoing Session
                            </Button>
                        ) : upcomingSessionId ? (
                            <Link href={`/dashboard/sessions/${upcomingSessionId}`}>
                                <Button className="w-full sm:w-auto justify-start" variant="default">
                                    <Play className="mr-2 h-4 w-4 fill-current" />
                                    Start Upcoming Session
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/dashboard/sabaqs/${sabaqId}/sessions`}>
                                <Button variant="outline" className="w-full sm:w-auto justify-start">
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Schedule Session
                                </Button>
                            </Link>
                        )}
                    </>
                )}

                {/* Enrollment Action (for non-enrolled users) */}
                {!isEnrolled && !isAdminOrManager && (
                    <EnrollmentButton
                        sabaqId={sabaqId}
                        enrollmentStartsAt={enrollmentStartsAt}
                        enrollmentEndsAt={enrollmentEndsAt}
                    />
                )}
            </CardContent>
        </Card>
    );
}
