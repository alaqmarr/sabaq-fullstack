"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { adminOtpTemplate } from "@/lib/email-templates";

export async function sendOTP() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, error: "Unauthorized or no email found" };
    }

    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await prisma.adminOTP.create({
      data: {
        userId: session.user.id,
        code: otp,
        expiresAt,
      },
    });

    // Send Email
    const emailHtml = adminOtpTemplate({
      otp,
      expiryMinutes: 10,
    });

    await sendEmail(session.user.email, "Your Verification Code", emailHtml);

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, error: "Failed to send OTP" };
  }
}

export async function verifyOTP(code: string) {
  try {
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
      return { success: false, error: "Invalid or expired OTP" };
    }

    // Delete used OTP
    await prisma.adminOTP.delete({ where: { id: otpRecord.id } });

    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Failed to verify OTP" };
  }
}
