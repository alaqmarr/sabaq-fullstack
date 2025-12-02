"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { queueEmail, processEmailQueue } from "./email-queue";
import { requirePermission } from "@/lib/rbac";
import { SessionSchema } from "@/schemas";
import { generateSessionId } from "@/lib/id-generators";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";
import { createNotification } from "@/actions/notifications";

import { cache } from "@/lib/cache";

export async function createSession(data: {
  sabaqId: string;
  scheduledAt: Date;
  cutoffTime: Date;
}) {
  try {
    await requirePermission("sessions", "create");

    const validatedData = SessionSchema.parse(data);

    // Generate human-readable session ID (falls back to cuid() if not provided)
    const sessionId = generateSessionId(
      validatedData.sabaqId,
      validatedData.scheduledAt
    );

    const newSession = await prisma.session.create({
      data: {
        id: sessionId,
        sabaqId: validatedData.sabaqId,
        scheduledAt: validatedData.scheduledAt,
        cutoffTime: validatedData.cutoffTime,
        createdBy: (await auth())?.user?.id!,
      },
    });

    await cache.invalidatePattern("sessions:*");
    revalidatePath(`/dashboard/sabaqs/${validatedData.sabaqId}`);
    revalidatePath("/dashboard/sessions");
    return { success: true, session: newSession };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to create session:", error);
    return {
      success: false,
      error: error.message || "Failed to create session",
    };
  }
}

export async function updateSession(
  id: string,
  data: {
    scheduledAt?: Date;
    cutoffTime?: Date;
  }
) {
  try {
    await requirePermission("sessions", "update");

    const validatedData = SessionSchema.partial().parse(data);

    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    if (existingSession.startedAt) {
      return {
        success: false,
        error: "Cannot edit a session that has already started",
      };
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: validatedData,
    });

    await cache.invalidatePattern("sessions:*");
    revalidatePath(`/dashboard/sabaqs/${updatedSession.sabaqId}`);
    revalidatePath("/dashboard/sessions");
    return { success: true, session: updatedSession };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return {
      success: false,
      error: error.message || "Failed to update session",
    };
  }
}

export async function deleteSession(id: string) {
  try {
    await requirePermission("sessions", "delete");

    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    if (existingSession.startedAt) {
      return {
        success: false,
        error: "Cannot delete a session that has already started",
      };
    }

    await prisma.session.delete({
      where: { id },
    });

    await cache.invalidatePattern("sessions:*");
    revalidatePath(`/dashboard/sabaqs/${existingSession.sabaqId}`);
    revalidatePath("/dashboard/sessions");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete session",
    };
  }
}

export async function startSession(id: string) {
  try {
    await requirePermission("sessions", "start");

    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    if (existingSession.isActive) {
      return { success: false, error: "Session is already active" };
    }

    if (existingSession.startedAt) {
      return { success: false, error: "Session has already been started" };
    }

    // Check if another session for this sabaq is active
    const activeSession = await prisma.session.findFirst({
      where: {
        sabaqId: existingSession.sabaqId,
        isActive: true,
      },
    });

    if (activeSession) {
      return {
        success: false,
        error: "Another session for this sabaq is already active",
      };
    }

    const [session] = await prisma.$transaction([
      prisma.session.update({
        where: { id },
        data: {
          startedAt: new Date(),
          isActive: true,
        },
        include: {
          sabaq: {
            select: {
              name: true,
              kitaab: true,
            },
          },
        },
      }),
      prisma.sabaq.update({
        where: { id: existingSession.sabaqId },
        data: { activeSessionId: id },
      }),
    ]);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId: session.sabaqId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Notify users
    await Promise.all(
      enrollments.map((enrollment) =>
        createNotification({
          userId: enrollment.user.id,
          type: "SESSION_START",
          title: "Session Started",
          message: `${session.sabaq.name} has started. Join now!`,
          data: { sessionId: session.id, sabaqId: session.sabaqId },
        })
      )
    );

    await cache.invalidatePattern("sessions:*");

    return { success: true, session };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to start session",
    };
  }
}

export async function endSession(id: string) {
  try {
    await requirePermission("sessions", "end");

    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    if (!existingSession.isActive) {
      return { success: false, error: "Session is not active" };
    }

    const [session] = await prisma.$transaction([
      prisma.session.update({
        where: { id },
        data: {
          endedAt: new Date(),
          isActive: false,
        },
      }),
      prisma.sabaq.update({
        where: { id: existingSession.sabaqId },
        data: {
          activeSessionId: null,
          conductedSessionsCount: { increment: 1 },
        },
      }),
    ]);

    // 1. Fetch all approved enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId: existingSession.sabaqId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // 2. Fetch all attendance records
    const attendances = await prisma.attendance.findMany({
      where: { sessionId: id },
      select: {
        userId: true,
        isLate: true,
        minutesLate: true,
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    // 3. Queue emails
    for (const enrollment of enrollments) {
      if (!enrollment.user.email) continue;

      const attendance = attendanceMap.get(enrollment.user.id);

      if (attendance) {
        // Present or Late
        await queueEmail(
          enrollment.user.email,
          `Session Summary: ${existingSession.sabaq.name}`,
          "session-summary",
          {
            userName: enrollment.user.name,
            sabaqName: existingSession.sabaq.name,
            scheduledAt: formatDateTime(existingSession.scheduledAt),
            status: attendance.isLate ? "Late" : "Present",
            minutesLate: attendance.minutesLate,
            sessionId: id,
            feedbackLink: `${process.env.NEXT_PUBLIC_APP_URL}/sessions/${id}/feedback`,
          }
        );
      } else {
        // Absent
        await queueEmail(
          enrollment.user.email,
          `Session Absence: ${existingSession.sabaq.name}`,
          "session-absent",
          {
            userName: enrollment.user.name,
            sabaqName: existingSession.sabaq.name,
            scheduledAt: formatDateTime(existingSession.scheduledAt),
            sessionId: id,
          }
        );
      }
    }

    // 4. Send Session Report to Admins
    const totalStudents = enrollments.length;
    const presentCount = attendances.filter((a) => !a.isLate).length;
    const lateCount = attendances.filter((a) => a.isLate).length;
    const absentCount = totalStudents - (presentCount + lateCount);
    const attendanceRate =
      totalStudents > 0
        ? `${Math.round(((presentCount + lateCount) / totalStudents) * 100)}%`
        : "0%";

    // Get top students (present)
    const topStudents = enrollments
      .filter(
        (e) =>
          attendanceMap.has(e.user.id) && !attendanceMap.get(e.user.id)?.isLate
      )
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    // Get absentees
    const lowAttendanceStudents = enrollments
      .filter((e) => !attendanceMap.has(e.user.id))
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    // Fetch admins
    const sabaqAdmins = await prisma.sabaqAdmin.findMany({
      where: { sabaqId: existingSession.sabaqId },
      include: { user: { select: { email: true } } },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { email: true },
    });

    const adminEmails = [
      ...sabaqAdmins.map((sa) => sa.user.email),
      ...superAdmins.map((sa) => sa.email),
    ].filter((email): email is string => !!email);

    const uniqueAdminEmails = [...new Set(adminEmails)];

    for (const email of uniqueAdminEmails) {
      await queueEmail(
        email,
        `Session Report: ${existingSession.sabaq.name}`,
        "session-report",
        {
          sabaqName: existingSession.sabaq.name,
          sessionDate: formatDateTime(existingSession.scheduledAt),
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate,
          topStudents,
          lowAttendanceStudents,
        }
      );
    }

    // Trigger processing immediately
    void processEmailQueue();

    await cache.invalidatePattern("sessions:*");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/sessions/${id}`);
    return { success: true, session };
  } catch (error: any) {
    console.error("Failed to end session:", error);
    return { success: false, error: error.message || "Failed to end session" };
  }
}

export async function resumeSession(id: string) {
  try {
    await requirePermission("sessions", "end");

    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    if (existingSession.isActive) {
      return { success: false, error: "Session is already active" };
    }

    if (!existingSession.endedAt) {
      return { success: false, error: "Session has not ended yet" };
    }

    const [session] = await prisma.$transaction([
      prisma.session.update({
        where: { id },
        data: {
          isActive: true,
          endedAt: null,
        },
      }),
      prisma.sabaq.update({
        where: { id: existingSession.sabaqId },
        data: { activeSessionId: id },
      }),
    ]);

    await cache.invalidatePattern("sessions:*");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/sessions/${id}`);
    return { success: true, session };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to resume session",
    };
  }
}

export async function getSessionsBySabaq(sabaqId: string) {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    // Verify access to this sabaq
    if (role !== "SUPERADMIN") {
      if (["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)) {
        const isAssigned = await prisma.sabaqAdmin.findUnique({
          where: { sabaqId_userId: { sabaqId, userId: currentUser.id } },
        });
        const isJanab = await prisma.sabaq.findFirst({
          where: { id: sabaqId, janabId: currentUser.id },
        });

        if (!isAssigned && !isJanab) {
          return { success: false, error: "Unauthorized access to this sabaq" };
        }
      } else {
        // Mumin check
        const isEnrolled = await prisma.enrollment.findUnique({
          where: {
            sabaqId_userId: { sabaqId, userId: currentUser.id },
            status: "APPROVED",
          },
        });
        if (!isEnrolled) {
          return { success: false, error: "Unauthorized access to this sabaq" };
        }
      }
    }

    const sessions = await prisma.session.findMany({
      where: { sabaqId },
      orderBy: { scheduledAt: "desc" },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
            allowLocationAttendance: true,
            locationId: true,
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
          select: {
            attendances: true,
            questions: true,
          },
        },
      },
    });
    return { success: true, sessions };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch sessions",
    };
  }
}

export async function getSessionById(id: string) {
  try {
    await requirePermission("sessions", "read");

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
            description: true,
            allowLocationAttendance: true,
            locationId: true,
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
          select: {
            attendances: true,
            questions: true,
          },
        },
      },
    });
    return { success: true, session };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch session",
    };
  }
}

export async function getAllSessions() {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    let where: any = {};

    if (role !== "SUPERADMIN") {
      if (["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)) {
        const assignedSabaqs = await prisma.sabaqAdmin.findMany({
          where: { userId: currentUser.id },
          select: { sabaqId: true },
        });
        const assignedSabaqIds = assignedSabaqs.map((sa) => sa.sabaqId);
        where = {
          sabaq: {
            OR: [{ id: { in: assignedSabaqIds } }, { janabId: currentUser.id }],
          },
        };
      } else {
        // Mumin
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: currentUser.id, status: "APPROVED" },
          select: { sabaqId: true },
        });
        const enrolledSabaqIds = enrollments.map((e) => e.sabaqId);
        where = { sabaqId: { in: enrolledSabaqIds } };
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });
    return { success: true, sessions };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch sessions",
    };
  }
}

export async function getActiveSessions() {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    const cacheKey = `sessions:active:${role}:${currentUser.id}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    let where: any = { isActive: true };

    if (role !== "SUPERADMIN") {
      if (["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)) {
        const assignedSabaqs = await prisma.sabaqAdmin.findMany({
          where: { userId: currentUser.id },
          select: { sabaqId: true },
        });
        const assignedSabaqIds = assignedSabaqs.map((sa) => sa.sabaqId);
        where = {
          isActive: true,
          sabaq: {
            OR: [{ id: { in: assignedSabaqIds } }, { janabId: currentUser.id }],
          },
        };
      } else {
        // Mumin
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: currentUser.id, status: "APPROVED" },
          select: { sabaqId: true },
        });
        const enrolledSabaqIds = enrollments.map((e) => e.sabaqId);
        where = {
          isActive: true,
          sabaqId: { in: enrolledSabaqIds },
        };
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
            allowLocationAttendance: true,
            locationId: true,
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
      orderBy: { startedAt: "desc" },
    });

    const result = { success: true, sessions };
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch active sessions",
    };
  }
}

export async function getUpcomingSessions(days: number = 7) {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    const cacheKey = `sessions:upcoming:${role}:${currentUser.id}:${days}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    let where: any = {
      scheduledAt: {
        gte: now,
        lte: futureDate,
      },
      isActive: false,
      startedAt: null,
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
            allowLocationAttendance: true,
            locationId: true,
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
      },
      orderBy: { scheduledAt: "asc" },
    });

    const result = { success: true, sessions };
    await cache.set(cacheKey, result, 60); // Cache for 1 minute

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch upcoming sessions",
    };
  }
}

export async function getPublicSessionInfo(sessionId: string) {
  try {
    const cacheKey = `session:public:${sessionId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            description: true,
            kitaab: true,
            level: true,
          },
        },
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const result = { success: true, session };
    await cache.set(cacheKey, result, 60); // Cache for 1 minute

    return result;
  } catch (error: any) {
    console.error("Failed to fetch public session info:", error);
    return { success: false, error: "Failed to fetch session info" };
  }
}

export async function getSessionUsers(sessionId: string) {
  try {
    await requirePermission("sessions", "read");

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { sabaqId: true },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId: session.sabaqId,
        status: "APPROVED",
      },
      select: {
        user: {
          select: {
            id: true,
            itsNumber: true,
            name: true,
          },
        },
      },
    });

    const users = enrollments.map((e) => ({
      id: e.user.id,
      itsNumber: e.user.itsNumber,
      name: e.user.name,
    }));

    return { success: true, users };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch session users",
    };
  }
}
