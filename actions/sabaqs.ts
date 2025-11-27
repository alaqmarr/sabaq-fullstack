"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { SabaqSchema } from "@/schemas";
import { queueEmail } from "./email-queue";

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

    // Notify Janab if assigned
    if (validatedData.janabId) {
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
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
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
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || "Failed to update sabaq" };
  }
}

export async function deleteSabaq(id: string) {
  try {
    await requirePermission("sabaqs", "delete");

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
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      } as any,
    });
    return { success: true, sabaqs };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch sabaqs" };
  }
}

export async function getSabaqById(id: string) {
  try {
    await requirePermission("sabaqs", "read");

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
      },
    });
    return { success: true, sabaq };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch sabaq" };
  }
}
