"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { SabaqSchema } from "@/schemas";
import { queueEmail } from "./email-queue";
import { z } from "zod";

export async function createSabaq(data: any) {
  try {
    const currentUser = await requirePermission("sabaqs", "create");

    const validatedData = SabaqSchema.parse(data);

    const sabaq = await prisma.sabaq.create({
      data: {
        id: validatedData.name.toLowerCase().replace(/\s+/g, "-"),
        name: validatedData.name,
        kitaab: validatedData.kitaab,
        level: validatedData.level,
        description: validatedData.description,
        criteria: validatedData.criteria,
        enrollmentStartsAt: validatedData.enrollmentStartsAt,
        enrollmentEndsAt: validatedData.enrollmentEndsAt,
        whatsappGroupLink: validatedData.whatsappGroupLink,
        allowLocationAttendance: validatedData.allowLocationAttendance,
        ...(validatedData.locationId
          ? { location: { connect: { id: validatedData.locationId } } }
          : {}),
        ...(validatedData.janabId
          ? { janab: { connect: { id: validatedData.janabId } } }
          : {}),
        createdBy: currentUser.id,
      },
    });

    // Increment counters
    if (validatedData.locationId) {
      await prisma.location.update({
        where: { id: validatedData.locationId },
        data: { sabaqsCount: { increment: 1 } },
      });
    }

    if (validatedData.janabId) {
      await prisma.user.update({
        where: { id: validatedData.janabId },
        data: { managedSabaqsCount: { increment: 1 } },
      });

      const janab = await prisma.user.findUnique({
        where: { id: validatedData.janabId },
        select: { email: true, name: true },
      });

      if (janab?.email) {
        await queueEmail(
          janab.email,
          `Assigned as Janab for ${sabaq.name}`,
          "janab-assignment",
          {
            janabName: janab.name,
            sabaqName: sabaq.name,
            sabaqLevel: sabaq.level,
            action: "assigned",
          }
        );
      }
    }

    revalidatePath("/dashboard/sabaqs");
    return { success: true, sabaq };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return { success: false, error: error.message || "Failed to create sabaq" };
  }
}

export async function updateSabaq(id: string, data: any) {
  try {
    await requirePermission("sabaqs", "update");

    const validatedData = SabaqSchema.partial().parse(data);

    const sabaq = await prisma.sabaq.update({
      where: { id },
      data: validatedData,
    });

    // Notify Janab if assigned/changed
    if (validatedData.janabId) {
      const janab = await prisma.user.findUnique({
        where: { id: validatedData.janabId },
        select: { email: true, name: true },
      });

      if (janab?.email) {
        await queueEmail(
          janab.email,
          `Janab Assignment Update: ${sabaq.name}`,
          "janab-assignment",
          {
            janabName: janab.name,
            sabaqName: sabaq.name,
            sabaqLevel: sabaq.level,
            action: "updated",
          }
        );
      }
    }

    revalidatePath("/dashboard/sabaqs");
    return { success: true, sabaq };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return { success: false, error: error.message || "Failed to update sabaq" };
  }
}

export async function deleteSabaq(id: string) {
  try {
    await requirePermission("sabaqs", "delete");

    const sabaq = await prisma.sabaq.findUnique({
      where: { id },
      select: { locationId: true, janabId: true },
    });

    if (sabaq) {
      if (sabaq.locationId) {
        await prisma.location.update({
          where: { id: sabaq.locationId },
          data: { sabaqsCount: { decrement: 1 } },
        });
      }
      if (sabaq.janabId) {
        await prisma.user.update({
          where: { id: sabaq.janabId },
          data: { managedSabaqsCount: { decrement: 1 } },
        });
      }
    }

    await prisma.sabaq.delete({
      where: { id },
    });
    revalidatePath("/dashboard/sabaqs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete sabaq" };
  }
}

export async function getSabaqs() {
  try {
    const currentUser = await requirePermission("sabaqs", "read");
    const role = currentUser.role;

    let where: any = { isActive: true };

    // Superadmin sees all
    if (role === "SUPERADMIN") {
      // No filter needed
    }
    // Admin/Manager/Janab see assigned sabaqs
    else if (
      ["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)
    ) {
      const assignedSabaqs = await prisma.sabaqAdmin.findMany({
        where: { userId: currentUser.id },
        select: { sabaqId: true },
      });

      const assignedSabaqIds = assignedSabaqs.map((sa) => sa.sabaqId);

      where = {
        isActive: true,
        OR: [
          { id: { in: assignedSabaqIds } },
          { janabId: currentUser.id }, // Also include if they are the Janab
        ],
      };
    }
    // Mumin sees enrolled sabaqs
    else {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: currentUser.id,
          status: "APPROVED",
        },
        select: { sabaqId: true },
      });
      const enrolledSabaqIds = enrollments.map((e) => e.sabaqId);

      where = {
        isActive: true,
        id: { in: enrolledSabaqIds },
      };
    }

    const sabaqs = await prisma.sabaq.findMany({
      where,
      include: {
        location: true,
        janab: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
          },
        },
        activeSession: true,
        _count: {
          select: {
            sessions: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            status: true,
          },
        },
        sessions: {
          where: {
            scheduledAt: { gte: new Date() },
            isActive: false,
          },
          orderBy: { scheduledAt: "asc" },
          take: 1, // Just need the next upcoming one
        },
      } as any,
    });

    const serializedSabaqs = sabaqs.map((sabaq: any) => ({
      ...sabaq,
      // Count enrollments by status
      _count: {
        ...sabaq._count,
        enrollments: sabaq.enrollments.filter(
          (e: any) => e.status === "APPROVED"
        ).length,
      },
      pendingEnrollments: sabaq.enrollments.filter(
        (e: any) => e.status === "PENDING"
      ),
      // Remove the full enrollments array from the response
      enrollments: undefined,
      // If we have an active session, put it in the sessions array for the UI to pick up
      sessions: sabaq.activeSession
        ? [sabaq.activeSession, ...(sabaq.sessions || [])]
        : sabaq.sessions,
      location: sabaq.location
        ? {
            ...sabaq.location,
            latitude: Number(sabaq.location.latitude),
            longitude: Number(sabaq.location.longitude),
            radiusMeters: Number(sabaq.location.radiusMeters),
          }
        : null,
    }));

    return { success: true, sabaqs: serializedSabaqs };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch sabaqs" };
  }
}

export async function getSabaqById(id: string) {
  try {
    const currentUser = await requirePermission("sabaqs", "read");

    // Verify access
    if (currentUser.role !== "SUPERADMIN") {
      if (
        ["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(
          currentUser.role
        )
      ) {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
          where: { sabaqId_userId: { sabaqId: id, userId: currentUser.id } },
        });
        const isJanab = await prisma.sabaq.findFirst({
          where: { id, janabId: currentUser.id },
        });

        if (!isAssigned && !isJanab) {
          return { success: false, error: "Unauthorized access to this sabaq" };
        }
      } else {
        // Mumin check
        const isEnrolled = await prisma.enrollment.findUnique({
          where: {
            sabaqId_userId: { sabaqId: id, userId: currentUser.id },
            status: "APPROVED",
          },
        });
        if (!isEnrolled) {
          return { success: false, error: "Unauthorized access to this sabaq" };
        }
      }
    }

    const sabaq = await prisma.sabaq.findUnique({
      where: { id },
      include: {
        location: true,
        janab: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
          },
        },
        activeSession: true,
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      },
    });

    if (!sabaq) return { success: false, error: "Sabaq not found" };

    const serializedSabaq = {
      ...sabaq,
      location: sabaq.location
        ? {
            ...sabaq.location,
            latitude: Number(sabaq.location.latitude),
            longitude: Number(sabaq.location.longitude),
            radiusMeters: Number(sabaq.location.radiusMeters),
          }
        : null,
    };

    return { success: true, sabaq: serializedSabaq };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch sabaq" };
  }
}

export async function getPublicSabaqInfo(sabaqId: string) {
  try {
    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
      select: {
        id: true,
        name: true,
        kitaab: true,
        level: true,
        description: true,
        criteria: true,
        enrollmentStartsAt: true,
        enrollmentEndsAt: true,
        allowLocationAttendance: true,
        janab: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!sabaq) {
      return { success: false, error: "Sabaq not found" };
    }

    return { success: true, sabaq };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch sabaq info",
    };
  }
}
