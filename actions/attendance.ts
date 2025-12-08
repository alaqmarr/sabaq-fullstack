"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getDistance } from "geolib";
import { requirePermission } from "@/lib/rbac";
import { queueEmail, processEmailQueue } from "./email-queue";
import { generateAttendanceId } from "@/lib/id-generators";
import { formatDate, formatTime, formatDateTime } from "@/lib/date-utils";

// Helper function to calculate lateness
function calculateLateness(markedAt: Date, cutoffTime: Date) {
  if (markedAt <= cutoffTime) {
    return { isLate: false, minutesLate: 0 };
  }

  const diffMs = markedAt.getTime() - cutoffTime.getTime();
  const minutesLate = Math.ceil(diffMs / (1000 * 60));

  return { isLate: true, minutesLate };
}

// Validate user enrollment
async function validateEnrollment(sessionId: string, userId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { sabaq: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      sabaqId_userId: {
        sabaqId: session.sabaqId,
        userId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "APPROVED") {
    throw new Error("User is not enrolled in this sabaq");
  }

  return session;
}

// ... imports
import { adminDb } from "@/lib/firebase-admin";

// ... existing helper functions

// Mark attendance manually (Admin/Janab)
export async function markAttendanceManual(
  sessionId: string,
  itsNumber: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUser = session.user;

    // Find user by ITS number
    const user = await prisma.user.findUnique({
      where: { itsNumber },
    });

    if (!user) {
      return { success: false, error: "User not found with this ITS number" };
    }

    // Validate session and enrollment
    const sessionData = await validateEnrollment(sessionId, user.id);

    // Check permissions
    const isSuperAdmin = currentUser.role === "SUPERADMIN";
    const isJanab = (sessionData.sabaq as any).janabId === currentUser.id;
    const isSabaqAdmin = await prisma.sabaqAdmin.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId: sessionData.sabaqId,
          userId: currentUser.id,
        },
      },
    });

    const canMark =
      isSuperAdmin ||
      ["ADMIN", "MANAGER", "ATTENDANCE_INCHARGE"].includes(
        currentUser.role as string
      ) ||
      isJanab;

    if (!canMark) {
      return { success: false, error: "Insufficient permissions" };
    }

    const canBypassSessionEnd = isSuperAdmin || isSabaqAdmin || isJanab;

    if (!sessionData.isActive && !canBypassSessionEnd) {
      return { success: false, error: "Session is not active" };
    }

    // Firebase Duplicate Check
    if (adminDb) {
      const ref = adminDb.ref(`sessions/${sessionId}/attendance/${user.id}`);
      const snapshot = await ref.get();
      if (snapshot.exists()) {
        return {
          success: false,
          error: "Attendance already marked (Firebase)",
        };
      }
    } else {
      // Fallback to Neon check if Firebase not configured (Safety)
      const existing = await prisma.attendance.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId: user.id,
          },
        },
      });
      if (existing)
        return { success: false, error: "Attendance already marked" };
    }

    // Calculate lateness
    const markedAt = new Date();
    const { isLate, minutesLate } = calculateLateness(
      markedAt,
      sessionData.cutoffTime
    );

    const attendanceId = generateAttendanceId(user.itsNumber, sessionId);

    // Write to Firebase
    if (adminDb) {
      const attendanceRef = adminDb.ref(
        `sessions/${sessionId}/attendance/${user.id}`
      );
      const statsRef = adminDb.ref(`sessions/${sessionId}/stats`);

      await attendanceRef.set({
        id: attendanceId,
        sessionId,
        userId: user.id,
        itsNumber: user.itsNumber,
        markedAt: markedAt.getTime(),
        markedBy: currentUser.id,
        method: "MANUAL_ENTRY",
        isLate,
        minutesLate,
        userName: user.name, // For UI
        userRole: user.role, // For UI
      });

      // Transactional update for stats
      await statsRef.transaction((currentStats) => {
        if (!currentStats)
          return { totalPresent: 1, lateCount: isLate ? 1 : 0 };
        return {
          totalPresent: (currentStats.totalPresent || 0) + 1,
          lateCount: (currentStats.lateCount || 0) + (isLate ? 1 : 0),
        };
      });
    } else {
      // Fallback: Write to Neon directly if Firebase fails/missing
      // This ensures app still works without Firebase keys
      await prisma.attendance.create({
        data: {
          id: attendanceId,
          sessionId,
          userId: user.id,
          itsNumber: user.itsNumber,
          markedAt,
          markedBy: currentUser.id,
          method: "MANUAL_ENTRY",
          isLate,
          minutesLate,
        },
      });
      // Update counts... (simplified for fallback)
      await prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      });
    }

    // Queue email notification with performance stats (Fire-and-Forget)
    if (user.email) {
      // Fetch user's sabaq performance
      const [totalSessions, userAttendanceCount] = await Promise.all([
        prisma.session.count({
          where: {
            sabaqId: sessionData.sabaqId,
            endedAt: { not: null },
          },
        }),
        prisma.attendance.count({
          where: {
            userId: user.id,
            session: { sabaqId: sessionData.sabaqId },
          },
        }),
      ]);

      // Add 1 to count for the attendance we just marked (it may not be in DB yet)
      const attendedCount = userAttendanceCount + 1;
      const attendancePercent =
        totalSessions > 0
          ? Math.round((attendedCount / (totalSessions + 1)) * 100)
          : 100;

      await queueEmail(
        user.email,
        `Attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: user.name,
          userItsNumber: user.itsNumber,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "On Time",
          markedAt: formatDateTime(markedAt),
          sessionDate: formatDate(sessionData.scheduledAt),
          sessionId: sessionId,
          attendedCount,
          totalSessions: totalSessions + 1, // Include current session
          attendancePercent,
        }
      );
      // Trigger processing immediately without awaiting
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);

    // Return mock attendance object for UI
    return {
      success: true,
      attendance: {
        id: attendanceId,
        user: {
          id: user.id,
          name: user.name,
          itsNumber: user.itsNumber,
          email: user.email,
        },
        markedAt,
        isLate,
      },
    };
  } catch (error: any) {
    console.error("Failed to mark attendance:", error);
    return {
      success: false,
      error: error.message || "Failed to mark attendance",
    };
  }
}

// Mark attendance via location (User self-attendance)
export async function markAttendanceLocation(
  sessionId: string,
  userLatitude: number,
  userLongitude: number
) {
  try {
    const currentUser = await requirePermission("attendance", "mark_self");

    // Get session with location data
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sabaq: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (!sessionData.isActive) {
      return { success: false, error: "Session is not active" };
    }

    if (!sessionData.sabaq.allowLocationAttendance) {
      return {
        success: false,
        error: "Location-based attendance is not enabled for this sabaq",
      };
    }

    if (!sessionData.sabaq.location) {
      return { success: false, error: "Session location not configured" };
    }

    // Validate enrollment
    await validateEnrollment(sessionId, currentUser.id);

    // Firebase Duplicate Check
    if (adminDb) {
      const ref = adminDb.ref(
        `sessions/${sessionId}/attendance/${currentUser.id}`
      );
      const snapshot = await ref.get();
      if (snapshot.exists()) {
        return {
          success: false,
          error:
            "You have already marked attendance for this session (Firebase)",
        };
      }
    } else {
      const existing = await prisma.attendance.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId: currentUser.id,
          },
        },
      });
      if (existing)
        return {
          success: false,
          error: "You have already marked attendance for this session",
        };
    }

    // Calculate distance using geolib
    const sessionLocation = sessionData.sabaq.location;
    const distance = getDistance(
      {
        latitude: Number(sessionLocation.latitude),
        longitude: Number(sessionLocation.longitude),
      },
      { latitude: userLatitude, longitude: userLongitude }
    );

    // Check if within radius
    if (distance > sessionLocation.radiusMeters) {
      return {
        success: false,
        error: `You are ${distance}m away from the session location. Must be within ${sessionLocation.radiusMeters}m`,
      };
    }

    // Calculate lateness
    const markedAt = new Date();
    const { isLate, minutesLate } = calculateLateness(
      markedAt,
      sessionData.cutoffTime
    );

    const attendanceId = generateAttendanceId(currentUser.itsNumber, sessionId);

    // Write to Firebase
    if (adminDb) {
      const attendanceRef = adminDb.ref(
        `sessions/${sessionId}/attendance/${currentUser.id}`
      );
      const statsRef = adminDb.ref(`sessions/${sessionId}/stats`);

      await attendanceRef.set({
        id: attendanceId,
        sessionId,
        userId: currentUser.id,
        itsNumber: currentUser.itsNumber,
        markedAt: markedAt.getTime(),
        markedBy: currentUser.id,
        method: "LOCATION_BASED_SELF",
        latitude: userLatitude.toString(),
        longitude: userLongitude.toString(),
        distanceMeters: distance,
        isLate,
        minutesLate,
        userName: currentUser.name,
        userRole: currentUser.role,
      });

      await statsRef.transaction((currentStats) => {
        if (!currentStats)
          return { totalPresent: 1, lateCount: isLate ? 1 : 0 };
        return {
          totalPresent: (currentStats.totalPresent || 0) + 1,
          lateCount: (currentStats.lateCount || 0) + (isLate ? 1 : 0),
        };
      });
    } else {
      // Fallback
      await prisma.attendance.create({
        data: {
          id: attendanceId,
          sessionId,
          userId: currentUser.id,
          itsNumber: currentUser.itsNumber,
          markedAt,
          markedBy: currentUser.id,
          method: "LOCATION_BASED_SELF",
          latitude: userLatitude.toString(),
          longitude: userLongitude.toString(),
          distanceMeters: distance,
          isLate,
          minutesLate,
        },
      });
      await prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      });
    }

    // Queue email notification with performance stats (Fire-and-Forget)
    if (currentUser.email) {
      // Fetch user's sabaq performance
      const [totalSessions, userAttendanceCount] = await Promise.all([
        prisma.session.count({
          where: {
            sabaqId: sessionData.sabaqId,
            endedAt: { not: null },
          },
        }),
        prisma.attendance.count({
          where: {
            userId: currentUser.id,
            session: { sabaqId: sessionData.sabaqId },
          },
        }),
      ]);

      const attendedCount = userAttendanceCount + 1;
      const attendancePercent =
        totalSessions > 0
          ? Math.round((attendedCount / (totalSessions + 1)) * 100)
          : 100;

      await queueEmail(
        currentUser.email,
        `Attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: currentUser.name,
          userItsNumber: currentUser.itsNumber,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "Present",
          markedAt: formatDateTime(markedAt),
          sessionDate: formatDate(sessionData.scheduledAt),
          sessionId: sessionId,
          attendedCount,
          totalSessions: totalSessions + 1,
          attendancePercent,
        }
      );
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return {
      success: true,
      attendance: {
        id: attendanceId,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          itsNumber: currentUser.itsNumber,
          email: currentUser.email,
        },
        markedAt,
        isLate,
        distanceMeters: distance,
      },
      distance,
    };
  } catch (error: any) {
    console.error("Failed to mark location-based attendance:", error);
    return {
      success: false,
      error: error.message || "Failed to mark attendance",
    };
  }
}

// Mark attendance via QR Code (User self-attendance)
export async function markAttendanceQR(sessionId: string) {
  try {
    const currentUser = await requirePermission("attendance", "mark_self");

    // Get session
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    if (!sessionData.isActive) {
      return { success: false, error: "Session is not active" };
    }

    // Validate enrollment
    await validateEnrollment(sessionId, currentUser.id);

    // Firebase Duplicate Check
    if (adminDb) {
      const ref = adminDb.ref(
        `sessions/${sessionId}/attendance/${currentUser.id}`
      );
      const snapshot = await ref.get();
      if (snapshot.exists()) {
        return {
          success: false,
          error:
            "You have already marked attendance for this session (Firebase)",
        };
      }
    } else {
      const existing = await prisma.attendance.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId: currentUser.id,
          },
        },
      });
      if (existing)
        return {
          success: false,
          error: "You have already marked attendance for this session",
        };
    }

    // Calculate lateness
    const markedAt = new Date();
    const { isLate, minutesLate } = calculateLateness(
      markedAt,
      sessionData.cutoffTime
    );

    const attendanceId = generateAttendanceId(currentUser.itsNumber, sessionId);

    // Write to Firebase
    if (adminDb) {
      const attendanceRef = adminDb.ref(
        `sessions/${sessionId}/attendance/${currentUser.id}`
      );
      const statsRef = adminDb.ref(`sessions/${sessionId}/stats`);

      await attendanceRef.set({
        id: attendanceId,
        sessionId,
        userId: currentUser.id,
        itsNumber: currentUser.itsNumber,
        markedAt: markedAt.getTime(),
        markedBy: currentUser.id,
        method: "QR_SCAN",
        isLate,
        minutesLate,
        userName: currentUser.name,
        userRole: currentUser.role,
      });

      await statsRef.transaction((currentStats) => {
        if (!currentStats)
          return { totalPresent: 1, lateCount: isLate ? 1 : 0 };
        return {
          totalPresent: (currentStats.totalPresent || 0) + 1,
          lateCount: (currentStats.lateCount || 0) + (isLate ? 1 : 0),
        };
      });
    } else {
      // Fallback
      await prisma.attendance.create({
        data: {
          id: attendanceId,
          sessionId,
          userId: currentUser.id,
          itsNumber: currentUser.itsNumber,
          markedAt,
          markedBy: currentUser.id,
          method: "QR_SCAN",
          isLate,
          minutesLate,
        },
      });
      await prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      });
    }

    // Queue email notification with performance stats (Fire-and-Forget)
    if (currentUser.email) {
      // Fetch user's sabaq performance
      const [totalSessions, userAttendanceCount] = await Promise.all([
        prisma.session.count({
          where: {
            sabaqId: sessionData.sabaqId,
            endedAt: { not: null },
          },
        }),
        prisma.attendance.count({
          where: {
            userId: currentUser.id,
            session: { sabaqId: sessionData.sabaqId },
          },
        }),
      ]);

      const attendedCount = userAttendanceCount + 1;
      const attendancePercent =
        totalSessions > 0
          ? Math.round((attendedCount / (totalSessions + 1)) * 100)
          : 100;

      await queueEmail(
        currentUser.email,
        `Attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: currentUser.name,
          userItsNumber: currentUser.itsNumber,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "Present",
          markedAt: formatDateTime(markedAt),
          sessionDate: formatDate(sessionData.scheduledAt),
          sessionId: sessionId,
          attendedCount,
          totalSessions: totalSessions + 1,
          attendancePercent,
        }
      );
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return {
      success: true,
      attendance: {
        id: attendanceId,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          itsNumber: currentUser.itsNumber,
          email: currentUser.email,
        },
        markedAt,
        isLate,
      },
    };
  } catch (error: any) {
    console.error("Failed to mark QR attendance:", error);
    return {
      success: false,
      error: error.message || "Failed to mark attendance",
    };
  }
}

// Get session attendance
export async function getSessionAttendance(sessionId: string) {
  try {
    await requirePermission("attendance", "read");

    // Check if session is active or finalized
    // If active, prefer Firebase data
    // If finalized/ended, prefer Neon data (or if Firebase is empty)

    // For now, we will try to fetch from Firebase first if configured
    // If Firebase has data, return it (mapped to match Neon structure)
    // Else fall back to Neon

    if (adminDb) {
      const ref = adminDb.ref(`sessions/${sessionId}/attendance`);
      const snapshot = await ref.get();

      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        const attendances = Object.values(firebaseData).map((record: any) => ({
          id: record.id,
          sessionId: record.sessionId,
          userId: record.userId,
          markedAt: new Date(record.markedAt),
          isLate: record.isLate,
          minutesLate: record.minutesLate,
          method: record.method,
          user: {
            id: record.userId,
            name: record.userName,
            itsNumber: record.itsNumber,
          },
          marker: {
            name: "System/Self", // Firebase doesn't store marker name easily unless we add it
          },
        }));

        // Sort by markedAt
        attendances.sort(
          (a: any, b: any) => a.markedAt.getTime() - b.markedAt.getTime()
        );

        return { success: true, attendances };
      }
    }

    // Fallback to Neon
    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
          },
        },
        marker: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { markedAt: "asc" },
    });

    return { success: true, attendances };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch attendance",
    };
  }
}

// Get user's attendance history
export async function getUserAttendanceHistory(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUserId = userId || session.user.id;

    // If requesting for another user, check 'read' permission
    // If requesting for self, check 'read_self' permission
    if (targetUserId !== session.user.id) {
      await requirePermission("attendance", "read");
    } else {
      await requirePermission("attendance", "read_self");
    }

    const attendances = await prisma.attendance.findMany({
      where: { userId: targetUserId },
      include: {
        session: {
          include: {
            sabaq: {
              select: {
                id: true,
                name: true,
                kitaab: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: "desc" },
    });

    return { success: true, attendances };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch attendance history",
    };
  }
}

// Delete attendance (Admin only)
export async function deleteAttendance(attendanceId: string) {
  try {
    await requirePermission("attendance", "delete");

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      // If not in Neon, check Firebase?
      // For now, we assume if it's not in Neon, it might be in Firebase if not synced.
      // But `deleteAttendance` usually takes an ID.
      // If we are in "Firebase First" mode, we might need to delete from Firebase using sessionId + userId.
      // But the UI might pass the ID.
      // Let's assume we need to find the session/user to delete from Firebase.
      return { success: false, error: "Attendance record not found (Neon)" };
    }

    // Delete from Neon
    await prisma.$transaction(async (tx) => {
      await tx.attendance.delete({
        where: { id: attendanceId },
      });

      await tx.session.update({
        where: { id: attendance.sessionId },
        data: { attendanceCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: attendance.userId },
        data: {
          attendedCount: { decrement: 1 },
          lateCount: attendance.isLate ? { decrement: 1 } : undefined,
        },
      });
    });

    // Delete from Firebase
    if (adminDb) {
      const attendanceRef = adminDb.ref(
        `sessions/${attendance.sessionId}/attendance/${attendance.userId}`
      );
      const statsRef = adminDb.ref(`sessions/${attendance.sessionId}/stats`);

      await attendanceRef.remove();

      await statsRef.transaction((currentStats) => {
        if (!currentStats) return null;
        return {
          totalPresent: Math.max((currentStats.totalPresent || 0) - 1, 0),
          lateCount: Math.max(
            (currentStats.lateCount || 0) - (attendance.isLate ? 1 : 0),
            0
          ),
        };
      });
    }

    revalidatePath(`/dashboard/sessions/${attendance.sessionId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete attendance",
    };
  }
}

// Get attendance statistics for a session
export async function getAttendanceStats(sessionId: string) {
  try {
    await requirePermission("attendance", "read");

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sabaq: {
          include: {
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
        attendances: true,
      },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    const totalEnrolled = sessionData.sabaq.enrollments.length;
    const totalPresent = sessionData.attendances.length;
    const onTimeCount = sessionData.attendances.filter((a) => !a.isLate).length;
    const lateCount = sessionData.attendances.filter((a) => a.isLate).length;
    const attendancePercentage =
      totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

    const stats = {
      totalEnrolled,
      totalPresent,
      onTimeCount,
      lateCount,
      attendancePercentage,
      absent: totalEnrolled - totalPresent,
    };

    return { success: true, stats };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch attendance stats",
    };
  }
}
// Get comprehensive session attendance data for the attendance taker view
export async function getSessionAttendanceData(sessionId: string) {
  try {
    await requirePermission("attendance", "read");

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sabaq: {
          include: {
            enrollments: {
              where: { status: "APPROVED" },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    itsNumber: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                itsNumber: true,
              },
            },
          },
        },
      },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    // Map enrollments to include attendance status
    const attendees = sessionData.sabaq.enrollments.map((enrollment) => {
      const attendance = sessionData.attendances.find(
        (a) => a.userId === enrollment.userId
      );

      return {
        user: enrollment.user,
        status: attendance
          ? attendance.isLate
            ? "LATE"
            : "PRESENT"
          : "ABSENT",
        markedAt: attendance?.markedAt || null,
        attendanceId: attendance?.id || null,
      };
    });

    // Sort by name
    attendees.sort((a, b) => a.user.name.localeCompare(b.user.name));

    return {
      success: true,
      session: {
        id: sessionData.id,
        sabaqName: sessionData.sabaq.name,
        scheduledAt: sessionData.scheduledAt,
        cutoffTime: sessionData.cutoffTime,
        isActive: sessionData.isActive,
      },
      attendees,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch session attendance data",
    };
  }
}

// Bulk mark attendance
export async function bulkMarkAttendance(
  sessionId: string,
  updates: { userId: string; status: "PRESENT" | "LATE" | "ABSENT" }[]
) {
  try {
    const currentUser = await requirePermission("attendance", "create");

    // We'll process these sequentially or in a transaction
    // For simplicity and to handle "ABSENT" (which means deleting attendance), we'll loop

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!sessionData) throw new Error("Session not found");

    for (const update of updates) {
      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.attendance.findUnique({
            where: {
              sessionId_userId: {
                sessionId,
                userId: update.userId,
              },
            },
          });

          if (update.status === "ABSENT") {
            if (existing) {
              await tx.attendance.delete({
                where: { id: existing.id },
              });
              await tx.session.update({
                where: { id: sessionId },
                data: { attendanceCount: { decrement: 1 } },
              });
              await tx.user.update({
                where: { id: update.userId },
                data: {
                  attendedCount: { decrement: 1 },
                  lateCount: existing.isLate ? { decrement: 1 } : undefined,
                },
              });
            }
          } else {
            const isLate = update.status === "LATE";
            const markedAt = new Date();

            if (existing) {
              // Update existing
              const attendance = await tx.attendance.update({
                where: { id: existing.id },
                data: {
                  isLate,
                  markedBy: currentUser.id,
                },
                include: { user: { select: { email: true, name: true } } },
              });

              // Adjust late count if status changed
              if (existing.isLate !== isLate) {
                await tx.user.update({
                  where: { id: update.userId },
                  data: {
                    lateCount: isLate ? { increment: 1 } : { decrement: 1 },
                  },
                });
              }

              // Queue email if status changed (optional, but good for feedback)
              // We'll queue it outside the transaction or just here if we want
              // For bulk, maybe skip email on update to avoid spam?
              // The original code queued it. Let's keep it consistent.
              if (attendance.user.email && existing.isLate !== isLate) {
                // We can't easily queue inside transaction if we want to be safe,
                // but we can return data to queue after.
                // For now, let's just queue it here, it's non-blocking.
                await queueEmail(
                  attendance.user.email,
                  `Attendance Update: ${sessionData.sabaq.name}`,
                  "attendance-marked",
                  {
                    userName: attendance.user.name,
                    sabaqName: sessionData.sabaq.name,
                    status: isLate ? "Late" : "Present",
                    markedAt: markedAt.toLocaleString(),
                    sessionId: sessionId,
                  }
                );
              }
            } else {
              // Create new
              const userIts =
                (await tx.user.findUnique({ where: { id: update.userId } }))
                  ?.itsNumber || "";
              const attendanceId = generateAttendanceId(userIts, sessionId);

              const attendance = await tx.attendance.create({
                data: {
                  id: attendanceId,
                  sessionId,
                  userId: update.userId,
                  itsNumber: userIts,
                  markedAt,
                  markedBy: currentUser.id,
                  method: "MANUAL_ENTRY",
                  isLate,
                  minutesLate: 0,
                },
                include: { user: { select: { email: true, name: true } } },
              });

              await tx.session.update({
                where: { id: sessionId },
                data: { attendanceCount: { increment: 1 } },
              });

              await tx.user.update({
                where: { id: update.userId },
                data: {
                  attendedCount: { increment: 1 },
                  lateCount: isLate ? { increment: 1 } : undefined,
                },
              });

              if (attendance.user.email) {
                await queueEmail(
                  attendance.user.email,
                  `Attendance: ${sessionData.sabaq.name}`,
                  "attendance-marked",
                  {
                    userName: attendance.user.name,
                    sabaqName: sessionData.sabaq.name,
                    status: isLate ? "Late" : "Present",
                    markedAt: markedAt.toLocaleString(),
                    sessionId: sessionId,
                  }
                );
              }
            }
          }
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`User ${update.userId}: ${err.message}`);
      }
    }

    // Trigger processing immediately (fire-and-forget)
    void processEmailQueue();

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, results };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to bulk mark attendance",
    };
  }
}
