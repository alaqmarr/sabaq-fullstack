"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";

interface SessionStatsCardProps {
    sessionId: string;
    initialStats: {
        totalPresent: number;
        lateCount: number;
    } | null;
}

export function SessionStatsCard({ sessionId, initialStats }: SessionStatsCardProps) {
    const { stats } = useRealtimeAttendance(sessionId);

    // Use realtime stats if available, otherwise fallback to initial stats
    const displayStats = stats || initialStats || { totalPresent: 0, lateCount: 0 };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">
                    {displayStats.totalPresent}
                </div>
                <p className="text-xs text-muted-foreground">
                    {displayStats.lateCount} Late
                </p>
            </CardContent>
        </Card>
    );
}
