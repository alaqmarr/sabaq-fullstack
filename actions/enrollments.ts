'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/rbac';
import { processEmailQueue } from './email-queue';

export async function createEnrollmentRequest(sabaqId: string) {
  try {
    // All authenticated users can create enrollment requests
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return { success: false, error: 'Already enrolled or pending' };
    }

    // Check enrollment window
    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
      select: { enrollmentStartsAt: true, enrollmentEndsAt: true },
    });

    if (!sabaq) {
      return { success: false, error: 'Sabaq not found' };
    }

    const now = new Date();
    if (now < sabaq.enrollmentStartsAt || now > sabaq.enrollmentEndsAt) {
      return { success: false, error: 'Enrollment window closed' };
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        sabaqId,
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    revalidatePath(`/dashboard/sabaqs/${sabaqId}`);
    revalidatePath('/dashboard/my-enrollments');
    return { success: true, enrollment };
  } catch (error: any) {
    console.error('Failed to create enrollment:', error);
    return { success: false, error: error.message || 'Failed to create enrollment request' };
  }
}

export async function getEnrollmentsBySabaq(sabaqId: string) {
  try {
    const currentUser = await requirePermission('enrollments', 'read');
    
    // Verify access
    if (currentUser.role !== 'SUPERADMIN') {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
            where: { sabaqId_userId: { sabaqId, userId: currentUser.id } }
        });
        const isJanab = await prisma.sabaq.findFirst({
            where: { id: sabaqId, janabId: currentUser.id }
        });
        if (!isAssigned && !isJanab) {
            return { success: false, error: 'Unauthorized access to this sabaq' };
        }
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { sabaqId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
    return { success: true, enrollments };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch enrollments' };
  }
}

export async function getMyEnrollments() {
  try {
    const currentUser = await requirePermission('enrollments', 'read_self');

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: currentUser.id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
    return { success: true, enrollments };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch enrollments' };
  }
}

export async function getEnrollmentStatus(sabaqId: string) {
  try {
    const currentUser = await requirePermission('enrollments', 'read_self');

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId,
          userId: currentUser.id,
        },
      },
    });

    return { success: true, enrollment };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch enrollment status' };
  }
}

export async function approveEnrollment(enrollmentId: string) {
  try {
    const currentUser = await requirePermission('enrollments', 'approve');

    const enrollmentToCheck = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { sabaqId: true }
    });
    if (!enrollmentToCheck) return { success: false, error: 'Enrollment not found' };

    // Verify access
    if (currentUser.role !== 'SUPERADMIN') {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
            where: { sabaqId_userId: { sabaqId: enrollmentToCheck.sabaqId, userId: currentUser.id } }
        });
        const isJanab = await prisma.sabaq.findFirst({
            where: { id: enrollmentToCheck.sabaqId, janabId: currentUser.id }
        });
        if (!isAssigned && !isJanab) {
            return { success: false, error: 'Unauthorized to approve for this sabaq' };
        }
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: currentUser.id,
      },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true } },
      },
    });

    // Queue email notification
    if (enrollment.user.email) {
      await queueEnrollmentEmail(
        enrollment.user.email,
        'approved',
        enrollment.sabaq.name,
        enrollment.user.name
      );
      // Trigger processing immediately
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sabaqs/${enrollment.sabaqId}`);
    return { success: true, enrollment };
  } catch (error: any) {
    console.error('Failed to approve enrollment:', error);
    return { success: false, error: error.message || 'Failed to approve enrollment' };
  }
}

export async function rejectEnrollment(enrollmentId: string, reason: string) {
  try {
    const currentUser = await requirePermission('enrollments', 'reject');

    const enrollmentToCheck = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { sabaqId: true }
    });
    if (!enrollmentToCheck) return { success: false, error: 'Enrollment not found' };

    // Verify access
    if (currentUser.role !== 'SUPERADMIN') {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
            where: { sabaqId_userId: { sabaqId: enrollmentToCheck.sabaqId, userId: currentUser.id } }
        });
        const isJanab = await prisma.sabaq.findFirst({
            where: { id: enrollmentToCheck.sabaqId, janabId: currentUser.id }
        });
        if (!isAssigned && !isJanab) {
            return { success: false, error: 'Unauthorized to reject for this sabaq' };
        }
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: currentUser.id,
        rejectionReason: reason,
      },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true } },
      },
    });

    // Queue email notification
    if (enrollment.user.email) {
      await queueEnrollmentEmail(
        enrollment.user.email,
        'rejected',
        enrollment.sabaq.name,
        enrollment.user.name,
        reason
      );
      // Trigger processing immediately
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sabaqs/${enrollment.sabaqId}`);
    return { success: true, enrollment };
  } catch (error: any) {
    console.error('Failed to reject enrollment:', error);
    return { success: false, error: error.message || 'Failed to reject enrollment' };
  }
}

export async function bulkApproveEnrollments(enrollmentIds: string[]) {
  try {
    const currentUser = await requirePermission('enrollments', 'approve');

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true } },
      },
    });

    await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: currentUser.id,
      },
    });

    // Queue email notifications
    for (const enrollment of enrollments) {
      if (enrollment.user.email) {
        await queueEnrollmentEmail(
          enrollment.user.email,
          'approved',
          enrollment.sabaq.name,
          enrollment.user.name
        );
      }
    }

    // Trigger processing immediately
    void processEmailQueue();

    if (enrollments.length > 0) {
      revalidatePath(`/dashboard/sabaqs/${enrollments[0].sabaqId}`);
    }

    return { success: true, count: enrollmentIds.length };
  } catch (error: any) {
    console.error('Failed to bulk approve enrollments:', error);
    return { success: false, error: error.message || 'Failed to bulk approve enrollments' };
  }
}

export async function bulkRejectEnrollments(enrollmentIds: string[], reason: string) {
  try {
    const currentUser = await requirePermission('enrollments', 'reject');

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true } },
      },
    });

    await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: currentUser.id,
        rejectionReason: reason,
      },
    });

    // Queue email notifications
    for (const enrollment of enrollments) {
      if (enrollment.user.email) {
        await queueEnrollmentEmail(
          enrollment.user.email,
          'rejected',
          enrollment.sabaq.name,
          enrollment.user.name,
          reason
        );
      }
    }

    // Trigger processing immediately
    void processEmailQueue();

    if (enrollments.length > 0) {
      revalidatePath(`/dashboard/sabaqs/${enrollments[0].sabaqId}`);
    }

    return { success: true, count: enrollmentIds.length };
  } catch (error: any) {
    console.error('Failed to bulk reject enrollments:', error);
    return { success: false, error: error.message || 'Failed to bulk reject enrollments' };
  }
}

async function queueEnrollmentEmail(
  to: string,
  status: 'approved' | 'rejected',
  sabaqName: string,
  userName: string,
  reason?: string
) {
  try {
    const subject = status === 'approved' 
      ? `Enrollment Approved - ${sabaqName}`
      : `Enrollment Rejected - ${sabaqName}`;

    const template = status === 'approved'
      ? `enrollment-approved`
      : `enrollment-rejected`;

    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: JSON.stringify({
          template,
          data: {
            userName,
            sabaqName,
            reason: reason || '',
          },
        }),
        status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('Failed to queue enrollment email:', error);
  }
}

/**
 * Bulk enroll users in a sabaq
 * Auto-approves enrollments for admin convenience
 */
export async function bulkEnrollUsers(sabaqId: string, itsNumbers: string[]) {
  try {
    const currentUser = await requirePermission('enrollments', 'bulk_enroll');

    // Verify sabaq exists
    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
      select: { id: true, name: true, janabId: true }
    });

    if (!sabaq) {
      return { success: false, error: 'Sabaq not found' };
    }

    // Verify access for non-superadmins
    if (currentUser.role !== 'SUPERADMIN') {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: { sabaqId_userId: { sabaqId, userId: currentUser.id } }
      });
      const isJanab = sabaq.janabId === currentUser.id;

      if (!isAssigned && !isJanab) {
        return { success: false, error: 'Unauthorized to bulk enroll for this sabaq' };
      }
    }

    // Remove duplicates and validate format
    const uniqueItsNumbers = [...new Set(itsNumbers)];
    const validItsNumbers = uniqueItsNumbers.filter(its => /^\d{8}$/.test(its));

    if (validItsNumbers.length === 0) {
      return { success: false, error: 'No valid ITS numbers provided' };
    }

    // Fetch users by ITS numbers
    const users = await prisma.user.findMany({
      where: { itsNumber: { in: validItsNumbers } },
      select: { id: true, itsNumber: true, name: true }
    });

    const foundItsNumbers = new Set(users.map(u => u.itsNumber));
    const notFoundItsNumbers = validItsNumbers.filter(its => !foundItsNumbers.has(its));

    // Check for existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId,
        userId: { in: users.map(u => u.id) }
      },
      select: { userId: true, status: true }
    });

    const enrolledUserIds = new Set(existingEnrollments.map(e => e.userId));
    const usersToEnroll = users.filter(u => !enrolledUserIds.has(u.id));

    // Create enrollments
    const results = {
      success: true,
      enrolled: [] as Array<{ itsNumber: string; name: string }>,
      alreadyEnrolled: [] as Array<{itsNumber: string; name: string }>,
      notFound: notFoundItsNumbers,
      invalid: uniqueItsNumbers.filter(its => !/^\d{8}$/.test(its))
    };

    if (usersToEnroll.length > 0) {
      await prisma.enrollment.createMany({
        data: usersToEnroll.map(user => ({
          sabaqId,
          userId: user.id,
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: currentUser.id,
          requestedAt: new Date()
        }))
      });

      results.enrolled = usersToEnroll.map(u => ({ itsNumber: u.itsNumber, name: u.name }));
    }

    // Track already enrolled
    const alreadyEnrolledUsers = users.filter(u => enrolledUserIds.has(u.id));
    results.alreadyEnrolled = alreadyEnrolledUsers.map(u => ({ itsNumber: u.itsNumber, name: u.name }));

    revalidatePath(`/dashboard/sabaqs/${sabaqId}`);
    revalidatePath('/dashboard/enrollments');

    return results;
  } catch (error: any) {
    console.error('Failed to bulk enroll users:', error);
    return { success: false, error: error.message || 'Failed to bulk enroll users' };
  }
}
