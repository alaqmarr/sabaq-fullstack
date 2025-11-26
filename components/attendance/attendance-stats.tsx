'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, AlertCircle } from 'lucide-react';

interface AttendanceStatsProps {
    stats: {
        totalEnrolled: number;
        totalPresent: number;
        onTimeCount: number;
        lateCount: number;
        attendancePercentage: number;
        absent: number;
    };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
                    <p className="text-xs text-muted-foreground">
                        Approved enrollments
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Present</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPresent}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.attendancePercentage}% attendance rate
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Time</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.onTimeCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Before cutoff time
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Late</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.lateCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.absent} absent
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
