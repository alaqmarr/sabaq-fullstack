"use server";

import { adminDb } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { endSessionWithProgress } from "./sessions";

// Progress phases for end session flow:
// Phase 1: Syncing attendance records (0-50%)
// Phase 2: Generating report (50-70%)
// Phase 3: Sending emails (70-100%)

export async function syncSessionAttendance(sessionId: string) {
  try {
    await requirePermission("attendance", "create");

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!session) throw new Error("Session not found");

    const statusRef = adminDb.ref(`sessions/${sessionId}/syncStatus`);

    // Initialize progress
    await statusRef.set({
      status: "syncing",
      phase: "init",
      phaseLabel: "Initializing...",
      total: 100,
      current: 0,
      errors: 0,
    });

    // Fetch all attendance from Firebase
    const ref = adminDb.ref(`sessions/${sessionId}/attendance`);
    const snapshot = await ref.get();

    let syncedCount = 0;
    let errorCount = 0;

    if (snapshot.exists()) {
      const firebaseData = snapshot.val();
      const records = Object.values(firebaseData) as any[];
      const totalRecords = records.length;

      // Phase 1: Sync records (0-50%)
      await statusRef.update({
        phase: "syncing",
        phaseLabel: `Syncing ${totalRecords} attendance records...`,
      });

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          const existing = await prisma.attendance.findUnique({
            where: {
              sessionId_userId: {
                sessionId,
                userId: record.userId,
              },
            },
          });

          if (!existing) {
            await prisma.$transaction([
              prisma.attendance.create({
                data: {
                  id: record.id,
                  sessionId,
                  userId: record.userId,
                  itsNumber: record.itsNumber,
                  markedAt: new Date(record.markedAt),
                  markedBy: record.markedBy,
                  method: record.method,
                  isLate: record.isLate,
                  minutesLate: record.minutesLate,
                  latitude: record.latitude,
                  longitude: record.longitude,
                  distanceMeters: record.distanceMeters,
                },
              }),
              prisma.session.update({
                where: { id: sessionId },
                data: { attendanceCount: { increment: 1 } },
              }),
              prisma.user.update({
                where: { id: record.userId },
                data: {
                  attendedCount: { increment: 1 },
                  lateCount: record.isLate ? { increment: 1 } : undefined,
                },
              }),
            ]);
            syncedCount++;
          }

          // Update progress (0-50% for sync phase)
          const syncProgress = Math.round(((i + 1) / totalRecords) * 50);
          await statusRef.update({
            current: syncProgress,
            phaseLabel: `Synced ${i + 1} of ${totalRecords} records`,
          });
        } catch (err) {
          console.error(
            `Failed to sync record for user ${record.userId}:`,
            err
          );
          errorCount++;
        }
      }
    } else {
      // No Firebase data - skip to 50%
      await statusRef.update({
        current: 50,
        phaseLabel: "No attendance data to sync",
      });
    }

    // Phase 2 & 3: Generate report and send emails (50-100%)
    await statusRef.update({
      current: 50,
      phase: "report",
      phaseLabel: "Generating session report...",
    });

    // Call endSession with progress callback
    const endResult = await endSessionWithProgress(
      sessionId,
      { skipActiveCheck: true },
      async (phase: string, progress: number, label: string) => {
        // Map endSession progress (0-100) to our progress (50-100)
        const mappedProgress = 50 + Math.round(progress * 0.5);
        await statusRef.update({
          current: mappedProgress,
          phase,
          phaseLabel: label,
        });
      }
    );

    // Finalize
    await statusRef.set({
      status: "completed",
      phase: "done",
      phaseLabel: "Complete!",
      total: 100,
      current: 100,
      errors: errorCount,
      completedAt: Date.now(),
    });

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return {
      success: true,
      count: syncedCount,
      errors: errorCount,
      message: `Synced ${syncedCount} records. ${errorCount} errors.`,
      reportData: endResult.reportData,
    };
  } catch (error: any) {
    console.error("Sync failed:", error);
    return {
      success: false,
      error: error.message || "Failed to sync session",
    };
  }
}
