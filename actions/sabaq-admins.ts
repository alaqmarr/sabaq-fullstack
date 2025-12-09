"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail, processEmailQueue } from "./email-queue";
import { waitUntil } from "@vercel/functions";

export async function getSabaqAdmins(sabaqId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const admins = await prisma.sabaqAdmin.findMany({
    where: { sabaqId },
    include: {
      user: {
        select: {
          id: true,
          itsNumber: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return admins;
}

export async function assignSabaqAdmin(sabaqId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  // Check if user exists and is eligible (ADMIN or MANAGER role)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!["ADMIN", "MANAGER", "ATTENDANCE_INCHARGE"].includes(user.role)) {
    throw new Error(
      "User must be ADMIN, MANAGER or ATTENDANCE_INCHARGE to be assigned as Sabaq admin"
    );
  }

  // Check if already assigned
  const existing = await prisma.sabaqAdmin.findUnique({
    where: {
      sabaqId_userId: {
        sabaqId,
        userId,
      },
    },
  });

  if (existing) {
    throw new Error("User is already assigned as admin for this sabaq");
  }

  // Fetch sabaq details for email
  const sabaq = await prisma.sabaq.findUnique({
    where: { id: sabaqId },
    select: { name: true },
  });

  if (!sabaq) {
    throw new Error("Sabaq not found");
  }

  await prisma.sabaqAdmin.create({
    data: {
      sabaqId,
      userId,
    },
  });

  // Queue email notification
  if (user.email) {
    waitUntil(
      (async () => {
        try {
          await queueEmail(
            user.email as string,
            `New Assignment - ${sabaq.name}`,
            "admin-assigned",
            {
              userName: user.name,
              sabaqName: sabaq.name,
              role: user.role,
              assignedBy: session.user.name || "Super Admin",
            }
          );
          // Trigger processing immediately
          await processEmailQueue();
        } catch (err) {
          console.error("Background email error (assignSabaqAdmin):", err);
        }
      })()
    );
  }

  revalidatePath("/dashboard/sabaqs");
  revalidatePath(`/dashboard/sabaqs/${sabaqId}`);
}

export async function removeSabaqAdmin(sabaqId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.sabaqAdmin.delete({
    where: {
      sabaqId_userId: {
        sabaqId,
        userId,
      },
    },
  });

  revalidatePath("/dashboard/sabaqs");
  revalidatePath(`/dashboard/sabaqs/${sabaqId}`);
}

export async function getEligibleAdmins() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "MANAGER", "ATTENDANCE_INCHARGE"],
      },
      isActive: true,
    },
    select: {
      id: true,
      itsNumber: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return admins;
}
