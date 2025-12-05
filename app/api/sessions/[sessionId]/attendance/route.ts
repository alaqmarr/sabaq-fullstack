import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const preferredRegion = ["sin1"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    const attendance = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            itsNumber: true,
          },
        },
        marker: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
