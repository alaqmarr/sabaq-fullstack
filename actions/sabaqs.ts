"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { SabaqSchema } from "@/schemas";
import { queueEmail } from "./email-queue";
import { z } from "zod";
import { cache } from "@/lib/cache";

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

    await cache.invalidatePattern("sabaqs:*");
    revalidatePath("/dashboard/sabaqs");
    return { success: true, sabaq };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: error.message || "Could not create sabaq. Please try again.",
    };
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

    await cache.invalidatePattern("sabaqs:*");
    await cache.del(`sabaq:${id}`);
    await cache.del(`sabaq:public:${id}`);

    revalidatePath("/dashboard/sabaqs");
    return { success: true, sabaq };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error.message ||
        "Could not update sabaq. Please check the details and try again.",
    };
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

    await cache.invalidatePattern("sabaqs:*");
    await cache.del(`sabaq:${id}`);
    await cache.del(`sabaq:public:${id}`);

    revalidatePath("/dashboard/sabaqs");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Could not delete sabaq. It may have dependencies preventing deletion.",
    };
  }
}

export async function getSabaqs() {
  try {
    const currentUser = await requirePermission("sabaqs", "read");
    const role = currentUser.role;

    const cacheKey = `sabaqs:all:${role}:${currentUser.id}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

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

    const result = { success: true, sabaqs: serializedSabaqs };
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes

    return result;
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message || "We encountered an issue fetching the sabaq list.",
    };
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
          return {
            success: false,
            error: "You do not have permission to access this sabaq.",
          };
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
          return {
            success: false,
            error: "You are not enrolled in this sabaq.",
          };
        }
      }
    }

    const cacheKey = `sabaq:${id}`;
    let sabaq = await cache.get<any>(cacheKey);

    if (!sabaq) {
      sabaq = await prisma.sabaq.findUnique({
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

      if (sabaq) {
        await cache.set(cacheKey, sabaq, 300);
      }
    }

    if (!sabaq)
      return {
        success: false,
        error: "The requested sabaq could not be found.",
      };

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
    return {
      success: false,
      error: error.message || "Could not load sabaq details.",
    };
  }
}

export async function getPublicSabaqInfo(sabaqId: string) {
  try {
    const cacheKey = `sabaq:public:${sabaqId}`;
    let sabaq = await cache.get<any>(cacheKey);

    if (!sabaq) {
      sabaq = await prisma.sabaq.findUnique({
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

      if (sabaq) {
        await cache.set(cacheKey, sabaq, 300);
      }
    }

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

export async function assignUserToSabaq(
  userId: string,
  sabaqId: string,
  type: "ASSIGN" | "ENROLL" = "ASSIGN"
) {
  try {
    // Only superadmin can assign freely
    const currentUser = await requirePermission("users", "promote");
    if (currentUser.role !== "SUPERADMIN") {
      return {
        success: false,
        error: "Only Superadmins can directly assign users to sabaqs.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const sabaq = await prisma.sabaq.findUnique({
      where: { id: sabaqId },
    });

    if (!sabaq) {
      return { success: false, error: "Sabaq not found." };
    }

    let message = "";

    if (type === "ENROLL") {
      // Force enrollment logic irrespective of role
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId,
            userId,
          },
        },
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === "APPROVED") {
          return {
            success: false,
            error: "User is already enrolled in this sabaq.",
          };
        } else {
          // Update to APPROVED
          await prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: { status: "APPROVED" },
          });
          message = `Approved enrollment for ${user.name} in ${sabaq.name}`;
        }
      } else {
        await prisma.enrollment.create({
          data: {
            userId,
            sabaqId,
            status: "APPROVED",
          },
        });
        message = `Enrolled ${user.name} in ${sabaq.name}`;
      }

      // If user was Mumin, good. If Admin, they are now also enrolled.
      // This is acceptable behavior.
    } else {
      // ASSIGN logic (Admin/Janab management)
      if (user.role === "JANAB") {
        // Assign as Janab (overwrite existing if any)
        await prisma.sabaq.update({
          where: { id: sabaqId },
          data: { janabId: userId },
        });

        // Increment counters
        await prisma.user.update({
          where: { id: userId },
          data: { managedSabaqsCount: { increment: 1 } },
        });

        // Send email
        if (user.email) {
          await queueEmail(
            user.email,
            `Assigned as Janab for ${sabaq.name}`,
            "janab-assignment",
            {
              janabName: user.name,
              sabaqName: sabaq.name,
              sabaqLevel: sabaq.level,
              action: "assigned",
            }
          );
        }
        message = `Assigned ${user.name} as Janab for ${sabaq.name}`;
      } else if (
        ["ADMIN", "MANAGER", "ATTENDANCE_INCHARGE"].includes(user.role)
      ) {
        // Create SabaqAdmin entry
        const existingAdmin = await prisma.sabaqAdmin.findUnique({
          where: {
            sabaqId_userId: {
              sabaqId,
              userId,
            },
          },
        });

        if (existingAdmin) {
          return {
            success: false,
            error: "User is already an admin for this sabaq.",
          };
        }

        await prisma.sabaqAdmin.create({
          data: {
            sabaqId,
            userId,
          },
        });
        message = `Assigned ${user.name} as Admin for ${sabaq.name}`;
      } else if (user.role === "MUMIN") {
        // Fallback for MUMIN in ASSIGN mode -> treat as ENROLL
        // Recursively call with ENROLL to avoid duplication
        return assignUserToSabaq(userId, sabaqId, "ENROLL");
      } else {
        return {
          success: false,
          error: "Cannot assign Superadmin to a specific sabaq.",
        };
      }
    }

    await cache.invalidatePattern("sabaqs:*");
    await cache.invalidatePattern("users:*");
    await cache.del(`user:profile:${userId}`);

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/sabaqs");

    return { success: true, message };
  } catch (error: any) {
    console.error("Assign user error:", error);
    return {
      success: false,
      error: error.message || "Failed to assign user to sabaq.",
    };
  }
}
