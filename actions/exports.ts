'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Get data for session export
export async function getSessionExportData(sessionId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role)) {
            return { success: false, error: 'Unauthorized' };
        }

        const sessionData = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                sabaq: {
                    select: {
                        name: true,
                        kitaab: true,
                    },
                },
                attendances: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                itsNumber: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        markedAt: 'asc',
                    },
                },
            },
        });

        if (!sessionData) {
            return { success: false, error: 'Session not found' };
        }

        // Format data for Excel
        const data = sessionData.attendances.map((att) => ({
            'ITS Number': att.user.itsNumber,
            'Name': att.user.name,
            'Status': att.isLate ? 'Late' : 'Present',
            'Marked At': att.markedAt.toLocaleString(),
            'Method': att.method,
            'Is Late': att.isLate ? 'Yes' : 'No',
        }));

        return { 
            success: true, 
            data, 
            filename: `${sessionData.sabaq.name} - ${sessionData.scheduledAt.toLocaleDateString()}.xlsx` 
        };
    } catch (error) {
        console.error('Failed to get session export data:', error);
        return { success: false, error: 'Failed to fetch export data' };
    }
}

// Get data for sabaq export (Master List)
export async function getSabaqExportData(sabaqId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
            return { success: false, error: 'Unauthorized' };
        }

        const sabaqData = await prisma.sabaq.findUnique({
            where: { id: sabaqId },
            include: {
                enrollments: {
                    where: { status: 'APPROVED' },
                    include: {
                        user: {
                            select: {
                                name: true,
                                itsNumber: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                    orderBy: {
                        user: {
                            name: 'asc',
                        },
                    },
                },
            },
        });

        if (!sabaqData) {
            return { success: false, error: 'Sabaq not found' };
        }

        // Format data for Excel
        const data = sabaqData.enrollments.map((enrollment) => ({
            'ITS Number': enrollment.user.itsNumber,
            'Name': enrollment.user.name,
            'Email': enrollment.user.email || 'N/A',
            'Phone': enrollment.user.phone || 'N/A',
            'Enrolled At': enrollment.approvedAt?.toLocaleDateString() || 'N/A',
        }));

        return { 
            success: true, 
            data, 
            filename: `${sabaqData.name} - Master List.xlsx` 
        };
    } catch (error) {
        console.error('Failed to get sabaq export data:', error);
        return { success: false, error: 'Failed to fetch export data' };
    }
}
