"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { auth } from "@/auth";
import { Role, Gender } from "@/app/prisma/client";
import { hash } from "bcryptjs";
import { queueEmail, processEmailQueue } from "./email-queue";
import { waitUntil } from "@vercel/functions";
import {
  profileUpdatedTemplate,
  rolePromotedTemplate,
  roleDemotedTemplate,
} from "@/lib/email-templates";

export async function lookupUserByITS(itsNumber: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "You do not have permission to perform this action.",
      };
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
      return {
        success: false,
        error: "You do not have the necessary permissions.",
      };
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
      return {
        success: false,
        error: "The requested user could not be found.",
      };
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

    // 0. Prepare filter
    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { itsNumber: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    // 1. Get total count and counts by role
    const [total, roleCountsResult] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["role"],
        where,
        _count: { _all: true },
        orderBy: { role: "asc" },
      }),
    ]);

    // 2. Define role priority
    const roleOrder: Role[] = [
      "SUPERADMIN",
      "ADMIN",
      "MANAGER",
      "JANAB",
      "ATTENDANCE_INCHARGE",
      "MUMIN",
    ];

    // Map DB counts to order
    const roleCountsMap = new Map(
      roleCountsResult.map((c: any) => [c.role, c._count._all])
    );

    let skip = (page - 1) * limit;
    let take = limit;
    const fetchedUsers: any[] = [];

    // 3. Iterate through roles and fetch simple slices
    for (const role of roleOrder) {
      if (take <= 0) break;

      const count = roleCountsMap.get(role) || 0;
      if (count === 0) continue;

      if (skip >= count) {
        // Skip this entire group
        skip -= count;
      } else {
        // Fetch from this group
        const toFetch = Math.min(take, count - skip);

        const roleUsers = await prisma.user.findMany({
          where: { ...where, role },
          orderBy: { name: "asc" },
          skip: skip,
          take: toFetch,
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

        fetchedUsers.push(...roleUsers);
        take -= roleUsers.length;
        skip = 0; // Exhausted global skip
      }
    }

    const result = {
      success: true,
      users: fetchedUsers,
      total,
      page,
      limit,
      hasMore: (page - 1) * limit + fetchedUsers.length < total,
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
      return {
        success: false,
        error: "A user with this ITS number already exists.",
      };
    }

    const hashedPassword = await hash(data.password || data.itsNumber, 10);

    const newUser = await prisma.user.create({
      data: {
        id: data.itsNumber,
        name: data.name,
        itsNumber: data.itsNumber,
        email: data.email,
        phone: data.phone ? normalizePhone(data.phone) : undefined,
        role: data.role || Role.MUMIN,
        password: hashedPassword,
        gender: data.gender || inferGender(data.name),
      },
    });

    await cache.invalidatePattern("users:*");
    return { success: true, user: newUser };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message || "Could not create user account. Please try again.",
    };
  }
}

export async function promoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "promote");

    // Prevent promoting self
    if (currentUser.id === userId) {
      return { success: false, error: "You cannot promote your own account." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return {
        success: false,
        error: "The requested user could not be found.",
      };

    const roleHierarchy = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];
    const currentIndex = roleHierarchy.indexOf(user.role);

    if (currentIndex === -1 || currentIndex === roleHierarchy.length - 1) {
      return {
        success: false,
        error: "This user is already at the highest role.",
      };
    }

    const newRole = roleHierarchy[currentIndex + 1];

    // Only SUPERADMIN can promote to ADMIN/MANAGER
    if (
      ["ADMIN", "MANAGER"].includes(newRole) &&
      currentUser.role !== "SUPERADMIN"
    ) {
      return {
        success: false,
        error:
          "You do not have sufficient permissions to promote a user to this level.",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
    });

    // Send email notification
    if (updatedUser.email) {
      waitUntil(
        (async () => {
          try {
            await queueEmail(
              updatedUser.email!,
              "Role Promoted",
              "role-promoted",
              {
                userName: updatedUser.name || "User",
                newRole: newRole,
                features: ["Access to new dashboard features"],
              }
            );
            await processEmailQueue();
          } catch (err) {
            console.error("Background email error (promoteUser):", err);
          }
        })()
      );
    }

    await cache.invalidatePattern("users:*");
    await cache.del(`user:profile:${userId}`);
    await cache.del(`rbac:user:${userId}`);
    return { success: true, user: updatedUser };
  } catch (error: any) {
    return {
      success: false,
      error: "We encountered an issue promoting the user. Please try again.",
    };
  }
}

export async function demoteUser(userId: string) {
  try {
    const currentUser = await requirePermission("users", "demote");

    // Prevent demoting self
    if (currentUser.id === userId) {
      return { success: false, error: "You cannot demote your own account." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return {
        success: false,
        error: "The requested user could not be found.",
      };

    const roleHierarchy = [
      "MUMIN",
      "ATTENDANCE_INCHARGE",
      "MANAGER",
      "ADMIN",
      "SUPERADMIN",
    ];
    const currentIndex = roleHierarchy.indexOf(user.role);

    if (currentIndex <= 0) {
      return {
        success: false,
        error: "This user is already at the lowest role.",
      };
    }

    const newRole = roleHierarchy[currentIndex - 1];

    // If demoting to MUMIN, clean up all admin assignments
    if (newRole === "MUMIN") {
      await prisma.$transaction([
        // 1. Update the user role
        prisma.user.update({
          where: { id: userId },
          data: { role: newRole as Role },
        }),
        // 2. Remove from SabaqAdmin
        prisma.sabaqAdmin.deleteMany({
          where: { userId: userId },
        }),
        // 3. Unlink as Janab from any Sabaq
        prisma.sabaq.updateMany({
          where: { janabId: userId },
          data: { janabId: null },
        }),
      ]);
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as Role },
      });
    }

    // Fetch the updated user for the return value and email
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!updatedUser)
      return { success: false, error: "User not found after update" };

    // Send email notification
    if (updatedUser.email) {
      waitUntil(
        (async () => {
          try {
            await queueEmail(
              updatedUser.email!,
              "Role Demoted",
              "role-demoted",
              {
                userName: updatedUser.name || "User",
                newRole: newRole,
                lostAccess: ["Access to advanced dashboard features"],
              }
            );
            await processEmailQueue();
          } catch (err) {
            console.error("Background email error (demoteUser):", err);
          }
        })()
      );
    }

    await cache.invalidatePattern("users:*");
    await cache.del(`user:profile:${userId}`);
    await cache.del(`rbac:user:${userId}`);
    return { success: true, user: updatedUser };
  } catch (error: any) {
    return {
      success: false,
      error: "We encountered an issue demoting the user. Please try again.",
    };
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "You do not have permission to perform this action.",
      };
    }

    const currentUser = session.user;
    const isSelf = currentUser.id === userId;
    const isAdmin = ["SUPERADMIN", "ADMIN", "MANAGER"].includes(
      currentUser.role as string
    );

    if (!isSelf && !isAdmin) {
      return {
        success: false,
        error: "You do not have the necessary permissions to update this user.",
      };
    }

    // If updating password, hash it
    if (data.password) {
      data.password = await hash(data.password, 10);
    }

    // Prevent non-admins from changing roles
    if (data.role && !isAdmin) {
      delete data.role;
    }

    // Special handling for demoting to MUMIN via update
    if (data.role === "MUMIN") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: data,
        }),
        prisma.sabaqAdmin.deleteMany({
          where: { userId: userId },
        }),
        prisma.sabaq.updateMany({
          where: { janabId: userId },
          data: { janabId: null },
        }),
      ]);
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: data,
      });
    }

    await cache.invalidatePattern("users:*");
    await cache.del(`user:profile:${userId}`);
    await cache.del(`rbac:user:${userId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error:
        "Failed to update user profile. Please check the details and try again.",
    };
  }
}

export async function bulkCreateUsers(users: any[]) {
  try {
    await requirePermission("users", "create");

    const inputItsNumbers = users.map((u) => u.itsNumber);

    // 1. Bulk check for existing users
    const existingUsers = await prisma.user.findMany({
      where: { itsNumber: { in: inputItsNumbers } },
      select: { itsNumber: true },
    });

    const existingItsSet = new Set(existingUsers.map((u) => u.itsNumber));

    const validUsers: any[] = [];
    const errors: { its: string; name: string; error: string }[] = [];

    // 2. Filter and Verify
    // Optimizing hashing by running in parallel for the batch
    const processingPromises = users.map(async (userData) => {
      if (existingItsSet.has(userData.itsNumber)) {
        errors.push({
          its: userData.itsNumber,
          name: userData.name,
          error: `User already exists`,
        });
        return;
      }

      const hashedPassword = await hash(
        userData.password || userData.itsNumber,
        10
      );

      validUsers.push({
        id: userData.itsNumber,
        name: userData.name,
        itsNumber: userData.itsNumber,
        email: userData.email,
        phone: userData.phone ? normalizePhone(userData.phone) : undefined,
        role: userData.role || Role.MUMIN,
        password: hashedPassword,
        gender: userData.gender || inferGender(userData.name),
        isActive: true,
      });
    });

    await Promise.all(processingPromises);

    // 3. Bulk Insert
    let createdCount = 0;
    if (validUsers.length > 0) {
      await prisma.user.createMany({
        data: validUsers,
        skipDuplicates: true,
      });
      createdCount = validUsers.length;
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

export async function fixMissingGenders() {
  try {
    await requirePermission("users", "update");

    const usersWithoutGender = await prisma.user.findMany({
      where: { gender: null },
      select: { id: true, name: true },
    });

    let updatedCount = 0;

    // Use parallel processing for gender updates with a concurrency limit
    // to avoid overwhelming the DB connection pool if there are thousands
    const BATCH_SIZE = 50;
    for (let i = 0; i < usersWithoutGender.length; i += BATCH_SIZE) {
      const batch = usersWithoutGender.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (user) => {
          const inferredGender = inferGender(user.name);
          if (inferredGender) {
            await prisma.user.update({
              where: { id: user.id },
              data: { gender: inferredGender },
            });
            updatedCount++;
          }
        })
      );
    }

    if (updatedCount > 0) {
      await cache.invalidatePattern("users:*");
    }

    return {
      success: true,
      count: updatedCount,
      message: `Updated gender for ${updatedCount} users`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function inferGender(name: string): Gender {
  const words = name.toLowerCase().split(/\s+/).slice(0, 3);
  const hasBhai = words.some((w) => w.includes("bhai"));
  return hasBhai ? Gender.MALE : Gender.FEMALE;
}

function normalizePhone(phone: string | number): string {
  let p = String(phone).trim();
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

    // 1. Bulk check existence
    const inputItsDetails = users.map((u) => ({
      its: u.itsNumber,
      name: u.name,
    }));
    const existingUsers = await prisma.user.findMany({
      where: { itsNumber: { in: inputItsDetails.map((d) => d.its) } },
      select: { itsNumber: true },
    });
    const existingItsSet = new Set(existingUsers.map((u) => u.itsNumber));

    const updatesToRun: {
      fn: () => Promise<any>;
      its: string;
      name: string;
    }[] = [];

    // 2. Prepare Updates
    for (const userData of users) {
      if (!existingItsSet.has(userData.itsNumber)) {
        errors.push({
          its: userData.itsNumber,
          name: userData.name || "Unknown",
          error: `User with ITS ${userData.itsNumber} not found`,
        });
        continue;
      }

      const dataToUpdate: any = {};
      if (userData.name) dataToUpdate.name = userData.name;
      // Only allow name update for now via this specific flow optimization,
      // but keep logic generic if other fields passed (though we only expect name from new UI)
      // For safety in "name only" feature, strictly update name implies we trust limits.
      // But existing function is generic "bulkUpdateUsers".
      if (userData.email) dataToUpdate.email = userData.email;
      if (userData.phone) dataToUpdate.phone = normalizePhone(userData.phone);
      if (userData.role) dataToUpdate.role = userData.role;

      if (Object.keys(dataToUpdate).length > 0) {
        updatesToRun.push({
          its: userData.itsNumber,
          name: userData.name,
          fn: () =>
            prisma.user.update({
              where: { id: userData.itsNumber },
              data: dataToUpdate,
            }),
        });
      }
    }

    // 3. Execute in parallel matches (concurrency limit 20)
    const BATCH_SIZE = 20;
    for (let i = 0; i < updatesToRun.length; i += BATCH_SIZE) {
      const batch = updatesToRun.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((item) => item.fn()));

      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          updatedCount++;
        } else {
          const failedItem = batch[idx];
          errors.push({
            its: failedItem.its,
            name: failedItem.name,
            error: res.reason?.message || "Update failed",
          });
        }
      });
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
        error: "You are not authorized to view this profile.",
      };
    }

    const cacheKey = `user:profile:${userId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return cached;
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
      return {
        success: false,
        error: "The requested user profile could not be found.",
      };
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

    const result = {
      success: true,
      profile: {
        user,
        sabaqStats,
        recentActivity,
      },
    };

    await cache.set(cacheKey, result, 180); // Cache for 3 minutes
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Could not load user profile details.",
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
      return {
        success: false,
        error: "You do not have permission to perform this action.",
      };
    }

    // Only allow users to update their own profile unless they are admins
    const isSelf = session.user.id === userId;
    const isAdmin = ["SUPERADMIN", "ADMIN"].includes(
      session.user.role as string
    );

    if (!isSelf && !isAdmin) {
      return {
        success: false,
        error: "You are not authorized to update this profile.",
      };
    }

    // If updating self and changing sensitive fields, require OTP
    if (isSelf && (data.phone || data.email)) {
      if (!data.otp) {
        return {
          success: false,
          error:
            "Please enter the OTP sent to your email to verify this change.",
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
        return {
          success: false,
          error: "The OTP you entered is invalid or has expired.",
        };
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
    // Send confirmation email if email exists
    if (data.email) {
      waitUntil(
        (async () => {
          try {
            await queueEmail(
              data.email!,
              "Profile Updated Successfully",
              "profile-updated",
              {
                userName: session.user.name || "User",
                updatedFields: Object.keys(data).filter(
                  (k) => k !== "otp" && data[k as keyof typeof data]
                ),
                time: new Date().toLocaleString(),
              }
            );
            await processEmailQueue();
          } catch (err) {
            console.error("Background email error (updateUserProfile):", err);
          }
        })()
      );
    }

    await cache.invalidatePattern("users:*");
    await cache.del(`user:profile:${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: "Could not update profile. Please try again.",
    };
  }
}

// Lookup user for attendance (Global search + Enrollment check)
export async function lookupUserForAttendance(query: string, sabaqId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Search by ITS or Name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { itsNumber: query },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        itsNumber: true,
        role: true,
      },
    });

    if (!user) {
      return { success: true, user: null };
    }

    // Check enrollment status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId,
          userId: user.id,
        },
      },
      select: { status: true, id: true },
    });

    return {
      success: true,
      user: {
        ...user,
        enrollmentStatus: enrollment?.status || null,
        enrollmentId: enrollment?.id || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkUserRoleForQuickLogin(itsNumber: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { itsNumber },
      select: { role: true },
    });

    if (user && user.role === "MUMIN") {
      return { success: true, isMumin: true };
    }

    return { success: true, isMumin: false };
  } catch (error) {
    return { success: false, error: "Failed to check role" };
  }
}
