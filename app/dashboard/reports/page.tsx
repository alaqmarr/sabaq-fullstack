import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAttendanceTrends, getEnrollmentDistribution, getTopStudents, getSabaqPerformance } from '@/actions/analytics';
import { AttendanceChart } from '@/components/analytics/attendance-chart';
import { EnrollmentChart } from '@/components/analytics/enrollment-chart';
import { TopStudents } from '@/components/analytics/top-students';
import { SabaqPerformance } from '@/components/analytics/sabaq-performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: "Reports & Analytics",
};

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const role = session.user.role;
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'JANAB'];

    if (!allowedRoles.includes(role)) {
        return (
            <div className="glass p-8 rounded-lg text-center">
                <p className="text-red-500">Unauthorized: You do not have permission to view reports.</p>
            </div>
        );
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
            <div>
                <h1 className="text-3xl sm:text-4xl text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Reports & Analytics
                </h1>
                <p className="text-cred-label mt-2">View comprehensive attendance and performance data</p>
            </div>

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
