"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const requestSchema = z.object({
  its: z.string().length(8, "ITS must be 8 digits"),
  sessionId: z.string().min(1, "Session ID is required"),
});

export async function submitAttendanceRequest(formData: FormData) {
  const its = formData.get("its") as string;
  const sessionId = formData.get("sessionId") as string;

  const validated = requestSchema.safeParse({ its, sessionId });

  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { itsNumber: its },
      select: { id: true, name: true, itsNumber: true },
    });

    if (!user) {
      return {
        success: false,
        error: "ITS not found in database. Please contact admin.",
      };
    }

    // 2. Check if session exists and get Sabaq details
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { sabaq: true },
    });

    if (!session) {
      return { success: false, error: "Invalid Session" };
    }

    // 3. Check if user is Enrolled in this Sabaq
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sabaqId_userId: {
          sabaqId: session.sabaqId,
          userId: user.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      const status = enrollment?.status || "NOT_ENROLLED";
      return {
        success: false,
        error: `You are not enrolled in ${session.sabaq.name}. Status: ${status}`,
      };
    }

    // 4. Check if already marked present
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        error: `Attendance already marked for ${user.name}`,
      };
    }

    // 5. Check if request already pending
    const existingRequest = await prisma.attendanceRequest.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    if (existingRequest) {
      return { success: false, error: "Request already pending approval" };
    }

    // 6. Create Request
    await prisma.attendanceRequest.create({
      data: {
        sessionId,
        userId: user.id,
        itsNumber: user.itsNumber,
        status: "PENDING",
      },
    });

    return { success: true, message: `Request submitted for ${user.name}` };
  } catch (error) {
    console.error("Attendance Request Error:", error);
    return { success: false, error: "Internal System Error" };
  }
}
