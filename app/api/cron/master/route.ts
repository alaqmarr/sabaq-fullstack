import { NextResponse } from "next/server";
import { processEmailQueue } from "@/actions/email-queue";
import { cache } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const preferredRegion = ["sin1"];

export async function GET(request: Request) {
  try {
    // Verify Cron Secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const results = {
      emailsProcessed: 0,
      errors: [] as string[],
    };

    // NOTE: We no longer compare Firebase vs Neon counts because:
    // 1. Direct/manual attendance only goes to Neon (not Firebase)
    // 2. Sessions are already synced when they are ended
    // 3. Count comparison would incorrectly trigger re-syncs

    // 1. Process Email Queue
    try {
      await processEmailQueue();
      results.emailsProcessed = 1;
    } catch (err: any) {
      results.errors.push(`Email Queue: ${err.message}`);
    }

    // 2. Update Last Sync Timestamp (so settings page shows correct time)
    try {
      await cache.set("system:last_sync", new Date().toISOString());
    } catch (err) {
      console.error("Failed to update last sync timestamp:", err);
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
