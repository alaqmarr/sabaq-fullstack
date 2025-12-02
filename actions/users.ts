"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { queueEmail, processEmailQueue } from "./email-queue";
import { sendEmail } from "@/lib/email";
import {
  profileUpdatedTemplate,
  rolePromotedTemplate,
  roleDemotedTemplate,
} from "@/lib/email-templates";

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

import { cache } from "@/lib/cache";

export async function getUsers(
  page: number = 1,
  limit: number = 20,
  query: string = ""
) {
  try {
    await requirePermission("users", "read");

    const cacheKey = `users:page:${page}:limit:${limit}:query:${query}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Fetch minimal data for sorting and filtering
    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { itsNumber: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const allUsers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        role: true,
        name: true,
      },
    });

    // 2. Define role priority (lower number = higher priority)
    const rolePriority: Record<string, number> = {
      SUPERADMIN: 0,
      ADMIN: 1,
      MANAGER: 2,
      JANAB: 3,
      ATTENDANCE_INCHARGE: 4,
      MUMIN: 5,
    };

    // 3. Sort all users
    const sortedAllUsers = allUsers.sort((a, b) => {
      const roleA = rolePriority[a.role] ?? 99;
      const roleB = rolePriority[b.role] ?? 99;

      if (roleA !== roleB) {
        return roleA - roleB;
      }

      // If roles are same, sort by name
      return (a.name || "").localeCompare(b.name || "");
    });

    // 4. Slice for pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = sortedAllUsers.slice(startIndex, startIndex + limit);
    const paginatedIds = paginatedUsers.map((u) => u.id);

    // 5. Fetch full details for the current page
    const users = await prisma.user.findMany({
      where: {
        id: { in: paginatedIds },
      },
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

    // 6. Re-sort the fetched users to match the sliced order (since 'in' query doesn't guarantee order)
    const sortedUsers = users.sort((a, b) => {
      return paginatedIds.indexOf(a.id) - paginatedIds.indexOf(b.id);
    });

    const result = {
      success: true,
      users: sortedUsers,
      total: allUsers.length,
      page,
      limit,
      hasMore: startIndex + limit < allUsers.length,
    };

    // Cache for 1 hour (3600 seconds)
    await cache.set(cacheKey, result, 3600);

    return result;
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
      return { success: false, error: "User already exists" };
    }

    const hashedPassword = await hash(data.password || data.itsNumber, 10);

    const newUser = await prisma.user.create({
      data: {
        id: data.itsNumber,
        name: data.name,
        itsNumber: data.itsNumber,
        email: data.email,
        phone: data.phone ? normalizePhone(data.phone) : undefined,
        role: data.role || "MUMIN",
        password: hashedPassword,
      },
    });

    await cache.invalidatePattern("users:*");
    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user" };
  }
}

export async function promoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "promote");

    // Prevent promoting self
    if (currentUser.id === userId) {
      return { success: false, error: "Cannot promote yourself" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    const roleHierarchy = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];
    const currentIndex = roleHierarchy.indexOf(user.role);

    if (currentIndex === -1 || currentIndex === roleHierarchy.length - 1) {
      return { success: false, error: "Cannot promote further" };
    }

    const newRole = roleHierarchy[currentIndex + 1];

    // Only SUPERADMIN can promote to ADMIN/MANAGER
    if (
      ["ADMIN", "MANAGER"].includes(newRole) &&
      currentUser.role !== "SUPERADMIN"
    ) {
      return {
        success: false,
        error: "Insufficient permissions to promote to this level",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
    });

    // Send email notification
    if (updatedUser.email) {
      const emailHtml = rolePromotedTemplate({
        userName: updatedUser.name || "User",
        newRole: newRole,
        features: [
          "Access to new dashboard features",
          "Ability to manage more resources",
        ],
      });
      await sendEmail(updatedUser.email, "Role Promoted", emailHtml);
    }

    await cache.invalidatePattern("users:*");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to promote user" };
  }
}

export async function demoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "demote");

    // Prevent demoting self
    if (currentUser.id === userId) {
      return { success: false, error: "Cannot demote yourself" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    const roleHierarchy = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];
    const currentIndex = roleHierarchy.indexOf(user.role);

    if (currentIndex <= 0) {
      return { success: false, error: "Cannot demote further" };
    }

    const newRole = roleHierarchy[currentIndex - 1];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
    });

    // Send email notification
    if (updatedUser.email) {
      const emailHtml = roleDemotedTemplate({
        userName: updatedUser.name || "User",
        newRole: newRole,
        lostAccess: [
          "Access to advanced dashboard features",
          "Ability to manage resources",
        ],
      });
      await sendEmail(updatedUser.email, "Role Demoted", emailHtml);
    }

    await cache.invalidatePattern("users:*");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to demote user" };
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUser = session.user;
    const isSelf = currentUser.id === userId;
    const isAdmin = ["SUPERADMIN", "ADMIN", "MANAGER"].includes(
      currentUser.role as string
    );

    if (!isSelf && !isAdmin) {
      return { success: false, error: "Insufficient permissions" };
    }

    // If updating password, hash it
    if (data.password) {
      data.password = await hash(data.password, 10);
    }

    // Prevent non-admins from changing roles
    if (data.role && !isAdmin) {
      delete data.role;
    }

    await prisma.user.update({
      where: { id: userId },
      data: data,
    });

    await cache.invalidatePattern("users:*");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user" };
  }
}

export async function bulkCreateUsers(users: any[]) {
  try {
    await requirePermission("users", "create");

    let createdCount = 0;
    let errors: { its: string; name: string; error: string }[] = [];

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { itsNumber: userData.itsNumber },
        });

        if (existingUser) {
          errors.push({
            its: userData.itsNumber,
            name: userData.name,
            error: `User with ITS ${userData.itsNumber} already exists`,
          });
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
            phone: userData.phone ? normalizePhone(userData.phone) : undefined,
            role: userData.role || "MUMIN",
            password: hashedPassword,
          },
        });
        createdCount++;
      } catch (error: any) {
        errors.push({
          its: userData.itsNumber,
          name: userData.name,
          error: error.message || "Unknown error",
        });
      }
    }

    if (createdCount > 0) {
      await cache.invalidatePattern("users:*");
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

function normalizePhone(phone: string): string {
  let p = phone.trim();
  const hasPlus = p.startsWith("+");
  const digits = p.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (!hasPlus) {
    return `+${p}`;
  }
  return p;
}

export async function bulkUpdateUsers(users: any[]) {
  try {
    await requirePermission("users", "update");

    let updatedCount = 0;
    let errors: { its: string; name: string; error: string }[] = [];

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { itsNumber: userData.itsNumber },
        });

        if (!existingUser) {
          errors.push({
            its: userData.itsNumber,
            name: userData.name || "Unknown",
            error: `User with ITS ${userData.itsNumber} not found`,
          });
          continue;
        }

        const dataToUpdate: any = {};
        if (userData.name) dataToUpdate.name = userData.name;
        if (userData.email) dataToUpdate.email = userData.email;
        if (userData.phone) dataToUpdate.phone = normalizePhone(userData.phone);
        if (userData.role) dataToUpdate.role = userData.role;
        if (userData.password) {
          dataToUpdate.password = await hash(userData.password, 10);
        }

        await prisma.user.update({
          where: { id: userData.itsNumber },
          data: dataToUpdate,
        });
        updatedCount++;
      } catch (error: any) {
        errors.push({
          its: userData.itsNumber,
          name: userData.name || "Unknown",
          error: error.message || "Unknown error",
        });
      }
    }

    if (updatedCount > 0) {
      await cache.invalidatePattern("users:*");
    }

    return {
      success: true,
      count: updatedCount,
      skipped: errors.length,
      message: `Updated ${updatedCount} users, skipped ${errors.length}`,
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
        const [totalAttended, late] = await Promise.all([
          prisma.attendance.count({
            where: {
              userId: user.id,
              session: { sabaqId: sabaqId },
            },
          }),
          prisma.attendance.count({
            where: {
              userId: user.id,
              session: { sabaqId: sabaqId },
              isLate: true,
            },
          }),
        ]);

        const present = totalAttended - late;

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

export async function updateUserProfile(
  userId: string,
  data: { phone?: string; email?: string; otp?: string }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only allow users to update their own profile unless they are admins
    const isSelf = session.user.id === userId;
    const isAdmin = ["SUPERADMIN", "ADMIN"].includes(
      session.user.role as string
    );

    if (!isSelf && !isAdmin) {
      return {
        success: false,
        error: "You are not authorized to update this profile",
      };
    }

    // If updating self and changing sensitive fields, require OTP
    if (isSelf && (data.phone || data.email)) {
      if (!data.otp) {
        return {
          success: false,
          error: "OTP is required for security verification",
        };
      }

      // Verify OTP
      const otpRecord = await prisma.adminOTP.findFirst({
        where: {
          userId: session.user.id,
          code: data.otp,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        return { success: false, error: "Invalid or expired OTP" };
      }

      // Delete used OTP
      await prisma.adminOTP.delete({ where: { id: otpRecord.id } });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: data.phone,
        email: data.email,
      },
    });

    // Send confirmation email if email exists
    if (data.email) {
      const emailHtml = profileUpdatedTemplate({
        userName: session.user.name || "User",
        updatedFields: Object.keys(data).filter(
          (k) => k !== "otp" && data[k as keyof typeof data]
        ),
        time: new Date().toLocaleString(),
      });

      await sendEmail(data.email, "Profile Updated Successfully", emailHtml);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
