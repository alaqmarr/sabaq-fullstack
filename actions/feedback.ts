"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function submitFeedback({
  sessionId,
  rating,
  comment,
  itsNumber,
}: {
  sessionId: string;
  rating: number;
  comment?: string;
  itsNumber?: string;
}) {
  try {
    let userId: string;

    // 1. Identify User
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (itsNumber) {
      // Guest mode: Find user by ITS
      const user = await prisma.user.findUnique({
        where: { itsNumber },
      });
      if (!user) {
        return {
          success: false,
          error: "User not found. Please register first.",
        };
      }
      userId = user.id;
    } else {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validate Session & Attendance
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionData) {
      return { success: false, error: "Session not found" };
    }

    // 3. Validate Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId: sessionData.sabaqId,
          userId,
        },
      },
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      return {
        success: false,
        error: "You must be enrolled in this sabaq to provide feedback.",
      };
    }

    // 4. Validate Attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (!attendance) {
      return {
        success: false,
        error: "You must attend the session to provide feedback.",
      };
    }

    // 3. Check for existing feedback
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (existingFeedback) {
      return { success: false, error: "You have already submitted feedback." };
    }

    // 4. Create Feedback
    const feedback = await prisma.feedback.create({
      data: {
        sessionId,
        userId,
        rating,
        comment,
      },
    });

    revalidatePath(`/dashboard/sessions/${sessionId}`);
    return { success: true, feedback };
  } catch (error: any) {
    console.error("Failed to submit feedback:", error);
    return {
      success: false,
      error: error.message || "Failed to submit feedback",
    };
  }
}

export async function getSessionFeedback(sessionId: string) {
  try {
    const currentUser = await requirePermission("sessions", "read"); // Using session read permission for now

    // Verify access (similar to other actions)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { sabaqId: true },
    });

    if (!session) return { success: false, error: "Session not found" };

    if (currentUser.role !== "SUPERADMIN") {
      const isAssigned = await prisma.sabaqAdmin.findUnique({
        where: {
          sabaqId_userId: {
            sabaqId: session.sabaqId,
            userId: currentUser.id,
          },
        },
      });
      const isJanab = await prisma.sabaq.findFirst({
        where: { id: session.sabaqId, janabId: currentUser.id },
      });

      if (!isAssigned && !isJanab) {
        return {
          success: false,
          error: "Unauthorized to view feedback for this session",
        };
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            name: true,
            itsNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const total = feedbacks.length;
    const average =
      total > 0
        ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / total
        : 0;

    return { success: true, feedbacks, stats: { total, average } };
  } catch (error: any) {
    console.error("Failed to fetch feedback:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch feedback",
    };
  }
}
