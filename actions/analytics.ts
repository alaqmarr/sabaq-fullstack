"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [
      totalUsers,
      activeSabaqs,
      totalEnrollments,
      totalSessions,
      pendingQuestions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "MUMIN" } }),
      prisma.sabaq.count(),
      prisma.enrollment.count({ where: { status: "APPROVED" } }),
      prisma.session.count(),
      prisma.question.count({ where: { isAnswered: false } }),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        activeSabaqs,
        totalEnrollments,
        totalSessions,
        pendingQuestions,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function getAttendanceTrends() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get last 10 sessions with attendance breakdown
    const sessions = await prisma.session.findMany({
      take: 10,
      orderBy: { scheduledAt: "desc" },
      include: {
        attendances: {
          select: { isLate: true },
        },
      },
    });

    const data = sessions.reverse().map((s) => {
      const present = s.attendances.filter((a) => !a.isLate).length;
      const late = s.attendances.filter((a) => a.isLate).length;

      return {
        date: s.scheduledAt.toLocaleDateString(),
        present,
        late,
      };
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Failed to fetch attendance trends" };
  }
}

export async function getEnrollmentDistribution() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const enrollments = await prisma.enrollment.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const data = enrollments.map((e) => ({
      name: e.status,
      value: e._count._all,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Failed to fetch enrollment distribution" };
  }
}

export async function getTopStudents() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get sessions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await prisma.session.findMany({
      where: {
        scheduledAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);
    const totalSessions = sessionIds.length;

    if (totalSessions === 0) {
      return { success: true, data: [] };
    }

    // Count attendance per user
    // Note: Attendance existence implies presence (either on time or late)
    const attendanceCounts = await prisma.attendance.groupBy({
      by: ["userId"],
      where: {
        sessionId: { in: sessionIds },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 5,
    });

    // Fetch user details
    const topUserIds = attendanceCounts.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, itsNumber: true },
    });

    const data = attendanceCounts
      .map((a) => {
        const user = users.find((u) => u.id === a.userId);
        const attendedCount = a._count._all;
        return {
          id: a.userId,
          name: user?.name || "Unknown",
          its: user?.itsNumber || "",
          attended: attendedCount,
          totalSessions,
          attendancePercentage: Math.round(
            (attendedCount / totalSessions) * 100
          ),
        };
      })
      .sort((a, b) => b.attended - a.attended);

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching top students:", error);
    return { success: false, error: "Failed to fetch top students" };
  }
}

export async function getSabaqPerformance() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all active sabaqs
    const sabaqs = await prisma.sabaq.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          where: { status: "APPROVED" },
        },
        sessions: {
          take: 5, // Last 5 sessions per sabaq for "recent" performance
          orderBy: { scheduledAt: "desc" },
          include: {
            attendances: true, // Just count existence
          },
        },
      },
    });

    const data = sabaqs
      .map((sabaq) => {
        const totalStudents = sabaq.enrollments.length;
        if (totalStudents === 0) return null;

        let totalPossibleAttendance = 0;
        let totalActualAttendance = 0;

        sabaq.sessions.forEach((session) => {
          totalPossibleAttendance += totalStudents;
          totalActualAttendance += session.attendances.length;
        });

        const attendanceRate =
          totalPossibleAttendance > 0
            ? Math.round(
                (totalActualAttendance / totalPossibleAttendance) * 100
              )
            : 0;

        return {
          name: sabaq.name,
          attendanceRate,
          totalStudents,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10);

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching sabaq performance:", error);
    return { success: false, error: "Failed to fetch sabaq performance" };
  }
}
