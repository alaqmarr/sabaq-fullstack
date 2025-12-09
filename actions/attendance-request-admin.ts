"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markAttendanceManual } from "./attendance";

export async function approveAttendanceRequest(
  requestId: string,
  sessionId: string,
  itsNumber: string
) {
  try {
    // 1. Check Permissions (Admin/Superadmin/Janab/Incharge)
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    // We rely on markAttendanceManual to check specific permissions
    // But we should verify this request exists
    const request = await prisma.attendanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { success: false, error: "Request not found" };

    // 2. Mark Attendance (which also clears the request in the updated logic)
    const result = await markAttendanceManual(sessionId, itsNumber);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to mark attendance",
      };
    }

    // 3. Mark request as APPROVED (Deleting might be handled by markAttendanceManual,
    // but if we want to keep a log, we would update status.
    // However, user specifically asked to "clear the requests from database too".
    // The markAttendanceManual already deletes it.
    // So we are good. We just revalidate.

    revalidatePath("/dashboard/sessions/[sessionId]/manual-attendance");
    revalidatePath("/user_direct");

    return {
      success: true,
      message: "Request approved and attendance marked.",
    };
  } catch (error) {
    console.error("Approve Request Error:", error);
    return { success: false, error: "Internal Error" };
  }
}

export async function rejectAttendanceRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    // Strictly speaking, we should verify permissions here too.
    // Assuming Admin/Superadmin/Manager/Incharge for now.
    const role = session.user.role;
    if (
      ![
        "SUPERADMIN",
        "ADMIN",
        "MANAGER",
        "JANAB",
        "ATTENDANCE_INCHARGE",
      ].includes(role)
    ) {
      return { success: false, error: "Insufficient Permissions" };
    }

    await prisma.attendanceRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }, // Or delete directly?
      // User said "clear the requests from database too".
      // So I will delete it.
    });

    await prisma.attendanceRequest.delete({
      where: { id: requestId },
    });

    revalidatePath("/user_direct");
    return { success: true, message: "Request rejected and removed." };
  } catch (error) {
    console.error("Reject Request Error:", error);
    return { success: false, error: "Internal Error" };
  }
}

export async function getSessionAttendanceRequests(sessionId: string) {
  try {
    const requests = await prisma.attendanceRequest.findMany({
      where: { sessionId, status: "PENDING" },
      include: {
        user: {
          select: {
            name: true,
            itsNumber: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return { success: true, requests };
  } catch (error) {
    console.error("Get Requests Error:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}
