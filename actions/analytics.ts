'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getDashboardStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const [
            totalUsers,
            activeSabaqs,
            totalEnrollments,
            totalSessions,
            pendingQuestions,
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'MUMIN' } }),
            prisma.sabaq.count(),
            prisma.enrollment.count({ where: { status: 'APPROVED' } }),
            prisma.session.count(),
            prisma.question.count({ where: { isAnswered: false } }),
        ]);

        return {
            success: true,
            stats: {
                totalUsers,
                activeSabaqs,
                totalEnrollments,
                totalSessions,
                pendingQuestions,
            },
        };
    } catch (error) {
        return { success: false, error: 'Failed to fetch dashboard stats' };
    }
}

export async function getAttendanceTrends() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get last 10 sessions with attendance breakdown
        const sessions = await prisma.session.findMany({
            take: 10,
            orderBy: { scheduledAt: 'desc' },
            include: {
                attendances: {
                    select: { isLate: true },
                },
            },
        });

        const data = sessions.reverse().map((s) => {
            const present = s.attendances.filter(a => !a.isLate).length;
            const late = s.attendances.filter(a => a.isLate).length;
            
            return {
                date: s.scheduledAt.toLocaleDateString(),
                present,
                late,
            };
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'Failed to fetch attendance trends' };
    }
}

export async function getEnrollmentDistribution() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const enrollments = await prisma.enrollment.groupBy({
            by: ['status'],
            _count: {
                _all: true,
            },
        });

        const data = enrollments.map((e) => ({
            name: e.status,
            value: e._count._all,
        }));

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'Failed to fetch enrollment distribution' };
    }
}
