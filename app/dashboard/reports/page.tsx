import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { getAttendanceTrends, getEnrollmentDistribution, getTopStudents, getSabaqPerformance } from '@/actions/analytics';
import { AttendanceChart } from '@/components/analytics/attendance-chart';
import { EnrollmentChart } from '@/components/analytics/enrollment-chart';
import { TopStudents } from '@/components/analytics/top-students';
import { SabaqPerformance } from '@/components/analytics/sabaq-performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = {
    title: "Reports & Analytics",
};

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('analytics', 'read');
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const [attendanceRes, enrollmentRes, topStudentsRes, sabaqPerformanceRes] = await Promise.all([
        getAttendanceTrends(),
        getEnrollmentDistribution(),
        getTopStudents(),
        getSabaqPerformance()
    ]);

    const attendanceData = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];
    const enrollmentData = enrollmentRes.success && enrollmentRes.data ? enrollmentRes.data : [];
    const topStudentsData = topStudentsRes.success && topStudentsRes.data ? topStudentsRes.data : [];
    const sabaqPerformanceData = sabaqPerformanceRes.success && sabaqPerformanceRes.data ? sabaqPerformanceRes.data : [];

    return (
        <div className="space-y-6 sm:space-y-8">
            <PageHeader
                title="Reports & Analytics"
                description="View comprehensive attendance and performance data"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AttendanceChart data={attendanceData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enrollment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EnrollmentChart data={enrollmentData} />
                    </CardContent>
                </Card>

                <TopStudents data={topStudentsData} />
                <SabaqPerformance data={sabaqPerformanceData} />
            </div>
        </div>
    );
}
