"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail } from "./email-queue";
import { headers } from "next/headers";
import { waitUntil } from "@vercel/functions";

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

    // 3. Background tasks (Logging & Email)
    waitUntil(
      (async () => {
        try {
          // Log to DB
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

          // Email User
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
                errorCode: details?.code,
                errorMessage: details?.reason,
              }
            );
          }

          // Email All Superadmins
          const superAdmins = await prisma.user.findMany({
            where: { role: "SUPERADMIN" },
            select: { email: true, name: true },
          });

          for (const admin of superAdmins) {
            if (admin.email) {
              await queueEmail(
                admin.email,
                `Security Alert: Unauthorized Access by ${user.name}`,
                "security-flagged-admin",
                {
                  userName: user.name || "User",
                  userEmail: user.email || "No Email",
                  userId: user.id,
                  action: "UNAUTHORIZED_ACCESS",
                  resource,
                  details,
                  time: new Date().toLocaleString(),
                  ip,
                  userAgent,
                  errorCode: details?.code,
                  errorMessage: details?.reason,
                }
              );
            }
          }
        } catch (err) {
          console.error("Background task unauthorized error:", err);
        }
      })()
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to log unauthorized access:", error);
    return { success: false, error: "Internal Error" };
  }
}
