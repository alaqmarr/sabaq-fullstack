"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function getEmailLogs() {
  try {
    await requirePermission("logs", "read");

    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 logs for performance
    });

    return { success: true, logs };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch email logs",
    };
  }
}

export async function getSecurityLogs() {
  try {
    await requirePermission("logs", "read");

    const logs = await prisma.securityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 logs
      include: {
        user: {
          select: {
            name: true,
            itsNumber: true,
            role: true,
          },
        },
      },
    });

    return { success: true, logs };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch security logs",
    };
  }
}
