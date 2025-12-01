"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail } from "./email-queue";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function generateAdminOTP() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true },
  });

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)) {
    return { success: false, error: "Unauthorized" };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

  // Save to DB
  await prisma.adminOTP.create({
    data: {
      userId: session.user.id,
      code: otp,
      expiresAt,
    },
  });

  // Send email
  await queueEmail(user.email!, "verification code", "admin-otp", {
    userName: user.name,
    otp,
    expiryMinutes: 15,
  });

  return { success: true };
}

export async function verifyAdminOTP(code: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const otpRecord = await prisma.adminOTP.findFirst({
    where: {
      userId: session.user.id,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { success: false, error: "Invalid or expired code" };
  }

  // Delete used OTP
  await prisma.adminOTP.delete({ where: { id: otpRecord.id } });

  // Set cookie
  const cookieStore = await cookies();
  const expiry = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

  cookieStore.set("admin_session", "verified", {
    expires: expiry,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return { success: true };
}

export async function sendUserOTP(userId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) return { success: false, error: "User not found" };
  if (!user.email) return { success: false, error: "User has no email linked" };

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

  // Save to DB
  await prisma.adminOTP.create({
    data: {
      userId: user.id,
      code: otp,
      expiresAt,
    },
  });

  // Send email
  await queueEmail(user.email, "Password Reset Code", "admin-otp", {
    userName: user.name,
    otp,
    expiryMinutes: 15,
  });

  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  otp: string,
  newPassword: string
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const otpRecord = await prisma.adminOTP.findFirst({
    where: {
      userId: userId,
      code: otp,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { success: false, error: "Invalid or expired code" };
  }

  // Delete used OTP
  await prisma.adminOTP.delete({ where: { id: otpRecord.id } });

  // Update Password
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}
