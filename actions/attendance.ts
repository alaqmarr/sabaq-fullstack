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
    // Superadmin can always mark
    // Admin/Manager/Attendance_Incharge can mark if active
    // Janab can mark for their sabaq

    const isSuperAdmin = currentUser.role === "SUPERADMIN";
    const isJanab = (sessionData.sabaq as any).janabId === currentUser.id;

    // Check if user is a Sabaq Admin
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

    // Check if session is active (Superadmin, Sabaq Admin, and Janab can bypass)
    const canBypassSessionEnd = isSuperAdmin || isSabaqAdmin || isJanab;

    if (!sessionData.isActive && !canBypassSessionEnd) {
      return { success: false, error: "Session is not active" };
    }

    // Check for duplicate attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Attendance already marked for this user",
      };
    }

    // Calculate lateness
    const markedAt = new Date();
    // Superadmin marking after cutoff shouldn't necessarily be "late" if they are correcting records,
    // but technically it is late relative to schedule.
    // However, if Superadmin is marking, we might want to allow them to override "isLate" status?
    // For now, we'll calculate it standardly, but maybe Superadmin bypasses the "cutoff" restriction for *marking* itself.
    // The requirement says "superadmin can add attendance after cutoff time too".
    // This implies others CANNOT add after cutoff?
    // Usually "cutoff" means "marked as late after this".
    // If it means "cannot mark at all", then we need that check.
    // Current logic: `calculateLateness` just sets a flag. It doesn't block.
    // So Superadmin can mark whenever.

    const { isLate, minutesLate } = calculateLateness(
      markedAt,
      sessionData.cutoffTime
    );

    // Create attendance record with human-readable ID
    const attendanceId = generateAttendanceId(user.itsNumber, sessionId);

    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
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
      }),
      prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          attendedCount: { increment: 1 },
          lateCount: isLate ? { increment: 1 } : undefined,
        },
      }),
    ]);

    // Queue email notification
    if (attendance.user.email) {
      // ... existing imports

      // ... inside markAttendanceManual
      await queueEmail(
        attendance.user.email,
        `Attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: attendance.user.name,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "On Time",
          markedAt: formatDateTime(markedAt),
          sessionDate: formatDate(sessionData.scheduledAt),
          sessionId: sessionId,
        }
      );
      // Trigger processing immediately (fire-and-forget)
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, attendance };
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

    // Check for duplicate attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: currentUser.id,
        },
      },
    });

    if (existing) {
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

    // Create attendance record with human-readable ID
    const attendanceId = generateAttendanceId(currentUser.itsNumber, sessionId);

    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
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
      }),
      prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: currentUser.id },
        data: {
          attendedCount: { increment: 1 },
          lateCount: isLate ? { increment: 1 } : undefined,
        },
      }),
    ]);

    // Queue email notification
    if (attendance.user.email) {
      await queueEmail(
        attendance.user.email,
        `attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: attendance.user.name,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "Present",
          markedAt: formatDateTime(markedAt),
          sessionId: sessionId,
        }
      );
      // Trigger processing immediately (fire-and-forget)
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, attendance, distance };
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

    // Check for duplicate attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: currentUser.id,
        },
      },
    });

    if (existing) {
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

    // Create attendance record with human-readable ID
    const attendanceId = generateAttendanceId(currentUser.itsNumber, sessionId);

    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
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
      }),
      prisma.session.update({
        where: { id: sessionId },
        data: { attendanceCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: currentUser.id },
        data: {
          attendedCount: { increment: 1 },
          lateCount: isLate ? { increment: 1 } : undefined,
        },
      }),
    ]);

    // Queue email notification
    if (attendance.user.email) {
      await queueEmail(
        attendance.user.email,
        `attendance: ${sessionData.sabaq.name}`,
        "attendance-marked",
        {
          userName: attendance.user.name,
          sabaqName: sessionData.sabaq.name,
          status: isLate ? "Late" : "Present",
          markedAt: formatDateTime(markedAt),
          sessionId: sessionId,
        }
      );
      // Trigger processing immediately (fire-and-forget)
      void processEmailQueue();
    }

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, attendance };
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

    const attendance = await prisma.$transaction(async (tx) => {
      const deleted = await tx.attendance.delete({
        where: { id: attendanceId },
      });

      await tx.session.update({
        where: { id: deleted.sessionId },
        data: { attendanceCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: deleted.userId },
        data: {
          attendedCount: { decrement: 1 },
          lateCount: deleted.isLate ? { decrement: 1 } : undefined,
        },
      });

      return deleted;
    });

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
