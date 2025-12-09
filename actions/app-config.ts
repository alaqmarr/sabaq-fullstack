"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@/app/prisma/enums";
import { revalidatePath } from "next/cache";

export async function getAppConfig() {
  try {
    let config = await prisma.appConfig.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      config = await prisma.appConfig.create({
        data: {
          id: 1,
          isAdminUp: true,
          isPostApiUp: true,
          isGetApiUp: true,
          isUnderMaintenance: false,
          version: "1.0.0",
          overallStatus: "OPERATIONAL",
          downReason: "System under maintenance",
        },
      });
    }

    return { success: true, config };
  } catch (error) {
    console.error("Failed to fetch app config:", error);
    return { success: false, error: "Failed to fetch configuration" };
  }
}

export async function updateAppConfig(data: {
  isAdminUp?: boolean;
  isPostApiUp?: boolean;
  isGetApiUp?: boolean;
  isUnderMaintenance?: boolean;
  version?: string;
  overallStatus?: string;
  downReason?: string;
}) {
  try {
    const session = await auth();
    if (session?.user?.role !== Role.SUPERADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const config = await prisma.appConfig.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data,
      },
    });

    revalidatePath("/");
    return { success: true, config };
  } catch (error) {
    console.error("Failed to update app config:", error);
    return { success: false, error: "Failed to update configuration" };
  }
}
