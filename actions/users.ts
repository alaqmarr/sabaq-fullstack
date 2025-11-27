"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { queueEmail, processEmailQueue } from "./email-queue";

export async function lookupUserByITS(itsNumber: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const role = session.user.role;
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "MANAGER",
      "ATTENDANCE_INCHARGE",
      "JANAB",
    ];

    if (!allowedRoles.includes(role as string)) {
      return { success: false, error: "Insufficient permissions" };
    }

    const user = await prisma.user.findUnique({
      where: { itsNumber },
      select: {
        id: true,
        name: true,
        itsNumber: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to lookup user" };
  }
}

export async function getUsers() {
  try {
    await requirePermission("users", "read");
    const users = await prisma.user.findMany({
      include: {
        assignedSabaqs: {
          include: {
            sabaq: {
              select: { name: true },
            },
          },
        },
        managedSabaqs: {
          select: { name: true },
        },
      },
    });

    // Define role priority (lower number = higher priority)
    const rolePriority: Record<string, number> = {
      SUPERADMIN: 0,
      ADMIN: 1,
      MANAGER: 2,
      JANAB: 3,
      ATTENDANCE_INCHARGE: 4,
      MUMIN: 5,
    };

    // Sort users
    const sortedUsers = users.sort((a, b) => {
      const roleA = rolePriority[a.role] ?? 99;
      const roleB = rolePriority[b.role] ?? 99;

      if (roleA !== roleB) {
        return roleA - roleB;
      }

      // If roles are same, sort by name
      return (a.name || "").localeCompare(b.name || "");
    });

    return { success: true, users: sortedUsers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function promoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "update");

    // Only Superadmin and Admin can promote
    if (!["SUPERADMIN", "ADMIN"].includes(currentUser.role)) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Role hierarchy: MUMIN -> ATTENDANCE_INCHARGE -> MANAGER -> ADMIN -> SUPERADMIN
    // JANAB is skipped as it must be set explicitly
    const roleHierarchy: Role[] = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];

    if (user.role === "JANAB") {
      throw new Error(
        "Janab role cannot be changed via quick actions. Use edit instead."
      );
    }

    const currentIndex = roleHierarchy.indexOf(user.role);
    if (currentIndex === -1 || currentIndex === roleHierarchy.length - 1) {
      return { success: false, error: "Cannot promote further" };
    }

    const newRole = roleHierarchy[currentIndex + 1];

    // Prevent Admin from promoting to Superadmin unless they are Superadmin
    if (newRole === "SUPERADMIN" && currentUser.role !== "SUPERADMIN") {
      throw new Error("Only Superadmins can promote to Superadmin");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return { success: true, newRole };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function demoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "update");

    // Only Superadmin and Admin can demote
    if (!["SUPERADMIN", "ADMIN"].includes(currentUser.role)) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Role hierarchy: MUMIN -> ATTENDANCE_INCHARGE -> MANAGER -> ADMIN -> SUPERADMIN
    const roleHierarchy: Role[] = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];

    if (user.role === "JANAB") {
      throw new Error(
        "Janab role cannot be changed via quick actions. Use edit instead."
      );
    }

    const currentIndex = roleHierarchy.indexOf(user.role);
    if (currentIndex === -1 || currentIndex === 0) {
      return { success: false, error: "Cannot demote further" };
    }

    const newRole = roleHierarchy[currentIndex - 1];

    // Prevent Admin from demoting Superadmin
    if (user.role === "SUPERADMIN" && currentUser.role !== "SUPERADMIN") {
      throw new Error("Only Superadmins can demote Superadmins");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return { success: true, newRole };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUser(data: any) {
  try {
    await requirePermission("users", "create");

    const existingUser = await prisma.user.findUnique({
      where: { itsNumber: data.itsNumber },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this ITS number already exists",
      };
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        id: data.itsNumber,
        ...data,
        password: hashedPassword,
      },
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    await requirePermission("users", "update");

    // Fetch current user to check for role change
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, name: true },
    });

    if (data.password) {
      data.password = await hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Check if role changed
    if (currentUser && data.role && data.role !== currentUser.role) {
      if (currentUser.email) {
        await queueEmail(currentUser.email, "Role Updated", "role-updated", {
          userName: currentUser.name,
          newRole: data.role,
        });
        // Trigger processing immediately
        void processEmailQueue();
      }
    }

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkCreateUsers(users: any[]) {
  try {
    await requirePermission("users", "create");

    let createdCount = 0;
    let errors: string[] = [];

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { itsNumber: userData.itsNumber },
        });

        if (existingUser) {
          errors.push(`User with ITS ${userData.itsNumber} already exists`);
          continue;
        }

        const hashedPassword = await hash(
          userData.password || userData.itsNumber,
          10
        );

        await prisma.user.create({
          data: {
            id: userData.itsNumber,
            name: userData.name,
            itsNumber: userData.itsNumber,
            email: userData.email,
            role: userData.role || "MUMIN",
            password: hashedPassword,
          },
        });
        createdCount++;
      } catch (error: any) {
        errors.push(`Failed to create user ${userData.name}: ${error.message}`);
      }
    }

    return {
      success: true,
      count: createdCount,
      skipped: errors.length,
      message: `Created ${createdCount} users, skipped ${errors.length}`,
      errors,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUser = session.user;

    const isSelf = currentUser.id === userId;
    const canViewOthers = [
      "SUPERADMIN",
      "ADMIN",
      "MANAGER",
      "ATTENDANCE_INCHARGE",
    ].includes(currentUser.role as string);

    if (!isSelf && !canViewOthers) {
      return {
        success: false,
        error: "You are not authorized to view this profile",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        itsNumber: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Fetch Enrollments with Sabaq details
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, status: "APPROVED" },
      include: {
        sabaq: {
          select: {
            id: true,
            name: true,
            kitaab: true,
            level: true,
            janab: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Calculate Attendance Stats for each enrolled Sabaq
    const sabaqStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const sabaqId = enrollment.sabaqId;

        // 1. Get all "countable" sessions for this sabaq (ended or past cutoff)
        const totalSessions = await prisma.session.count({
          where: {
            sabaqId: sabaqId,
            OR: [
              { endedAt: { not: null } },
              { cutoffTime: { lt: new Date() } },
            ],
          },
        });

        // 2. Get user's attendance records for this sabaq
        const attendances = await prisma.attendance.findMany({
          where: {
            userId: user.id,
            session: { sabaqId: sabaqId },
          },
          select: { isLate: true },
        });

        const present = attendances.filter((a) => !a.isLate).length;
        const late = attendances.filter((a) => a.isLate).length;
        const totalAttended = present + late;

        const absent = Math.max(0, totalSessions - totalAttended);

        const percentage =
          totalSessions > 0
            ? Math.round((totalAttended / totalSessions) * 100)
            : 0;

        return {
          sabaq: enrollment.sabaq,
          stats: {
            totalSessions,
            present,
            late,
            absent,
            percentage,
          },
        };
      })
    );

    // Fetch Recent Activity (Last 10 attendance records)
    const recentActivity = await prisma.attendance.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { markedAt: "desc" },
      include: {
        session: {
          select: {
            sabaq: { select: { name: true } },
          },
        },
      },
    });

    return {
      success: true,
      profile: {
        user,
        sabaqStats,
        recentActivity,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch user profile",
    };
  }
}
