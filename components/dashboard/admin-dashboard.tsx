import { Suspense } from 'react';
import { DashboardStatsSection } from '@/components/dashboard/dashboard-stats';
import { ActiveSessionsSection } from '@/components/dashboard/active-sessions';
import { UpcomingSessionsSection } from '@/components/dashboard/upcoming-sessions';
import { AdminQuickActions } from '@/components/dashboard/admin-quick-actions';
import { DashboardStatsSkeleton, ActiveSessionsSkeleton, UpcomingSessionsSkeleton, DashboardChartSkeleton } from '@/components/dashboard/skeletons';
import { AttendanceChart } from '@/components/analytics/attendance-chart';
import { EnrollmentChart } from '@/components/analytics/enrollment-chart';
import { getAttendanceTrends, getEnrollmentDistribution } from '@/actions/analytics';
import { Button } from '@/components/ui/button';

export async function AdminDashboard({ user }: { user: any }) {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Welcome back, <span className="font-semibold text-foreground">{user.name}</span>.
                </p>
            </div>

            {/* Quick Actions */}
            <AdminQuickActions />

            {/* Stats Section */}
            <Suspense fallback={<DashboardStatsSkeleton />}>
                <DashboardStatsSection />
            </Suspense>

            {/* Active Sessions */}
            <Suspense fallback={<ActiveSessionsSkeleton />}>
                <ActiveSessionsSection />
            </Suspense>

            {/* Upcoming Sessions */}
            <Suspense fallback={<UpcomingSessionsSkeleton />}>
                <UpcomingSessionsSection />
            </Suspense>

            {/* Charts Section */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <Suspense fallback={<DashboardChartSkeleton />}>
                    <AttendanceChartSection />
                </Suspense>
                <Suspense fallback={<DashboardChartSkeleton />}>
                    <EnrollmentChartSection />
                </Suspense>
            </div>
        </div>
    );
}

async function AttendanceChartSection() {
    const trendsResult = await getAttendanceTrends();
    const trends = trendsResult.success && trendsResult.data ? trendsResult.data : [];
    return <AttendanceChart data={trends} />;
}

async function EnrollmentChartSection() {
    const enrollmentResult = await getEnrollmentDistribution();
    const enrollments = enrollmentResult.success && enrollmentResult.data ? enrollmentResult.data : [];
    return <EnrollmentChart data={enrollments} />;
}
