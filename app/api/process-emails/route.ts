import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue, getEmailStats } from "@/actions/email-queue";
import { auth } from "@/auth";

export const preferredRegion = ["sin1"];

// POST /api/process-emails - Manually trigger email queue processing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow SuperAdmin to trigger email processing
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processEmailQueue();

    if (result.success) {
      return NextResponse.json({
        message: "Email queue processed successfully",
        ...result,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/process-emails - Get email queue statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow admins to view stats
    if (
      !session?.user ||
      !["SUPERADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getEmailStats();

    if (result.success) {
      return NextResponse.json(result.stats);
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
