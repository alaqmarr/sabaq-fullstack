"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export async function getCalendarSessions(start: Date, end: Date) {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    let where: any = {
      scheduledAt: {
        gte: start,
        lte: end,
      },
    };

    if (role !== "SUPERADMIN") {
      if (["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)) {
        const assignedSabaqs = await prisma.sabaqAdmin.findMany({
          where: { userId: currentUser.id },
          select: { sabaqId: true },
        });
        const assignedSabaqIds = assignedSabaqs.map((sa) => sa.sabaqId);
        where.sabaq = {
          OR: [{ id: { in: assignedSabaqIds } }, { janabId: currentUser.id }],
        };
      } else {
        // Mumin
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: currentUser.id, status: "APPROVED" },
          select: { sabaqId: true },
        });
        const enrolledSabaqIds = enrollments.map((e) => e.sabaqId);
        where.sabaqId = { in: enrolledSabaqIds };
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
            location: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                radiusMeters: true,
              },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Serialize Decimal types to Number for client components
    const serializedSessions = sessions.map((session) => ({
      ...session,
      sabaq: {
        ...session.sabaq,
        location: session.sabaq.location
          ? {
              ...session.sabaq.location,
              latitude: Number(session.sabaq.location.latitude),
              longitude: Number(session.sabaq.location.longitude),
            }
          : null,
      },
    }));

    return { success: true, sessions: serializedSessions };
  } catch (error: any) {
    console.error("Failed to fetch calendar sessions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch calendar sessions",
    };
  }
}
