"use server";

import { adminDb } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

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

    // Fetch all attendance from Firebase
    const ref = adminDb.ref(`sessions/${sessionId}/attendance`);
    const snapshot = await ref.get();

    if (!snapshot.exists()) {
      // No data in Firebase, maybe just mark as ended?
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });
      revalidatePath(`/dashboard/sessions/${sessionId}`);
      return {
        success: true,
        count: 0,
        message: "No attendance data to sync.",
      };
    }

    const firebaseData = snapshot.val();
    const records = Object.values(firebaseData) as any[];
    const totalRecords = records.length;
    let syncedCount = 0;
    let errorCount = 0;

    // Initialize progress in Firebase
    const statusRef = adminDb.ref(`sessions/${sessionId}/syncStatus`);
    await statusRef.set({
      status: "syncing",
      total: totalRecords,
      current: 0,
      errors: 0,
    });

    // Process in chunks or sequentially to handle errors gracefully
    // Using createMany is faster but skipDuplicates is needed.
    // However, we need to update User stats (attendedCount, lateCount) too.
    // So we might need to loop.

    for (const record of records) {
      try {
        // Check if exists in Neon
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

        // Update progress every 5 records or if it's the last one
        if (syncedCount % 5 === 0 || syncedCount === totalRecords) {
          await statusRef.update({
            current: syncedCount,
            errors: errorCount,
          });
        }
      } catch (err) {
        console.error(`Failed to sync record for user ${record.userId}:`, err);
        errorCount++;
        await statusRef.update({ errors: errorCount });
      }
    }

    // Mark session as ended
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Finalize status
    await statusRef.set({
      status: "completed",
      total: totalRecords,
      current: syncedCount,
      errors: errorCount,
      completedAt: Date.now(),
    });

    // Optional: Clear Firebase data after successful sync?
    // Or keep it for history/backup?
    // Let's keep it for now, maybe clean up via Cron later.

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return {
      success: true,
      count: syncedCount,
      errors: errorCount,
      message: `Synced ${syncedCount} records. ${errorCount} errors.`,
    };
  } catch (error: any) {
    console.error("Sync failed:", error);
    return {
      success: false,
      error: error.message || "Failed to sync session",
    };
  }
}
