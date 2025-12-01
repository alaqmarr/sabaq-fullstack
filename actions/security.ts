"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail } from "./email-queue";
import { headers } from "next/headers";

export async function logUnauthorizedAccess(resource: string, details?: any) {
  try {
    const session = await auth();
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    if (!session?.user?.id) {
      // Anonymous access attempt - just log it if needed, but we can't email the user
      console.warn("Anonymous unauthorized access attempt:", resource, ip);
      return { success: false, error: "No user session" };
    }

    const user = session.user;

    // 1. Log to DB
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: "UNAUTHORIZED_ACCESS",
        resource,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: ip,
        userAgent,
      },
    });

    // 2. Email User
    if (user.email) {
      await queueEmail(
        user.email,
        "Security Alert: Unauthorized Access Attempt",
        "security-flagged-user",
        {
          userName: user.name || "User",
          action: `Attempted access to ${resource}`,
          time: new Date().toLocaleString(),
          ip,
        }
      );
    }

    // 3. Email Admin
    await queueEmail(
      "alaqmarak0810@gmail.com",
      `Security Alert: Unauthorized Access by ${user.name}`,
      "security-flagged-admin",
      {
        userName: user.name || "User",
        userEmail: user.email || "No Email",
        userId: user.id,
        action: "UNAUTHORIZED_ACCESS",
        resource,
        time: new Date().toLocaleString(),
        ip,
        userAgent,
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to log unauthorized access:", error);
    return { success: false, error: "Internal Error" };
  }
}
