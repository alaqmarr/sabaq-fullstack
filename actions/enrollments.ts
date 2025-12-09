"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { processEmailQueue } from "./email-queue";
import { generateEnrollmentId } from "@/lib/id-generators";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";
import { createNotification } from "@/actions/notifications";
import { cache } from "@/lib/cache";

export async function createEnrollmentRequest(
  sabaqId: string,
  guestIts?: string
) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    let userIts = session?.user?.itsNumber;

    // If not authenticated, check for guest ITS
    if (!userId) {
      if (!guestIts) {
        return { success: false, error: "Unauthorized" };
      }

      // Verify the guest user exists
      const user = await prisma.user.findUnique({
        where: { itsNumber: guestIts },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      userId = user.id;
      userIts = user.itsNumber;
    }

    if (!userIts) {
      return { success: false, error: "User ITS not found" };
    }

    // Check if sabaq exists
    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
    });

    if (!sabaq) {
      return { success: false, error: "Sabaq not found" };
    }

    // Check existing enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        sabaqId: sabaqId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingEnrollment) {
      return {
        success: false,
        error:
          "You have already submitted an enrollment request for this sabaq.",
      };
    }

    // Create enrollment request with human-readable ID
    const enrollmentId = generateEnrollmentId(userIts!, sabaqId);

    const enrollment = await prisma.enrollment.create({
      data: {
        id: enrollmentId,
        userId: userId!,
        sabaqId: sabaqId,
        status: "PENDING",
      },
      include: {
        sabaq: true,
        user: true,
      },
    });

    await cache.del(`enrollments:sabaq:${sabaqId}`);
    await cache.del(`enrollments:user:${userId}`);

    revalidatePath("/dashboard/enrollments");
    revalidatePath("/");

    return { success: true, enrollment };
  } catch (error) {
    console.error("Error creating enrollment request:", error);
    return { success: false, error: "Failed to create enrollment request" };
  }
}

// Create enrollment request (Public access via ITS)
export async function createPublicEnrollmentRequest(
  sabaqId: string,
  itsNumber: string
) {
  try {
    // Find user by ITS
    const user = await prisma.user.findUnique({
      where: { itsNumber },
    });

    if (!user) {
      return {
        success: false,
        error:
          "No user found with this ITS number. Please register for an account first.",
      };
    }

    // Check existing enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        sabaqId: sabaqId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingEnrollment) {
      return {
        success: false,
        error:
          "You have already submitted an enrollment request for this sabaq.",
      };
    }

    // Create enrollment request with human-readable ID
    const enrollmentId = generateEnrollmentId(user.itsNumber, sabaqId);

    const enrollment = await prisma.enrollment.create({
      data: {
        id: enrollmentId,
        userId: user.id,
        sabaqId: sabaqId,
        status: "PENDING",
      },
    });

    await cache.del(`enrollments:sabaq:${sabaqId}`);
    await cache.del(`enrollments:user:${user.id}`);

    return { success: true, enrollment };
  } catch (error: any) {
    console.error("Error creating public enrollment request:", error);
    return { success: false, error: "Failed to create enrollment request" };
  }
}

// Get enrollment status (Public access via ITS or session)
export async function getPublicEnrollmentStatus(
  sabaqId: string,
  itsNumber?: string
) {
  try {
    const session = await auth();
    let userId: string | undefined;

    if (session?.user) {
      // Logged-in user
      userId = session.user.id;
    } else if (itsNumber) {
      // Guest user - find by ITS
      const user = await prisma.user.findUnique({
        where: { itsNumber },
      });

      if (!user) {
        return { success: true, enrollment: null };
      }

      userId = user.id;
    } else {
      return { success: true, enrollment: null };
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId,
          userId,
        },
      },
    });

    return { success: true, enrollment };
  } catch (error: any) {
    console.error("Error fetching public enrollment status:", error);
    return { success: false, error: "Failed to fetch enrollment status" };
  }
}

export async function getEnrollmentsBySabaq(sabaqId: string) {
  try {
    const currentUser = await requirePermission("enrollments", "read");

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: { sabaqId_userId: { sabaqId, userId: currentUser.id } },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: sabaqId, janabId: currentUser.id },
      });

      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error:
            "You do not have permission to view enrollments for this sabaq.",
        };
      }
    }

    const cacheKey = `enrollments:sabaq:${sabaqId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
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
            phone: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    const result = { success: true, enrollments };
    await cache.set(cacheKey, result, 120); // Cache for 2 minutes
    return result;
  } catch (error: any) {
    console.error("Failed to fetch enrollments:", error);
    return { success: false, error: "Failed to fetch enrollments" };
  }
}

export async function getMyEnrollments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const cacheKey = `enrollments:user:${session.user.id}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            description: true,
            enrollmentStartsAt: true,
            enrollmentEndsAt: true,
            criteria: true,
            janabId: true,
            janab: true,
            location: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    const result = { success: true, enrollments };
    await cache.set(cacheKey, result, 120); // Cache for 2 minutes
    return result;
  } catch (error: any) {
    console.error("Failed to fetch my enrollments:", error);
    return { success: false, error: "Failed to fetch enrollments" };
  }
}

export async function getEnrollmentStatus(sabaqId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, enrollment: null, status: null };
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId,
          userId: session.user.id,
        },
      },
    });

    return {
      success: true,
      enrollment,
      status: enrollment?.status || null,
    };
  } catch (error: any) {
    console.error("Failed to fetch enrollment status:", error);
    return { success: false, error: "Failed to fetch enrollment status" };
  }
}

export async function approveEnrollment(enrollmentId: string) {
  try {
    const currentUser = await requirePermission("enrollments", "approve");

    const enrollmentToCheck = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollmentToCheck) {
      return { success: false, error: "Enrollment request not found" };
    }

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId: enrollmentToCheck.sabaqId,
            userId: currentUser.id,
          },
        },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: enrollmentToCheck.sabaqId, janabId: currentUser.id },
      });
      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error:
            "You do not have permission to approve enrollments for this sabaq.",
        };
      }
    }

    if (enrollmentToCheck.status === "APPROVED") {
      return { success: false, error: "Enrollment is already approved" };
    }

    const [enrollment] = await prisma.$transaction([
      prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: currentUser.id,
        },
        include: {
          user: { select: { email: true, name: true } },
          sabaq: { select: { name: true, whatsappGroupLink: true } },
        },
      }),
      prisma.sabaq.update({
        where: { id: enrollmentToCheck.sabaqId },
        data: { enrollmentCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: enrollmentToCheck.userId },
        data: { enrollmentCount: { increment: 1 } },
      }),
    ]);

    // Queue email notification
    if (enrollment.user.email) {
      await queueEnrollmentEmail(
        enrollment.user.email,
        "approved",
        enrollment.sabaq.name,
        enrollment.user.name,
        formatDate(new Date()),
        undefined,
        enrollment.sabaq.whatsappGroupLink || undefined
      );
      // Trigger processing immediately
      void processEmailQueue();
    }

    // In-app notification
    await createNotification({
      userId: enrollment.userId,
      type: "ENROLLMENT_UPDATE",
      title: "Enrollment Approved",
      message: `Your enrollment for ${enrollment.sabaq.name} has been approved.`,
      data: { sabaqId: enrollment.sabaqId },
    });

    await cache.del(`enrollments:sabaq:${enrollment.sabaqId}`);
    await cache.del(`enrollments:user:${enrollment.userId}`);
    await cache.del(`user:profile:${enrollment.userId}`);

    revalidatePath(`/dashboard/sabaqs/${enrollment.sabaqId}`);
    return { success: true, enrollment };
  } catch (error: any) {
    console.error("Failed to approve enrollment:", error);
    return {
      success: false,
      error: error.message || "Failed to approve enrollment",
    };
  }
}

export async function rejectEnrollment(enrollmentId: string, reason: string) {
  try {
    const currentUser = await requirePermission("enrollments", "reject");

    const enrollmentToCheck = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollmentToCheck) {
      return { success: false, error: "Enrollment request not found" };
    }

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId: enrollmentToCheck.sabaqId,
            userId: currentUser.id,
          },
        },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: enrollmentToCheck.sabaqId, janabId: currentUser.id },
      });
      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error:
            "You do not have permission to reject enrollments for this sabaq",
        };
      }
    }

    const [enrollment] = await prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: currentUser.id,
          rejectionReason: reason,
        },
        include: {
          user: { select: { email: true, name: true } },
          sabaq: { select: { name: true } },
        },
      });

      if (enrollmentToCheck.status === "APPROVED") {
        await tx.sabaq.update({
          where: { id: enrollmentToCheck.sabaqId },
          data: { enrollmentCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: enrollmentToCheck.userId },
          data: { enrollmentCount: { decrement: 1 } },
        });
      }

      return [updated];
    });

    // Queue email notification
    if (enrollment.user.email) {
      await queueEnrollmentEmail(
        enrollment.user.email,
        "rejected",
        enrollment.sabaq.name,
        enrollment.user.name,
        formatDate(new Date()),
        reason
      );
      // Trigger processing immediately
      void processEmailQueue();
    }

    // In-app notification
    await createNotification({
      userId: enrollment.userId,
      type: "ENROLLMENT_UPDATE",
      title: "Enrollment Rejected",
      message: `Your enrollment for ${enrollment.sabaq.name} was rejected: ${reason}`,
      data: { sabaqId: enrollment.sabaqId },
    });

    await cache.del(`enrollments:sabaq:${enrollment.sabaqId}`);
    await cache.del(`enrollments:user:${enrollment.userId}`);
    await cache.del(`user:profile:${enrollment.userId}`);

    revalidatePath(`/dashboard/sabaqs/${enrollment.sabaqId}`);
    return { success: true, enrollment };
  } catch (error: any) {
    console.error("Failed to reject enrollment:", error);
    return {
      success: false,
      error: error.message || "Failed to reject enrollment",
    };
  }
}

export async function bulkApproveEnrollments(enrollmentIds: string[]) {
  try {
    const currentUser = await requirePermission("enrollments", "approve");

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true, whatsappGroupLink: true } },
      },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: currentUser.id,
        },
      });

      // 2. Update counts (only for those not already approved)
      // We fetched 'enrollments' before update. We should check their previous status.
      for (const enrollment of enrollments) {
        if (enrollment.status !== "APPROVED") {
          await tx.sabaq.update({
            where: { id: enrollment.sabaqId },
            data: { enrollmentCount: { increment: 1 } },
          });
          await tx.user.update({
            where: { id: enrollment.userId },
            data: { enrollmentCount: { increment: 1 } },
          });
        }
      }
    });

    // Queue email notifications
    for (const enrollment of enrollments) {
      if (enrollment.user.email) {
        await queueEnrollmentEmail(
          enrollment.user.email,
          "approved",
          enrollment.sabaq.name,
          enrollment.user.name,
          formatDate(new Date())
        );
      }

      // In-app notification
      await createNotification({
        userId: enrollment.userId,
        type: "ENROLLMENT_UPDATE",
        title: "Enrollment Approved",
        message: `Your enrollment for ${enrollment.sabaq.name} has been approved.`,
        data: { sabaqId: enrollment.sabaqId },
      });

      await cache.del(`enrollments:user:${enrollment.userId}`);
      await cache.del(`user:profile:${enrollment.userId}`);
    }

    if (enrollments.length > 0) {
      await cache.del(`enrollments:sabaq:${enrollments[0].sabaqId}`);
    }

    // Trigger processing immediately
    void processEmailQueue();

    if (enrollments.length > 0) {
      revalidatePath(`/dashboard/sabaqs/${enrollments[0].sabaqId}`);
    }

    return { success: true, count: enrollmentIds.length };
  } catch (error: any) {
    console.error("Failed to bulk approve enrollments:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk approve enrollments",
    };
  }
}

export async function bulkRejectEnrollments(
  enrollmentIds: string[],
  reason: string
) {
  try {
    const currentUser = await requirePermission("enrollments", "reject");

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        user: { select: { email: true, name: true } },
        sabaq: { select: { name: true } },
      },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: currentUser.id,
          rejectionReason: reason,
        },
      });

      // 2. Update counts (only for those previously approved)
      for (const enrollment of enrollments) {
        if (enrollment.status === "APPROVED") {
          await tx.sabaq.update({
            where: { id: enrollment.sabaqId },
            data: { enrollmentCount: { decrement: 1 } },
          });
          await tx.user.update({
            where: { id: enrollment.userId },
            data: { enrollmentCount: { decrement: 1 } },
          });
        }
      }
    });

    // Queue email notifications
    for (const enrollment of enrollments) {
      if (enrollment.user.email) {
        await queueEnrollmentEmail(
          enrollment.user.email,
          "rejected",
          enrollment.sabaq.name,
          enrollment.user.name,
          formatDate(new Date()),
          reason
        );
      }

      // In-app notification
      await createNotification({
        userId: enrollment.userId,
        type: "ENROLLMENT_UPDATE",
        title: "Enrollment Rejected",
        message: `Your enrollment for ${enrollment.sabaq.name} was rejected: ${reason}`,
        data: { sabaqId: enrollment.sabaqId },
      });

      await cache.del(`enrollments:user:${enrollment.userId}`);
      await cache.del(`user:profile:${enrollment.userId}`);
    }

    if (enrollments.length > 0) {
      await cache.del(`enrollments:sabaq:${enrollments[0].sabaqId}`);
    }

    // Trigger processing immediately
    void processEmailQueue();

    if (enrollments.length > 0) {
      revalidatePath(`/dashboard/sabaqs/${enrollments[0].sabaqId}`);
    }

    return { success: true, count: enrollmentIds.length };
  } catch (error: any) {
    console.error("Failed to bulk reject enrollments:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk reject enrollments",
    };
  }
}

async function queueEnrollmentEmail(
  to: string,
  status: "approved" | "rejected",
  sabaqName: string,
  userName: string,
  dateStr: string,
  reason?: string,
  whatsappGroupLink?: string
) {
  try {
    const subject =
      status === "approved"
        ? `Enrollment Approved: ${sabaqName}`
        : `Enrollment Update: ${sabaqName}`;

    const template =
      status === "approved" ? `enrollment-approved` : `enrollment-rejected`;

    const data: any = {
      userName,
      sabaqName,
    };

    if (status === "approved") {
      data.approvedAt = dateStr;
      data.whatsappGroupLink = whatsappGroupLink || "";
    } else {
      data.rejectedAt = dateStr;
      data.reason = reason || "";
    }

    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: JSON.stringify({
          templateName: template,
          data,
        }),
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Failed to queue enrollment email:", error);
  }
}

/**
 * Bulk enroll users in a sabaq
 * Auto-approves enrollments for admin convenience
 */
export async function bulkEnrollUsers(sabaqId: string, itsNumbers: string[]) {
  try {
    const currentUser = await requirePermission("enrollments", "create");

    // Verify sabaq exists
    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
      select: { id: true, name: true, janabId: true },
    });

    if (!sabaq) {
      return { success: false, error: "Sabaq not found" };
    }

    // Verify access for non-superadmins
    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: { sabaqId_userId: { sabaqId, userId: currentUser.id } },
      });
      const isJanab = sabaq.janabId === currentUser.id;

      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error: "Unauthorized to bulk enroll for this sabaq",
        };
      }
    }

    // Remove duplicates and validate format
    const uniqueItsNumbers = [...new Set(itsNumbers)];
    const validItsNumbers = uniqueItsNumbers.filter((its) =>
      /^\d{8}$/.test(its)
    );

    if (validItsNumbers.length === 0) {
      return {
        success: false,
        error: "Please provide at least one valid ITS number.",
      };
    }

    // Fetch users by ITS numbers
    const users = await prisma.user.findMany({
      where: { itsNumber: { in: validItsNumbers } },
      select: { id: true, itsNumber: true, name: true },
    });

    const foundItsNumbers = new Set(users.map((u) => u.itsNumber));
    const notFoundItsNumbers = validItsNumbers.filter(
      (its) => !foundItsNumbers.has(its)
    );

    // Check for existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId,
        userId: { in: users.map((u) => u.id) },
      },
      select: { userId: true, status: true },
    });

    const enrolledUserIds = new Set(existingEnrollments.map((e) => e.userId));
    const usersToEnroll = users.filter((u) => !enrolledUserIds.has(u.id));

    // Create enrollments
    const results = {
      success: true,
      enrolled: [] as Array<{ itsNumber: string; name: string }>,
      alreadyEnrolled: [] as Array<{ itsNumber: string; name: string }>,
      notFound: notFoundItsNumbers,
      invalid: uniqueItsNumbers.filter((its) => !/^\d{8}$/.test(its)),
    };

    if (usersToEnroll.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.enrollment.createMany({
          data: usersToEnroll.map((user) => ({
            id: generateEnrollmentId(user.itsNumber, sabaqId),
            sabaqId,
            userId: user.id,
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: currentUser.id,
            requestedAt: new Date(),
          })),
        });

        // Increment counts
        await tx.sabaq.update({
          where: { id: sabaqId },
          data: { enrollmentCount: { increment: usersToEnroll.length } },
        });

        await tx.user.updateMany({
          where: { id: { in: usersToEnroll.map((u) => u.id) } },
          data: { enrollmentCount: { increment: 1 } },
        });
      });

      await cache.del(`enrollments:sabaq:${sabaqId}`);
      for (const user of usersToEnroll) {
        await cache.del(`enrollments:user:${user.id}`);
        await cache.del(`user:profile:${user.id}`);
      }

      results.enrolled = usersToEnroll.map((u) => ({
        itsNumber: u.itsNumber,
        name: u.name,
      }));
    }

    // Track already enrolled
    const alreadyEnrolledUsers = users.filter((u) => enrolledUserIds.has(u.id));
    results.alreadyEnrolled = alreadyEnrolledUsers.map((u) => ({
      itsNumber: u.itsNumber,
      name: u.name,
    }));

    revalidatePath(`/dashboard/sabaqs/${sabaqId}`);
    revalidatePath("/dashboard/enrollments");

    return results;
  } catch (error: any) {
    console.error("Failed to bulk enroll users:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk enroll users",
    };
  }
}

export async function getEnrollmentRequests(
  page: number = 1,
  limit: number = 20,
  sabaqId?: string
) {
  try {
    const currentUser = await requirePermission("enrollments", "approve");

    const where: any = { status: "PENDING" };
    if (sabaqId && sabaqId !== "all") {
      where.sabaqId = sabaqId;
    }

    // If superadmin, get all pending (filtered by sabaqId if provided)
    if (currentUser.role === "SUPERADMIN") {
      const [enrollments, total] = await prisma.$transaction([
        prisma.enrollment.findMany({
          where,
          include: {
            user: true,
            sabaq: true,
          },
          orderBy: { requestedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.enrollment.count({ where }),
      ]);

      const sabaqs = await prisma.sabaq.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      return {
        success: true,
        enrollments,
        sabaqs,
        total,
        page,
        limit,
        hasMore: (page - 1) * limit + enrollments.length < total,
      };
    }

    // Otherwise get pending for assigned sabaqs
    // 1. Get sabaqs where user is admin
    const adminSabaqs = await prisma.sabaqAdmin.findMany({
      where: { userId: currentUser.id },
      select: { sabaqId: true },
    });

    // 2. Get sabaqs where user is Janab
    const janabSabaqs = await prisma.sabaq.findMany({
      where: { janabId: currentUser.id },
      select: { id: true },
    });

    const allowedSabaqIds = [
      ...adminSabaqs.map((s) => s.sabaqId),
      ...janabSabaqs.map((s) => s.id),
    ];

    if (allowedSabaqIds.length === 0) {
      return { success: true, enrollments: [], sabaqs: [], total: 0 };
    }

    // If sabaqId is provided, check if allowed
    if (sabaqId && sabaqId !== "all") {
      if (!allowedSabaqIds.includes(sabaqId)) {
        return { success: false, error: "Unauthorized for this sabaq" };
      }
      where.sabaqId = sabaqId;
    } else {
      where.sabaqId = { in: allowedSabaqIds };
    }

    const [enrollments, total] = await prisma.$transaction([
      prisma.enrollment.findMany({
        where,
        include: {
          user: true,
          sabaq: true,
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    const sabaqs = await prisma.sabaq.findMany({
      where: { id: { in: allowedSabaqIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      enrollments,
      sabaqs,
      total,
      page,
      limit,
      hasMore: (page - 1) * limit + enrollments.length < total,
    };
  } catch (error: any) {
    console.error("Failed to fetch enrollment requests:", error);
    return { success: false, error: "Failed to fetch enrollment requests" };
  }
}
