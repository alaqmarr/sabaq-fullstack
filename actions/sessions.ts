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
import * as XLSX from "xlsx";

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

    const authSession = await auth();
    if (!authSession?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is ADMIN/SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: { role: true },
    });

    if (!user || !["SUPERADMIN", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sabaq: {
          select: {
            id: true,
            admins: { select: { userId: true } },
          },
        },
      },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    // For ADMIN, verify they are a sabaq admin
    if (user.role === "ADMIN") {
      const isSabaqAdmin = existingSession.sabaq.admins.some(
        (a) => a.userId === authSession.user.id
      );
      if (!isSabaqAdmin) {
        return { success: false, error: "Unauthorized - Not a sabaq admin" };
      }
    }

    // Update session timing
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt,
        cutoffTime: data.cutoffTime,
      },
    });

    await cache.invalidatePattern("sessions:*");
    revalidatePath(`/dashboard/sabaqs/${updatedSession.sabaqId}`);
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/sessions/${id}`);
    return { success: true, session: updatedSession };
  } catch (error: any) {
    console.error("Failed to update session:", error);
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

export async function endSession(
  id: string,
  options?: { skipActiveCheck?: boolean }
) {
  try {
    await requirePermission("sessions", "end");

    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            janab: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    // Allow skipping active check when called from sync (session was just ended)
    const skipActiveCheck = options?.skipActiveCheck ?? false;

    if (!skipActiveCheck && !existingSession.isActive) {
      return { success: false, error: "Session is not active" };
    }

    // Only update session status if it's still active
    let session = existingSession;
    if (existingSession.isActive) {
      const [updatedSession] = await prisma.$transaction([
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
      session = updatedSession as any;
    }

    // 1. Fetch all approved enrollments with ITS number
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
            itsNumber: true,
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

    // NOTE: Individual user emails (session-summary/session-absent) removed to reduce email spam
    // Users already receive attendance confirmation when marked. Only admins get end-of-session report.

    // 4. Calculate attendance stats
    const totalStudents = enrollments.length;
    const presentCount = attendances.filter((a) => !a.isLate).length;
    const lateCount = attendances.filter((a) => a.isLate).length;
    const absentCount = totalStudents - (presentCount + lateCount);
    const attendanceRate =
      totalStudents > 0
        ? `${Math.round(((presentCount + lateCount) / totalStudents) * 100)}%`
        : "0%";

    // 5. Find No-Shows (enrolled users who have NEVER attended any session of this sabaq)
    const enrolledUserIds = enrollments.map((e) => e.user.id);
    const allSabaqAttendances = await prisma.attendance.findMany({
      where: {
        session: { sabaqId: existingSession.sabaqId },
        userId: { in: enrolledUserIds },
      },
      select: { userId: true },
    });
    const usersWhoEverAttended = new Set(
      allSabaqAttendances.map((a) => a.userId)
    );
    const noShowUsers = enrollments.filter(
      (e) => !usersWhoEverAttended.has(e.user.id)
    );

    // 6. Prepare data for Excel report
    const presentData = enrollments
      .filter(
        (e) =>
          attendanceMap.has(e.user.id) && !attendanceMap.get(e.user.id)?.isLate
      )
      .map((e) => ({
        Name: e.user.name || "Unknown",
        "ITS Number": e.user.itsNumber || "N/A",
        Email: e.user.email || "N/A",
        Status: "Present",
      }));

    const lateData = enrollments
      .filter(
        (e) =>
          attendanceMap.has(e.user.id) && attendanceMap.get(e.user.id)?.isLate
      )
      .map((e) => ({
        Name: e.user.name || "Unknown",
        "ITS Number": e.user.itsNumber || "N/A",
        Email: e.user.email || "N/A",
        Status: "Late",
        "Minutes Late": attendanceMap.get(e.user.id)?.minutesLate || 0,
      }));

    const absentData = enrollments
      .filter((e) => !attendanceMap.has(e.user.id))
      .map((e) => ({
        Name: e.user.name || "Unknown",
        "ITS Number": e.user.itsNumber || "N/A",
        Email: e.user.email || "N/A",
      }));

    const noShowData = noShowUsers.map((e) => ({
      Name: e.user.name || "Unknown",
      "ITS Number": e.user.itsNumber || "N/A",
      Email: e.user.email || "N/A",
      Note: "Never attended any session",
    }));

    // 7. Generate Excel workbook
    const workbook = XLSX.utils.book_new();
    const attendedSheet = XLSX.utils.json_to_sheet([
      ...presentData,
      ...lateData,
    ]);
    XLSX.utils.book_append_sheet(workbook, attendedSheet, "Attended");
    const absentSheet = XLSX.utils.json_to_sheet(absentData);
    XLSX.utils.book_append_sheet(workbook, absentSheet, "Absent");
    const noShowSheet = XLSX.utils.json_to_sheet(noShowData);
    XLSX.utils.book_append_sheet(workbook, noShowSheet, "No-Shows");
    const excelBuffer = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });
    const excelFilename = `${existingSession.sabaq.name} - ${formatDate(
      existingSession.scheduledAt
    )}.xlsx`;

    // 8. Get top students and absentees for email
    const topStudents = enrollments
      .filter(
        (e) =>
          attendanceMap.has(e.user.id) && !attendanceMap.get(e.user.id)?.isLate
      )
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    const lowAttendanceStudents = enrollments
      .filter((e) => !attendanceMap.has(e.user.id))
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    const noShowStudents = noShowUsers
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    // 9. Fetch admins - only ADMIN and SUPERADMIN roles (not ATTENDANCE_INCHARGE)
    const sabaqAdmins = await prisma.sabaqAdmin.findMany({
      where: {
        sabaqId: existingSession.sabaqId,
        user: {
          role: { in: ["ADMIN", "SUPERADMIN"] },
        },
      },
      include: { user: { select: { email: true, role: true } } },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { email: true },
    });

    // Only send to Sabaq Admins (ADMIN role), SuperAdmins, and Janab (not ATTENDANCE_INCHARGE)
    const adminEmails = [
      ...sabaqAdmins.map((sa) => sa.user.email),
      ...superAdmins.map((sa) => sa.email),
      existingSession.sabaq.janab?.email,
    ].filter((email): email is string => !!email);

    const uniqueAdminEmails = [...new Set(adminEmails)];

    // 10. Queue session report emails with Excel attachment
    const excelAttachment = {
      filename: excelFilename,
      content: excelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

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
          noShowStudents,
          noShowCount: noShowUsers.length,
        },
        [excelAttachment] // Attach Excel report
      );
    }

    // 11. Process email queue and wait for completion
    await processEmailQueue();

    await cache.invalidatePattern("sessions:*");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/sessions/${id}`);

    return {
      success: true,
      session,
      reportData: {
        excelBase64: excelBuffer,
        filename: excelFilename,
        stats: {
          totalStudents,
          presentCount,
          lateCount,
          absentCount,
          noShowCount: noShowUsers.length,
          attendanceRate,
        },
      },
    };
  } catch (error: any) {
    console.error("Failed to end session:", error);
    return { success: false, error: error.message || "Failed to end session" };
  }
}

// Progress callback type
type ProgressCallback = (
  phase: string,
  progress: number,
  label: string
) => Promise<void>;

// Version of endSession with progress reporting for the dialog
export async function endSessionWithProgress(
  id: string,
  options?: { skipActiveCheck?: boolean },
  onProgress?: ProgressCallback
) {
  try {
    await requirePermission("sessions", "end");

    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            janab: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return { success: false, error: "Session not found" };
    }

    const skipActiveCheck = options?.skipActiveCheck ?? false;

    if (!skipActiveCheck && !existingSession.isActive) {
      return { success: false, error: "Session is not active" };
    }

    // Report progress: Starting
    await onProgress?.("report", 0, "Starting session finalization...");

    // Only update session status if it's still active
    let session = existingSession;
    if (existingSession.isActive) {
      const [updatedSession] = await prisma.$transaction([
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
      session = updatedSession as any;
    }

    await onProgress?.("report", 10, "Fetching enrollment data...");

    // 1. Fetch all approved enrollments with ITS number
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sabaqId: existingSession.sabaqId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            itsNumber: true,
          },
        },
      },
    });

    await onProgress?.("report", 20, "Fetching attendance records...");

    // 2. Fetch all attendance records for this session
    const attendances = await prisma.attendance.findMany({
      where: { sessionId: id },
      select: {
        userId: true,
        isLate: true,
        user: {
          select: { name: true, itsNumber: true },
        },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    await onProgress?.("report", 30, "Calculating attendance stats...");

    // Calculate attendance stats
    const totalStudents = enrollments.length;
    const presentCount = attendances.filter((a) => !a.isLate).length;
    const lateCount = attendances.filter((a) => a.isLate).length;
    const absentCount = totalStudents - (presentCount + lateCount);
    const attendanceRate =
      totalStudents > 0
        ? `${Math.round(((presentCount + lateCount) / totalStudents) * 100)}%`
        : "0%";

    await onProgress?.("report", 40, "Generating Excel report...");

    // Generate Excel report (simplified - copy from main function)
    const enrolledUserIds = enrollments.map((e) => e.user.id);
    const allSabaqAttendances = await prisma.attendance.findMany({
      where: {
        session: { sabaqId: existingSession.sabaqId },
        userId: { in: enrolledUserIds },
      },
      select: { userId: true },
    });

    const everAttendedUserIds = new Set(
      allSabaqAttendances.map((a) => a.userId)
    );
    const noShowUsers = enrollments.filter(
      (e) => !everAttendedUserIds.has(e.user.id)
    );

    // Build Excel data
    const attendedList = attendances.map((a) => ({
      Name: a.user.name || "Unknown",
      ITS: a.user.itsNumber,
      Status: a.isLate ? "Late" : "Present",
    }));

    const absentList = enrollments
      .filter((e) => !attendanceMap.has(e.user.id))
      .map((e) => ({
        Name: e.user.name || "Unknown",
        ITS: e.user.itsNumber,
        Status: "Absent",
      }));

    const noShowList = noShowUsers.map((e) => ({
      Name: e.user.name || "Unknown",
      ITS: e.user.itsNumber,
      Status: "No-Show (Never Attended)",
    }));

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(attendedList),
      "Attended"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(absentList),
      "Absent"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(noShowList),
      "No-Shows"
    );

    const excelBuffer = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });
    const dateStr = formatDate(existingSession.scheduledAt).replace(
      /[/\\]/g,
      "-"
    );
    const excelFilename = `${existingSession.sabaq.name}_${dateStr}_Report.xlsx`;

    await onProgress?.("emails", 50, "Preparing email recipients...");

    // Fetch admins
    const sabaqAdmins = await prisma.sabaqAdmin.findMany({
      where: {
        sabaqId: existingSession.sabaqId,
        user: { role: { in: ["ADMIN", "SUPERADMIN"] } },
      },
      include: { user: { select: { email: true } } },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { email: true },
    });

    const topStudents = attendances
      .slice(0, 5)
      .map((a) => a.user.name || "Unknown");
    const lowAttendanceStudents = enrollments
      .filter((e) => !attendanceMap.has(e.user.id))
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");
    const noShowStudents = noShowUsers
      .slice(0, 5)
      .map((e) => e.user.name || "Unknown");

    const adminEmails = [
      ...sabaqAdmins.map((sa) => sa.user.email),
      ...superAdmins.map((sa) => sa.email),
      existingSession.sabaq.janab?.email,
    ].filter((email): email is string => !!email);

    const uniqueAdminEmails = [...new Set(adminEmails)];

    await onProgress?.(
      "emails",
      60,
      `Sending emails to ${uniqueAdminEmails.length} admins...`
    );

    // Queue session report emails
    const excelAttachment = {
      filename: excelFilename,
      content: excelBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    for (let i = 0; i < uniqueAdminEmails.length; i++) {
      const email = uniqueAdminEmails[i];
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
          noShowStudents,
          noShowCount: noShowUsers.length,
        },
        [excelAttachment]
      );

      // Update progress for each email queued
      const emailProgress =
        60 + Math.round(((i + 1) / uniqueAdminEmails.length) * 30);
      await onProgress?.(
        "emails",
        emailProgress,
        `Queued ${i + 1} of ${uniqueAdminEmails.length} emails`
      );
    }

    await onProgress?.("processing", 90, "Processing email queue...");

    // Process email queue
    await processEmailQueue();

    await onProgress?.("done", 100, "Complete!");

    await cache.invalidatePattern("sessions:*");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/dashboard/sessions/${id}`);

    return {
      success: true,
      session,
      reportData: {
        excelBase64: excelBuffer,
        filename: excelFilename,
        stats: {
          totalStudents,
          presentCount,
          lateCount,
          absentCount,
          noShowCount: noShowUsers.length,
          attendanceRate,
        },
      },
    };
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

export async function getRecentlyEndedSessions() {
  try {
    const currentUser = await requirePermission("sessions", "read");
    const role = currentUser.role;

    // Get sessions ended in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let where: any = {
      isActive: false,
      endedAt: { gte: twentyFourHoursAgo },
    };

    if (role !== "SUPERADMIN") {
      if (["ADMIN", "MANAGER", "JANAB", "ATTENDANCE_INCHARGE"].includes(role)) {
        // Get assigned sabaqs
        const assignedSabaqs = await prisma.sabaqAdmin.findMany({
          where: { userId: currentUser.id },
          select: { sabaqId: true },
        });
        const assignedSabaqIds = assignedSabaqs.map((sa) => sa.sabaqId);
        where = {
          isActive: false,
          endedAt: { gte: twentyFourHoursAgo },
          sabaq: {
            OR: [{ id: { in: assignedSabaqIds } }, { janabId: currentUser.id }],
          },
        };
      } else {
        // MUMIN - get enrolled sabaqs
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: currentUser.id, status: "APPROVED" },
          select: { sabaqId: true },
        });
        const enrolledSabaqIds = enrollments.map((e) => e.sabaqId);
        where = {
          isActive: false,
          endedAt: { gte: twentyFourHoursAgo },
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
              },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { endedAt: "desc" },
      take: 3, // Only get the 3 most recent
    });

    return { success: true, sessions };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch recently ended sessions",
    };
  }
}
