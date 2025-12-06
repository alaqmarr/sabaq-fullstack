"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, MapPin, Users, CheckCircle, XCircle, MessageCircle, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";

interface RecentlyEndedSessionCardProps {
    session: any;
    userAttendance: {
        attended: boolean;
        isLate?: boolean;
    } | null;
    showAdminActions?: boolean;
}

export function RecentlyEndedSessionCard({
    session,
    userAttendance,
    showAdminActions = false
}: RecentlyEndedSessionCardProps) {
    const attendanceCount = session._count?.attendances || 0;

    return (
        <Card className={cn(
            "glass group relative overflow-hidden transition-all hover:shadow-lg border-white/20 dark:border-white/10",
            "border-l-4 border-l-muted-foreground/50"
        )}>
            <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-0" />
            <CardContent className="p-0 relative z-10 pointer-events-none">
                <div className="flex flex-col lg:flex-row lg:items-center">
                    {/* Left: Details */}
                    <div className="p-4 sm:p-5 flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-semibold line-clamp-1 pointer-events-auto">
                                {session.sabaq.name}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary">Ended</Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span className="truncate">
                                    {formatDate(session.scheduledAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span className="truncate">
                                    {formatTime(session.scheduledAt)}
                                </span>
                            </div>
                            {session.sabaq.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                    <span className="truncate">{session.sabaq.location.name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                <span>Attended: <strong>{attendanceCount}</strong></span>
                            </div>
                        </div>

                        {/* User Attendance Status */}
                        {userAttendance && (
                            <div className={cn(
                                "flex items-center gap-2 font-medium text-xs sm:text-sm p-2 rounded-md w-fit",
                                userAttendance.attended
                                    ? "text-green-600 bg-green-500/10"
                                    : "text-red-600 bg-red-500/10"
                            )}>
                                {userAttendance.attended ? (
                                    <>
                                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                        <span>{userAttendance.isLate ? "Attended (Late)" : "Attended"}</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                        <span>You were absent</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Controls */}
                    <div className="p-4 sm:p-5 bg-muted/30 lg:bg-transparent lg:border-l border-t lg:border-t-0 flex flex-wrap lg:flex-col gap-2 justify-end lg:w-48 pointer-events-auto">
                        {/* Actions for users who attended */}
                        {userAttendance?.attended && (
                            <>
                                <Button size="sm" variant="frosted-amber" asChild className="w-fit justify-start">
                                    <Link href={`/sessions/${session.id}/ask`}>
                                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> Ask Question
                                    </Link>
                                </Button>
                                <Button size="sm" variant="frosted-blue" asChild className="w-fit justify-start">
                                    <Link href={`/sessions/${session.id}/feedback`}>
                                        <Star className="h-3.5 w-3.5 mr-2" /> Add Feedback
                                    </Link>
                                </Button>
                            </>
                        )}

                        {/* Admin actions */}
                        {showAdminActions && (
                            <Button size="sm" variant="ghost" asChild className="w-fit justify-start">
                                <Link href={`/dashboard/sessions/${session.id}`}>
                                    View Report
                                </Link>
                            </Button>
                        )}

                        {/* Message for absent users */}
                        {userAttendance && !userAttendance.attended && (
                            <p className="text-xs text-muted-foreground italic">
                                You missed this session.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
