import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSessionAttendance } from "@/actions/sync";
import { processEmailQueue } from "@/actions/email-queue";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify Cron Secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const results = {
      syncedSessions: 0,
      emailsProcessed: 0,
      errors: [] as string[],
    };

    // 1. Safety Net: Find sessions marked as ENDED but might have missing data
    // Find sessions ended in the last 24 hours.
    if (adminDb) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentSessions = await prisma.session.findMany({
        where: {
          isActive: false,
          scheduledAt: { gte: yesterday },
        },
      });

      for (const session of recentSessions) {
        try {
          // Check Firebase count
          const ref = adminDb.ref(`sessions/${session.id}/attendance`);
          const snapshot = await ref.get();

          if (snapshot.exists()) {
            const firebaseCount = snapshot.numChildren();
            // If Neon count is significantly less, re-sync
            if (firebaseCount > session.attendanceCount) {
              console.log(
                `Re-syncing session ${session.id} (Firebase: ${firebaseCount}, Neon: ${session.attendanceCount})`
              );
              await syncSessionAttendance(session.id);
              results.syncedSessions++;
            }
          }
        } catch (err: any) {
          results.errors.push(`Session ${session.id}: ${err.message}`);
        }
      }
    }

    // 2. Process Email Queue
    try {
      // Process a batch
      await processEmailQueue();
      results.emailsProcessed = 1; // Just a flag that it ran
    } catch (err: any) {
      results.errors.push(`Email Queue: ${err.message}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Master Cron failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
