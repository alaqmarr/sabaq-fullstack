"use server";

import { prisma } from "@/lib/prisma";
import { adminDb } from "@/lib/firebase-admin";
import { requirePermission } from "@/lib/rbac";
import { cache } from "@/lib/cache";
import { syncSessionAttendance } from "@/actions/sync";
import { processEmailQueue, queueEmail } from "@/actions/email-queue";
import { auth } from "@/auth";
function isRedirectError(error: any) {
  return (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

// Get System Status (Redis, Firebase, Last Sync)
export async function getMaintenanceStatus() {
  try {
    await requirePermission("settings", "manage");

    const status = {
      redis: "unknown",
      firebase: "unknown",
      lastSync: null as string | null,
    };

    // Check Redis
    try {
      const isConnected = await cache.ping();
      status.redis = isConnected ? "connected" : "not_configured";
    } catch (e) {
      status.redis = "error";
    }

    // Check Firebase
    try {
      if (adminDb) {
        // Just a simple read to check connection
        await adminDb.ref("_system_health").get();
        status.firebase = "connected";
      } else {
        status.firebase = "not_configured";
      }
    } catch (e: any) {
      status.firebase = `error: ${e.message}`;
    }

    // Check Last Sync
    const lastSync = await cache.get<string>("system:last_sync");
    status.lastSync = lastSync;

    return { success: true, status };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: error.message };
  }
}

// Manual Sync (Sync all active/recent sessions)
export async function triggerManualSync() {
  try {
    await requirePermission("settings", "manage");

    // Find active sessions or sessions ended recently
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { isActive: true },
          { scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Last 24h
        ],
      },
    });

    let syncedCount = 0;
    for (const session of sessions) {
      await syncSessionAttendance(session.id);
      syncedCount++;
    }

    // Update Last Sync Time
    await cache.set("system:last_sync", new Date().toISOString());

    // Send Success Email
    const session = await auth();
    if (session?.user?.email) {
      const startTime = Date.now(); // Approximate start
      await queueEmail(
        session.user.email,
        "System Sync Successful",
        "sync-success",
        {
          syncedCount,
          duration: "N/A", // We didn't track duration precisely here, but could
          time: new Date().toLocaleString(),
        }
      );
    }

    return { success: true, message: `Synced ${syncedCount} sessions.` };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;

    // Send Failure Email
    try {
      const session = await auth();
      if (session?.user?.email) {
        await queueEmail(
          session.user.email,
          "System Sync Failed",
          "sync-failed",
          {
            error: error.message,
            time: new Date().toLocaleString(),
          }
        );
      }
    } catch (e) {
      console.error("Failed to send sync failure email:", e);
    }

    return { success: false, error: error.message };
  }
}

// Clear Notifications
export async function clearAllNotifications() {
  try {
    await requirePermission("settings", "manage");

    // Clear all notifications for all users
    const result = await prisma.notification.deleteMany({});

    return { success: true, message: `Cleared ${result.count} notifications.` };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: error.message };
  }
}

// Clear Logs (Keep latest N)
export async function clearSystemLogs(keepCount: number = 30) {
  try {
    await requirePermission("logs", "delete");

    // 1. Get the IDs of the latest N logs
    const latestLogs = await prisma.securityLog.findMany({
      take: keepCount,
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const latestIds = latestLogs.map((log) => log.id);

    // 2. Delete logs NOT in this list
    let deletedCount = 0;
    if (latestIds.length > 0) {
      const result = await prisma.securityLog.deleteMany({
        where: {
          id: { notIn: latestIds },
        },
      });
      deletedCount = result.count;
    }

    return {
      success: true,
      message: `Logs cleared. Removed ${deletedCount} records (kept latest ${keepCount}).`,
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: error.message };
  }
}

// Email Queue Management
export async function processEmailQueueAction() {
  try {
    await requirePermission("settings", "manage");
    await processEmailQueue();
    return { success: true, message: "Email queue processed." };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: error.message };
  }
}

export async function clearEmailQueueAction() {
  try {
    await requirePermission("settings", "manage");
    // Clear PENDING emails
    const result = await prisma.emailLog.deleteMany({
      where: { status: "PENDING" },
    });
    return {
      success: true,
      message: `Email queue cleared (${result.count} removed).`,
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: error.message };
  }
}
