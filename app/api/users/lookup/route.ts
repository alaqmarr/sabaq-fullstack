import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const preferredRegion = ["sin1"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itsNumber = searchParams.get("itsNumber");

    if (!itsNumber || itsNumber.length !== 8) {
      return NextResponse.json(
        { success: false, error: "Invalid ITS number" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { itsNumber },
      select: {
        id: true,
        name: true,
        itsNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("User lookup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
